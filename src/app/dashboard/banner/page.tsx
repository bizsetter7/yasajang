'use client';

import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Upload, X, CheckCircle, Clock, XCircle, Trash2, AlertCircle } from 'lucide-react';

interface ShopBanner {
  id: number;
  platform: string;
  banner_status: string | null;
  banner_image_url: string | null;
  options: Record<string, unknown> | null;
  tier: string | null;
}

interface SlotDef {
  id: string;
  label: string;
  desc: string;
  size: string;
  recommend: string;
  bannerPosition: string | null;
  plans: readonly string[];
  status: 'live' | 'coming_soon';
  icon: string;
}

const PLATFORM_LABEL: Record<string, string> = {
  cocoalba: '코코알바', waiterzone: '웨이터존', sunsuzone: '선수존', bamgil: '밤길',
};
const PLATFORM_ACTIVE_CLS: Record<string, string> = {
  cocoalba: 'border-rose-300 text-rose-600 bg-rose-50',
  waiterzone: 'border-blue-300 text-blue-600 bg-blue-50',
  sunsuzone: 'border-yellow-300 text-yellow-600 bg-yellow-50',
  bamgil: 'border-amber-300 text-amber-600 bg-amber-50',
};

const BANNER_STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending_banner: { label: '심사 중', cls: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Clock size={12} /> },
  approved_banner: { label: '배너 게시 중', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle size={12} /> },
  rejected_banner: { label: '배너 거절됨', cls: 'text-red-600 bg-red-50 border-red-200', icon: <XCircle size={12} /> },
  approved: { label: '광고 게시 중', cls: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle size={12} /> },
  none: { label: '배너 미설정', cls: 'text-gray-400 bg-gray-50 border-gray-200', icon: <AlertCircle size={12} /> },
};

function StatusBadge({ status }: { status: string | null }) {
  const m = BANNER_STATUS_META[status ?? 'none'] ?? BANNER_STATUS_META.none;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${m.cls}`}>
      {m.icon}{m.label}
    </span>
  );
}

// 슬롯 위치 시각화 컴포넌트
function SlotVisual({ slotId, selected }: { slotId: string; selected: boolean }) {
  const base = `transition-all duration-200 ${selected ? 'opacity-100' : 'opacity-30'}`;
  if (slotId === 'side_left') return (
    <div className="flex gap-0.5 items-center justify-center h-8 mb-2">
      <div className={`w-3 h-8 rounded bg-amber-400 ${base}`} />
      <div className="flex-1 h-8 rounded bg-gray-200" />
      <div className="w-3 h-8 rounded bg-gray-100" />
    </div>
  );
  if (slotId === 'side_right') return (
    <div className="flex gap-0.5 items-center justify-center h-8 mb-2">
      <div className="w-3 h-8 rounded bg-gray-100" />
      <div className="flex-1 h-8 rounded bg-gray-200" />
      <div className={`w-3 h-8 rounded bg-amber-400 ${base}`} />
    </div>
  );
  if (slotId === 'side_both') return (
    <div className="flex gap-0.5 items-center justify-center h-8 mb-2">
      <div className={`w-3 h-8 rounded bg-amber-400 ${base}`} />
      <div className="flex-1 h-8 rounded bg-gray-200" />
      <div className={`w-3 h-8 rounded bg-amber-400 ${base}`} />
    </div>
  );
  return <div className="h-8 mb-2 flex items-center justify-center text-lg">{slotId.includes('hero') ? '🎯' : slotId.includes('inner') ? '📌' : slotId.includes('native') ? '📋' : '💬'}</div>;
}

export default function BannerPage() {
  const [shops, setShops] = useState<ShopBanner[]>([]);
  const [planName, setPlanName] = useState('free');
  const [allowedSlots, setAllowedSlots] = useState<string[]>([]);
  const [slotRegistry, setSlotRegistry] = useState<SlotDef[]>([]);
  const [loading, setLoading] = useState(true);

  const [activePlatform, setActivePlatform] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [resetLoading, setResetLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/banner');
      const d = await r.json();
      if (d.error) { setLoading(false); return; }
      setShops(d.shops ?? []);
      setPlanName(d.planName ?? 'free');
      setAllowedSlots(d.allowedSlots ?? []);
      setSlotRegistry(d.slotRegistry ?? []);
      if (!activePlatform && d.shops?.length > 0) setActivePlatform(d.shops[0].platform);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const currentShop = shops.find(s => s.platform === activePlatform);
  const currentSlotId = currentShop?.options?.banner_slot as string | undefined;

  const liveSlots = slotRegistry.filter(s => s.status === 'live');
  const comingSlots = slotRegistry.filter(s => s.status === 'coming_soon');

  const resetForm = () => {
    setSelectedSlot(''); setImageFile(null); setImagePreview('');
    setError(''); setSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePlatformChange = (p: string) => { setActivePlatform(p); resetForm(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('파일 크기는 5MB 이하여야 합니다.'); return; }
    if (!f.type.startsWith('image/')) { setError('이미지 파일만 업로드 가능합니다.'); return; }
    setImageFile(f); setImagePreview(URL.createObjectURL(f)); setError('');
  };

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!selectedSlot) { setError('배너 위치를 선택해주세요.'); return; }
    if (!imageFile) { setError('배너 이미지를 선택해주세요.'); return; }

    setUploading(true);
    const fd = new FormData();
    fd.append('file', imageFile);
    fd.append('platform', activePlatform);
    fd.append('slot', selectedSlot);

    const r = await fetch('/api/banner', { method: 'POST', body: fd });
    const d = await r.json();
    setUploading(false);

    if (d.error) { setError(d.error); return; }
    setSuccess('배너 이미지가 제출되었습니다. 관리자 심사 후 게시됩니다 (1~2 영업일).');
    resetForm();
    fetchData();
  };

  const handleReset = async (platform: string) => {
    if (!confirm('이 플랫폼의 배너를 초기화하시겠습니까?')) return;
    setResetLoading(platform);
    await fetch('/api/banner', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    });
    setResetLoading('');
    if (platform === activePlatform) resetForm();
    fetchData();
  };

  const canUpload = allowedSlots.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <ImageIcon size={22} className="text-amber-500" />
              배너 관리
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">플랫폼별 배너 이미지 등록 및 노출 위치를 설정합니다.</p>
          </div>
          <a href="/dashboard" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">← 대시보드</a>
        </div>

        {/* 플랜 + 허용 슬롯 요약 */}
        <div className="p-4 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              현재 플랜 · <span className="text-amber-600">{planName}</span>
            </span>
            {!canUpload && (
              <a href="/dashboard" className="text-xs font-black text-amber-600 underline underline-offset-2">플랜 업그레이드 →</a>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {liveSlots.map(s => (
              <span
                key={s.id}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                  allowedSlots.includes(s.id)
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                {s.icon} {s.label}
                <span className="ml-0.5">{allowedSlots.includes(s.id) ? '✓' : '🔒'}</span>
              </span>
            ))}
          </div>
          {!canUpload && (
            <p className="mt-2 text-xs text-gray-400">스탠다드 이상 플랜에서 배너 기능을 사용할 수 있습니다.</p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">로딩 중...</div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <ImageIcon size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-500 text-sm">활성 광고가 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1">대시보드에서 플랫폼 광고를 먼저 게시해주세요.</p>
            <a href="/dashboard" className="mt-4 inline-block text-xs font-black text-amber-600 underline underline-offset-2">대시보드로 이동 →</a>
          </div>
        ) : (
          <>
            {/* 플랫폼 탭 */}
            <div className="flex gap-2 flex-wrap">
              {shops.map(s => (
                <button
                  key={s.platform}
                  onClick={() => handlePlatformChange(s.platform)}
                  className={`px-4 py-2 rounded-xl text-sm font-black border transition-all ${
                    activePlatform === s.platform
                      ? (PLATFORM_ACTIVE_CLS[s.platform] ?? 'border-amber-300 text-amber-600 bg-amber-50')
                      : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                  }`}
                >
                  {PLATFORM_LABEL[s.platform] ?? s.platform}
                </button>
              ))}
            </div>

            {currentShop && (
              <div className="space-y-5">
                {/* 현재 배너 상태 */}
                <div className="p-5 bg-white border border-gray-200 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-1.5">현재 배너 상태</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={currentShop.banner_status} />
                        {currentSlotId && (
                          <span className="text-xs text-gray-500">
                            위치: <span className="font-bold text-gray-700">
                              {slotRegistry.find(s => s.id === currentSlotId)?.label ?? currentSlotId}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    {currentShop.banner_image_url && (
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={currentShop.banner_image_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold text-amber-600 underline underline-offset-2">이미지 보기</a>
                        <button
                          onClick={() => handleReset(currentShop.platform)}
                          disabled={resetLoading === currentShop.platform}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={11} /> 초기화
                        </button>
                      </div>
                    )}
                  </div>
                  {currentShop.banner_image_url && (
                    <div className="rounded-xl overflow-hidden border border-gray-100">
                      <img src={currentShop.banner_image_url} alt="현재 배너" className="w-full max-h-28 object-cover" />
                    </div>
                  )}
                </div>

                {/* 배너 등록 폼 */}
                {canUpload && (
                  <div className="p-5 bg-white border border-gray-200 rounded-2xl space-y-6">
                    <p className="font-black text-gray-900 text-sm">
                      {currentShop.banner_status === 'pending_banner' ? '배너 재등록' : '배너 등록'}
                    </p>

                    {/* STEP 1 — 슬롯(위치) 선택 */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black">1</span>
                        배너 노출 위치 선택
                      </p>

                      {/* Live 슬롯 */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        {liveSlots.map(slot => {
                          const unlocked = allowedSlots.includes(slot.id);
                          const isSelected = selectedSlot === slot.id;
                          return (
                            <button
                              key={slot.id}
                              onClick={() => unlocked && setSelectedSlot(slot.id)}
                              disabled={!unlocked}
                              className={`relative p-3 rounded-2xl border-2 text-left transition-all ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-50 shadow-sm'
                                  : unlocked
                                    ? 'border-gray-200 hover:border-amber-200 bg-white cursor-pointer'
                                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute top-2 right-2 text-amber-500"><CheckCircle size={13} /></span>
                              )}
                              {!unlocked && (
                                <span className="absolute top-2 right-2 text-[10px] text-gray-400">🔒</span>
                              )}
                              <SlotVisual slotId={slot.id} selected={isSelected} />
                              <p className="text-[11px] font-black text-gray-800 leading-tight">{slot.label}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{slot.size}</p>
                              <p className="text-[9px] text-gray-400 mt-1 leading-snug">{slot.desc}</p>
                            </button>
                          );
                        })}
                      </div>

                      {/* 권장 사이즈 안내 */}
                      {selectedSlot && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                          <span className="font-black shrink-0">권장 사이즈:</span>
                          <span>{liveSlots.find(s => s.id === selectedSlot)?.recommend}</span>
                        </div>
                      )}

                      {/* Coming Soon 슬롯 (비활성 미리보기) */}
                      <div className="mt-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">준비 중인 슬롯</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {comingSlots.map(slot => (
                            <div
                              key={slot.id}
                              className="p-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50 opacity-60"
                            >
                              <span className="text-base block mb-1">{slot.icon}</span>
                              <p className="text-[10px] font-bold text-gray-500">{slot.label}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">준비 중</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* STEP 2 — 이미지 업로드 */}
                    <div>
                      <p className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black">2</span>
                        배너 이미지 업로드
                        <span className="text-gray-400 font-normal">JPG · PNG · WebP · 5MB 이하</span>
                      </p>

                      {imagePreview ? (
                        <div className="relative">
                          <img src={imagePreview} alt="미리보기" className="w-full max-h-36 object-cover rounded-xl border border-gray-200" />
                          <button
                            onClick={() => { setImageFile(null); setImagePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="absolute top-2 right-2 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors shadow-sm"
                          >
                            <X size={14} />
                          </button>
                          <p className="text-xs text-gray-400 mt-1.5">{imageFile?.name}</p>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 hover:bg-amber-50/40 transition-colors">
                          <Upload size={20} className="text-gray-300" />
                          <span className="text-sm text-gray-400 font-medium">클릭하여 이미지 선택</span>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>

                    {/* 피드백 */}
                    {error && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600 font-bold">
                        <XCircle size={13} /> {error}
                      </p>
                    )}
                    {success && (
                      <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                        <CheckCircle size={13} /> {success}
                      </p>
                    )}

                    {/* 제출 */}
                    <button
                      onClick={handleSubmit}
                      disabled={uploading || !selectedSlot || !imageFile}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 disabled:text-gray-400 text-black font-black rounded-2xl text-sm transition-colors"
                    >
                      {uploading ? '업로드 중...' : '배너 심사 신청'}
                    </button>
                    <p className="text-[11px] text-gray-400 text-center">
                      심사 후 1~2 영업일 내 게시됩니다. 부적절한 이미지는 거절될 수 있습니다.
                    </p>
                  </div>
                )}

                {!canUpload && (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                    <p className="font-black text-amber-700 text-sm mb-1">스탠다드 이상 플랜에서 배너를 등록할 수 있습니다</p>
                    <a href="/dashboard" className="text-xs font-black text-amber-700 underline underline-offset-2">플랜 업그레이드 →</a>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
