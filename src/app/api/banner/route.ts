import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { BANNER_SLOT_REGISTRY, PLAN_ALLOWED_SLOTS } from '@/lib/bannerSlots';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type OwnerCtx = {
  userId: string;
  businessId: string;
  planName: string;
  allowedSlots: string[];
};

async function getOwnerCtx(): Promise<OwnerCtx | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const svc = getAdmin();

  const { data: business } = await svc
    .from('businesses')
    .select('id, owner_id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!business) return null;

  const { data: sub } = await svc
    .from('subscriptions')
    .select('plan, status')
    .eq('business_id', business.id)
    .maybeSingle();

  const isActive = sub?.status === 'active' || sub?.status === 'trial';
  const planName = isActive ? (sub?.plan ?? 'free') : 'free';
  const allowedSlots = PLAN_ALLOWED_SLOTS[planName] ?? [];

  return { userId: user.id, businessId: business.id, planName, allowedSlots };
}

/** GET — 내 플랫폼별 배너 현황 + 슬롯 레지스트리 */
export async function GET() {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const svc = getAdmin();
  const { data: shops, error } = await svc
    .from('shops')
    .select('id, platform, banner_status, banner_image_url, options, tier, status')
    .eq('user_id', ctx.userId)
    .eq('status', 'active');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    shops: shops ?? [],
    planName: ctx.planName,
    allowedSlots: ctx.allowedSlots,
    slotRegistry: BANNER_SLOT_REGISTRY,
  });
}

/** POST — 배너 이미지 업로드 + 슬롯/위치 설정 (multipart/form-data) */
export async function POST(req: NextRequest) {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const platform = formData.get('platform') as string | null;
  const slotId = formData.get('slot') as string | null;

  if (!file || !platform || !slotId) {
    return NextResponse.json({ error: '파일, 플랫폼, 슬롯은 필수입니다.' }, { status: 400 });
  }

  if (!ctx.allowedSlots.includes(slotId)) {
    return NextResponse.json(
      { error: `현재 플랜(${ctx.planName})에서는 이 슬롯을 사용할 수 없습니다.` },
      { status: 403 }
    );
  }

  const slotDef = BANNER_SLOT_REGISTRY.find(s => s.id === slotId);
  if (!slotDef || slotDef.status !== 'live') {
    return NextResponse.json({ error: '현재 운영 중인 슬롯이 아닙니다.' }, { status: 400 });
  }

  const svc = getAdmin();

  const { data: shop, error: shopErr } = await svc
    .from('shops')
    .select('id, options')
    .eq('user_id', ctx.userId)
    .eq('platform', platform)
    .eq('status', 'active')
    .maybeSingle();

  if (shopErr || !shop) {
    return NextResponse.json(
      { error: '해당 플랫폼의 활성 광고를 찾을 수 없습니다. 먼저 광고를 게시해주세요.' },
      { status: 404 }
    );
  }

  // Storage 업로드
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `banners/${ctx.businessId}/${platform}_${slotId}_${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data: uploadResult, error: uploadError } = await svc.storage
    .from('businesses-docs')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError || !uploadResult) {
    console.error('[POST /api/banner] upload error:', uploadError);
    return NextResponse.json({ error: '이미지 업로드 실패: ' + uploadError?.message }, { status: 500 });
  }

  const { data: { publicUrl } } = svc.storage
    .from('businesses-docs')
    .getPublicUrl(uploadResult.path);

  // options에 슬롯 정보 저장
  const newOptions = {
    ...(shop.options ?? {}),
    banner_slot: slotId,
    banner_position: slotDef.bannerPosition,
  };

  const updatePayload: Record<string, unknown> = {
    banner_image_url: publicUrl,
    banner_status: 'pending_banner',
    options: newOptions,
  };

  // banner_position 컬럼도 함께 업데이트 (P2 BannerSidebar가 이 컬럼을 직접 읽음)
  if (slotDef.bannerPosition) {
    updatePayload.banner_position = slotDef.bannerPosition;
  }

  const { error: updateError } = await svc
    .from('shops')
    .update(updatePayload)
    .eq('id', shop.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, imageUrl: publicUrl, bannerPosition: slotDef.bannerPosition });
}

/** DELETE — 배너 초기화 */
export async function DELETE(req: NextRequest) {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const { platform } = await req.json();
  if (!platform) return NextResponse.json({ error: 'platform 필수' }, { status: 400 });

  const svc = getAdmin();

  const { data: shop } = await svc
    .from('shops')
    .select('id, options')
    .eq('user_id', ctx.userId)
    .eq('platform', platform)
    .eq('status', 'active')
    .maybeSingle();

  if (!shop) return NextResponse.json({ error: '광고를 찾을 수 없습니다.' }, { status: 404 });

  const { banner_slot: _s, banner_position: _p, ...restOptions } = (shop.options ?? {}) as Record<string, unknown>;
  const { error } = await svc
    .from('shops')
    .update({
      banner_image_url: null,
      banner_status: 'none',
      banner_position: null,
      options: restOptions,
    })
    .eq('id', shop.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
