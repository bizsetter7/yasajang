import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const PLAN_NOTICE_LIMIT: Record<string, number> = {
  free: 0,
  basic: 1,
  standard: 3,
  special: 5,
  deluxe: 10,
  premium: 20,
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
  noticeLimit: number;
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
  const noticeLimit = PLAN_NOTICE_LIMIT[planName] ?? 0;

  return { userId: user.id, businessId: business.id, planName, noticeLimit };
}

/** GET — 내 업소 공지 목록 */
export async function GET() {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const svc = getAdmin();
  const { data, error } = await svc
    .from('business_notices')
    .select('*')
    .eq('business_id', ctx.businessId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    notices: data ?? [],
    planName: ctx.planName,
    noticeLimit: ctx.noticeLimit,
  });
}

/** POST — 공지 등록 (플랜 한도 검사) */
export async function POST(req: NextRequest) {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  if (ctx.noticeLimit === 0) {
    return NextResponse.json(
      { error: '현재 플랜에서는 공지 등록이 불가합니다. 베이직 이상으로 업그레이드 해주세요.' },
      { status: 403 }
    );
  }

  const svc = getAdmin();
  const { count } = await svc
    .from('business_notices')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', ctx.businessId)
    .eq('is_active', true);

  if ((count ?? 0) >= ctx.noticeLimit) {
    return NextResponse.json(
      { error: `${ctx.planName} 플랜의 공지 한도(${ctx.noticeLimit}개)에 도달했습니다.` },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { title, content, isPinned } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: '제목은 필수입니다.' }, { status: 400 });
  }

  const { data, error } = await svc
    .from('business_notices')
    .insert({
      business_id: ctx.businessId,
      title: title.trim(),
      content: content?.trim() ?? null,
      is_pinned: isPinned ?? false,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, notice: data });
}

/** PATCH — 활성/비활성 토글 */
export async function PATCH(req: NextRequest) {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const body = await req.json();
  const { id, is_active } = body;
  if (!id || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'id, is_active 필수' }, { status: 400 });
  }

  const svc = getAdmin();
  const { data: notice } = await svc
    .from('business_notices')
    .select('business_id')
    .eq('id', id)
    .single();

  if (!notice || notice.business_id !== ctx.businessId) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const { error } = await svc
    .from('business_notices')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE — 공지 삭제 */
export async function DELETE(req: NextRequest) {
  const ctx = await getOwnerCtx();
  if (!ctx) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'id 필수' }, { status: 400 });

  const svc = getAdmin();
  const { data: notice } = await svc
    .from('business_notices')
    .select('business_id')
    .eq('id', id)
    .single();

  if (!notice || notice.business_id !== ctx.businessId) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  const { error } = await svc.from('business_notices').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
