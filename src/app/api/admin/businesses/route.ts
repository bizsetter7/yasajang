import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'bizsetter7@gmail.com';
  return !!user && user.email === adminEmail;
}

// GET /api/admin/businesses?status=all|pending|active|rejected
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';

  let query = supabaseAdmin
    .from('businesses')
    .select('id, name, category, region_code, address, address_detail, phone, manager_name, status, created_at, is_verified, is_active, business_reg_url, permit_path, owner_id, audit_note, audited_at, cocoalba_tier')
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 구독 정보 병합
  const ids = (data || []).map(b => b.id);
  let subs: Record<string, { plan: string; status: string; trial_ends_at: string }> = {};
  if (ids.length > 0) {
    const { data: subData } = await supabaseAdmin
      .from('subscriptions')
      .select('business_id, plan, status, trial_ends_at')
      .in('business_id', ids);
    (subData || []).forEach(s => { subs[s.business_id] = s; });
  }

  const enriched = (data || []).map(b => ({ ...b, subscription: subs[b.id] || null }));

  return NextResponse.json({ businesses: enriched });
}

// DELETE /api/admin/businesses  body: { businessId }
export async function DELETE(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { businessId } = await req.json();
  if (!businessId) {
    return NextResponse.json({ error: 'businessId 필요' }, { status: 400 });
  }

  // 연관 데이터 cascade 삭제
  await supabaseAdmin.from('subscriptions').delete().eq('business_id', businessId);
  await supabaseAdmin.from('bamgil_contacts').delete().eq('business_id', businessId);

  // businesses 삭제 (owner_id로 shops도 정리)
  const { data: biz } = await supabaseAdmin
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .single();

  const { error } = await supabaseAdmin
    .from('businesses')
    .delete()
    .eq('id', businessId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 연관 shops도 삭제 (야사장 입점신청 공고)
  if (biz?.owner_id) {
    await supabaseAdmin
      .from('shops')
      .delete()
      .eq('user_id', biz.owner_id)
      .in('status', ['PENDING_REVIEW', 'rejected']);
  }

  return NextResponse.json({ ok: true });
}
