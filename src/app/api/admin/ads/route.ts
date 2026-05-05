import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'bizsetter7@gmail.com';
  return !!user && user.email === adminEmail;
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') ?? 'all';
  const bannerStatus = searchParams.get('banner_status') ?? 'all';

  // shops.user_id → profiles.id 간 FK constraint 미보장이므로 2-step 쿼리
  let query = supabaseAdmin
    .from('shops')
    .select('id, user_id, platform, banner_status, banner_image_url, tier, deadline, status, options')
    .order('deadline', { ascending: true });

  if (platform !== 'all') {
    query = query.eq('platform', platform);
  }
  if (bannerStatus === 'approved') {
    query = query.eq('banner_status', 'approved');
  } else if (bannerStatus === 'approved_banner') {
    query = query.eq('banner_status', 'approved_banner');
  } else if (bannerStatus === 'pending_banner') {
    query = query.eq('banner_status', 'pending_banner');
  } else if (bannerStatus === 'rejected_banner') {
    query = query.eq('banner_status', 'rejected_banner');
  } else if (bannerStatus === 'none') {
    query = query.eq('banner_status', 'none');
  } else if (bannerStatus === 'null') {
    query = query.is('banner_status', null);
  }

  const { data: shops, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [...new Set((shops ?? []).map(s => s.user_id).filter(Boolean))];
  let profileMap = new Map<string, string | null>();
  let platformsMap = new Map<string, string[]>();
  if (userIds.length > 0) {
    const [{ data: profiles }, { data: allShops }] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, business_name').in('id', userIds),
      supabaseAdmin.from('shops').select('user_id, platform, status').in('user_id', userIds),
    ]);
    profileMap = new Map((profiles ?? []).map(p => [p.id as string, p.business_name as string | null]));
    // 유저별 활성 플랫폼 목록
    for (const s of (allShops ?? [])) {
      if (!s.user_id) continue;
      const list = platformsMap.get(s.user_id) ?? [];
      if (s.status === 'active' && !list.includes(s.platform)) list.push(s.platform);
      platformsMap.set(s.user_id, list);
    }
  }

  const result = (shops ?? []).map(s => ({
    ...s,
    business_name: profileMap.get(s.user_id) ?? null,
    active_platforms: platformsMap.get(s.user_id) ?? [],
  }));

  return NextResponse.json({ ads: result });
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { shopId, banner_status } = await request.json() as { shopId: string | number; banner_status: string };
  const allowed = ['approved', 'none', 'approved_banner', 'rejected_banner', 'pending_banner'];
  if (!shopId || !allowed.includes(banner_status)) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('shops')
    .update({ banner_status })
    .eq('id', shopId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
