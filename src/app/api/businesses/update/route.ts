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
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Route Handler에서는 정상 동작 */ }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      businessId,
      // 기본 정보 (재심사)
      name, phone, address, addressDetail, openChatUrl, category, regionCode,
      menu_main, menu_liquor, menu_snack,
      // 메신저 연락처
      kakao_id, line_id, telegram_id,
      // 홍보 정보 (즉시 반영)
      businessHours, managerName, managerPhone,
      roomCount, ageRange,
      hasParking, hasValet, hasPickup,
      description, openedAt, floorArea, coverImageUrl,
      images,
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

    const updatePayload: Record<string, string | number | boolean | null | object> = {
      // 기본 정보
      name, phone,
      address, address_detail: addressDetail,
      open_chat_url: openChatUrl,
      category, region_code: regionCode,
      menu_main: menu_main || null,
      menu_liquor: menu_liquor || null,
      menu_snack: menu_snack || null,
      // 메신저 연락처
      kakao_id: kakao_id || null,
      line_id: line_id || null,
      telegram_id: telegram_id || null,
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
      // cover_image_url + images 둘 다 빈값이면 기존 DB 값 유지 (race condition 방지)
      // edit 페이지가 photoUrls 로드 전에 저장하면 빈 값이 올 수 있음
      ...(coverImageUrl ? { cover_image_url: coverImageUrl } : {}),
      ...(Array.isArray(images) && images.length > 0 ? { images } : {}),
      menu_items: menuItems || null,
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

    // DB에서 최신 이미지 재조회 (race condition 방지: 빈 배열로 기존 이미지 덮어쓰지 않도록)
    const { data: bizAfterUpdate } = await supabaseAdmin
      .from('businesses')
      .select('images, cover_image_url')
      .eq('id', businessId)
      .single();
    const syncImages = Array.isArray(bizAfterUpdate?.images) && (bizAfterUpdate.images as string[]).length > 0
      ? bizAfterUpdate.images as string[]
      : null;

    // 업체명·카테고리·지역·이미지 변경 시 shops 테이블도 동기화 (코코알바/웨이터존 등 게시 광고 반영)
    {
      const shopSync: Record<string, unknown> = {};
      if (name) { shopSync.name = name; shopSync.title = name; }
      if (category) shopSync.category = category;
      // address(한국어) 파싱: "경기 평택시 특구로5번길..." → [0]="경기", [1]="평택시"
      // region_code는 영문코드('gyeonggi')라 절대 사용 금지 (M-048)
      if (address) {
        const [regionMain, regionSub = null] = address.split(/\s+/);
        shopSync.region = regionMain;
        shopSync.work_region_sub = regionSub;
      }
      if (syncImages) {
        shopSync.media_url = syncImages[0] || null;
      }
      if (Object.keys(shopSync).length > 0) {
        // options.regionGu(P2 ShopDetailView에서 읽음) + mediaUrl/images도 병합 업데이트
        const { data: userShops } = await supabaseAdmin
          .from('shops').select('id, options').eq('user_id', user.id);
        for (const shop of (userShops || [])) {
          const opts = (shop.options as Record<string, unknown>) || {};
          const optsPatch: Record<string, unknown> = { ...opts };
          if (address) optsPatch.regionGu = address.split(/\s+/)[1] || null;
          // DB에서 가져온 최신 이미지 사용 (race condition 방지)
          if (syncImages) { optsPatch.mediaUrl = syncImages[0] || null; optsPatch.images = syncImages; }
          await supabaseAdmin.from('shops').update({
            ...shopSync,
            options: optsPatch,
          }).eq('id', shop.id);
        }
      }
    }

    return NextResponse.json({ ok: true, reaudit: basicChanged });
  } catch (err) {
    console.error('Business update error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
