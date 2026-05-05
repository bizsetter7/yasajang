import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Tag, Calendar, Image as ImageIcon, Megaphone } from 'lucide-react';
import BusinessCard from '@/components/dashboard/BusinessCard';
import SubscriptionCard from '@/components/dashboard/SubscriptionCard';
import BamgilStatsCard from '@/components/dashboard/BamgilStatsCard';
import PlatformGrid from '@/components/dashboard/PlatformGrid';
import AnnouncementModal from '@/components/dashboard/AnnouncementModal';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 로그인 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // 어드민 계정은 어드민 대시보드로 리다이렉트
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'bizsetter7@gmail.com';
  if (user.email === adminEmail) redirect('/admin');

  // 내 업소 조회
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  // 구독 및 밤길 통계 조회 (business가 있을 때만)
  let subscription = null;
  let bamgilCount = 0;
  let jumpBalance: number | null = null;
  let lastMonthBamgilCount = 0;
  let callCount = 0;
  let chatCount = 0;
  let visitCount = 0;
  let daily7d: number[] = [0, 0, 0, 0, 0, 0, 0];
  let activeCouponCount = 0;
  let activeEventCount = 0;
  let activeNoticeCount = 0;

  // 점프 잔액 조회 — subscription_balance 단독 표시 (자정마다 cron이 +1, P2도 동일 기준으로 수정됨)
  const { data: jumpData } = await supabase
    .from('user_jumps')
    .select('subscription_balance')
    .eq('user_id', user.id)
    .single();
  jumpBalance = jumpData?.subscription_balance ?? null;

  if (business) {
    const svc = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      { data: subData },
      { count: thisMonthCount },
      { count: lastMonthCount },
      { data: typeRows },
      { data: recent7dRows },
      { count: couponCount },
      { count: eventCount },
      { count: noticeCount },
    ] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('business_id', business.id).single(),
      supabase.from('bamgil_contacts').select('*', { count: 'exact', head: true })
        .eq('business_id', business.id).gte('contacted_at', thisMonthStart.toISOString()),
      supabase.from('bamgil_contacts').select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .gte('contacted_at', lastMonthStart.toISOString())
        .lt('contacted_at', thisMonthStart.toISOString()),
      supabase.from('bamgil_contacts').select('contact_type')
        .eq('business_id', business.id).gte('contacted_at', thisMonthStart.toISOString()),
      supabase.from('bamgil_contacts').select('contacted_at')
        .eq('business_id', business.id).gte('contacted_at', sevenDaysAgo.toISOString()),
      svc.from('bamgil_coupons').select('*', { count: 'exact', head: true })
        .eq('business_id', business.id).eq('is_active', true),
      svc.from('business_events').select('*', { count: 'exact', head: true })
        .eq('business_id', business.id).eq('is_active', true),
      svc.from('business_notices').select('*', { count: 'exact', head: true })
        .eq('business_id', business.id).eq('is_active', true),
    ]);

    subscription = subData;
    bamgilCount = thisMonthCount ?? 0;
    lastMonthBamgilCount = lastMonthCount ?? 0;
    activeCouponCount = couponCount ?? 0;
    activeEventCount = eventCount ?? 0;
    activeNoticeCount = noticeCount ?? 0;

    // 유형별 집계
    for (const row of typeRows ?? []) {
      if (row.contact_type === 'call') callCount++;
      else if (row.contact_type === 'chat') chatCount++;
      else if (row.contact_type === 'visit') visitCount++;
    }

    // 7일 일별 집계
    const dayBuckets = new Array(7).fill(0);
    for (const row of recent7dRows ?? []) {
      const diff = Math.floor((new Date(row.contacted_at).getTime() - sevenDaysAgo.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) dayBuckets[diff]++;
    }
    daily7d = dayBuckets;
  }

  // 플랫폼 현황 — platform 컬럼 기반 (Migration 07 이후)
  const { data: shops } = await supabase
    .from('shops')
    .select('id, platform, status, category, banner_status')
    .eq('user_id', user.id);

  // 게시 상태(active)인 광고만 카운트
  const publishedShops = (shops ?? [])
    .filter(s => s.status === 'active' && s.platform)
    .map(s => ({ platform: s.platform as string, id: s.id }));

  // 배너 상태 요약 (active shop 기준)
  const activeShopBannerStatuses = (shops ?? [])
    .filter(s => s.status === 'active')
    .map(s => (s as { banner_status?: string | null }).banner_status);
  const bannerSummary: 'approved' | 'pending' | 'none' =
    activeShopBannerStatuses.some(b => b === 'approved_banner') ? 'approved' :
    activeShopBannerStatuses.some(b => b === 'pending_banner') ? 'pending' : 'none';
  const cocoShopCount = publishedShops.filter(s => s.platform === 'cocoalba').length;
  const waiterShopCount = publishedShops.filter(s => s.platform === 'waiterzone').length;
  const sunsuShopCount = publishedShops.filter(s => s.platform === 'sunsuzone').length;
  const bamgilActive = business?.is_active === true;
  // P5는 무료 플랜이면 'free', 그 외는 subscription.plan
  const planName = subscription?.plan || 'free';
  const platformChoice = subscription?.platform_choice ?? null;

  const platformCards = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 밤길 */}
      <a
        href={business ? `https://www.bamgil.kr/places/${business.id}` : 'https://www.bamgil.kr'}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-6 bg-white border border-gray-200 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all group"
      >
        <h3 className="text-sm font-bold text-amber-500 mb-3">밤길 업소 현황</h3>
        <div className="flex items-end gap-2 mb-4">
          <span className={`text-4xl font-black ${bamgilActive ? 'text-gray-900' : 'text-gray-300'}`}>
            {bamgilActive ? '게시중' : '미게시'}
          </span>
        </div>
        <span className="text-xs font-bold text-amber-500 flex items-center gap-1 group-hover:gap-2 transition-all border-t border-gray-100 pt-4">
          밤길 업소 페이지 바로가기 →
        </span>
      </a>
      {/* 코코알바 */}
      <a
        href="https://cocoalba.kr/my-shop"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-6 bg-white border border-gray-200 rounded-2xl hover:border-rose-300 hover:shadow-md transition-all group"
      >
        <h3 className="text-sm font-bold text-rose-500 mb-3">코코알바 공고 현황</h3>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-black text-gray-900">{cocoShopCount}</span>
          <span className="text-gray-500 mb-1 font-medium">개 공고</span>
        </div>
        <span className="text-xs font-bold text-rose-500 flex items-center gap-1 group-hover:gap-2 transition-all border-t border-gray-100 pt-4">
          코코알바 마이샵 바로가기 →
        </span>
      </a>
      {/* 웨이터존 */}
      <a
        href="https://waiterzone.kr/my"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group"
      >
        <h3 className="text-sm font-bold text-blue-500 mb-3">웨이터존 공고 현황</h3>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-black text-gray-900">{waiterShopCount}</span>
          <span className="text-gray-500 mb-1 font-medium">개 공고</span>
        </div>
        <span className="text-xs font-bold text-blue-500 flex items-center gap-1 group-hover:gap-2 transition-all border-t border-gray-100 pt-4">
          웨이터존 마이샵 바로가기 →
        </span>
      </a>
      {/* 선수존 */}
      <a
        href="https://sunsuzone.kr/my"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-6 bg-white border border-gray-200 rounded-2xl hover:border-yellow-300 hover:shadow-md transition-all group"
      >
        <h3 className="text-sm font-bold text-yellow-600 mb-3">선수존 공고 현황</h3>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-black text-gray-900">{sunsuShopCount}</span>
          <span className="text-gray-500 mb-1 font-medium">개 공고</span>
        </div>
        <span className="text-xs font-bold text-yellow-600 flex items-center gap-1 group-hover:gap-2 transition-all border-t border-gray-100 pt-4">
          선수존 마이샵 바로가기 →
        </span>
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {/* 공지 모달 (1회 표시 + 다시 보지 않기) */}
      <AnnouncementModal />

      <div className="max-w-6xl mx-auto">
        <header className="space-y-1 mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">사장님 대시보드</h1>
          <p className="text-gray-500 font-medium">업소 관리와 구독 현황을 한눈에 확인하세요.</p>
        </header>

        {/* ── 상세 정보 미입력 안내 배너 ── */}
        {business && !business.description && !business.business_hours && !business.cover_image_url && (
          <section className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
            <span className="text-2xl shrink-0">✏️</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-amber-700 text-sm mb-0.5">업소 상세 정보를 아직 입력하지 않으셨어요!</p>
              <p className="text-amber-600/80 text-xs leading-relaxed">
                영업시간 · 메뉴 · 소개글 · 사진을 입력하면 밤길에서 훨씬 많은 고객이 찾아옵니다.
              </p>
            </div>
            <a
              href="/dashboard/edit"
              className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-colors whitespace-nowrap"
            >
              지금 입력하기 →
            </a>
          </section>
        )}

        {business ? (
          /* ── PC: 좌측 메인 + 우측 사이드바 ── */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start mt-6">
            {/* 좌측 */}
            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">내 업소 정보</h2>
                <BusinessCard business={business} subscription={subscription} />
              </section>

              <section className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">플랫폼 현황</h2>
                {platformCards}
              </section>

              {/* ── 플랫폼 구인 조건 관리 (2026-04-30 — 무료 비활성화 + 광고게시 흐름) ── */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">플랫폼 구인 조건</h2>
                  <span className="text-[10px] text-gray-400 font-medium">광고 게시 후 각 플랫폼 마이샵에서 채용 메시지 작성</span>
                </div>
                <PlatformGrid
                  plan={planName}
                  platformChoice={platformChoice}
                  businessId={business?.id ?? null}
                  publishedShops={publishedShops}
                />
              </section>

              <section className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">마케팅 도구</h2>
                <Link
                  href="/dashboard/coupons"
                  className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <Tag size={20} className="text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm">쿠폰 관리</p>
                    <p className="text-gray-500 text-xs mt-0.5">밤길 업소 쿠폰 발급 및 관리</p>
                  </div>
                  {activeCouponCount > 0 && (
                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      활성 {activeCouponCount}개
                    </span>
                  )}
                  <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform shrink-0">→</span>
                </Link>
                <Link
                  href="/dashboard/events"
                  className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <Calendar size={20} className="text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm">이벤트 관리</p>
                    <p className="text-gray-500 text-xs mt-0.5">밤길 업소 이벤트·할인 공지 등록</p>
                  </div>
                  {activeEventCount > 0 && (
                    <span className="text-[11px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                      활성 {activeEventCount}개
                    </span>
                  )}
                  <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform shrink-0">→</span>
                </Link>
                <Link
                  href="/dashboard/banner"
                  className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <ImageIcon size={20} className="text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm">배너 관리</p>
                    <p className="text-gray-500 text-xs mt-0.5">플랫폼별 배너 이미지 등록 및 노출 위치 설정</p>
                  </div>
                  {bannerSummary === 'approved' && (
                    <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      게시중
                    </span>
                  )}
                  {bannerSummary === 'pending' && (
                    <span className="text-[11px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                      심사중
                    </span>
                  )}
                  <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform shrink-0">→</span>
                </Link>
                <Link
                  href="/dashboard/notices"
                  className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all group"
                >
                  <Megaphone size={20} className="text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm">공지 관리</p>
                    <p className="text-gray-500 text-xs mt-0.5">밤길 업소 페이지 공지사항 등록 및 관리</p>
                  </div>
                  {activeNoticeCount > 0 && (
                    <span className="text-[11px] font-black text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                      활성 {activeNoticeCount}개
                    </span>
                  )}
                  <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform shrink-0">→</span>
                </Link>
              </section>
            </div>

            {/* 우측 사이드바 */}
            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">멤버십 상태</h2>
                <SubscriptionCard subscription={subscription} businessId={business.id} jumpBalance={jumpBalance} />
              </section>
              <section className="space-y-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">마케팅 성과</h2>
                <BamgilStatsCard
                  count={bamgilCount}
                  lastMonthCount={lastMonthBamgilCount}
                  callCount={callCount}
                  chatCount={chatCount}
                  visitCount={visitCount}
                  daily7d={daily7d}
                />
              </section>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-black text-amber-600 mb-3">아직 입점신청을 하지 않으셨어요</h2>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                밤길/코코알바에 업소를 등록하고 새로운 고객을 만나보세요.<br/>
                간단한 입점신청을 통해 다양한 플랫폼에서 내 업소를 홍보할 수 있습니다.
              </p>
              <a
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-colors"
              >
                지금 입점신청하기 →
              </a>
            </section>
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">플랫폼 현황</h2>
              {platformCards}
            </section>
          </div>
        )}

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-400 text-xs">&copy; 2026 Yasajang. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
