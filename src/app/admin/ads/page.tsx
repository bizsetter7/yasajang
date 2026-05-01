'use client';

import { useEffect, useState, useCallback } from 'react';
import { Monitor, RefreshCw, Search } from 'lucide-react';

const PLATFORM_LABEL: Record<string, string> = {
  bamgil: '밤길', cocoalba: '코코알바', waiterzone: '웨이터존', sunsuzone: '선수존',
};
const PLATFORM_COLOR: Record<string, string> = {
  bamgil: 'text-amber-400 bg-amber-400/10',
  cocoalba: 'text-pink-400 bg-pink-400/10',
  waiterzone: 'text-blue-400 bg-blue-400/10',
  sunsuzone: 'text-yellow-400 bg-yellow-400/10',
};
const TIER_LABEL: Record<string, string> = {
  p2: 'P2 최상단', p3: 'P3 사이드', p4: 'P4 일반', p7: 'P7 기본',
};
const BANNER_META: Record<string, { label: string; color: string }> = {
  approved: { label: '게시중', color: 'text-green-400 bg-green-400/10' },
  none: { label: '미게시', color: 'text-zinc-400 bg-zinc-400/10' },
  null: { label: '미설정', color: 'text-red-400 bg-red-400/10' },
};

interface Ad {
  id: number;
  user_id: string;
  platform: string;
  banner_status: string | null;
  ad_tier: string | null;
  deadline: string | null;
  status: string | null;
  business_name: string | null;
}

const PLATFORM_TABS = ['all', 'bamgil', 'cocoalba', 'waiterzone', 'sunsuzone'];
const BANNER_TABS = [
  { key: 'all', label: '전체' },
  { key: 'approved', label: '게시중' },
  { key: 'none', label: '미게시' },
  { key: 'null', label: '미설정' },
];

function fmtDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('all');
  const [bannerStatus, setBannerStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (platform !== 'all') params.set('platform', platform);
    if (bannerStatus !== 'all') params.set('banner_status', bannerStatus);
    const qs = params.toString() ? `?${params}` : '';
    const res = await fetch(`/api/admin/ads${qs}`);
    const json = await res.json();
    setAds(json.ads ?? []);
    setLoading(false);
  }, [platform, bannerStatus]);

  useEffect(() => { load(); }, [load]);

  const toggleBanner = async (id: number, current: string | null) => {
    const next = current === 'approved' ? 'none' : 'approved';
    setUpdating(id);
    await fetch('/api/admin/ads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: id, banner_status: next }),
    });
    await load();
    setUpdating(null);
  };

  const filtered = search
    ? ads.filter(a => (a.business_name ?? '').toLowerCase().includes(search.toLowerCase()))
    : ads;

  const approvedCount = ads.filter(a => a.banner_status === 'approved').length;
  const noneCount = ads.filter(a => a.banner_status === 'none').length;
  const nullCount = ads.filter(a => !a.banner_status).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="text-amber-500" size={22} />
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">광고 모니터링</h1>
            <p className="text-zinc-500 text-sm mt-0.5">P2/P9/P10 shops 게시 현황 · banner_status 관리</p>
          </div>
        </div>
        <button onClick={load} className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 rounded-xl">
          <RefreshCw size={17} />
        </button>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '전체 광고', value: ads.length, color: 'text-zinc-300' },
          { label: '게시중', value: approvedCount, color: 'text-green-400' },
          { label: '미게시', value: noneCount, color: 'text-zinc-400' },
          { label: '미설정', value: nullCount, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">{label}</div>
            <div className={`text-2xl font-black ${color}`}>{loading ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* 플랫폼 필터 */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 w-fit border border-zinc-800">
        {PLATFORM_TABS.map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              platform === p ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {p === 'all' ? '전체' : PLATFORM_LABEL[p]}
          </button>
        ))}
      </div>

      {/* 게시 상태 필터 */}
      <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 w-fit border border-zinc-800">
        {BANNER_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setBannerStatus(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              bannerStatus === t.key ? 'bg-zinc-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="업소명으로 검색..."
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
          <div className="grid grid-cols-[1fr_90px_80px_80px_90px_auto] gap-3 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>업소명</span>
            <span>플랫폼</span>
            <span>등급</span>
            <span>게시상태</span>
            <span>만료일</span>
            <span>액션</span>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {filtered.map(ad => {
              const bstatus = ad.banner_status ?? 'null';
              const bm = BANNER_META[bstatus] ?? BANNER_META.null;
              const pc = PLATFORM_COLOR[ad.platform] ?? 'text-zinc-400 bg-zinc-800';
              const isExpired = ad.deadline ? new Date(ad.deadline) < new Date() : false;

              return (
                <div
                  key={ad.id}
                  className="grid grid-cols-[1fr_90px_80px_80px_90px_auto] gap-3 px-5 py-3.5 items-center hover:bg-zinc-900/40 transition-colors"
                >
                  <span className="text-sm text-zinc-200 font-medium truncate">
                    {ad.business_name ?? '(업소명 없음)'}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${pc}`}>
                    {PLATFORM_LABEL[ad.platform] ?? ad.platform}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {TIER_LABEL[ad.ad_tier ?? ''] ?? ad.ad_tier ?? '-'}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${bm.color}`}>
                    {bm.label}
                  </span>
                  <span className={`text-xs ${isExpired ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                    {fmtDate(ad.deadline)}
                    {isExpired && ' 만료'}
                  </span>
                  <div>
                    <button
                      onClick={() => toggleBanner(ad.id, ad.banner_status)}
                      disabled={updating === ad.id}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all disabled:opacity-40 ${
                        ad.banner_status === 'approved'
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                          : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                      }`}
                    >
                      {ad.banner_status === 'approved' ? '게시 중단' : '게시 승인'}
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-zinc-600 text-sm">광고 데이터가 없습니다</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
