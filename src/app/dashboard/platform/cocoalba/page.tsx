'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const WORK_CLOTHES = ['자율', '홈복', '캐주얼', '유니폼'] as const;
const DAYS_OFF = ['월', '화', '수', '목', '금', '토', '일'] as const;
const CAREER_OPTIONS = ['무관', '신입만', '경력만', '경력우대'] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINS = ['00', '15', '30', '45'];

export default function CocoalbaHiringPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // 폼 상태
  const [tc, setTc] = useState('');        // raw digits only (no commas)
  const [tcFocused, setTcFocused] = useState(false);
  const [ageMin, setAgeMin] = useState('20');
  const [ageMax, setAgeMax] = useState('40');
  const [workStartH, setWorkStartH] = useState('20');
  const [workStartM, setWorkStartM] = useState('00');
  const [workEndH, setWorkEndH] = useState('04');
  const [workEndM, setWorkEndM] = useState('00');
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [clothes, setClothes] = useState<string[]>(['자율']);
  const [weekendOnly, setWeekendOnly] = useState(false);
  const [career, setCareer] = useState('무관');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }

      // options 컬럼 없을 수 있으므로 id만 조회
      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (bizErr || !biz) { router.push('/dashboard'); return; }
      setBusinessId(biz.id);

      // 기존 저장된 구인 조건 불러오기 (shops.options.hiring_info.cocoalba)
      const { data: shops } = await supabase
        .from('shops')
        .select('options')
        .eq('user_id', user.id)
        .limit(10);

      if (shops && shops.length > 0) {
        for (const shop of shops) {
          const opts = (shop.options || {}) as Record<string, unknown>;
          const hiringInfo = (opts.hiring_info as Record<string, unknown> | undefined);
          const saved = hiringInfo?.cocoalba as Record<string, unknown> | undefined;
          if (saved) {
            if (saved.tc) setTc(String(Number(saved.tc))); // raw digits
            if (saved.age_min) setAgeMin(String(saved.age_min));
            if (saved.age_max) setAgeMax(String(saved.age_max));
            if (saved.work_start) {
              const [h, m] = String(saved.work_start).split(':');
              if (h) setWorkStartH(h);
              if (m) setWorkStartM(m);
            }
            if (saved.work_end) {
              const [h, m] = String(saved.work_end).split(':');
              if (h) setWorkEndH(h);
              if (m) setWorkEndM(m);
            }
            if (Array.isArray(saved.days_off)) setDaysOff(saved.days_off as string[]);
            if (Array.isArray(saved.clothes)) setClothes(saved.clothes as string[]);
            if (typeof saved.weekend_only === 'boolean') setWeekendOnly(saved.weekend_only);
            if (saved.career) setCareer(String(saved.career));
            break;
          }
        }
      }

      setLoading(false);
    };
    load();
  }, []);

  const toggleDay = (day: string) => {
    setDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const toggleCloth = (cloth: string) => {
    setClothes(prev => prev.includes(cloth) ? prev.filter(c => c !== cloth) : [...prev, cloth]);
  };

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    setError('');

    const hiringInfo = {
      tc: tc ? Number(tc) : null,
      age_min: Number(ageMin),
      age_max: Number(ageMax),
      work_start: `${workStartH}:${workStartM}`,
      work_end: `${workEndH}:${workEndM}`,
      days_off: daysOff,
      clothes,
      weekend_only: weekendOnly,
      career,
    };

    try {
      const res = await fetch('/api/platform-ads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, platform: 'cocoalba', hiringInfo }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '저장 실패');
      } else {
        setSaved(true);
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch {
      setError('네트워크 오류');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // text-gray-900 명시 — 글로벌 body가 다크테마(#fafafa)라 input/select 글자가 흰색으로 보임 방지
  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-gray-900 placeholder:text-gray-400';
  // select는 appearance-none + 커스텀 화살표 (Chrome/Windows native dropdown 텍스트 누락 버그 방지)
  const selectCls = 'w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-gray-900 cursor-pointer appearance-none';
  const labelCls = 'block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5';
  const sectionCls = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4';

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-base font-black text-gray-900">코코알바 구인 조건</h1>
            <p className="text-xs text-gray-400 font-medium">아가씨 구인공고에 반영될 채용 조건</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            <span className="text-xs font-black text-rose-500">코코알바</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* TC */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            💰 TC (기본 이용료)
            <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">필수</span>
          </h2>
          <div>
            <label className={labelCls}>TC 금액</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={tcFocused ? tc : (tc ? Number(tc).toLocaleString() : '')}
                onFocus={() => setTcFocused(true)}
                onChange={e => setTc(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={() => setTcFocused(false)}
                placeholder="예: 200,000"
                className={inputCls}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">원</span>
            </div>
          </div>
        </div>

        {/* 모집 연령 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            👩 모집 연령
            <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">필수</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className={labelCls}>최소 나이</label>
              <div className="relative">
                <input
                  type="number"
                  value={ageMin}
                  onChange={e => setAgeMin(e.target.value)}
                  min={18} max={60}
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">세</span>
              </div>
            </div>
            <span className="text-gray-400 font-black mt-5">~</span>
            <div className="flex-1">
              <label className={labelCls}>최대 나이</label>
              <div className="relative">
                <input
                  type="number"
                  value={ageMax}
                  onChange={e => setAgeMax(e.target.value)}
                  min={18} max={60}
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">세</span>
              </div>
            </div>
          </div>
        </div>

        {/* 근무 시간 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            🕐 근무 시간
            <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">필수</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>출근 시간</label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <select value={workStartH} onChange={e => setWorkStartH(e.target.value)} className={selectCls}>
                    {HOURS.map(h => <option key={h} value={h}>{h}시</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▼</span>
                </div>
                <div className="relative w-20">
                  <select value={workStartM} onChange={e => setWorkStartM(e.target.value)} className={selectCls}>
                    {MINS.map(m => <option key={m} value={m}>{m}분</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▼</span>
                </div>
              </div>
            </div>
            <div>
              <label className={labelCls}>퇴근 시간</label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <select value={workEndH} onChange={e => setWorkEndH(e.target.value)} className={selectCls}>
                    {HOURS.map(h => <option key={h} value={h}>{h}시</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▼</span>
                </div>
                <div className="relative w-20">
                  <select value={workEndM} onChange={e => setWorkEndM(e.target.value)} className={selectCls}>
                    {MINS.map(m => <option key={m} value={m}>{m}분</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▼</span>
                </div>
              </div>
            </div>
          </div>
          {/* 주말만 근무 */}
          <label className="flex items-center gap-2.5 cursor-pointer mt-1">
            <div
              onClick={() => setWeekendOnly(!weekendOnly)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer ${weekendOnly ? 'bg-rose-500 border-rose-500' : 'bg-white border-gray-300'}`}
            >
              {weekendOnly && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-sm font-bold text-gray-700">주말만 근무 가능</span>
          </label>
        </div>

        {/* 휴무일 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800">📅 휴무일</h2>
          <div className="flex flex-wrap gap-2">
            {DAYS_OFF.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-xl text-sm font-black border transition-all ${
                  daysOff.includes(day)
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          {daysOff.length === 0 && (
            <p className="text-xs text-gray-400 font-medium">선택 없음 = 휴무 없음</p>
          )}
        </div>

        {/* 근무 복장 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800">👗 근무 복장</h2>
          <div className="flex flex-wrap gap-2">
            {WORK_CLOTHES.map(cloth => (
              <button
                key={cloth}
                type="button"
                onClick={() => toggleCloth(cloth)}
                className={`px-4 py-2 rounded-xl text-sm font-black border transition-all ${
                  clothes.includes(cloth)
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {cloth}
              </button>
            ))}
          </div>
        </div>

        {/* 경력 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800">📋 경력 조건</h2>
          <div className="flex flex-wrap gap-2">
            {CAREER_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setCareer(opt)}
                className={`px-4 py-2 rounded-xl text-sm font-black border transition-all ${
                  career === opt
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 안내 */}
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
          <p className="text-xs font-bold text-rose-600 leading-relaxed">
            💡 입력한 구인 조건은 코코알바 공고의 <strong>채용 조건 섹션</strong>에 자동으로 반영됩니다.<br/>
            채용 메시지(상세 소개글)는 코코알바 마이샵에서 별도로 수정할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto p-4 flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-black text-sm flex items-center justify-center transition-colors hover:bg-gray-200"
          >
            취소
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              <><CheckCircle className="w-4 h-4" /> 저장 완료!</>
            ) : (
              <><Save className="w-4 h-4" /> 저장하기</>
            )}
          </button>
        </div>
        {error && (
          <p className="text-center text-xs text-red-500 font-bold pb-2">{error}</p>
        )}
      </div>
    </div>
  );
}
