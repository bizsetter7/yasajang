'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const JOB_TYPES = ['웨이터', '실무자 (실장, 매니저)', '영업진 (PR)'] as const;
const DAYS_OFF = ['월', '화', '수', '목', '금', '토', '일'] as const;
const CAREER_OPTIONS = ['초보자, 경력자 모두 환영', '경력자만 지원 가능'] as const;
const DRIVING_OPTIONS = ['운전 업무 없음', '운전 면허 필수 (차량 운전 업무가 있는 경우)'] as const;
const PAY_TYPES = ['일급', '월급'] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINS = ['00', '15', '30', '45'];

const BENEFIT_GROUPS = [
  {
    title: '생활지원',
    items: ['식사 제공', '숙소 제공'],
  },
  {
    title: '금전지원',
    items: ['꽁비 별도 지급', '1년 이상 근무 시, 퇴직금 지급'],
  },
  {
    title: '근로지원',
    items: ['주방 업무 없음', '청소 업무 없음', '4대보험 가입', '근로계약서 작성'],
  },
] as const;

export default function WaiterzoneHiringPage() {
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
  const [jobType, setJobType] = useState<string[]>(['웨이터']);
  const [salary, setSalary] = useState('');       // raw digits
  const [salaryFocused, setSalaryFocused] = useState(false);
  const [roomTip, setRoomTip] = useState('');     // raw digits
  const [roomTipFocused, setRoomTipFocused] = useState(false);
  const [ageMin, setAgeMin] = useState('20');
  const [ageMax, setAgeMax] = useState('40');
  const [workStartH, setWorkStartH] = useState('20');
  const [workStartM, setWorkStartM] = useState('00');
  const [workEndH, setWorkEndH] = useState('04');
  const [workEndM, setWorkEndM] = useState('00');
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [career, setCareer] = useState('초보자, 경력자 모두 환영');
  const [driving, setDriving] = useState('운전 업무 없음');
  const [payType, setPayType] = useState('일급');
  const [benefits, setBenefits] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }

      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (bizErr || !biz) { router.push('/dashboard'); return; }
      setBusinessId(biz.id);

      const { data: shops } = await supabase
        .from('shops')
        .select('options')
        .eq('user_id', user.id)
        .limit(10);

      if (shops && shops.length > 0) {
        for (const shop of shops) {
          const opts = (shop.options || {}) as Record<string, unknown>;
          const hiringInfo = (opts.hiring_info as Record<string, unknown> | undefined);
          const saved = hiringInfo?.waiterzone as Record<string, unknown> | undefined;
          if (saved) {
            if (Array.isArray(saved.job_type)) setJobType(saved.job_type as string[]);
            if (saved.salary) setSalary(String(Number(saved.salary)));
            if (saved.room_tip) setRoomTip(String(Number(saved.room_tip)));
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
            if (saved.career) {
              const raw = String(saved.career);
              const careerMigrated = (raw === '경력만' || raw === '경력우대') ? '경력자만 지원 가능' : raw === '경력자만 지원 가능' ? raw : '초보자, 경력자 모두 환영';
              setCareer(careerMigrated);
            }
            if (saved.driving_required !== undefined) {
              setDriving(saved.driving_required === true || saved.driving === '운전 면허 필수 (차량 운전 업무가 있는 경우)' ? '운전 면허 필수 (차량 운전 업무가 있는 경우)' : '운전 업무 없음');
            } else if (saved.driving) {
              setDriving(String(saved.driving));
            }
            if (saved.pay_type) setPayType(String(saved.pay_type));
            if (Array.isArray(saved.benefits)) setBenefits(saved.benefits as string[]);
            break;
          }
        }
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

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    setError('');

    const hiringInfo = {
      job_type: jobType,
      salary: salary ? Number(salary) : null,
      pay_type: payType,
      room_tip: roomTip ? Number(roomTip) : null,
      age_min: Number(ageMin),
      age_max: Number(ageMax),
      work_start: `${workStartH}:${workStartM}`,
      work_end: `${workEndH}:${workEndM}`,
      days_off: daysOff,
      career,
      driving: driving,
      driving_required: driving === '운전 면허 필수 (차량 운전 업무가 있는 경우)',
      benefits,
    };

    try {
      const res = await fetch('/api/platform-ads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, platform: 'waiterzone', hiringInfo }),
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
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // text-gray-900 명시 — 글로벌 body가 다크테마(#fafafa)라 input/select 글자가 흰색으로 보임 방지
  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 placeholder:text-gray-400';
  const selectCls = 'w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 cursor-pointer appearance-none';
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
            <h1 className="text-base font-black text-gray-900">웨이터존 구인 조건</h1>
            <p className="text-xs text-gray-400 font-medium">웨이터 구인공고에 반영될 채용 조건</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            <span className="text-xs font-black text-blue-500">웨이터존</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* 직종 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            🤵 직종
            <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">필수</span>
          </h2>
          <div className="flex flex-col gap-2">
            {JOB_TYPES.map(type => {
              const checked = jobType.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleJobType(type)}
                  className="flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${checked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                    {checked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-sm font-bold text-gray-700">{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 급여 & 룸티 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
            💰 급여 & 룸티
            <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">필수</span>
          </h2>
          <div>
            <label className={labelCls}>급여방식</label>
            <div className="relative">
              <select value={payType} onChange={e => setPayType(e.target.value)} className={selectCls}>
                {PAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▼</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>급여 금액</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={salaryFocused ? salary : (salary ? Number(salary).toLocaleString() : '')}
                  onFocus={() => setSalaryFocused(true)}
                  onChange={e => setSalary(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={() => setSalaryFocused(false)}
                  placeholder="0원 또는 미입력시, 미노출"
                  className={inputCls}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">원</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>룸티</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={roomTipFocused ? roomTip : (roomTip ? Number(roomTip).toLocaleString() : '')}
                  onFocus={() => setRoomTipFocused(true)}
                  onChange={e => setRoomTip(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={() => setRoomTipFocused(false)}
                  placeholder="0원 또는 미입력시, 미노출"
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
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
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
          <div className="flex flex-col gap-2">
            {CAREER_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setCareer(opt)}
                className={`w-full px-4 py-3 rounded-xl text-sm font-black border transition-all text-left flex items-center gap-3 ${
                  career === opt
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${career === opt ? 'border-white' : 'border-gray-300'}`}>
                  {career === opt && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 운전 필수 여부 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800">🚗 운전 필수 여부</h2>
          <div className="flex flex-col gap-2">
            {DRIVING_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setDriving(opt)}
                className={`w-full px-4 py-3 rounded-xl text-sm font-black border transition-all text-left flex items-center gap-3 ${
                  driving === opt
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${driving === opt ? 'border-white' : 'border-gray-300'}`}>
                  {driving === opt && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 복지혜택 */}
        <div className={sectionCls}>
          <h2 className="text-sm font-black text-gray-800">🎁 복지혜택 <span className="text-[10px] font-bold text-gray-400">(선택사항)</span></h2>
          {BENEFIT_GROUPS.map(group => (
            <div key={group.title}>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">{group.title}</p>
              <div className="flex flex-col gap-1.5">
                {group.items.map(item => {
                  const checked = benefits.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setBenefits(prev => checked ? prev.filter(b => b !== item) : [...prev, item])}
                      className="flex items-center gap-2.5 cursor-pointer text-left"
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${checked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                        {checked && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 안내 */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-xs font-bold text-blue-600 leading-relaxed">
            💡 입력한 구인 조건은 웨이터존 공고의 <strong>채용 조건 섹션</strong>에 자동으로 반영됩니다.<br/>
            채용 메시지(상세 소개글)는 웨이터존 마이샵에서 별도로 수정할 수 있습니다.
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
            className="flex-[2] py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
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
