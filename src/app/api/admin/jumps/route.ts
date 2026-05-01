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

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: jumps, error } = await supabaseAdmin
    .from('user_jumps')
    .select('user_id, subscription_balance, package_balance, auto_remaining_today, last_daily_reset_at, next_reset_at')
    .order('subscription_balance', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { users }, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

  const emailMap = new Map(users.map(u => [u.id, u.email ?? u.id]));

  const result = (jumps ?? []).map(j => ({
    ...j,
    email: emailMap.get(j.user_id) ?? j.user_id,
  }));

  return NextResponse.json({ jumps: result });
}

// 정책 결정(M-060): 어드민 grant → subscription_balance 적립 (package_balance는 유료 패키지 구매용으로 보존)
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, amount } = await request.json() as { userId: string; amount: number };
  if (!userId || typeof amount !== 'number' || amount < 1 || amount > 1000) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('user_jumps')
    .select('subscription_balance')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { error } = await supabaseAdmin
      .from('user_jumps')
      .update({ subscription_balance: (existing.subscription_balance ?? 0) + amount })
      .eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabaseAdmin
      .from('user_jumps')
      .insert({ user_id: userId, subscription_balance: amount, package_balance: 0, auto_remaining_today: 0 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
