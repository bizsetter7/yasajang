import { NextResponse } from 'next/server';
import { sendTelegramAlert } from '@/lib/utils/telegram';

const PLAN_LABELS: Record<string, string> = {
  basic: '베이직 (99,000원)',
  standard: '스탠다드 (199,000원)',
  premium: '프리미엄 (499,000원)',
};

/**
 * POST /api/notify/new-subscription
 * 구독 신청(입금 대기) 시 관리자 텔레그램 알림을 발송합니다.
 */
export async function POST(request: Request) {
  try {
    const { businessName, plan, ownerEmail } = await request.json();

    const msg =
      `🔔 <b>[야사장] 구독 신청 (입금 대기)</b>\n\n` +
      `🏪 업소명: <b>${businessName}</b>\n` +
      `📦 플랜: ${PLAN_LABELS[plan] ?? plan}\n` +
      `👤 신청자: ${ownerEmail}\n\n` +
      `💳 입금 확인 후 어드민 → 구독 관리에서 활성화 버튼 클릭.`;

    const success = await sendTelegramAlert(msg);
    
    return NextResponse.json({ ok: success });
  } catch (err: any) {
    console.error('API Error (new-subscription):', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
