import { NextResponse } from 'next/server';
import { sendTelegramAlert } from '@/lib/utils/telegram';

/**
 * POST /api/notify/new-business
 * 업소 신규 등록 신청 시 관리자 텔레그램 알림을 발송합니다.
 */
export async function POST(request: Request) {
  try {
    const { businessName, category, region, ownerEmail } = await request.json();

    const msg =
      `🏪 <b>[야사장] 새 업소 등록 신청</b>\n\n` +
      `📌 업소명: <b>${businessName}</b>\n` +
      `🏷 업종: ${category}\n` +
      `📍 지역: ${region}\n` +
      `👤 신청자: ${ownerEmail}\n\n` +
      `👉 야사장 어드민에서 서류 확인 후 승인해주세요.`;

    const success = await sendTelegramAlert(msg);
    
    return NextResponse.json({ ok: success });
  } catch (err) {
    console.error('API Error (new-business):', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
