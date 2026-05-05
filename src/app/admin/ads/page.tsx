'use client';

import { useEffect, useState, useCallback } from 'react';
import { Monitor, RefreshCw, Search, CheckCircle, XCircle, Image } from 'lucide-react';

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
  approved_banner: { label: '배너게시', color: 'text-emerald-400 bg-emerald-400/10' },
  pending_banner: { label: '배너심사중', color: 'text-amber-400 bg-amber-400/10' },
  rejected_banner: { label: '배너거절', color: 'text-red-400 bg-red-400/10' },
  none: { label: '미게시', color: 'text-zinc-400 bg-zinc-400/10' },
  null: { label: '미설정', color: 'text-red-400 bg-red-400/10' },
};

const SLOT_LABEL: Record<string, string> = {
  side_left:  '◀ 좌측 사이드',
  side_right: '▶ 우측 사이드',
  side_both:  '◀▶ 좌우 양쪽',
  hero_sub:        '🎯 히어로 배너',
  inner_sidebar:   '📌 내부 사이드바',
  list_native:     '📋 목록 네이티브',
  community_native:'💬 커뮤니티',
  joblist_native:  '🔔 최신구인 네이티브',
};

interface Ad {
  id: number;
  user_id: string;
  platform: string;
  banner_status: string | null;
  banner_image_url: string | null;
  tier: string | null;
  deadline: string | null;
  status: string | null;
  business_name: string | null;
  active_platforms: string[];
  options: Record<string, unknown> | null;
}

const ALL_PLATFORMS = ['bamgil', 'cocoalba', 'waiterzone', 'sunsuzone'];

const PLATFORM_TABS = ['all', 'bamgil', 'cocoalba', 'waiterzone', 'sunsuzone'];
const BANNER_TABS = [
  { key: 'all', label: '전체' },
  { key: 'pending_banner', label: '배너심사중' },
  { key: 'approved_banner', label: '배너게시' },
  { key: 'approved', label: '게시중' },
  { key: 'rejected_banner', label: '배너거절' },
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
  const [apiError, setApiError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    const params = new URLSearchParams();
    if (platform !== 'all') params.set('platform', platform);
    if (bannerStatus !== 'all') params.set('banner_status', bannerStatus);
    const qs = params.toString() ? `?${params}` : '';
    const res = await fetch(`/api/admin/ads${qs}`);
    const json = await res.json();
    if (json.error) {
      setApiError(`API 오류 (${res.status}): ${json.error}`);
      setAds([]);
    } else {
      setAds(json.ads ?? []);
    }
    setLoading(false);
  }, [platform, bannerStatus]);

  useEffect(() => { load(); }, [load]);

  const updateBannerStatus = async (id: number, next: string) => {
    setUpdating(id);
    await fetch('/api/admin/ads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: id, banner_status: next }),
    });
    await load();
    setUpdating(null);
  };

  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const filtered = search
    ? ads.filter(a => (a.business_name ?? '').toLowerCase().includes(search.toLowerCase()))
    : ads;

  const approvedCount = ads.filter(a => a.banner_status === 'approved').length;
  const pendingBannerCount = ads.filter(a => a.banner_status === 'pending_banner').length;
  const approvedBannerCount = ads.filter(a => a.banner_status === 'approved_banner').length;
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
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: '전체', value: ads.length, color: 'text-zinc-300' },
          { label: '배너심사중', value: pendingBannerCount, color: 'text-amber-400' },
          { label: '배너게시', value: approvedBannerCount, color: 'text-emerald-400' },
          { label: '게시중', value: approvedCount, color: 'text-green-400' },
          { label: '미게시/미설정', value: noneCount + nullCount, color: 'text-zinc-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">{label}</div>
            <div className={`text-2xl font-black ${color}`}>{loading ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* 배너 이미지 미리보기 모달 */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="배너 미리보기" className="max-w-2xl max-h-[80vh] rounded-xl shadow-2xl object-contain" />
        </div>
      )}

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

      {/* API 오류 표시 */}
      {apiError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 font-mono break-all">
          {apiError}
        </div>
      )}

      {/* 테이블 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_130px_80px_90px_90px_auto] gap-3 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
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
              const isExpired = ad.deadline ? new Date(ad.deadline) < new Date() : false;
              const isPending = ad.banner_status === 'pending_banner';

              return (
                <div
                  key={ad.id}
                  className={`grid grid-cols-[1fr_130px_80px_90px_90px_auto] gap-3 px-5 py-3.5 items-center hover:bg-zinc-900/40 transition-colors ${
                    isPending ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-sm text-zinc-200 font-medium truncate block">
                      {ad.business_name ?? '(업소명 없음)'}
                    </span>
                    {ad.banner_image_url && (
                      <button
                        onClick={() => setPreviewImg(ad.banner_image_url)}
                        className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 mt-0.5 transition-colors"
                      >
                        <Image size={10} /> 배너 이미지 보기
                      </button>
                    )}
                    {isPending && typeof ad.options?.banner_slot === 'string' && (
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">
                        신청 위치: <span className="font-bold text-zinc-300">{SLOT_LABEL[ad.options.banner_slot] ?? ad.options.banner_slot}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {ALL_PLATFORMS.map(p => {
                      const isActive = (ad.active_platforms ?? []).includes(p);
                      const cls = isActive ? PLATFORM_COLOR[p] : 'text-zinc-600 bg-zinc-800/40';
                      return (
                        <span key={p} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cls}`}>
                          {PLATFORM_LABEL[p]}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-xs text-zinc-400">
                    {TIER_LABEL[ad.tier ?? ''] ?? ad.tier ?? '-'}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full w-fit ${bm.color}`}>
                    {bm.label}
                  </span>
                  <span className={`text-xs ${isExpired ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                    {fmtDate(ad.deadline)}
                    {isExpired && ' 만료'}
                  </span>
                  <div className="flex gap-1.5">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => updateBannerStatus(ad.id, 'approved_banner')}
                          disabled={updating === ad.id}
                          title="배너 승인"
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all disabled:opacity-40"
                        >
                          <CheckCircle size={12} /> 승인
                        </button>
                        <button
                          onClick={() => updateBannerStatus(ad.id, 'rejected_banner')}
                          disabled={updating === ad.id}
                          title="배너 거절"
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-40"
                        >
                          <XCircle size={12} /> 거절
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => updateBannerStatus(ad.id, ad.banner_status === 'approved' || ad.banner_status === 'approved_banner' ? 'none' : 'approved')}
                        disabled={updating === ad.id}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all disabled:opacity-40 ${
                          ad.banner_status === 'approved' || ad.banner_status === 'approved_banner'
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                        }`}
                      >
                        {ad.banner_status === 'approved' || ad.banner_status === 'approved_banner' ? '게시 중단' : '게시 승인'}
                      </button>
                    )}
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
