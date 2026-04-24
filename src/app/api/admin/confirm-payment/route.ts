import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { sendTelegramAlert } from '@/lib/utils/telegram';

// service_role 클라이언트 — 로컬 선언 (공용 모듈 import 금지)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PATCH(request: Request) {
  // 어드민 인증 체크
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        getAll: () => cookieStore.getAll(),
      } 
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscriptionId, action } = await request.json();
  // action: 'confirm' | 'reject'

  try {
    if (action === 'confirm') {
      const now = new Date().toISOString();
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      const { data: sub, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          billing_starts_at: now,
          next_billing_at: nextBilling.toISOString(),
          confirmed_at: now,
          confirmed_by: user.email,
          updated_at: now,
        })
        .eq('id', subscriptionId)
        .select('*, businesses(name, owner_id)')
        .single();

      if (error) throw error;

      // 성공 알림 (텔레그램)
      await sendTelegramAlert(
        `✅ <b>구독 활성화 완료</b>\n\n` +
        `🏪 업소명: <b>${(sub as any).businesses?.name}</b>\n` +
        `📦 플랜: ${sub.plan}\n` +
        `💳 확인자: ${user.email}`
      );
    } else if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          payment_reference: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);
      
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Confirm payment API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
