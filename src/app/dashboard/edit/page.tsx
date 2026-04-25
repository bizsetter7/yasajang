'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  ChevronLeft, Save, Building, Phone, MapPin, MessageSquare,
  Tag, Globe, Clock, Users, ParkingCircle, Car, Navigation,
  Plus, Trash2, Info, CalendarDays, Ruler,
} from 'lucide-react';
import Link from 'next/link';

const REGIONS = [
  { value: 'seoul', label: '서울' }, { value: 'gyeonggi', label: '경기' },
  { value: 'incheon', label: '인천' }, { value: 'busan', label: '부산' },
  { value: 'daegu', label: '대구' }, { value: 'daejeon', label: '대전' },
  { value: 'gwangju', label: '광주' }, { value: 'ulsan', label: '울산' },
  { value: 'chungnam', label: '충청남도' }, { value: 'chungbuk', label: '충청북도' },
  { value: 'jeonnam', label: '전라남도' }, { value: 'jeonbuk', label: '전라북도' },
  { value: 'gangwon', label: '강원도' }, { value: 'gyeongnam', label: '경상남도' },
  { value: 'gyeongbuk', label: '경상북도' }, { value: 'jeju', label: '제주도' },
  { value: 'other', label: '기타' },
];

const CATEGORIES = [
  { value: 'room_salon', label: '룸살롱' }, { value: 'karaoke_bar', label: '노래주점' },
  { value: 'bar', label: '유흥주점' }, { value: 'night_club', label: '나이트/클럽' },
  { value: 'hostbar', label: '호스트바' }, { value: 'general', label: '일반' },
  { value: 'other', label: '기타' },
];

interface MenuItem { name: string; price: string; note: string; }
interface ExtraFee { label: string; value: string; amount: string; }

interface DayHours {
  open: string;
  close: string;
  is24h: boolean;
  isClosed: boolean;
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

const DEFAULT_DAY_HOURS: DayHours = { open: '18:00', close: '04:00', is24h: false, isClosed: false };

interface MenuCategories {
  featured: MenuItem[];
  drinks: MenuItem[];
  snacks: MenuItem[];
}

const DEFAULT_EXTRA_FEES: ExtraFee[] = [
  { label: '접객원 이용료', value: '', amount: '' },
  { label: '룸 이용료', value: '', amount: '0' },
  { label: '웨이터 팁', value: '', amount: '0' },
];

const inputCls = 'w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 text-white focus:border-amber-500 outline-none transition-all font-medium text-sm placeholder-zinc-600';
const labelCls = 'text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1.5';
const sectionCls = 'space-y-5 p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl';

export default function BusinessEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState('');

  // 기본 정보 (재심사 필요)
  const [basic, setBasic] = useState({
    name: '', phone: '', address: '', addressDetail: '',
    openChatUrl: '', category: '', regionCode: '',
  });

  // 홍보 정보 (즉시 반영)
  const [promo, setPromo] = useState({
    managerName: '', managerPhone: '',
    roomCount: '', ageRange: '',
    hasParking: false, hasValet: false, hasPickup: false,
    description: '', openedAt: '', floorArea: '',
    coverImageUrl: '',
  });

  const [dayHours, setDayHours] = useState<Record<string, DayHours>>(
    Object.fromEntries(DAYS.map(d => [d, { ...DEFAULT_DAY_HOURS }]))
  );

  const [menuCategories, setMenuCategories] = useState<MenuCategories>({
    featured: [], drinks: [], snacks: [],
  });
  const [extraFees, setExtraFees] = useState<ExtraFee[]>(DEFAULT_EXTRA_FEES);
  
  const [showPreview, setShowPreview] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/?auth=login'); return; }

      const { data, error } = await supabase
        .from('businesses').select('*').eq('owner_id', user.id).single();

      if (error || !data) { alert('업소 정보를 불러올 수 없습니다.'); router.push('/dashboard'); return; }

      setBusinessId(data.id);
      setBasic({
        name: data.name || '', phone: data.phone || '',
        address: data.address || '', addressDetail: data.address_detail || '',
        openChatUrl: data.open_chat_url || '', category: data.category || '',
        regionCode: data.region_code || '',
      });
      setPromo({
        managerName: data.manager_name || '',
        managerPhone: data.manager_phone || '', roomCount: data.room_count?.toString() || '',
        ageRange: data.age_range || '', hasParking: data.has_parking || false,
        hasValet: data.has_valet || false, hasPickup: data.has_pickup || false,
        description: data.description || '', openedAt: data.opened_at || '',
        floorArea: data.floor_area || '', coverImageUrl: data.cover_image_url || '',
      });
      
      // business_hours가 JSON이면 파싱, 텍스트면 무시 (기존 데이터 하위호환)
      if (data.business_hours) {
        try {
          const parsed = JSON.parse(data.business_hours);
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            setDayHours(prev => ({ ...prev, ...parsed }));
          }
        } catch {
          // 구형 텍스트 데이터 — 무시하고 기본값 유지
        }
      }

      if (data.menu_items) {
        const raw = data.menu_items;
        // 신형: { featured, drinks, snacks }
        if (raw.featured !== undefined) {
          setMenuCategories({
            featured: (raw.featured || []).map((m: MenuItem) => ({ name: m.name, price: m.price?.toString() || '', note: m.note || '' })),
            drinks: (raw.drinks || []).map((m: MenuItem) => ({ name: m.name, price: m.price?.toString() || '', note: m.note || '' })),
            snacks: (raw.snacks || []).map((m: MenuItem) => ({ name: m.name, price: m.price?.toString() || '', note: m.note || '' })),
          });
        } else if (Array.isArray(raw)) {
          // 구형 배열 데이터 → featured로 마이그레이션
          setMenuCategories(prev => ({
            ...prev,
            featured: (raw as MenuItem[]).map((m: MenuItem) => ({ name: m.name, price: m.price?.toString() || '', note: m.note || '' })),
          }));
        }
      }
      if (data.extra_fees?.length) {
        setExtraFees((data.extra_fees as ExtraFee[]).map((f: ExtraFee) => ({
          label: f.label, value: f.value || '', amount: f.amount?.toString() || '',
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/businesses/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          ...basic,
          ...promo,
          businessHours: JSON.stringify(dayHours),
          menuItems: {
            featured: menuCategories.featured.map(m => ({ name: m.name, price: Number(m.price) || 0, note: m.note })),
            drinks: menuCategories.drinks.map(m => ({ name: m.name, price: Number(m.price) || 0, note: m.note })),
            snacks: menuCategories.snacks.map(m => ({ name: m.name, price: Number(m.price) || 0, note: m.note })),
          },
          extraFees: extraFees.map(f => ({
            label: f.label, value: f.value, amount: Number(f.amount) || 0,
          })),
        }),
      });
      if (res.ok) { alert('저장되었습니다.'); router.push('/dashboard'); }
      else { const d = await res.json(); alert(d.error || '오류가 발생했습니다.'); }
    } catch { alert('서버 오류가 발생했습니다.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* 헤더 */}
        <header className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm font-bold group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 대시보드
          </Link>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-full uppercase tracking-widest">Edit Mode</span>
        </header>

        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">업소 정보 수정</h1>
          <p className="text-zinc-500 text-sm mt-2">기본 정보 변경 시 재심사가 진행됩니다. 홍보 정보는 즉시 반영됩니다.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">

          {/* ─ 기본 정보 (재심사) ─ */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-2">
              <Building size={15} className="text-amber-500" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">기본 정보</h2>
              <span className="ml-auto text-[10px] text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full font-bold">변경 시 재심사</span>
            </div>
            <div>
              <label className={labelCls}><Building size={13} /> 업소명</label>
              <input required className={inputCls} value={basic.name} onChange={e => setBasic({...basic, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><Globe size={13} /> 지역</label>
                <select className={inputCls} value={basic.regionCode} onChange={e => setBasic({...basic, regionCode: e.target.value})}>
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}><Tag size={13} /> 업종</label>
                <select className={inputCls} value={basic.category} onChange={e => setBasic({...basic, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}><MapPin size={13} /> 기본 주소</label>
              <input required className={inputCls} value={basic.address} onChange={e => setBasic({...basic, address: e.target.value})} />
            </div>
            <div>
              <label className={labelCls}>상세 주소 (층, 호수)</label>
              <input className={inputCls} value={basic.addressDetail} onChange={e => setBasic({...basic, addressDetail: e.target.value})} />
            </div>
            <div>
              <label className={labelCls}><Phone size={13} /> 대표 전화번호</label>
              <input type="tel" className={inputCls} value={basic.phone} onChange={e => setBasic({...basic, phone: e.target.value})} />
            </div>
            <div>
              <label className={labelCls}><MessageSquare size={13} /> 카카오톡 오픈채팅 URL</label>
              <input type="url" placeholder="https://open.kakao.com/..." className={inputCls} value={basic.openChatUrl} onChange={e => setBasic({...basic, openChatUrl: e.target.value})} />
            </div>
          </div>

          {/* ─ 홍보 정보 (즉시 반영) ─ */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-2">
              <Info size={15} className="text-emerald-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">홍보 정보</h2>
              <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-bold">즉시 반영</span>
            </div>

            {/* 대표 이미지 URL */}
            <div>
              <label className={labelCls}>대표 사진 URL (커버)</label>
              <input type="url" placeholder="https://..." className={inputCls} value={promo.coverImageUrl} onChange={e => setPromo({...promo, coverImageUrl: e.target.value})} />
              <p className="text-[10px] text-zinc-600 mt-1">이미지 직접 업로드는 추후 지원 예정. 현재는 URL 입력.</p>
            </div>

            {/* 영업시간 */}
            <div>
              <label className={labelCls}><Clock size={13} /> 영업시간 (요일별)</label>
              <div className="space-y-2">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-black text-zinc-400 shrink-0">{day}</span>
                    <button
                      type="button"
                      onClick={() => setDayHours(h => ({
                        ...h, [day]: { ...h[day], isClosed: !h[day].isClosed }
                      }))}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
                        dayHours[day].isClosed
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {dayHours[day].isClosed ? '휴무' : '영업'}
                    </button>
                    {!dayHours[day].isClosed && (
                      <>
                        <input
                          type="time"
                          value={dayHours[day].open}
                          onChange={e => setDayHours(h => ({ ...h, [day]: { ...h[day], open: e.target.value } }))}
                          disabled={dayHours[day].is24h}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 outline-none disabled:opacity-40"
                        />
                        <span className="text-zinc-600 text-xs shrink-0">~</span>
                        <input
                          type="time"
                          value={dayHours[day].close}
                          onChange={e => setDayHours(h => ({ ...h, [day]: { ...h[day], close: e.target.value } }))}
                          disabled={dayHours[day].is24h}
                          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 outline-none disabled:opacity-40"
                        />
                        <button
                          type="button"
                          onClick={() => setDayHours(h => ({ ...h, [day]: { ...h[day], is24h: !h[day].is24h } }))}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
                            dayHours[day].is24h
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          }`}
                        >
                          24h
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 담당자 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><Users size={13} /> 담당자(실장)명</label>
                <input placeholder="예: 김철훈" className={inputCls} value={promo.managerName} onChange={e => setPromo({...promo, managerName: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}><Phone size={13} /> 담당자 전화</label>
                <input type="tel" placeholder="010-0000-0000" className={inputCls} value={promo.managerPhone} onChange={e => setPromo({...promo, managerPhone: e.target.value})} />
              </div>
            </div>

            {/* 룸수 / 연령대 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><Building size={13} /> 룸 수</label>
                <input type="number" min="0" placeholder="예: 8" className={inputCls} value={promo.roomCount} onChange={e => setPromo({...promo, roomCount: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}><Users size={13} /> 연령대</label>
                <input placeholder="예: 20~26세" className={inputCls} value={promo.ageRange} onChange={e => setPromo({...promo, ageRange: e.target.value})} />
              </div>
            </div>

            {/* 주차/발렛/픽업 */}
            <div>
              <label className={labelCls}>편의 옵션</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'hasParking', label: '주차', icon: ParkingCircle },
                  { key: 'hasValet', label: '발렛', icon: Car },
                  { key: 'hasPickup', label: '픽업', icon: Navigation },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPromo(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                    className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border font-bold text-sm transition-all ${
                      promo[key as keyof typeof promo]
                        ? 'bg-amber-500/15 border-amber-500 text-amber-500'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 개업일 / 업소 규모 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><CalendarDays size={13} /> 개업일</label>
                <input type="date" className={inputCls} value={promo.openedAt} onChange={e => setPromo({...promo, openedAt: e.target.value})} />
              </div>
              <div>
                <label className={labelCls}><Ruler size={13} /> 업소 규모</label>
                <input placeholder="예: 73.92㎡ / 22평" className={inputCls} value={promo.floorArea} onChange={e => setPromo({...promo, floorArea: e.target.value})} />
              </div>
            </div>

            {/* 업소 소개 */}
            <div>
              <label className={labelCls}><Info size={13} /> 업소 소개</label>
              <textarea
                rows={4}
                placeholder="예: 경기 평택시 비전동에 위치한 정식 허가 유흥업소로 안심하고 이용하실 수 있습니다."
                className={inputCls + ' resize-none'}
                value={promo.description}
                onChange={e => setPromo({...promo, description: e.target.value})}
              />
            </div>
          </div>

          {/* ─ 메뉴 정보 ─ */}
          <div className={sectionCls}>
            {(['featured', 'drinks', 'snacks'] as const).map(cat => {
              const labels = { featured: '대표메뉴', drinks: '주류', snacks: '안주' };
              const items = menuCategories[cat];
              return (
                <div key={cat} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">{labels[cat]}</h2>
                    <button
                      type="button"
                      onClick={() => setMenuCategories(mc => ({ ...mc, [cat]: [...mc[cat], { name: '', price: '', note: '' }] }))}
                      className="flex items-center gap-1.5 text-xs text-amber-500 font-bold hover:opacity-80"
                    >
                      <Plus size={14} /> 추가
                    </button>
                  </div>
                  {items.length === 0 && (
                    <p className="text-zinc-600 text-sm text-center py-2">항목을 추가해주세요</p>
                  )}
                  <div className="space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-end">
                          <button type="button"
                            onClick={() => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].filter((_, j) => j !== i) }))}
                            className="text-zinc-600 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-zinc-600 font-bold block mb-1">메뉴명</label>
                            <input placeholder="예: 양주 1병" className={inputCls} value={item.name}
                              onChange={e => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-600 font-bold block mb-1">가격 (원)</label>
                            <input type="number" placeholder="150000" className={inputCls} value={item.price}
                              onChange={e => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].map((x, j) => j === i ? { ...x, price: e.target.value } : x) }))} />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-600 font-bold block mb-1">설명 (선택)</label>
                          <input placeholder="예: 기본 세팅 포함" className={inputCls} value={item.note}
                            onChange={e => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].map((x, j) => j === i ? { ...x, note: e.target.value } : x) }))} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {cat !== 'snacks' && <hr className="border-zinc-800 mt-4" />}
                </div>
              );
            })}
          </div>

          {/* ─ 별도 요금 ─ */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">별도 요금</h2>
              <button
                type="button"
                onClick={() => setExtraFees(f => [...f, { label: '', value: '', amount: '' }])}
                className="flex items-center gap-1.5 text-xs text-amber-500 font-bold hover:opacity-80"
              >
                <Plus size={14} /> 항목 추가
              </button>
            </div>
            <p className="text-[11px] text-zinc-600 mb-3">모든 금액은 VAT 포함으로 입력하세요. 없는 항목은 0으로 입력.</p>
            <div className="space-y-3">
              {extraFees.map((fee, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <div>
                    {i === 0 && <label className="text-[10px] text-zinc-600 font-bold block mb-1">항목명</label>}
                    <input placeholder="접객원 이용료" className={inputCls} value={fee.label}
                      onChange={e => setExtraFees(f => f.map((x, j) => j === i ? {...x, label: e.target.value} : x))} />
                  </div>
                  <div>
                    {i === 0 && <label className="text-[10px] text-zinc-600 font-bold block mb-1">기준</label>}
                    <input placeholder="1시간 20분" className={inputCls} value={fee.value}
                      onChange={e => setExtraFees(f => f.map((x, j) => j === i ? {...x, value: e.target.value} : x))} />
                  </div>
                  <div>
                    {i === 0 && <label className="text-[10px] text-zinc-600 font-bold block mb-1">금액 (원)</label>}
                    <input type="number" placeholder="200000" className={inputCls} value={fee.amount}
                      onChange={e => setExtraFees(f => f.map((x, j) => j === i ? {...x, amount: e.target.value} : x))} />
                  </div>
                  <button type="button" onClick={() => setExtraFees(f => f.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 pb-3.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold py-4 rounded-[2rem] transition-all flex items-center justify-center gap-2 text-sm mb-3"
          >
            출력 예시 보기
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black py-5 rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/10"
          >
            {saving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Save size={20} /> 저장하기</>}
          </button>
        </form>

        {showPreview && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-sm w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-amber-500 uppercase tracking-widest">출력 예시</span>
                <button onClick={() => setShowPreview(false)} className="text-zinc-500 hover:text-white text-lg font-bold">✕</button>
              </div>

              {/* 대표 이미지 */}
              {promo.coverImageUrl && (
                <div className="rounded-2xl overflow-hidden mb-4 aspect-video relative bg-zinc-900">
                  <img src={promo.coverImageUrl} alt="cover" className="w-full h-full object-cover" />
                </div>
              )}

              {/* 업소명 + 지역 */}
              <h3 className="text-xl font-black text-white">{basic.name || '업소명'}</h3>
              <p className="text-zinc-500 text-sm mt-1">{REGIONS.find(r => r.value === basic.regionCode)?.label || '지역'} · {CATEGORIES.find(c => c.value === basic.category)?.label || '업종'}</p>

              {/* 연락처 버튼 */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="p-3 bg-zinc-900 rounded-xl text-center text-xs font-bold text-zinc-300">📞 전화</div>
                <div className="p-3 bg-zinc-900 rounded-xl text-center text-xs font-bold text-zinc-300">💬 오픈톡</div>
              </div>

              {/* 영업시간 */}
              <div className="mt-4 p-4 bg-zinc-900 rounded-2xl">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">영업시간</p>
                {DAYS.map(day => {
                  const h = dayHours[day];
                  return (
                    <div key={day} className="flex justify-between text-xs py-1 border-b border-zinc-800 last:border-0">
                      <span className="text-zinc-400 font-bold">{day}</span>
                      <span className="text-white font-medium">
                        {h.isClosed ? '휴무' : h.is24h ? '24시간' : `${h.open} ~ ${h.close}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 메뉴 */}
              {(menuCategories.featured.length > 0 || menuCategories.drinks.length > 0 || menuCategories.snacks.length > 0) && (
                <div className="mt-4 p-4 bg-zinc-900 rounded-2xl space-y-3">
                  {(['featured', 'drinks', 'snacks'] as const).map(cat => {
                    const labels = { featured: '대표메뉴', drinks: '주류', snacks: '안주' };
                    if (!menuCategories[cat].length) return null;
                    return (
                      <div key={cat}>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{labels[cat]}</p>
                        {menuCategories[cat].map((m, i) => (
                          <div key={i} className="flex justify-between text-xs py-1">
                            <span className="text-zinc-300">{m.name}</span>
                            <span className="text-amber-400 font-bold">{Number(m.price).toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 별도요금 */}
              {extraFees.some(f => f.label && Number(f.amount) > 0) && (
                <div className="mt-4 p-4 bg-zinc-900 rounded-2xl">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">별도 요금</p>
                  {extraFees.filter(f => f.label && Number(f.amount) > 0).map((fee, i) => (
                    <div key={i} className="flex justify-between text-xs py-1">
                      <span className="text-zinc-400">{fee.label} {fee.value && `(${fee.value})`}</span>
                      <span className="text-white font-bold">{Number(fee.amount).toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-zinc-600 text-center mt-4">* 저장 후 실제 광고에 반영됩니다</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
