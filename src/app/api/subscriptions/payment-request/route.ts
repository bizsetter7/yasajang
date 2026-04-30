import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTelegramAlert } from '@/lib/utils/telegram';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId, plan, period_months, payerName, payDate, platform_choice, note } = await request.json();
  if (!payerName || !payDate) {
    return NextResponse.json({ error: '입금자명과 날짜는 필수입니다' }, { status: 400 });
  }

  // 본인 업소 확인
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, owner_id')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single();

  if (!business) return NextResponse.json({ error: '업소를 찾을 수 없습니다' }, { status: 404 });

  const reference = `${payerName}_${payDate}${note ? `_${note}` : ''}`;

  // subscriptions 업데이트
  const updateData: Record<string, unknown> = {
    payment_reference: reference,
    payment_method: 'bank_transfer',
    platform_choice: platform_choice,
    updated_at: new Date().toISOString(),
  };
  if (plan) updateData.plan = plan;
  if (period_months && Number.isInteger(Number(period_months))) {
    updateData.period_months = Number(period_months);
  }

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('business_id', businessId);

  if (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json({ error: '신청 중 오류가 발생했습니다. (RLS 확인 필요)' }, { status: 500 });
  }

  // 어드민 텔레그램 알림
  await sendTelegramAlert(
    `💳 <b>무통장 입금 신청</b>\n\n` +
    `🏪 업소명: <b>${business.name}</b>\n` +
    `📦 플랜: ${plan || '미선택'} (${period_months || 1}개월)\n` +
    `👤 입금자명: ${payerName}\n` +
    `📅 입금일: ${payDate}\n\n` +
    `👉 야사장 어드민 → 입금 확인 탭에서 처리해주세요.`
  );

  return NextResponse.json({ ok: true });
}
