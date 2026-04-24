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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-6">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">멤버십 상태</h2>
            <SubscriptionCard subscription={subscription} businessId={business.id} />
          </section>

          <section className="space-y-6">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">마케팅 성과</h2>
            <BamgilStatsCard count={bamgilCount ?? 0} />
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
