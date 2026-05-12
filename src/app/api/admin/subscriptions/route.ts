import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') ?? 'all';
  const expiringSoon = searchParams.get('expiring') === '1';

  let query = supabaseAdmin
    .from('subscriptions')
    .select(`
      id, plan, status, amount, period_months,
      trial_starts_at, trial_ends_at,
      billing_starts_at, next_billing_at, platform_choice, confirmed_at,
      businesses ( name )
    `);

  if (expiringSoon) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);
    query = query
      .eq('status', 'active')
      .lte('next_billing_at', cutoff.toISOString());
  } else if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query.order('next_billing_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 구독 없는 업체 탐지 (고아 업체) — 전체 탭 한정으로 함께 반환
  let noSubBusinesses: { id: string; name: string; status: string; created_at: string }[] = [];
  if (!expiringSoon && statusFilter === 'all') {
    const { data: allBizes } = await supabaseAdmin
      .from('businesses')
      .select('id, name, status, created_at')
      .in('status', ['active', 'approved', 'pending']);

    const { data: subBizData } = await supabaseAdmin
      .from('subscriptions')
      .select('business_id');

    const subBizSet = new Set((subBizData || []).map(s => s.business_id));
    noSubBusinesses = (allBizes || []).filter(b => !subBizSet.has(b.id));
  }

  return NextResponse.json({ subscriptions: data ?? [], noSubBusinesses });
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscriptionId, status } = await request.json() as { subscriptionId: string; status: string };
  const allowed = ['active', 'paused', 'cancelled'];
  if (!subscriptionId || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status })
    .eq('id', subscriptionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
