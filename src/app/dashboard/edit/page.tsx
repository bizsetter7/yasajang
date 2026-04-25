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
    businessHours: '', managerName: '', managerPhone: '',
    roomCount: '', ageRange: '',
    hasParking: false, hasValet: false, hasPickup: false,
    description: '', openedAt: '', floorArea: '',
    coverImageUrl: '',
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [extraFees, setExtraFees] = useState<ExtraFee[]>(DEFAULT_EXTRA_FEES);

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
        businessHours: data.business_hours || '', managerName: data.manager_name || '',
        managerPhone: data.manager_phone || '', roomCount: data.room_count?.toString() || '',
        ageRange: data.age_range || '', hasParking: data.has_parking || false,
        hasValet: data.has_valet || false, hasPickup: data.has_pickup || false,
        description: data.description || '', openedAt: data.opened_at || '',
        floorArea: data.floor_area || '', coverImageUrl: data.cover_image_url || '',
      });
      if (data.menu_items?.length) {
        setMenuItems(data.menu_items.map((m: any) => ({
          name: m.name, price: m.price?.toString() || '', note: m.note || '',
        })));
      }
      if (data.extra_fees?.length) {
        setExtraFees(data.extra_fees.map((f: any) => ({
          label: f.label, value: f.value || '', amount: f.amount?.toString() || '',
        })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

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
          menuItems: menuItems.map(m => ({
            name: m.name, price: Number(m.price) || 0, note: m.note,
          })),
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
              <label className={labelCls}><Clock size={13} /> 영업시간</label>
              <input placeholder="예: 오후 6시 ~ 다음날 새벽 4시" className={inputCls} value={promo.businessHours} onChange={e => setPromo({...promo, businessHours: e.target.value})} />
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

          {/* ─ 대표 메뉴 ─ */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">대표 메뉴</h2>
              <button
                type="button"
                onClick={() => setMenuItems(m => [...m, { name: '', price: '', note: '' }])}
                className="flex items-center gap-1.5 text-xs text-amber-500 font-bold hover:opacity-80"
              >
                <Plus size={14} /> 메뉴 추가
              </button>
            </div>
            {menuItems.length === 0 && (
              <p className="text-zinc-600 text-sm text-center py-4">메뉴를 추가해주세요</p>
            )}
            <div className="space-y-3">
              {menuItems.map((item, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-500">메뉴 {i + 1}</span>
                    <button type="button" onClick={() => setMenuItems(m => m.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-600 font-bold block mb-1">메뉴명</label>
                      <input placeholder="맥주 무한 리필" className={inputCls} value={item.name}
                        onChange={e => setMenuItems(m => m.map((x, j) => j === i ? {...x, name: e.target.value} : x))} />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-600 font-bold block mb-1">가격 (원)</label>
                      <input type="number" placeholder="140000" className={inputCls} value={item.price}
                        onChange={e => setMenuItems(m => m.map((x, j) => j === i ? {...x, price: e.target.value} : x))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-600 font-bold block mb-1">설명 (선택)</label>
                    <input placeholder="1인: 140,000원 · 2인: 220,000원 - 봉사료 포함" className={inputCls} value={item.note}
                      onChange={e => setMenuItems(m => m.map((x, j) => j === i ? {...x, note: e.target.value} : x))} />
                  </div>
                </div>
              ))}
            </div>
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
            type="submit"
            disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black py-5 rounded-[2rem] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/10"
          >
            {saving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Save size={20} /> 저장하기</>}
          </button>
        </form>
      </div>
    </div>
  );
}
