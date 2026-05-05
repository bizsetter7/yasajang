import { createClient } from '@supabase/supabase-js';
import { TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react';

const PLAN_LABEL: Record<string, string> = {
  free: '무료',
  basic: '베이직',
  standard: '스탠다드',
  special: '스페셜',
  deluxe: '디럭스',
  premium: '프리미엄',
};
const PLAN_COLOR: Record<string, string> = {
  basic: 'text-zinc-400',
  standard: 'text-blue-400',
  special: 'text-indigo-400',
  deluxe: 'text-amber-400',
  premium: 'text-orange-400',
};
const PLAN_ORDER = ['premium', 'deluxe', 'special', 'standard', 'basic'];

function fmtKRW(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}백만`;
  if (n >= 10_000) return `${Math.floor(n / 10_000)}만`;
  return n.toLocaleString();
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

export default async function MrrPage() {
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    { data: activeSubs },
    { data: cancelledSubs },
    { data: recentPayments },
  ] = await Promise.all([
    svc.from('subscriptions')
      .select('id, business_id, plan, status, amount, billing_starts_at, next_billing_at')
      .in('status', ['active', 'trial'])
      .order('plan', { ascending: false }),
    svc.from('subscriptions')
      .select('id, business_id, plan, status, amount')
      .in('status', ['cancelled', 'paused'])
      .gte('updated_at' as never, thirtyDaysAgo.toISOString()),
    svc.from('subscriptions')
      .select('id, business_id, plan, status, amount, confirmed_at, pay_date')
      .not('confirmed_at', 'is', null)
      .order('confirmed_at' as never, { ascending: false })
      .limit(20),
  ]);

  // 업소명 매핑
  const allBizIds = [...new Set([
    ...(activeSubs ?? []).map(s => s.business_id),
    ...(recentPayments ?? []).map(s => s.business_id),
  ].filter(Boolean))];
  let bizMap = new Map<string, string>();
  if (allBizIds.length > 0) {
    const { data: bizzes } = await svc.from('businesses').select('id, name').in('id', allBizIds);
    bizMap = new Map((bizzes ?? []).map(b => [b.id as string, b.name as string]));
  }

  // KPI 계산
  const mrr = (activeSubs ?? []).reduce((s, sub) => s + (sub.amount ?? 0), 0);
  const activeCount = (activeSubs ?? []).length;
  const arpu = activeCount > 0 ? Math.round(mrr / activeCount) : 0;
  const churnCount = (cancelledSubs ?? []).length;

  // 플랜별 분포
  const planStats: Record<string, { count: number; revenue: number }> = {};
  for (const sub of activeSubs ?? []) {
    if (!planStats[sub.plan]) planStats[sub.plan] = { count: 0, revenue: 0 };
    planStats[sub.plan].count++;
    planStats[sub.plan].revenue += sub.amount ?? 0;
  }

  const kpis = [
    {
      label: '이번 달 MRR',
      value: `₩${fmtKRW(mrr)}`,
      sub: '활성+체험 구독 합산',
      icon: DollarSign,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: '활성 구독자',
      value: `${activeCount}명`,
      sub: `활성 ${(activeSubs ?? []).filter(s => s.status === 'active').length} / 체험 ${(activeSubs ?? []).filter(s => s.status === 'trial').length}`,
      icon: Users,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: 'ARPU',
      value: `₩${fmtKRW(arpu)}`,
      sub: '구독자당 평균 월 수익',
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: '30일 이탈',
      value: `${churnCount}명`,
      sub: '취소 또는 일시정지',
      icon: AlertTriangle,
      color: churnCount > 0 ? 'text-red-400' : 'text-zinc-400',
      bg: churnCount > 0 ? 'bg-red-400/10' : 'bg-zinc-400/10',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">MRR 분석</h1>
        <p className="text-zinc-500 text-sm mt-1">구독 수익 현황 · 플랜별 분포 · 최근 결제</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <div className={`text-3xl font-black ${color}`}>{value}</div>
            <div className="text-[11px] text-zinc-600 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 플랜별 분포 */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300 mb-4">플랜별 분포</h2>
          {PLAN_ORDER.filter(p => planStats[p]).length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">구독자 없음</p>
          ) : (
            <div className="space-y-3">
              {PLAN_ORDER.filter(p => planStats[p]).map(plan => {
                const { count, revenue } = planStats[plan];
                const pct = activeCount > 0 ? Math.round((count / activeCount) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-bold ${PLAN_COLOR[plan] ?? 'text-zinc-400'}`}>
                        {PLAN_LABEL[plan] ?? plan}
                      </span>
                      <div className="flex items-center gap-3 text-zinc-400">
                        <span>{count}명 ({pct}%)</span>
                        <span className="font-black text-zinc-300">₩{fmtKRW(revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          plan === 'premium' ? 'bg-orange-400' :
                          plan === 'deluxe' ? 'bg-amber-400' :
                          plan === 'special' ? 'bg-indigo-400' :
                          plan === 'standard' ? 'bg-blue-400' : 'bg-zinc-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs">
                <span className="text-zinc-500">합계</span>
                <span className="font-black text-amber-400">₩{mrr.toLocaleString()}/월</span>
              </div>
            </div>
          )}
        </div>

        {/* 최근 결제 확인 */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300 mb-4">최근 결제 내역</h2>
          {(recentPayments ?? []).length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">내역 없음</p>
          ) : (
            <div className="space-y-2">
              {(recentPayments ?? []).map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-2.5 bg-zinc-800/40 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {bizMap.get(sub.business_id) ?? '—'}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {PLAN_LABEL[sub.plan] ?? sub.plan} · {fmtDate(sub.pay_date ?? sub.confirmed_at)}
                    </p>
                  </div>
                  <span className={`text-xs font-black ml-3 shrink-0 ${PLAN_COLOR[sub.plan] ?? 'text-zinc-400'}`}>
                    ₩{(sub.amount ?? 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 활성 구독 전체 목록 */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300">활성 구독 목록</h2>
        </div>
        <div className="grid grid-cols-[1fr_100px_80px_100px_100px] gap-3 px-6 py-2.5 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          <span>업소명</span>
          <span>플랜</span>
          <span>상태</span>
          <span>월 금액</span>
          <span>다음 결제</span>
        </div>
        <div className="divide-y divide-zinc-800/60 max-h-96 overflow-y-auto">
          {(activeSubs ?? []).length === 0 ? (
            <div className="py-12 text-center text-zinc-600 text-sm">활성 구독 없음</div>
          ) : (
            (activeSubs ?? []).map(sub => (
              <div key={sub.id} className="grid grid-cols-[1fr_100px_80px_100px_100px] gap-3 px-6 py-3 items-center hover:bg-zinc-900/40 transition-colors">
                <span className="text-sm text-zinc-200 font-medium truncate">
                  {bizMap.get(sub.business_id) ?? '—'}
                </span>
                <span className={`text-xs font-black ${PLAN_COLOR[sub.plan] ?? 'text-zinc-400'}`}>
                  {PLAN_LABEL[sub.plan] ?? sub.plan}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${
                  sub.status === 'active' ? 'text-green-400 bg-green-400/10' : 'text-amber-400 bg-amber-400/10'
                }`}>
                  {sub.status === 'active' ? '활성' : '체험'}
                </span>
                <span className="text-xs text-zinc-300 font-bold">
                  ₩{(sub.amount ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-zinc-500">
                  {fmtDate(sub.next_billing_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
