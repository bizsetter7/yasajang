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

  if (!business) redirect('/register'); // 업소 없으면 등록으로

  // 구독 조회
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('business_id', business.id)
    .single();

  // 이번 달 밤길 유입 수 (bamgil_contacts 테이블)
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const { count: bamgilCount } = await supabase
    .from('bamgil_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('contacted_at', thisMonthStart.toISOString());

  // 코코알바 연동 위젯 (shops 테이블 확인)
  const { count: cocoShopCount } = await supabase
    .from('shops')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">사장님 대시보드</h1>
          <p className="text-zinc-500 font-medium">업소 관리와 구독 현황을 한눈에 확인하세요.</p>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">내 업소 정보</h2>
          </div>
          <BusinessCard business={business} subscription={subscription} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="space-y-6">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">멤버십 상태</h2>
            <SubscriptionCard subscription={subscription} businessId={business.id} />
          </section>

          <section className="space-y-6">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">마케팅 성과</h2>
            <BamgilStatsCard count={bamgilCount ?? 0} />
          </section>

          <section className="space-y-6">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">코코알바 현황</h2>
            <a
              href="https://cocoalba.kr/my-shop"
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full p-6 bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-2xl hover:bg-rose-500/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
              <h3 className="text-lg font-bold text-rose-500 mb-2 flex items-center gap-2">
                내 공고 현황
              </h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-black text-white">{cocoShopCount ?? 0}</span>
                <span className="text-zinc-400 mb-1">개 공고</span>
              </div>
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1 group-hover:gap-2 transition-all mt-auto pt-4 border-t border-rose-500/20">
                코코알바에서 관리 →
              </span>
            </a>
          </section>
        </div>

        <footer className="pt-12 text-center border-t border-zinc-900">
          <p className="text-zinc-600 text-xs">
            &copy; 2026 Yasajang. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
