import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { sendTelegramAlert } from '@/lib/utils/telegram';

// service_role 클라이언트
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
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { businessId, status, auditNote } = await request.json();
  // status: 'active' | 'rejected'

  try {
    const updateData: {
      status: string;
      audit_note: string;
      audited_at: string;
      updated_at: string;
      is_verified?: boolean;
      is_active?: boolean;
    } = {
      status,
      audit_note: auditNote,
      audited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (status === 'active') {
      updateData.is_verified = true;
      updateData.is_active = true;
    }

    const { data: business, error } = await supabaseAdmin
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)
      .select('name, owner_id')
      .single();

    if (error) throw error;

    // [연동] 야사장 승인 시 P2/P9/P10 shops 도 동시 활성화
    // publish API는 status='active'로 즉시 INSERT하므로 PENDING_REVIEW + active 모두 대상
    if (status === 'active' && business?.owner_id) {
      const { error: shopErr } = await supabaseAdmin
        .from('shops')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
        })
        .eq('user_id', business.owner_id)
        .in('status', ['PENDING_REVIEW', 'active'])
        .eq('is_closed', false);

      if (shopErr) {
        console.error('[business-audit] shops activate error:', shopErr.message);
        // shops 업데이트 실패해도 businesses 승인은 이미 완료 — 무시하고 진행
      }
    }

    // [연동] 야사장 거절 시 P2 shops 도 rejected 처리
    if (status === 'rejected' && business?.owner_id) {
      await supabaseAdmin
        .from('shops')
        .update({
          status: 'rejected',
          rejection_reason: auditNote || '야사장 심사 거절',
        })
        .eq('user_id', business.owner_id)
        .eq('status', 'PENDING_REVIEW');
    }

    // 텔레그램 알림 발송
    const msg = `<b>[업소 심사 완료]</b>\n` +
                `🏪 업소명: <b>${business.name}</b>\n` +
                `📊 결과: ${status === 'active' ? '✅ 승인' : '❌ 거절'}\n` +
                `📝 사유: ${auditNote || '없음'}\n\n` +
                `👉 야사장 플랫폼에서 확인 가능합니다.`;

    await sendTelegramAlert(msg);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Business audit API error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
