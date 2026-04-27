import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminHeaders = {
  'Content-Type': 'application/json',
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Prefer': 'return=representation',
};

// 한글 시/도 → region_code 매핑
const SIDO_TO_CODE: Record<string, string> = {
  '서울': 'seoul', '경기': 'gyeonggi', '인천': 'incheon',
  '부산': 'busan', '대구': 'daegu', '대전': 'daejeon',
  '광주': 'gwangju', '울산': 'ulsan', '세종': 'sejong',
  '강원': 'gangwon', '충북': 'chungbuk', '충남': 'chungnam',
  '전북': 'jeonbuk', '전남': 'jeonnam', '경북': 'gyeongbuk',
  '경남': 'gyeongnam', '제주': 'jeju',
};

function toRegionCode(region: string): string {
  const sido = (region || '').split(' ')[0];
  return SIDO_TO_CODE[sido] || 'gyeonggi';
}

// 한글 대분류 → businesses.category 허용값 매핑
const CATEGORY_TO_CODE: Record<string, string> = {
  '룸알바': 'room_salon',
  '노래주점': 'karaoke_bar',
  '텐프로/쩜오': 'room_salon',
  '요정': 'room_salon',
  '바(Bar)': 'bar',
  '엔터': 'other',
  '다방': 'other',
  '카페': 'other',
  '마사지': 'other',
  '기타': 'other',
};

function toCategoryCode(category: string): string {
  // "대분류 > 상세" 형식이면 대분류만 추출
  const main = (category || '').split('>')[0].trim();
  return CATEGORY_TO_CODE[main] || 'other';
}

// 야사장 플랜 → 코코알바 tier 매핑
const PLAN_TO_TIER: Record<string, string> = {
  basic:    'p7',
  standard: 'p5',
  special:  'p4',
  deluxe:   'p3',
  premium:  'p2',
};

// 야사장 플랜 → 코코알바 ad_price 매핑 (원)
const PLAN_TO_PRICE: Record<string, number> = {
  basic:    22000,
  standard: 66000,
  special:  88000,
  deluxe:   199000,
  premium:  399000,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, category, region, representative, business_number,
      phone, address, description, menu_main, menu_liquor, menu_snack,
      platform_choice, owner_id, license_path, permit_path, plan,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    if (!SB_KEY || SB_KEY.length < 10) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ error: '서버 환경 설정 오류 (SERVICE_KEY_MISSING)' }, { status: 500 });
    }

    const tier = PLAN_TO_TIER[plan] || 'p7';
    const adPrice = PLAN_TO_PRICE[plan] || 22000;
    const regionCode = toRegionCode(region);
    const categoryCode = toCategoryCode(category);

    // 1. businesses 테이블 INSERT (실제 스키마에 맞춤)
    const bizRes = await fetch(`${SB_URL}/rest/v1/businesses`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name,
        category: categoryCode,
        region_code: regionCode,
        address: address || null,
        phone,
        manager_name: representative || null,
        description: description || null,
        menu_main: menu_main || null,
        menu_liquor: menu_liquor || null,
        menu_snack: menu_snack || null,
        business_reg_url: license_path || null,
        permit_path: permit_path || null,
        owner_id: owner_id || null,
        status: 'pending',
        cocoalba_tier: plan || 'basic',
        is_active: false,
        is_verified: false,
      }),
    });

    if (!bizRes.ok) {
      const err = await bizRes.json().catch(() => ({}));
      const msg = (err as any)?.message || (err as any)?.error || bizRes.statusText;
      return NextResponse.json({ error: `신청 등록 실패: ${msg}` }, { status: 500 });
    }

    const bizData = await bizRes.json();
    const businessId = Array.isArray(bizData) ? bizData[0]?.id : bizData?.id;

    // 2. shops 테이블에도 INSERT → P2 코코알바 광고 목록에 노출
    const shopsRes = await fetch(`${SB_URL}/rest/v1/shops`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        user_id: owner_id || null,
        name,
        title: `[야사장] ${name} 광고 신청`,
        content: description || null,
        category,
        region,
        phone,
        tier,
        product_type: tier,
        ad_price: adPrice,
        status: 'PENDING_REVIEW',
        is_closed: false,
        options: {
          yasajang_plan: plan,
          platform_choice: platform_choice || null,
          business_number: business_number || null,
          address: address || null,
          yasajang_business_id: businessId || null,
          menu_main: menu_main || null,
          menu_liquor: menu_liquor || null,
          menu_snack: menu_snack || null,
        },
      }),
    });

    let shopId: number | null = null;
    let shopError: string | null = null;
    if (shopsRes.ok) {
      const shopData = await shopsRes.json();
      shopId = Array.isArray(shopData) ? shopData[0]?.id : shopData?.id;
    } else {
      const err = await shopsRes.json().catch(() => ({}));
      shopError = (err as any)?.message || (err as any)?.error || shopsRes.statusText;
      console.error('shops insert error:', err);
    }

    // 3. subscriptions 테이블 INSERT
    if (businessId) {
      const subRes = await fetch(`${SB_URL}/rest/v1/subscriptions`, {
        method: 'POST',
        headers: { ...adminHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          business_id: businessId,
          plan: plan || 'basic',
          status: 'trial',
          platform_choice: plan === 'basic' ? null : (platform_choice || null),
          trial_starts_at: new Date().toISOString(),
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      if (!subRes.ok) {
        const err = await subRes.json().catch(() => ({}));
        console.error('subscriptions insert error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      business_id: businessId,
      shop_id: shopId,
      tier,
    });
  } catch (err) {
    console.error('register API error:', err);
    const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
