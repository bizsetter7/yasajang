'use client';

import { useEffect, useState, useCallback } from 'react';
import { Zap, RefreshCw, Plus, Search } from 'lucide-react';

interface JumpRow {
  user_id: string;
  email: string;
  subscription_balance: number;
  package_balance: number;
  auto_remaining_today: number;
  last_daily_reset_at: string | null;
  next_reset_at: string | null;
}

function fmtDatetime(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function JumpsPage() {
  const [rows, setRows] = useState<JumpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantAmount, setGrantAmount] = useState('10');
  const [granting, setGranting] = useState(false);
  const [grantMsg, setGrantMsg] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/jumps');
    const json = await res.json();
    setRows(json.jumps ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grant = async () => {
    if (!grantUserId || !grantAmount) return;
    setGranting(true);
    setGrantMsg('');
    const res = await fetch('/api/admin/jumps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: grantUserId, amount: parseInt(grantAmount, 10) }),
    });
    const json = await res.json();
    if (json.ok) {
      setGrantMsg(`✅ 충전 완료 (+${grantAmount}회)`);
      setGrantUserId('');
      setGrantAmount('10');
      await load();
    } else {
      setGrantMsg(`❌ 오류: ${json.error}`);
    }
    setGranting(false);
    setTimeout(() => setGrantMsg(''), 3000);
  };

  const filtered = search
    ? rows.filter(r => r.email.toLowerCase().includes(search.toLowerCase()))
    : rows;

  const totalSub = rows.reduce((s, r) => s + (r.subscription_balance ?? 0), 0);
  const totalPkg = rows.reduce((s, r) => s + (r.package_balance ?? 0), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="text-amber-500" size={22} />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">점프 모니터링</h1>
            <p className="text-zinc-500 text-sm mt-0.5">사용자별 점프 잔액 현황 · 수동 충전</p>
          </div>
        </div>
        <button onClick={load} className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 rounded-xl">
          <RefreshCw size={17} />
        </button>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '총 유저', value: rows.length, color: 'text-zinc-300' },
          { label: '구독 잔액 합계', value: totalSub, color: 'text-amber-400' },
          { label: '패키지 잔액 합계', value: totalPkg, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">{label}</div>
            <div className={`text-3xl font-black ${color}`}>{loading ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* 수동 충전 패널 */}
      <div className="bg-zinc-900/50 border border-amber-500/20 rounded-2xl p-5">
        <div className="text-xs font-bold text-amber-500 mb-3 uppercase tracking-widest flex items-center gap-1.5">
          <Zap size={12} />
          점프 수동 충전 — subscription_balance에 적립 (M-060 정책)
        </div>
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-60">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 block">대상 사용자</label>
            <select
              value={grantUserId}
              onChange={e => setGrantUserId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white appearance-none cursor-pointer"
            >
              <option value="">사용자 선택...</option>
              {rows.map(r => (
                <option key={r.user_id} value={r.user_id}>
                  {r.email} (현재 잔액: {r.subscription_balance}회)
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 block">충전 횟수</label>
            <input
              type="number"
              value={grantAmount}
              onChange={e => setGrantAmount(e.target.value)}
              min={1}
              max={1000}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>
          <button
            onClick={grant}
            disabled={!grantUserId || granting}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-black rounded-xl transition-all disabled:opacity-40"
          >
            <Plus size={14} />
            충전
          </button>
          {grantMsg && (
            <span className="text-sm font-bold text-zinc-300">{grantMsg}</span>
          )}
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="이메일로 검색..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-zinc-600 transition-all"
        />
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px_80px_140px_140px] gap-3 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>이메일</span>
            <span className="text-right">구독 잔액</span>
            <span className="text-right">패키지</span>
            <span className="text-right">자동(오늘)</span>
            <span className="text-right">마지막 리셋</span>
            <span className="text-right">다음 리셋</span>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {filtered.map(r => (
              <div
                key={r.user_id}
                className="grid grid-cols-[1fr_80px_80px_80px_140px_140px] gap-3 px-5 py-3.5 items-center hover:bg-zinc-900/40 transition-colors"
              >
                <span className="text-sm text-zinc-300 font-medium truncate">{r.email}</span>
                <span className={`text-right font-black text-base ${r.subscription_balance > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                  {r.subscription_balance}
                </span>
                <span className="text-right text-sm text-zinc-500">{r.package_balance ?? 0}</span>
                <span className="text-right text-sm text-zinc-500">{r.auto_remaining_today ?? 0}</span>
                <span className="text-right text-xs text-zinc-600">{fmtDatetime(r.last_daily_reset_at)}</span>
                <span className="text-right text-xs text-zinc-600">{fmtDatetime(r.next_reset_at)}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-zinc-600 text-sm">데이터가 없습니다</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
