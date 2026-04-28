'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const JOB_TYPES = ['룸살롱 선수', '바 선수', '클럽 선수', '노래방 선수', '기타'] as const;
const DAYS_OFF = ['월', '화', '수', '목', '금', '토', '일'] as const;
const CAREER_OPTIONS = ['무관', '신입만', '경력만', '경력우대'] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINS = ['00', '15', '30', '45'];

export default function SunsuzoneHiringPage() {
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

  const [jobType, setJobType] = useState<string[]>([]);
  const [salary, setSalary] = useState('');
  const [bonus, setBonus] = useState('');
  const [ageMin, setAgeMin] = useState('20');
  const [ageMax, setAgeMax] = useState('40');
  const [workStartH, setWorkStartH] = useState('20');
  const [workStartM, setWorkStartM] = useState('00');
  const [workEndH, setWorkEndH] = useState('04');
  const [workEndM, setWorkEndM] = useState('00');
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [career, setCareer] = useState('무관');
  const [drivingRequired, setDrivingRequired] = useState(false);
  const [accommodation, setAccommodation] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }

      const { data: biz } = await supabase
        .from('businesses')
        .select('id, options')
        .eq('owner_id', user.id)
        .single();

      if (!biz) { router.push('/dashboard'); return; }
      setBusinessId(biz.id);

      const existingOptions = (biz.options as Record<string, unknown>) || {};
      const savedInfo = existingOptions.hiring_sunsuzone as Record<string, unknown> | undefined;
      if (savedInfo) {
        if (Array.isArray(savedInfo.job_type)) setJobType(savedInfo.job_type as string[]);
        if (savedInfo.salary) setSalary(String(savedInfo.salary));
        if (savedInfo.bonus) setBonus(String(savedInfo.bonus));
        if (savedInfo.age_min) setAgeMin(String(savedInfo.age_min));
        if (savedInfo.age_max) setAgeMax(String(savedInfo.age_max));
        if (savedInfo.work_start) {
          const [h, m] = String(savedInfo.work_start).split(':');
          if (h) setWorkStartH(h);
          if (m) setWorkStartM(m);
        }
        if (savedInfo.work_end) {
          const [h, m] = String(savedInfo.work_end).split(':');
          if (h) setWorkEndH(h);
          if (m) setWorkEndM(m);
        }
        if (Array.isArray(savedInfo.days_off)) setDaysOff(savedInfo.days_off as string[]);
        if (savedInfo.career) setCareer(String(savedInfo.career));
        if (typeof savedInfo.driving_required === 'boolean') setDrivingRequired(savedInfo.driving_required);
        if (typeof savedInfo.accommodation === 'boolean') setAccommodation(savedInfo.accommodation);
      }

      setLoading(false);
    };
    load();
  }, []);

  const toggleJobType = (type: string) => {
    setJobType(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };
  const toggleDay = (day: string) => {
    setDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };
  const formatNum = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    return num ? Number(num).toLocaleString() : '';
  };

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    setError('');

    const hiringInfo = {
      job_type: jobType,
      salary: salary ? Number(salary.replace(/,/g, '')) : null,
      bonus: bonus ? Number(bonus.replace(/,/g, '')) : null,
      age_min: Number(ageMin),
      age_max: Number(ageMax),
      work_start: `${workStartH}:${workStartM}`,
      work_end: `${workEndH}:${workEndM}`,
      days_off: daysOff,
      career,
      driving_required: drivingRequired,
      accommodation,
    };

    try {
      const res = await fetch('/api/platform-ads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, platform: 'sunsuzone', hiringInfo }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '저장 실패');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
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
        <div className="w-8 h-8 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white';
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
            <h1 className="text-base font-black text-gray-900">선수존 구인 조건</h1>
            <p className="text-xs text-gray-400 font-medium">선수 구인공고에 반영될 채용 조건</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            <span className="text-xs font-black text-yellow-600">선수존</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* 직종 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            👑 직종
            <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">필수</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => toggleJobType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-black border transition-all ${
                  jobType.includes(type)
                    ? 'bg-yellow-400 text-gray-900 border-yellow-400 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 급여 & 보너스 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            💰 급여 & 보너스
            <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">필수</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>기본 급여</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={salary}
                  onChange={e => setSalary(formatNum(e.target.value))}
                  placeholder="예: 200,000"
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">원</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>보너스</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={bonus}
                  onChange={e => setBonus(formatNum(e.target.value))}
                  placeholder="예: 50,000"
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 모집 연령 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800">👤 모집 연령</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className={labelCls}>최소 나이</label>
              <div className="relative">
                <input type="number" value={ageMin} onChange={e => setAgeMin(e.target.value)} min={18} max={60} className={inputCls} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">세</span>
              </div>
            </div>
            <span className="text-gray-400 font-black mt-5">~</span>
            <div className="flex-1">
              <label className={labelCls}>최대 나이</label>
              <div className="relative">
                <input type="number" value={ageMax} onChange={e => setAgeMax(e.target.value)} min={18} max={60} className={inputCls} />
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
                <select value={workStartH} onChange={e => setWorkStartH(e.target.value)} className={`flex-1 ${inputCls}`}>
                  {HOURS.map(h => <option key={h} value={h}>{h}시</option>)}
                </select>
                <select value={workStartM} onChange={e => setWorkStartM(e.target.value)} className={`w-20 ${inputCls}`}>
                  {MINS.map(m => <option key={m} value={m}>{m}분</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>퇴근 시간</label>
              <div className="flex gap-1.5">
                <select value={workEndH} onChange={e => setWorkEndH(e.target.value)} className={`flex-1 ${inputCls}`}>
                  {HOURS.map(h => <option key={h} value={h}>{h}시</option>)}
                </select>
                <select value={workEndM} onChange={e => setWorkEndM(e.target.value)} className={`w-20 ${inputCls}`}>
                  {MINS.map(m => <option key={m} value={m}>{m}분</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 휴무일 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            📅 휴무일
            <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">필수</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {DAYS_OFF.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-xl text-sm font-black border transition-all ${
                  daysOff.includes(day)
                    ? 'bg-yellow-400 text-gray-900 border-yellow-400 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-300'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          {daysOff.length === 0 && <p className="text-xs text-gray-400 font-medium">선택 없음 = 휴무 없음</p>}
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
                    ? 'bg-yellow-400 text-gray-900 border-yellow-400 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 기타 조건 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800">🏠 기타 조건</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setDrivingRequired(!drivingRequired)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${drivingRequired ? 'bg-yellow-400' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${drivingRequired ? 'left-6' : 'left-0.5'}`} />
              </div>
              <span className="text-sm font-bold text-gray-700">운전 가능자 우대</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setAccommodation(!accommodation)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${accommodation ? 'bg-yellow-400' : 'bg-gray-200'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${accommodation ? 'left-6' : 'left-0.5'}`} />
              </div>
              <span className="text-sm font-bold text-gray-700">숙소 제공</span>
            </label>
          </div>
        </div>

        {/* 안내 */}
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
          <p className="text-xs font-bold text-yellow-700 leading-relaxed">
            💡 입력한 구인 조건은 선수존 공고의 <strong>채용 조건 섹션</strong>에 자동으로 반영됩니다.<br/>
            채용 메시지(상세 소개글)는 선수존 마이샵에서 별도로 수정할 수 있습니다.
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
            className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
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
