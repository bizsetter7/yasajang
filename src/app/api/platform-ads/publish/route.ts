import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * [API] /api/platform-ads/publish — 사장이 야사장 대시보드에서 [광고 게시하기] 클릭
 *
 * 흐름:
 *   1. 사용자 인증 (Bearer 토큰)
 *   2. businesses 정보 조회 (owner_id = 본인)
 *   3. subscription 활성 + 플랜별 게시 권한 확인
 *   4. shops INSERT (status='active', platform=요청)
 *
 * 정책 (2026-04-30):
 *   - 무료 플랜 → 밤길만, 다른 플랫폼 ❌
 *   - 베이직 → 밤길 + 웨이터존
 *   - 스탠다드+ → 밤길 + 웨이터존(스페셜+) + (코코OR선수, platform_choice 따름)
 *   - 광고는 status='active' 즉시 게시 (어드민 재승인 X)
 */
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const PLAN_TO_TIER: Record<string, string> = {
    basic:    'p7', // T7 베이직
    standard: 'p4', // T4 스페셜 (이전 'p5'=급구/추천 오류 수정 — plan_structure_confirmed 기준)
    special:  'p4', // T4 스페셜
    deluxe:   'p3', // T3 디럭스
    premium:  'p2', // T2 프리미엄 (BannerSidebar가 banner_status='none' 필터로 사이드배너 자동 노출 차단)
};

function canPublish(plan: string, platformChoice: string | null, target: string): boolean {
    if (target === 'bamgil') return true; // 모든 플랜 밤길 게시 가능 (단 별도 처리 — bamgil은 shops X)
    if (target === 'waiterzone') return ['basic', 'special', 'deluxe', 'premium'].includes(plan);
    if (target === 'cocoalba') {
        return ['standard', 'special', 'deluxe', 'premium'].includes(plan)
            && platformChoice === 'cocoalba';
    }
    if (target === 'sunsuzone') {
        return ['standard', 'special', 'deluxe', 'premium'].includes(plan)
            && platformChoice === 'sunsuzone';
    }
    return false;
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
        }
        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: '유효하지 않은 토큰' }, { status: 401 });
        }

        const body = await request.json();
        const {
            platform,             // 'cocoalba' | 'waiterzone' | 'sunsuzone'
            title,                // 광고 제목 (사장이 수정한 값)
            content,              // 본문 (사장이 수정한 값)
            category,             // 업종
            region,               // 지역
        } = body;

        if (!platform || !['cocoalba', 'waiterzone', 'sunsuzone'].includes(platform)) {
            return NextResponse.json({ error: '유효한 platform 필요' }, { status: 400 });
        }

        // businesses 조회 (사장 본인)
        const { data: business, error: bizError } = await supabaseAdmin
            .from('businesses')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle();
        if (bizError) throw bizError;
        if (!business) {
            return NextResponse.json({ error: '입점 신청을 먼저 완료해주세요' }, { status: 400 });
        }

        // subscription 활성 확인
        const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('plan, status, platform_choice')
            .eq('business_id', business.id)
            .in('status', ['active', 'trial'])
            .maybeSingle();
        if (!sub) {
            return NextResponse.json({
                error: '활성 구독이 없습니다',
                code: 'NO_SUBSCRIPTION',
                message: '결제 승인 완료 후 광고를 게시할 수 있습니다.',
            }, { status: 403 });
        }

        // 플랜별 게시 권한 확인
        if (!canPublish(sub.plan, sub.platform_choice, platform)) {
            return NextResponse.json({
                error: '해당 플랫폼은 현재 플랜으로 게시할 수 없습니다',
                code: 'PLAN_RESTRICTED',
                message: `${platform} 게시는 플랜 업그레이드가 필요합니다.`,
                currentPlan: sub.plan,
                platformChoice: sub.platform_choice,
            }, { status: 403 });
        }

        // 중복 게시 방지 (같은 사장의 같은 플랫폼 active 광고가 이미 있으면)
        const { data: existing } = await supabaseAdmin
            .from('shops')
            .select('id')
            .eq('user_id', user.id)
            .eq('platform', platform)
            .eq('status', 'active')
            .maybeSingle();
        if (existing) {
            return NextResponse.json({
                error: '이미 해당 플랫폼에 게시된 광고가 있습니다',
                code: 'ALREADY_PUBLISHED',
                shopId: existing.id,
            }, { status: 409 });
        }

        // shops INSERT (status='active' 즉시 게시)
        const tier = PLAN_TO_TIER[sub.plan] ?? 'p7';
        const { data: shopData, error: shopError } = await supabaseAdmin
            .from('shops')
            .insert({
                user_id: user.id,
                name: business.name,
                nickname: business.name, // P2/P9/P10 광고 목록 표시용 — null이면 상호명 폴백되지 않고 enrichAdData가 다른 폴백 사용
                title: title || business.name,
                content: content || business.description || null,
                category: category || business.category,
                // address(한국어) 파싱: "경기 평택시 특구로5번길..." → [0]="경기", [1]="평택시"
                // region_code는 영문코드('gyeonggi')라 절대 사용 금지 (M-048)
                region: region || business.address?.split(/\s+/)[0] || '서울',
                work_region_sub: business.address?.split(/\s+/)[1] || null,
                phone: business.phone,
                manager_name: business.manager_name,
                manager_phone: business.phone,
                tier,
                product_type: tier,
                ad_price: 0,
                status: 'active', // 어드민 재승인 없이 즉시 게시
                // P5 야사장 게시 shop은 배너 별도 신청 전까지 사이드배너 미노출
                // BannerSidebar는 banner_status IS NULL OR 'approved_banner'만 표시
                banner_status: 'none',
                is_closed: false,
                platform,
                options: {
                    yasajang_plan: sub.plan,
                    yasajang_business_id: business.id,
                    business_number: business.business_reg_number || null,
                    address: business.address || null,
                    regionGu: business.address?.split(/\s+/)[1] || null, // P2 ShopDetailView: options.regionGu
                    menu_main: business.menu_main || null,
                    menu_liquor: business.menu_liquor || null,
                    menu_snack: business.menu_snack || null,
                    opened_at: business.opened_at || null,
                    floor_area: business.floor_area || null,
                    license_number: business.license_number || null,
                    published_at: new Date().toISOString(),
                    published_via: 'yasajang-dashboard',
                },
            })
            .select('id')
            .single();

        if (shopError) throw shopError;

        return NextResponse.json({
            success: true,
            shopId: shopData?.id,
            platform,
            redirect: getMyShopUrl(platform),
            message: `${platformLabel(platform)} 광고가 게시되었습니다. 채용 메시지는 ${platformLabel(platform)} 마이샵에서 작성해주세요.`,
        });
    } catch (err: any) {
        console.error('[platform-ads/publish] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function platformLabel(p: string): string {
    return p === 'cocoalba' ? '코코알바' : p === 'waiterzone' ? '웨이터존' : p === 'sunsuzone' ? '선수존' : p;
}

function getMyShopUrl(p: string): string {
    if (p === 'cocoalba') return 'https://www.cocoalba.kr/my-shop';
    if (p === 'waiterzone') return 'https://www.waiterzone.kr/my';
    if (p === 'sunsuzone') return 'https://www.sunsuzone.kr/my';
    return '/dashboard';
}
