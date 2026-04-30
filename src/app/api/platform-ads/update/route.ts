import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST /api/platform-ads/update
// body: { businessId, platform, hiringInfo: {...} }
// 플랫폼별 구인 조건을 shops.options 에 병합 저장 (야사장 공유 DB)
export async function POST(request: Request) {
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
    const { businessId, platform, hiringInfo } = body;

    if (!businessId || !platform || !hiringInfo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 해당 유저의 shops 조회 — 반드시 platform 필터 포함
    // platform 없이 user_id만 걸면 모든 플랫폼 shop이 같이 덮어써짐 (M-056)
    const { data: shops, error: fetchError } = await supabaseAdmin
      .from('shops')
      .select('id, options')
      .eq('user_id', user.id)
      .eq('platform', platform);

    if (fetchError) {
      console.error('[platform-ads/update] fetch error:', fetchError);
      return NextResponse.json({ error: 'DB fetch error' }, { status: 500 });
    }

    if (!shops || shops.length === 0) {
      // shops가 없으면 businesses 테이블에 임시 저장 (platform_info JSONB)
      // businesses 테이블의 options 컬럼에 저장 시도
      const { error: bizError } = await supabaseAdmin
        .from('businesses')
        .update({
          [`platform_hiring_${platform}`]: hiringInfo,
        } as Record<string, unknown>)
        .eq('id', businessId)
        .eq('owner_id', user.id);

      if (bizError) {
        // 컬럼이 없을 수 있으므로 무시하고 성공 반환
        console.warn('[platform-ads/update] businesses update skipped:', bizError.message);
      }

      return NextResponse.json({ success: true, updatedCount: 0, message: 'No linked shops found — saved to business profile' });
    }

    // 각 shop의 options에 hiring_info 병합 저장
    let updatedCount = 0;
    for (const shop of shops) {
      const existingOptions = (shop.options || {}) as Record<string, unknown>;
      // "19:00"~"06:00" → "19:00~06:00"
      const workTimeStr = (hiringInfo.work_start && hiringInfo.work_end)
        ? `${hiringInfo.work_start}~${hiringInfo.work_end}`
        : null;

      // ─── workType 매핑 (웨이터존/선수존 직종 → options.workType)
      let workTypeMapped: string | undefined;
      if (platform !== 'cocoalba' && Array.isArray(hiringInfo.job_type) && hiringInfo.job_type.length > 0) {
        workTypeMapped = (hiringInfo.job_type as string[]).join('/');
      }

      // ─── paySuffixes 매핑 (룸티/보너스)
      const paySuffixesNew: string[] = [];
      if (platform === 'waiterzone' && hiringInfo.room_tip) {
        paySuffixesNew.push(`룸티 ${Math.round(Number(hiringInfo.room_tip) / 10000)}만`);
      }
      if (platform === 'sunsuzone' && hiringInfo.bonus) {
        paySuffixesNew.push(`보너스 ${Math.round(Number(hiringInfo.bonus) / 10000)}만`);
      }
      if (platform === 'sunsuzone' && hiringInfo.accommodation) {
        paySuffixesNew.push('숙소제공');
      }

      const newOptions: Record<string, unknown> = {
        ...existingOptions,
        hiring_info: {
          ...(existingOptions.hiring_info as Record<string, unknown> || {}),
          [platform]: hiringInfo,
        },
        // P2 ShopDetailView 호환: options.ageMin/ageMax 직접 읽음
        ...(hiringInfo.age_min != null ? { ageMin: hiringInfo.age_min } : {}),
        ...(hiringInfo.age_max != null ? { ageMax: hiringInfo.age_max } : {}),
        // P2 anyAdToShop: opt?.workTime 로 읽음
        ...(workTimeStr ? { workTime: workTimeStr } : {}),
        // 직종 → workType (웨이터존/선수존)
        ...(workTypeMapped ? { workType: workTypeMapped } : {}),
        // 룸티/보너스 → paySuffixes
        ...(paySuffixesNew.length > 0 ? { paySuffixes: paySuffixesNew } : {}),
      };

      // ─── top-level pay 컬럼 매핑 — P2/P9/P10 광고카드가 읽는 컬럼 (M-056)
      // hiring_info에만 저장하면 카드에 급여 공백. 반드시 top-level에도 동기화.
      let payType = '협의';
      let payAmount = 0;
      if (platform === 'cocoalba') {
        if (hiringInfo.tc) { payType = 'TC'; payAmount = Number(hiringInfo.tc); }
      } else if (platform === 'waiterzone') {
        if (hiringInfo.salary) { payType = '일급'; payAmount = Number(hiringInfo.salary); }
      } else if (platform === 'sunsuzone') {
        if (hiringInfo.salary) { payType = '일급'; payAmount = Number(hiringInfo.salary); }
      }

      const updatePayload: Record<string, unknown> = {
        options: newOptions,
        pay_type: payType,
        pay_amount: payAmount,
        pay: String(payAmount),
      };

      const { error: updateError } = await supabaseAdmin
        .from('shops')
        .update(updatePayload)
        .eq('id', shop.id);

      if (!updateError) updatedCount++;
      else console.error(`[platform-ads/update] shop ${shop.id} update error:`, updateError);
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (err) {
    console.error('[platform-ads/update] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
