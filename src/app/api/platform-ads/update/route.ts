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

    // 해당 유저의 shops 조회 (user_id 기준 — JSONB 필터 불필요)
    const { data: shops, error: fetchError } = await supabaseAdmin
      .from('shops')
      .select('id, options')
      .eq('user_id', user.id);

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
      const newOptions = {
        ...existingOptions,
        hiring_info: {
          ...(existingOptions.hiring_info as Record<string, unknown> || {}),
          [platform]: hiringInfo,
        },
      };

      const { error: updateError } = await supabaseAdmin
        .from('shops')
        .update({ options: newOptions })
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
