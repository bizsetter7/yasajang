'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, Save, Building, Phone, MapPin, MessageSquare, Tag, Globe } from 'lucide-react';
import Link from 'next/link';

export default function BusinessEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    addressDetail: '',
    openChatUrl: '',
    category: '',
    regionCode: '',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchBusiness = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/?auth=login');
        return;
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error || !data) {
        alert('업소 정보를 불러올 수 없습니다.');
        router.push('/dashboard');
        return;
      }

      setBusiness(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        addressDetail: data.address_detail || '',
        openChatUrl: data.open_chat_url || '',
        category: data.category || '',
        regionCode: data.region_code || '',
      });
      setLoading(false);
    };

    fetchBusiness();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/businesses/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          ...formData,
        }),
      });

      if (res.ok) {
        alert('정보가 수정되었습니다. 재심사가 진행됩니다.');
        router.push('/dashboard');
      } else {
        const data = await res.json();
        alert(data.error || '수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
        <header className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 대시보드로 돌아가기
          </Link>
          <div className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-full uppercase tracking-widest">
            Edit Mode
          </div>
        </header>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight">업소 정보 수정</h1>
          <p className="text-zinc-500 font-medium leading-relaxed">
            정보를 수정하면 <span className="text-amber-500">재심사</span>가 진행되며, 승인 전까지 밤길 노출이 일시 제한될 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* 업소명 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Building size={14} /> 업소명
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-medium"
              />
            </div>

            {/* 전화번호 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Phone size={14} /> 대표 전화번호
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-medium"
              />
            </div>

            {/* 지역 및 카테고리 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} /> 지역
                </label>
                <select
                  value={formData.regionCode}
                  onChange={(e) => setFormData({ ...formData, regionCode: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-medium appearance-none"
                >
                  <option value="seoul">서울</option>
                  <option value="gyeonggi">경기</option>
                  <option value="incheon">인천</option>
                  <option value="busan">부산</option>
                  <option value="daegu">대구</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={14} /> 업종
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-medium appearance-none"
                >
                  <option value="room_salon">룸살롱</option>
                  <option value="karaoke_bar">노래방</option>
                  <option value="bar">바/나이트</option>
                  <option value="other">기타</option>
                </select>
              </div>
            </div>

            {/* 주소 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} /> 기본 주소
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">상세 주소 (층, 호수 등)</label>
              <input
                type="text"
                value={formData.addressDetail}
                onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-medium"
              />
            </div>

            {/* 오픈채팅 URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14} /> 카카오톡 오픈채팅 URL
              </label>
              <input
                type="url"
                placeholder="https://open.kakao.com/..."
                value={formData.openChatUrl}
                onChange={(e) => setFormData({ ...formData, openChatUrl: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-amber-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black py-5 rounded-[2rem] transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/10"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={20} /> 수정 사항 저장하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
