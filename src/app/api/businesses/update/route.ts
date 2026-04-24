import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// service_role 클라이언트
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { businessId, name, phone, address, addressDetail, openChatUrl, category, regionCode } = await request.json();

    // 본인 업소인지 확인
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single();

    if (fetchError || business.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 정보 수정 및 상태를 pending으로 변경 (재심사)
    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({
        name,
        phone,
        address,
        address_detail: addressDetail,
        open_chat_url: openChatUrl,
        category,
        region_code: regionCode,
        status: 'pending', // 수정 시 재심사 필요
        is_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Business update API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
