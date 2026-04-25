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
      .select('name')
      .single();

    if (error) throw error;

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
