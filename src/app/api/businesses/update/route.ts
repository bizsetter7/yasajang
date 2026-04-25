import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      businessId,
      // 기본 정보 (재심사)
      name, phone, address, addressDetail, openChatUrl, category, regionCode,
      // 홍보 정보 (즉시 반영)
      businessHours, managerName, managerPhone,
      roomCount, ageRange,
      hasParking, hasValet, hasPickup,
      description, openedAt, floorArea, coverImageUrl,
      menuItems, extraFees,
    } = body;

    // 본인 업소 확인
    const { data: biz, error: fetchErr } = await supabaseAdmin
      .from('businesses').select('owner_id').eq('id', businessId).single();
    if (fetchErr || biz.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 기본 정보 변경 여부 확인 (재심사 여부 결정)
    const { data: current } = await supabaseAdmin
      .from('businesses')
      .select('name, phone, address, category, region_code')
      .eq('id', businessId).single();

    const basicChanged =
      current?.name !== name ||
      current?.phone !== phone ||
      current?.address !== address ||
      current?.category !== category ||
      current?.region_code !== regionCode;

    const updatePayload: Record<string, any> = {
      // 기본 정보
      name, phone,
      address, address_detail: addressDetail,
      open_chat_url: openChatUrl,
      category, region_code: regionCode,
      // 홍보 정보
      business_hours: businessHours || null,
      manager_name: managerName || null,
      manager_phone: managerPhone || null,
      room_count: roomCount ? parseInt(roomCount) : null,
      age_range: ageRange || null,
      has_parking: hasParking ?? false,
      has_valet: hasValet ?? false,
      has_pickup: hasPickup ?? false,
      description: description || null,
      opened_at: openedAt || null,
      floor_area: floorArea || null,
      cover_image_url: coverImageUrl || null,
      menu_items: Array.isArray(menuItems) ? menuItems : [],
      extra_fees: Array.isArray(extraFees) ? extraFees : [],
      updated_at: new Date().toISOString(),
    };

    // 기본 정보 변경 시에만 재심사
    if (basicChanged) {
      updatePayload.status = 'pending';
      updatePayload.is_verified = false;
    }

    const { error: updateErr } = await supabaseAdmin
      .from('businesses').update(updatePayload).eq('id', businessId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true, reaudit: basicChanged });
  } catch (err: any) {
    console.error('Business update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
