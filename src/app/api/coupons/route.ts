import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 플랜별 동시 활성 쿠폰 최대 개수
const PLAN_COUPON_LIMIT: Record<string, number> = {
  free: 0,
  basic: 2,
  standard: 5,
  special: 10,
  deluxe: 20,
  premium: 99,
};

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
  couponLimit: number;
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
  const couponLimit = PLAN_COUPON_LIMIT[planName] ?? 0;

  return { userId: user.id, businessId: business.id, planName, couponLimit };
}

/** GET — 내 업소 쿠폰 목록 */
export async function GET() {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const svc = getAdmin();
  const { data, error } = await svc
    .from('bamgil_coupons')
    .select('*')
    .eq('business_id', ctx.businessId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    coupons: data ?? [],
    planName: ctx.planName,
    couponLimit: ctx.couponLimit,
  });
}

/** POST — 쿠폰 발급 (플랜 한도 검사) */
export async function POST(req: NextRequest) {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  if (ctx.couponLimit === 0) {
    return NextResponse.json(
      { error: '현재 플랜에서는 쿠폰 발급이 불가합니다. 스탠다드 이상으로 업그레이드 해주세요.' },
      { status: 403 }
    );
  }

  const svc = getAdmin();

  // 현재 활성 쿠폰 수 확인
  const { count } = await svc
    .from('bamgil_coupons')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', ctx.businessId)
    .eq('is_active', true);

  if ((count ?? 0) >= ctx.couponLimit) {
    return NextResponse.json(
      { error: `${ctx.planName} 플랜의 쿠폰 한도(${ctx.couponLimit}개)에 도달했습니다. 플랜을 업그레이드하거나 기존 쿠폰을 비활성화해주세요.` },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { title, description, discountType, discountValue, maxUses, minVisitCount, validUntil } = body;

  if (!title?.trim() || !discountType || !discountValue) {
    return NextResponse.json({ error: '제목, 할인 유형, 할인값은 필수입니다.' }, { status: 400 });
  }
  if (discountType === 'percent' && (Number(discountValue) < 1 || Number(discountValue) > 100)) {
    return NextResponse.json({ error: '% 할인은 1~100 사이여야 합니다.' }, { status: 400 });
  }

  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data, error } = await svc
    .from('bamgil_coupons')
    .insert({
      business_id: ctx.businessId,
      code,
      title: title.trim(),
      description: description?.trim() ?? null,
      discount_type: discountType,
      discount_value: Number(discountValue),
      max_uses: maxUses ? Number(maxUses) : null,
      min_visit_count: Number(minVisitCount) || 0,
      valid_until: validUntil || null,
      is_active: true,
    })
    .select('id, code')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, coupon: data });
}

/** PATCH — 쿠폰 활성/비활성 토글 */
export async function PATCH(req: NextRequest) {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const body = await req.json();
  const { id, is_active } = body;
  if (!id || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'id, is_active 필수' }, { status: 400 });
  }

  const svc = getAdmin();

  // 소유자 확인
  const { data: coupon } = await svc
    .from('bamgil_coupons')
    .select('business_id')
    .eq('id', id)
    .single();

  if (!coupon || coupon.business_id !== ctx.businessId) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const { error } = await svc
    .from('bamgil_coupons')
    .update({ is_active })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE — 쿠폰 삭제 (사용 이력 없는 경우만) */
export async function DELETE(req: NextRequest) {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id 필수' }, { status: 400 });

  const svc = getAdmin();

  // 소유자 + 사용 이력 동시 확인
  const { data: coupon } = await svc
    .from('bamgil_coupons')
    .select('business_id, used_count')
    .eq('id', id)
    .single();

  if (!coupon || coupon.business_id !== ctx.businessId) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }
  if ((coupon.used_count ?? 0) > 0) {
    return NextResponse.json(
      { error: '이미 사용된 쿠폰은 삭제할 수 없습니다. 비활성화 처리해주세요.' },
      { status: 400 }
    );
  }

  const { error } = await svc.from('bamgil_coupons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
