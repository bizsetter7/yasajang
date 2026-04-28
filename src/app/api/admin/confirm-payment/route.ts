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

      // [Bug Fix] period_months 먼저 조회 → next_billing_at 정확히 계산
      const { data: periodData, error: periodError } = await supabaseAdmin
        .from('subscriptions')
        .select('period_months')
        .eq('id', subscriptionId)
        .single();
      if (periodError) throw periodError;
      const periodMonths: number = (periodData as any)?.period_months || 1;

      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + periodMonths);

      interface SubscriptionWithBusiness {
        id: string;
        plan_name: string;
        plan?: string;
        platform_choice: string;
        business_id: string;
        period_months: number;
        businesses: {
          name: string;
          owner_id: string;
        } | null;
      }

      const { data, error } = await supabaseAdmin
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
      const sub = data as SubscriptionWithBusiness;

      const planName = sub.plan_name || sub.plan || '';

      // [P2 연동] 코코알바 플랫폼 선택 시 cocoalba_tier 동기화
      if (sub.platform_choice === 'cocoalba') {
        let tier: string | null = null;
        if (planName === 'premium') tier = 'premium';
        else if (['standard', 'special', 'deluxe'].includes(planName)) tier = 'standard';

        if (tier) {
          const { error: bizError } = await supabaseAdmin
            .from('businesses')
            .update({ cocoalba_tier: tier })
            .eq('id', sub.business_id);

          if (bizError) console.error('[confirm-payment] cocoalba_tier sync error:', bizError);
          else console.log(`[confirm-payment] cocoalba_tier synced: ${tier} (business_id: ${sub.business_id})`);
        }
      } else if (sub.platform_choice === 'waiterzone' || sub.platform_choice === 'sunsuzone') {
        // waiterzone/sunsuzone: subscriptions.status='active'만으로 P9/P10 접근 게이트 동작
        // cocoalba_tier 동기화 불필요 — 플랫폼별 구독 체크 API(/api/subscription/check)가 처리
        console.log(`[confirm-payment] ${sub.platform_choice} 구독 활성화 완료 (period: ${periodMonths}개월, business_id: ${sub.business_id})`);
      }

      // 성공 알림 (텔레그램)
      await sendTelegramAlert(
        `✅ <b>구독 활성화 완료</b>\n\n` +
        `🏪 업소명: <b>${sub.businesses?.name}</b>\n` +
        `📦 플랜: ${planName} (${periodMonths}개월)\n` +
        `🔗 플랫폼: ${sub.platform_choice || '없음'}\n` +
        `📅 만료: ${nextBilling.toLocaleDateString('ko-KR')}\n` +
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
  } catch (err) {
    console.error('Confirm payment API error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
