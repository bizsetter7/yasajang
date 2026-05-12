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

// businesses.category 컬럼은 한글값으로 저장 (businesses_category_check 제약조건 기준)
const CATEGORY_TO_KO: Record<string, string> = {
  '룸알바': '룸살롱',
  '노래주점': '노래주점',
  '텐프로/쩜오': '룸살롱',
  '요정': '룸살롱',
  '바(Bar)': '유흥주점',
  '엔터': '기타',
  '다방': '기타',
  '카페': '기타',
  '마사지': '기타',
  '기타': '기타',
};

function toCategoryKo(category: string): string {
  const main = (category || '').split('>')[0].trim();
  return CATEGORY_TO_KO[main] || '기타';
}

const PLAN_TO_TIER: Record<string, string> = {
  free:     'p7',
  basic:    'p7', // T7 베이직
  standard: 'p4', // T4 스페셜 (이전 'p5'=급구/추천 오류 — plan_structure_confirmed 기준)
  special:  'p4', // T4 스페셜
  deluxe:   'p3', // T3 디럭스
  premium:  'p2', // T2 프리미엄 (BannerSidebar banner_status 필터로 사이드배너 자동 노출 차단)
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
      phone, address, address_detail, description, menu_main, menu_liquor, menu_snack,
      platform_choice, owner_id, license_path, permit_path, plan,
      license_number, floor_area, opened_at,
      manager_name, manager_role,
      kakao_id, line_id, telegram_id,
      photo_urls,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const tier = PLAN_TO_TIER[plan] || 'p7';
    const isFree = plan === 'free';
    // trial 상태로 신청 — 실제 결제 전까지 코코알바에 금액 0 표시
    const adPrice = 0;
    const regionCode = toRegionCode(region);
    const categoryKo = toCategoryKo(category);

    // 1. businesses 테이블 INSERT
    // manager_name 우선순위: 영업진 본인(manager_name) → 대표자(representative)
    const finalManagerName = (manager_name && manager_name.trim()) || representative || null;
    const finalManagerRole = manager_role || '실장';

    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .insert({
        name,
        category: categoryKo,
        region_code: regionCode,
        address: address || null,
        address_detail: address_detail || null,
        phone,
        manager_name: finalManagerName,
        manager_role: finalManagerRole,
        description: description || null,
        menu_main: menu_main || null,
        menu_liquor: menu_liquor || null,
        menu_snack: menu_snack || null,
        business_reg_url: license_path || null,
        permit_path: permit_path || null,
        business_reg_number: business_number || null,
        license_number: license_number || null,
        floor_area: floor_area || null,
        opened_at: opened_at || null,
        kakao_id: kakao_id || null,
        line_id: line_id || null,
        telegram_id: telegram_id || null,
        images: Array.isArray(photo_urls) && photo_urls.length > 0 ? photo_urls : [],
        cover_image_url: Array.isArray(photo_urls) && photo_urls.length > 0 ? photo_urls[0] : null,
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

    // 1-1. profiles UPSERT — 야사장 회원은 무조건 corporate
    // (callback에서 이미 처리되지만 안전망: 이메일/비밀번호 가입, 트리거 누락 등 대비)
    if (owner_id) {
      try {
        // auth.users에서 email 조회 (contact_email + username placeholder 보정용)
        let authEmail: string | null = null;
        try {
          const { data: auData } = await supabase.auth.admin.getUserById(owner_id);
          authEmail = auData?.user?.email ?? null;
        } catch (e) { /* 조회 실패 시 email은 null로 진행 */ }

        // 기존 profile placeholder 상태 확인 (username='신규회원' 등 트리거 기본값)
        const { data: existing } = await supabase
          .from('profiles')
          .select('username, full_name, business_name, phone, contact_email, nickname')
          .eq('id', owner_id)
          .maybeSingle();

        const finalUsername =
          (existing?.username && existing.username !== '신규회원')
            ? existing.username
            : (authEmail?.split('@')[0] || `user_${owner_id.slice(0, 8)}`);
        const finalNickname = existing?.nickname || finalManagerName || name;

        await supabase.from('profiles').upsert({
          id: owner_id,
          username: finalUsername,
          full_name: existing?.full_name || finalManagerName || representative || '',
          nickname: finalNickname,
          business_name: existing?.business_name || name, // 상호명 = 어드민 회원관리 첫 표시
          phone: existing?.phone || phone || null,
          contact_email: existing?.contact_email || authEmail || null,
          business_number: business_number || null,
          business_address: address || null,
          business_address_detail: address_detail || null,
          manager_phone: phone || null,
          role: 'corporate',
          user_type: 'corporate',
          // 야사장 입점 신청 완료(서류 OCR 검증) = 사업자 인증 완료
          // P2/P9/P10 마이샵에서 '사업자 인증이 필요합니다' 배너 사라짐
          business_verified: true,
          business_verify_status: 'pending', // 어드민 최종 검토 전까지 pending
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('profiles upsert 실패 (무시하고 계속):', e);
      }
    }

    // 2. shops 자동 INSERT 제거 (2026-04-30 정책 변경)
    //    → 광고는 어드민 결제 승인 후 사장이 야사장 대시보드에서 [광고 게시하기] 버튼으로 직접 게시
    //    → /api/platform-ads/publish 엔드포인트 활용
    //    → 사장이 콘텐츠를 한번 더 검토·수정한 후 게시하여 실수 방지
    const shopId: string | null = null;

    // 3. subscriptions 테이블 INSERT
    // free 플랜 = 밤길 3개월 무료, 그 외 = 7일 trial
    if (businessId) {
      const trialDays = isFree ? 90 : 7;
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          business_id: businessId,
          plan: plan || 'basic',
          status: 'trial',
          platform_choice: (plan === 'basic' || isFree) ? null : (platform_choice || null),
          trial_starts_at: new Date().toISOString(),
          trial_ends_at: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (subError) {
        // 구독 생성 실패 → 방금 생성한 업체도 롤백 (고아 업체 방지)
        console.error('subscriptions insert failed → rolling back business:', businessId, subError);
        await supabase.from('businesses').delete().eq('id', businessId);
        return NextResponse.json({ error: `구독 생성 실패: ${subError.message}` }, { status: 500 });
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
