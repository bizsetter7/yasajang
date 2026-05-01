'use client';

import { useEffect, useState, useCallback } from 'react';
import { ReceiptText, RefreshCw } from 'lucide-react';

const PLAN_LABEL: Record<string, string> = {
  basic: '베이직', standard: '스탠다드', special: '스페셜',
  deluxe: '디럭스', premium: '프리미엄',
};
const PLAN_COLOR: Record<string, string> = {
  basic: 'text-zinc-300 bg-zinc-700/50',
  standard: 'text-emerald-400 bg-emerald-400/10',
  special: 'text-amber-400 bg-amber-400/10',
  deluxe: 'text-purple-400 bg-purple-400/10',
  premium: 'text-yellow-400 bg-yellow-400/10',
};
const PLATFORM_LABEL: Record<string, string> = {
  cocoalba: '코코알바', waiterzone: '웨이터존', sunsuzone: '선수존',
};
const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: '활성', color: 'text-green-400 bg-green-400/10' },
  trial: { label: '체험', color: 'text-blue-400 bg-blue-400/10' },
  paused: { label: '일시정지', color: 'text-yellow-400 bg-yellow-400/10' },
  cancelled: { label: '취소', color: 'text-red-400 bg-red-400/10' },
};

interface Sub {
  id: string;
  plan: string;
  status: string;
  amount: number | null;
  period_months: number | null;
  billing_starts_at: string | null;
  next_billing_at: string | null;
  platform_choice: string | null;
  confirmed_at: string | null;
  businesses: { name: string } | null;
}

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'expiring', label: '만료임박 30일' },
  { key: 'active', label: '활성' },
  { key: 'trial', label: '체험중' },
  { key: 'paused', label: '일시정지' },
  { key: 'cancelled', label: '취소' },
];

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = tab === 'expiring' ? '?expiring=1' : tab === 'all' ? '' : `?status=${tab}`;
    const res = await fetch(`/api/admin/subscriptions${qs}`);
    const json = await res.json();
    setSubs(json.subscriptions ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch('/api/admin/subscriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: id, status }),
    });
    await load();
    setUpdating(null);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ReceiptText className="text-amber-500" size={22} />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">구독 관리</h1>
            <p className="text-zinc-500 text-sm mt-0.5">전체 구독 현황 · 만료 임박 · 상태 변경</p>
          </div>
        </div>
        <button onClick={load} className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 rounded-xl">
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 w-fit border border-zinc-800">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t.key ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subs.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[2rem]">
          <ReceiptText className="mx-auto mb-4 text-zinc-700" size={48} />
          <p className="text-zinc-500 font-bold">구독 내역이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map(sub => {
            const days = daysUntil(sub.next_billing_at);
            const isUrgent = days !== null && days <= 7 && sub.status === 'active';
            const isWarn = days !== null && days <= 30 && days > 7 && sub.status === 'active';
            const st = STATUS_META[sub.status] ?? { label: sub.status, color: 'text-zinc-400 bg-zinc-400/10' };
            const planColor = PLAN_COLOR[sub.plan] ?? 'text-zinc-300 bg-zinc-800';

            return (
              <div
                key={sub.id}
                className={`bg-zinc-900/50 rounded-xl border p-4 flex flex-wrap items-center gap-4 transition-colors hover:bg-zinc-900 ${
                  isUrgent ? 'border-red-500/50' : isWarn ? 'border-amber-500/30' : 'border-zinc-800'
                }`}
              >
                <div className="flex-1 min-w-36">
                  <p className="font-bold text-sm text-white">{sub.businesses?.name ?? '(업소 없음)'}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {PLATFORM_LABEL[sub.platform_choice ?? ''] ?? '플랫폼 미선택'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${planColor}`}>
                    {PLAN_LABEL[sub.plan] ?? sub.plan}
                  </span>
                  {sub.period_months && (
                    <span className="text-zinc-500 text-[11px]">{sub.period_months}개월</span>
                  )}
                </div>

                {sub.amount != null && (
                  <div className="text-sm font-black text-white min-w-20 text-right">
                    ₩{sub.amount.toLocaleString('ko-KR')}
                  </div>
                )}

                <div className="text-xs text-zinc-500 min-w-32">
                  <div>시작 {fmtDate(sub.billing_starts_at)}</div>
                  <div className={`mt-0.5 font-bold ${isUrgent ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-zinc-400'}`}>
                    만료 {fmtDate(sub.next_billing_at)}
                    {days !== null && sub.status === 'active' && (
                      <span className="ml-1 font-normal text-[10px]">({days > 0 ? `${days}일 후` : '만료됨'})</span>
                    )}
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${st.color}`}>
                  {st.label}
                </span>

                <div className="flex gap-1.5 ml-auto">
                  {sub.status !== 'active' && (
                    <button
                      onClick={() => changeStatus(sub.id, 'active')}
                      disabled={updating === sub.id}
                      className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-40"
                    >
                      활성화
                    </button>
                  )}
                  {sub.status === 'active' && (
                    <button
                      onClick={() => changeStatus(sub.id, 'paused')}
                      disabled={updating === sub.id}
                      className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-40"
                    >
                      정지
                    </button>
                  )}
                  {sub.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`${sub.businesses?.name ?? '이 구독'}을 취소하시겠습니까?`)) {
                          changeStatus(sub.id, 'cancelled');
                        }
                      }}
                      disabled={updating === sub.id}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-40"
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
