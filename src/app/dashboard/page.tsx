import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BusinessCard from '@/components/dashboard/BusinessCard';
import SubscriptionCard from '@/components/dashboard/SubscriptionCard';
import BamgilStatsCard from '@/components/dashboard/BamgilStatsCard';

export default async function DashboardPage() {
  const supabase = await createClient();

  // 로그인 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // 내 업소 조회
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  // 구독 및 밤길 통계 조회 (business가 있을 때만)
  let subscription = null;
  let bamgilCount = 0;

  if (business) {
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('business_id', business.id)
      .single();
    subscription = subData;

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('bamgil_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('contacted_at', thisMonthStart.toISOString());
    bamgilCount = count ?? 0;
  }

  // 플랫폼 현황 (코코알바/웨이터존 공고 확인)
  const { data: shops } = await supabase
    .from('shops')
    .select('id, category')
    .eq('user_id', user.id);

  // [야사장] 입점신청 샵은 제외, 웨이터 키워드만 웨이터존으로 분류, 나머지 전체는 코코알바
  const WAITER_KW = ['웨이터', '서빙', '바텐더', 'waiter'];
  const isWaiter = (cat: string) => WAITER_KW.some(k => (cat || '').toLowerCase().includes(k));
  const allShops = shops?.filter(s => !s.category?.includes('[야사장]')) ?? [];
  const waiterShopCount = allShops.filter(s => isWaiter(s.category)).length;
  const cocoShopCount = allShops.filter(s => !isWaiter(s.category)).length;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">사장님 대시보드</h1>
          <p className="text-gray-500 font-medium">업소 관리와 구독 현황을 한눈에 확인하세요.</p>
        </header>

        {business ? (
          <>
            <section className="space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">내 업소 정보</h2>
              <BusinessCard business={business} subscription={subscription} />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">멤버십 상태</h2>
                <SubscriptionCard subscription={subscription} businessId={business.id} />
              </section>

              <section className="space-y-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">마케팅 성과</h2>
                <BamgilStatsCard count={bamgilCount} />
              </section>
            </div>
          </>
        ) : (
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
        )}

        <section className="space-y-4 pt-6 border-t border-gray-200">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">플랫폼 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </section>

        <footer className="pt-12 text-center border-t border-gray-200">
          <p className="text-gray-400 text-xs">
            &copy; 2026 Yasajang. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
