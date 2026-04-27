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
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">사장님 대시보드</h1>
          <p className="text-zinc-500 font-medium">업소 관리와 구독 현황을 한눈에 확인하세요.</p>
        </header>

        {business ? (
          <>
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">내 업소 정보</h2>
              </div>
              <BusinessCard business={business} subscription={subscription} />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-6">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">멤버십 상태</h2>
                <SubscriptionCard subscription={subscription} businessId={business.id} />
              </section>

              <section className="space-y-6">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">마케팅 성과</h2>
                <BamgilStatsCard count={bamgilCount} />
              </section>
            </div>
          </>
        ) : (
          <section className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0 opacity-50" />
            <h2 className="text-xl font-black text-amber-500 mb-3">⚠️ 아직 입점신청을 하지 않으셨어요</h2>
            <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
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

        <section className="space-y-6 pt-6 border-t border-zinc-900">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">플랫폼 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a
              href="https://cocoalba.kr/my-shop"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-2xl hover:bg-rose-500/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
              <h3 className="text-lg font-bold text-rose-500 mb-2">코코알바 공고 현황</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white">{cocoShopCount}</span>
                <span className="text-zinc-400 mb-1">개 공고</span>
              </div>
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1 group-hover:gap-2 transition-all border-t border-rose-500/20 pt-4">
                코코알바 마이샵 바로가기 →
              </span>
            </a>

            <a
              href="https://waiterzone.kr/my"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl hover:bg-blue-500/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
              <h3 className="text-lg font-bold text-blue-500 mb-2">웨이터존 공고 현황</h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white">{waiterShopCount}</span>
                <span className="text-zinc-400 mb-1">개 공고</span>
              </div>
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all border-t border-blue-500/20 pt-4">
                웨이터존 마이샵 바로가기 →
              </span>
            </a>
          </div>
        </section>

        <footer className="pt-12 text-center border-t border-zinc-900">
          <p className="text-zinc-600 text-xs">
            &copy; 2026 Yasajang. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
