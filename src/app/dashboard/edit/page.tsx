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

// 시/도 코드 → 시/군/구 목록
const SIDO_TO_SIGUNGU: Record<string, string[]> = {
  '서울': ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
  '경기': ['수원시','성남시','고양시','용인시','부천시','안산시','안양시','남양주시','화성시','평택시','의정부시','시흥시','파주시','광명시','김포시','군포시','광주시','이천시','양주시','오산시','구리시','안성시','포천시','의왕시','하남시','여주시','동두천시','과천시','가평군','양평군','연천군'],
  '인천': ['계양구','남동구','동구','미추홀구','부평구','서구','연수구','중구','강화군','옹진군'],
  '부산': ['강서구','금정구','기장군','남구','동구','동래구','부산진구','북구','사상구','사하구','서구','수영구','연제구','영도구','중구','해운대구'],
  '대구': ['남구','달서구','달성군','동구','북구','서구','수성구','중구'],
  '대전': ['대덕구','동구','서구','유성구','중구'],
  '광주': ['광산구','남구','동구','북구','서구'],
  '울산': ['남구','동구','북구','울주군','중구'],
  '충청남도': ['공주시','논산시','당진시','보령시','서산시','아산시','천안시','계룡시','금산군','부여군','서천군','청양군','태안군','홍성군','예산군'],
  '충청북도': ['청주시','충주시','제천시','보은군','옥천군','영동군','증평군','진천군','괴산군','음성군','단양군'],
  '전라남도': ['광양시','나주시','목포시','순천시','여수시','강진군','고흥군','곡성군','구례군','담양군','무안군','보성군','신안군','영광군','영암군','완도군','장성군','장흥군','진도군','함평군','해남군','화순군'],
  '전라북도': ['군산시','김제시','남원시','익산시','전주시','정읍시','고창군','무주군','부안군','순창군','완주군','임실군','장수군','진안군'],
  '강원도': ['강릉시','동해시','삼척시','속초시','원주시','춘천시','태백시','고성군','양구군','양양군','영월군','인제군','정선군','철원군','평창군','홍천군','화천군','횡성군'],
  '경상남도': ['거제시','김해시','밀양시','사천시','양산시','진주시','창원시','통영시','거창군','고성군','남해군','산청군','의령군','창녕군','하동군','함안군','함양군','합천군'],
  '경상북도': ['경산시','경주시','구미시','김천시','문경시','상주시','안동시','영주시','영천시','포항시','고령군','군위군','봉화군','성주군','영덕군','영양군','예천군','울릉군','울진군','의성군','청도군','청송군','칠곡군'],
  '제주도': ['제주시','서귀포시'],
  '기타': [],
};

// region_code → 시/도 한글명
const REGION_CODE_LABEL: Record<string, string> = {
  'seoul': '서울', 'gyeonggi': '경기', 'incheon': '인천',
  'busan': '부산', 'daegu': '대구', 'daejeon': '대전',
  'gwangju': '광주', 'ulsan': '울산', 'chungnam': '충청남도',
  'chungbuk': '충청북도', 'jeonnam': '전라남도', 'jeonbuk': '전라북도',
  'gangwon': '강원도', 'gyeongnam': '경상남도', 'gyeongbuk': '경상북도',
  'jeju': '제주도', 'other': '기타',
};

// "18:00" → { ampm:'오후', hour:'6', min:'00' }
function timeToComps(time: string) {
  const [hStr = '0', mStr = '0'] = (time || '').split(':');
  const h24 = parseInt(hStr) || 0;
  const min = parseInt(mStr) || 0;
  return {
    ampm: h24 < 12 ? '오전' : '오후',
    hour: String(h24 % 12 || 12),
    min: min === 30 ? '30' : '00',
  };
}

// ('오후', '6', '00') → "18:00"
function compsToTime(ampm: string, hour: string, min: string) {
  const h = parseInt(hour);
  if (!ampm || !h) return '';
  let h24 = h % 12;
  if (ampm === '오후') h24 += 12;
  return `${String(h24).padStart(2, '0')}:${min || '00'}`;
}

// 주소에서 시/군/구 추출: "경기도 평택시 특구로..." → "평택시"
function extractSub(address: string) {
  if (!address) return '';
  const parts = address.split(/\s+/);
  for (let i = 1; i < parts.length; i++) {
    if (/[시군구]$/.test(parts[i]) && parts[i].length > 2) return parts[i];
  }
  return '';
}

// 업소 소개 자동 생성
function buildAutoDescription(regionCode: string, regionSub: string) {
  const sido = REGION_CODE_LABEL[regionCode] || '';
  const sub = regionSub ? ` ${regionSub}` : '';
  return `${sido}${sub}에 위치한 정식 허가 유흥업소로, 안심하고 이용하실 수 있습니다.`;
}

// 시간 선택 컴포넌트
function TimeSelect({ time, disabled, onChange }: { time: string; disabled: boolean; onChange: (t: string) => void }) {
  const { ampm, hour, min } = timeToComps(time);
  const selCls = `bg-white border border-gray-200 rounded-lg px-1.5 py-2 text-gray-900 text-xs focus:border-amber-500 outline-none${disabled ? ' opacity-40' : ''}`;
  const upd = (a: string, h: string, m: string) => { if (a && h) onChange(compsToTime(a, h, m)); };
  return (
    <div className="flex gap-1">
      <select value={ampm} disabled={disabled} onChange={e => upd(e.target.value, hour, min)} className={selCls}>
        <option value="">선택</option>
        <option>오전</option><option>오후</option>
      </select>
      <select value={hour} disabled={disabled} onChange={e => upd(ampm, e.target.value, min)} className={selCls}>
        <option value="">시</option>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={String(h)}>{h}시</option>)}
      </select>
      <select value={min} disabled={disabled} onChange={e => upd(ampm, hour, e.target.value)} className={selCls}>
        <option value="">분</option>
        <option value="00">00분</option><option value="30">30분</option>
      </select>
    </div>
  );
}

const CATEGORIES = [
  { value: '룸살롱', label: '룸살롱' }, { value: '노래주점', label: '노래주점' },
  { value: '유흥주점', label: '유흥주점' }, { value: '나이트', label: '나이트/클럽' },
  { value: '호스트바', label: '호스트바' }, { value: '일반', label: '일반' },
  { value: '기타', label: '기타' },
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

const inputCls = 'w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 focus:border-amber-500 outline-none transition-all font-medium text-sm placeholder-gray-400';
const labelCls = 'text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-1.5';
const sectionCls = 'space-y-5 p-6 bg-white border border-gray-200 rounded-3xl shadow-sm';

export default function BusinessEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState('');

  const [basic, setBasic] = useState({
    name: '', phone: '', address: '', addressDetail: '',
    openChatUrl: '', category: '', regionCode: '', regionSub: '',
    menu_main: '', menu_liquor: '', menu_snack: '',
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
      const storedAddress = data.address || '';
      setBasic({
        name: data.name || '', phone: data.phone || '',
        address: storedAddress, addressDetail: data.address_detail || '',
        openChatUrl: data.open_chat_url || '', category: data.category || '',
        regionCode: data.region_code || '',
        regionSub: extractSub(storedAddress),
        menu_main: data.menu_main || '',
        menu_liquor: data.menu_liquor || '',
        menu_snack: data.menu_snack || '',
      });
      setPromo({
        managerName: data.manager_name || '',
        managerPhone: data.manager_phone || data.phone || '', roomCount: data.room_count?.toString() || '',
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
    // 업소 소개 없으면 주소 기반 자동 생성
    const finalDescription = promo.description?.trim() ||
      buildAutoDescription(basic.regionCode, basic.regionSub);
    try {
      const res = await fetch('/api/businesses/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          ...basic,
          ...promo,
          description: finalDescription,
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* 헤더 */}
        <header className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-bold group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 대시보드
          </Link>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest">Edit Mode</span>
        </header>

        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">업소 정보 수정</h1>
          <p className="text-gray-500 text-sm mt-2">기본 정보 변경 시 재심사가 진행됩니다. 홍보 정보는 즉시 반영됩니다.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">

          {/* ─ 기본 정보 (재심사) ─ */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-2">
              <Building size={15} className="text-amber-500" />
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">기본 정보</h2>
              <span className="ml-auto text-[10px] text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-bold">변경 시 재심사</span>
            </div>
            <div>
              <label className={labelCls}><Building size={13} /> 업소명</label>
              <input required className={inputCls} value={basic.name} onChange={e => setBasic({...basic, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}><Globe size={13} /> 지역</label>
                <select className={inputCls} value={basic.regionCode}
                  onChange={e => {
                    const newCode = e.target.value;
                    const label = REGION_CODE_LABEL[newCode] || '';
                    const subs = SIDO_TO_SIGUNGU[label] || [];
                    setBasic({...basic, regionCode: newCode, regionSub: subs[0] || ''});
                  }}>
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>상세 지역</label>
                <select className={inputCls} value={basic.regionSub}
                  onChange={e => setBasic({...basic, regionSub: e.target.value})}>
                  <option value="">선택</option>
                  {(SIDO_TO_SIGUNGU[REGION_CODE_LABEL[basic.regionCode] || ''] || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
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
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-4">간편 메뉴 (필수)</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>대표 메뉴</label>
                  <input className={inputCls} placeholder="예: 양주 1병 80,000원" value={basic.menu_main} onChange={e => setBasic({...basic, menu_main: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>주류 메뉴</label>
                    <textarea rows={3} className={inputCls + ' resize-none'} placeholder="맥주 5,000원..." value={basic.menu_liquor} onChange={e => setBasic({...basic, menu_liquor: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelCls}>안주 메뉴</label>
                    <textarea rows={3} className={inputCls + ' resize-none'} placeholder="안주모듬 20,000원..." value={basic.menu_snack} onChange={e => setBasic({...basic, menu_snack: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─ 홍보 정보 (즉시 반영) ─ */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-2">
              <Info size={15} className="text-emerald-400" />
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">홍보 정보</h2>
              <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">즉시 반영</span>
            </div>

            {/* 대표 이미지 URL */}
            <div>
              <label className={labelCls}>대표 사진 URL (커버)</label>
              <input type="url" placeholder="https://..." className={inputCls} value={promo.coverImageUrl} onChange={e => setPromo({...promo, coverImageUrl: e.target.value})} />
              <p className="text-[10px] text-gray-400 mt-1">이미지 직접 업로드는 추후 지원 예정. 현재는 URL 입력.</p>
            </div>

            {/* 영업시간 */}
            <div>
              <label className={labelCls}><Clock size={13} /> 영업시간 (요일별)</label>
              <div className="space-y-2">
                {DAYS.map(day => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-black text-gray-600 shrink-0">{day}</span>
                    <button
                      type="button"
                      onClick={() => setDayHours(h => ({
                        ...h, [day]: { ...h[day], isClosed: !h[day].isClosed }
                      }))}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
                        dayHours[day].isClosed
                          ? 'bg-gray-100 border-gray-200 text-gray-400'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      }`}
                    >
                      {dayHours[day].isClosed ? '휴무' : '영업'}
                    </button>
                    {!dayHours[day].isClosed && (
                      <>
                        <TimeSelect
                          time={dayHours[day].open}
                          disabled={dayHours[day].is24h}
                          onChange={t => setDayHours(h => ({ ...h, [day]: { ...h[day], open: t } }))}
                        />
                        <span className="text-gray-400 text-xs shrink-0">~</span>
                        <TimeSelect
                          time={dayHours[day].close}
                          disabled={dayHours[day].is24h}
                          onChange={t => setDayHours(h => ({ ...h, [day]: { ...h[day], close: t } }))}
                        />
                        <button
                          type="button"
                          onClick={() => setDayHours(h => ({ ...h, [day]: { ...h[day], is24h: !h[day].is24h } }))}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
                            dayHours[day].is24h
                              ? 'bg-amber-50 border-amber-200 text-amber-600'
                              : 'bg-gray-100 border-gray-200 text-gray-400'
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
                        ? 'bg-amber-50 border-amber-400 text-amber-600'
                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
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
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + ' mb-0'}><Info size={13} /> 업소 소개</label>
                <button
                  type="button"
                  onClick={() => setPromo(p => ({...p, description: buildAutoDescription(basic.regionCode, basic.regionSub)}))}
                  className="text-[10px] text-amber-500 font-bold hover:opacity-80 border border-amber-300 rounded-lg px-2 py-0.5"
                >
                  주소 기반 자동 생성
                </button>
              </div>
              <textarea
                rows={4}
                placeholder="예: 경기 평택시에 위치한 정식 허가 유흥업소로, 안심하고 이용하실 수 있습니다."
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
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">{labels[cat]}</h2>
                    <button
                      type="button"
                      onClick={() => setMenuCategories(mc => ({ ...mc, [cat]: [...mc[cat], { name: '', price: '', note: '' }] }))}
                      className="flex items-center gap-1.5 text-xs text-amber-500 font-bold hover:opacity-80"
                    >
                      <Plus size={14} /> 추가
                    </button>
                  </div>
                  {items.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-2">항목을 추가해주세요</p>
                  )}
                  <div className="space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-end">
                          <button type="button"
                            onClick={() => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].filter((_, j) => j !== i) }))}
                            className="text-gray-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-1">메뉴명</label>
                            <input placeholder="예: 양주 1병" className={inputCls} value={item.name}
                              onChange={e => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-1">가격 (원)</label>
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
                  {cat !== 'snacks' && <hr className="border-gray-200 mt-4" />}
                </div>
              );
            })}
          </div>

          {/* ─ 별도 요금 ─ */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">별도 요금</h2>
              <button
                type="button"
                onClick={() => setExtraFees(f => [...f, { label: '', value: '', amount: '' }])}
                className="flex items-center gap-1.5 text-xs text-amber-500 font-bold hover:opacity-80"
              >
                <Plus size={14} /> 항목 추가
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">모든 금액은 VAT 포함으로 입력하세요. 없는 항목은 0으로 입력.</p>
            <div className="space-y-3">
              {extraFees.map((fee, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <div>
                    {i === 0 && <label className="text-[10px] text-gray-500 font-bold block mb-1">항목명</label>}
                    <input placeholder="접객원 이용료" className={inputCls} value={fee.label}
                      onChange={e => setExtraFees(f => f.map((x, j) => j === i ? {...x, label: e.target.value} : x))} />
                  </div>
                  <div>
                    {i === 0 && <label className="text-[10px] text-gray-500 font-bold block mb-1">기준</label>}
                    <input placeholder="1시간 20분" className={inputCls} value={fee.value}
                      onChange={e => setExtraFees(f => f.map((x, j) => j === i ? {...x, value: e.target.value} : x))} />
                  </div>
                  <div>
                    {i === 0 && <label className="text-[10px] text-gray-500 font-bold block mb-1">금액 (원)</label>}
                    <input type="number" placeholder="200000" className={inputCls} value={fee.amount}
                      onChange={e => setExtraFees(f => f.map((x, j) => j === i ? {...x, amount: e.target.value} : x))} />
                  </div>
                  <button type="button" onClick={() => setExtraFees(f => f.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 pb-3.5">
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
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-bold py-4 rounded-[2rem] transition-all flex items-center justify-center gap-2 text-sm mb-3"
          >
            출력 예시 보기
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 disabled:text-gray-400 text-black font-black py-5 rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/10"
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
              <p className="text-zinc-500 text-sm mt-1">
                {REGIONS.find(r => r.value === basic.regionCode)?.label || '지역'}
                {basic.regionSub ? ` ${basic.regionSub}` : ''} · {CATEGORIES.find(c => c.value === basic.category)?.label || '업종'}
              </p>

              {/* 룸수 / 연령대 / 편의옵션 */}
              <div className="flex flex-wrap gap-2 mt-3">
                {promo.roomCount && (
                  <span className="bg-zinc-800 text-zinc-300 text-[11px] font-bold px-2.5 py-1 rounded-lg">룸 {promo.roomCount}개</span>
                )}
                {promo.ageRange && (
                  <span className="bg-zinc-800 text-zinc-300 text-[11px] font-bold px-2.5 py-1 rounded-lg">{promo.ageRange}</span>
                )}
                {promo.hasParking && <span className="bg-zinc-800 text-zinc-300 text-[11px] font-bold px-2.5 py-1 rounded-lg">🅿 주차</span>}
                {promo.hasValet && <span className="bg-zinc-800 text-zinc-300 text-[11px] font-bold px-2.5 py-1 rounded-lg">🚗 발렛</span>}
                {promo.hasPickup && <span className="bg-zinc-800 text-zinc-300 text-[11px] font-bold px-2.5 py-1 rounded-lg">🚐 픽업</span>}
              </div>

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
                  const fmtTime = (t: string) => {
                    const { ampm, hour, min } = timeToComps(t);
                    return ampm && hour ? `${ampm} ${hour}:${min}` : t;
                  };
                  return (
                    <div key={day} className="flex justify-between text-xs py-1 border-b border-zinc-800 last:border-0">
                      <span className="text-zinc-400 font-bold">{day}</span>
                      <span className="text-white font-medium">
                        {h.isClosed ? '휴무' : h.is24h ? '24시간' : `${fmtTime(h.open)} ~ ${fmtTime(h.close)}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 간편 메뉴 (새로운 방식) */}
              {(basic.menu_main || basic.menu_liquor || basic.menu_snack) && (
                <div className="mt-4 p-4 bg-zinc-900 rounded-2xl space-y-3">
                  {basic.menu_main && (
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">대표메뉴</p>
                      <p className="text-xs text-white">{basic.menu_main}</p>
                    </div>
                  )}
                  {basic.menu_liquor && (
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">주류</p>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap">{basic.menu_liquor}</p>
                    </div>
                  )}
                  {basic.menu_snack && (
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">안주</p>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap">{basic.menu_snack}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 메뉴 (기존 상세 방식) */}
              {(menuCategories.featured.length > 0 || menuCategories.drinks.length > 0 || menuCategories.snacks.length > 0) && (
                <div className="mt-4 p-4 bg-zinc-900 rounded-2xl space-y-3">
                  {(['featured', 'drinks', 'snacks'] as const).map(cat => {
                    const labels = { featured: '상세 대표메뉴', drinks: '상세 주류', snacks: '상세 안주' };
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

              {/* 별도요금 — 0원 포함 라벨 있는 항목 모두 표시 */}
              {extraFees.some(f => f.label) && (
                <div className="mt-4 p-4 bg-zinc-900 rounded-2xl">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">별도 요금</p>
                  {extraFees.filter(f => f.label).map((fee, i) => {
                    const amt = Number(fee.amount);
                    return (
                      <div key={i} className="flex justify-between text-xs py-1">
                        <span className="text-zinc-400">{fee.label} {fee.value && `(${fee.value})`}</span>
                        <span className={amt > 0 ? 'text-white font-bold' : 'text-zinc-500 font-medium'}>
                          {amt > 0 ? `${amt.toLocaleString()}원` : '없음 0원'}
                        </span>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-zinc-600 mt-2">모든 금액은 VAT 포함입니다.</p>
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
