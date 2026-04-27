import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const main = (category || '').split('>')[0].trim();
  return CATEGORY_TO_CODE[main] || 'other';
}

const PLAN_TO_TIER: Record<string, string> = {
  basic:    'p7',
  standard: 'p5',
  special:  'p4',
  deluxe:   'p3',
  premium:  'p2',
};

const PLAN_TO_PRICE: Record<string, number> = {
  basic:    22000,
  standard: 66000,
  special:  88000,
  deluxe:   199000,
  premium:  399000,
};

export async function POST(req: NextRequest) {
  try {
    const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SB_URL || !SB_KEY) {
      console.error('Supabase env vars missing:', { SB_URL: !!SB_URL, SB_KEY: !!SB_KEY });
      return NextResponse.json({ error: '서버 환경 설정 오류 (MISSING_ENV)' }, { status: 500 });
    }

    const supabase = createClient(SB_URL, SB_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const {
      name, category, region, representative, business_number,
      phone, address, description, menu_main, menu_liquor, menu_snack,
      platform_choice, owner_id, license_path, permit_path, plan,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const tier = PLAN_TO_TIER[plan] || 'p7';
    const adPrice = PLAN_TO_PRICE[plan] || 22000;
    const regionCode = toRegionCode(region);
    const categoryCode = toCategoryCode(category);

    // 1. businesses 테이블 INSERT
    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .insert({
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
      })
      .select('id')
      .single();

    if (bizError) {
      console.error('businesses insert error:', bizError);
      return NextResponse.json({ error: `신청 등록 실패: ${bizError.message}` }, { status: 500 });
    }

    const businessId = bizData?.id ?? null;

    // 2. shops 테이블 INSERT → 코코알바 광고 목록 노출
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .insert({
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
      })
      .select('id')
      .single();

    if (shopError) {
      console.error('shops insert error:', shopError);
    }

    const shopId = shopData?.id ?? null;

    // 3. subscriptions 테이블 INSERT
    if (businessId) {
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          business_id: businessId,
          plan: plan || 'basic',
          status: 'trial',
          platform_choice: plan === 'basic' ? null : (platform_choice || null),
          trial_starts_at: new Date().toISOString(),
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (subError) {
        console.error('subscriptions insert error:', subError);
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
