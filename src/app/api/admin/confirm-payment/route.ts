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
          category: string | null;
          address: string | null;
          address_detail: string | null;
          phone: string | null;
          business_reg_number: string | null;
          kakao_id: string | null;
          line_id: string | null;
          telegram_id: string | null;
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
        .select('*, businesses(name, owner_id, category, address, address_detail, phone, business_reg_number, kakao_id, line_id, telegram_id)')
        .single();

      if (error) throw error;
      const sub = data as SubscriptionWithBusiness;

      // [profiles 동기화] P5 businesses → P2/P9/P10 profiles 공통 사업자 정보 반영
      // businesses 데이터가 있고 owner_id가 있을 때만 실행
      if (sub.businesses?.owner_id) {
        const biz = sub.businesses;
        const profilePatch: Record<string, string> = {};
        if (biz.name)                 profilePatch.business_name          = biz.name;
        if (biz.category)             profilePatch.business_type          = biz.category;
        if (biz.address)              profilePatch.business_address       = biz.address;
        if (biz.address_detail)       profilePatch.business_address_detail = biz.address_detail;
        if (biz.phone)                profilePatch.manager_phone          = biz.phone;
        if (biz.business_reg_number)  profilePatch.business_number        = biz.business_reg_number;
        if (biz.kakao_id)             profilePatch.manager_kakao          = biz.kakao_id;
        if (biz.line_id)              profilePatch.manager_line           = biz.line_id;
        if (biz.telegram_id)          profilePatch.manager_telegram       = biz.telegram_id;
        // business_verify_status: P2 BusinessVerifySection이 'approved' 값으로 체크
        // business_verified: Step1BasicInfo가 boolean으로 체크
        profilePatch.business_verify_status = 'approved';
        (profilePatch as any).business_verified = true;

        const { error: profileErr } = await supabaseAdmin
          .from('profiles')
          .update(profilePatch)
          .eq('id', biz.owner_id);

        if (profileErr) console.error('[confirm-payment] profiles 동기화 실패 (구독은 활성화 유지):', profileErr);
        else console.log(`[confirm-payment] profiles 동기화 완료 (owner: ${biz.owner_id})`);
      }

      const planName = sub.plan_name || sub.plan || '';

      // [businesses 활성화] P6 밤길 지도 노출 게이트
      // confirm-payment = 입금 확인 = 즉시 사업장 활성화 (business-audit과 병행 가능, 멱등성 보장)
      const { error: bizActivateErr } = await supabaseAdmin
        .from('businesses')
        .update({ is_active: true, is_verified: true, status: 'active' })
        .eq('id', sub.business_id);
      if (bizActivateErr) console.error('[confirm-payment] businesses 활성화 실패:', bizActivateErr);
      else console.log(`[confirm-payment] businesses 활성화 완료 (business_id: ${sub.business_id})`);

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

      // [점프 시스템 연동 — Migration 10, 2026-04-30]
      // 구독 승인 즉시 무료 점프 지급 (스페셜 10 / 디럭스 30 / 프리미엄 30)
      // 30일 후 reset (구독 승인 일시 + 30일)
      const ownerId = sub.businesses?.owner_id;
      const PLAN_INITIAL_JUMPS: Record<string, number> = {
        special:  10,
        deluxe:   30,
        premium:  30,
      };
      const initialJumps = PLAN_INITIAL_JUMPS[planName] ?? 0;
      if (ownerId && initialJumps > 0) {
        try {
          const next30Days = new Date();
          next30Days.setDate(next30Days.getDate() + 30);

          const { data: existing } = await supabaseAdmin
            .from('user_jumps')
            .select('user_id')
            .eq('user_id', ownerId)
            .maybeSingle();

          if (existing) {
            await supabaseAdmin
              .from('user_jumps')
              .update({
                subscription_balance: initialJumps,
                next_reset_at: next30Days.toISOString(),
                updated_at: now,
              })
              .eq('user_id', ownerId);
          } else {
            await supabaseAdmin
              .from('user_jumps')
              .insert({
                user_id: ownerId,
                subscription_balance: initialJumps,
                next_reset_at: next30Days.toISOString(),
              });
          }
          console.log(`[confirm-payment] 무료 점프 ${initialJumps}회 지급 완료 (plan: ${planName}, user: ${ownerId})`);
        } catch (jumpErr) {
          console.error('[confirm-payment] user_jumps 적립 실패 (구독은 활성화 유지):', jumpErr);
          // 점프 적립 실패해도 구독 활성화는 그대로 진행 (별도 운영 보정 가능)
        }
      }

      // [shop deadline 갱신] 구독 만료일 → 연동 광고의 마감일 업데이트
      if (ownerId) {
        try {
          // UTC → KST(+9h) 보정 후 날짜 추출: Vercel 서버는 UTC이므로 toISOString()이 UTC 날짜를 반환
          // 브라우저 KST 렌더링과 일치시키기 위해 9시간 오프셋 적용 (M-deadline-kst)
          const kstOffset = 9 * 60 * 60 * 1000;
          const nextBillingKST = new Date(nextBilling.getTime() + kstOffset);
          const deadlineStr = nextBillingKST.toISOString().split('T')[0];
          const { data: linkedShops } = await supabaseAdmin
            .from('shops')
            .select('id')
            .eq('user_id', ownerId)
            .eq('is_closed', false);

          if (linkedShops && linkedShops.length > 0) {
            const shopIds = linkedShops.map((s: { id: number }) => s.id);
            await supabaseAdmin
              .from('shops')
              .update({ deadline: deadlineStr })
              .in('id', shopIds);
            console.log(`[confirm-payment] shop deadline 갱신: ${deadlineStr} (${shopIds.length}개)`);
          }
        } catch (shopErr) {
          console.error('[confirm-payment] shop deadline 갱신 실패 (구독은 활성화 유지):', shopErr);
        }
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
