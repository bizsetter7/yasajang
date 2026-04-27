'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  FileText,
  Calendar,
  User,
  MapPin,
  Clock,
  Building,
  Hash,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { useCallback } from 'react';

interface Business {
  id: string;
  name: string;
  category: string;
  region_code: string;
  created_at: string;
  representative?: string;
  business_number?: string;
  phone: string;
  license_path: string;
  status: string;
  address_detail?: string;
}

const REGION_LABEL: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천', busan: '부산',
  daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  sejong: '세종', gangwon: '강원', chungbuk: '충북', chungnam: '충남',
  jeonbuk: '전북', jeonnam: '전남', gyeongbuk: '경북', gyeongnam: '경남', jeju: '제주',
};
const CATEGORY_LABEL: Record<string, string> = {
  room_salon: '룸살롱', karaoke_bar: '노래주점', bar: '바(Bar)', other: '기타',
};

export default function RegisterAuditPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<Business | null>(null);
  const [auditMessage, setAuditMessage] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchBusinesses = useCallback(async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error) setBusinesses((data as Business[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinesses();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchBusinesses]);

  const handleAudit = async (status: 'active' | 'rejected') => {
    if (!selectedShop) return;

    try {
      const res = await fetch('/api/admin/business-audit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedShop.id,
          status,
          auditNote: auditMessage,
        }),
      });

      if (res.ok) {
        alert(`성공적으로 ${status === 'active' ? '승인' : '거절'} 처리되었습니다.`);
        setSelectedShop(null);
        setAuditMessage('');
        fetchBusinesses();
      } else {
        const data = await res.json();
        alert(data.error || '처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">업소 입점 심사</h1>
          <p className="text-zinc-500 text-sm mt-1">새로 신청된 비즈니스 파트너의 서류 및 정보를 검토합니다.</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="업소명 검색..." 
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-amber-500 transition-all outline-none"
            />
          </div>
          <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[2rem]">
          <CheckCircle2 className="mx-auto mb-4 text-zinc-700" size={48} />
          <h3 className="text-xl font-bold text-zinc-500">대기 중인 심사가 없습니다</h3>
          <p className="text-zinc-600 text-sm mt-2">모든 파트너 신청이 처리되었습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {businesses.map((shop) => (
            <div 
              key={shop.id}
              className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer"
              onClick={() => setSelectedShop(shop)}
            >
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-amber-500 group-hover:text-black transition-all">
                  <Building size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{shop.name}</h3>
                  <div className="flex items-center space-x-4 text-xs text-zinc-500">
                    <span className="flex items-center"><MapPin size={12} className="mr-1" /> {REGION_LABEL[shop.region_code] ?? shop.region_code}</span>
                    <span className="flex items-center"><Clock size={12} className="mr-1" /> {new Date(shop.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-xs font-bold text-zinc-400 mb-1">{CATEGORY_LABEL[shop.category] ?? shop.category}</div>
                  <div className="text-[10px] text-zinc-600 font-medium">신청번호: P5R-{shop.id.toString().substring(0, 8)}</div>
                </div>
                <div className="bg-amber-500/10 text-amber-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                  Pending
                </div>
                <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up">
            <div className="p-8 border-b border-zinc-900 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{selectedShop.name}</h2>
                  <p className="text-zinc-500 text-xs">심사 완료 후 자동으로 파트너 레벨이 할당됩니다.</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedShop(null)}
                className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">기본 비즈니스 정보</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 text-sm flex items-center"><User size={14} className="mr-2" /> 대표자명</span>
                        <span className="text-white font-bold">{selectedShop.representative || '미입력'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 text-sm flex items-center"><Hash size={14} className="mr-2" /> 사업자번호</span>
                        <span className="text-white font-bold">{selectedShop.business_number || '미입력'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <span className="text-zinc-500 text-sm flex items-center"><Phone size={14} className="mr-2" /> 연락처</span>
                        <span className="text-white font-bold">{selectedShop.phone}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">인증 서류 검토</h4>
                    <div 
                      className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:border-amber-500/50 transition-all cursor-pointer"
                      onClick={async () => {
                        const res = await fetch('/api/storage/signed-url', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ path: selectedShop.license_path }),
                        });
                        const { url, error } = await res.json();
                        if (error) { alert('서류 조회 실패: ' + error); return; }
                        window.open(url, '_blank');
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 group-hover:text-amber-500">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">사업자등록증.pdf</p>
                          <p className="text-[10px] text-zinc-600">클릭하여 원본 보기</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-zinc-700 group-hover:text-white" />
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                   <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-4">심사 의견 및 조치</h4>
                    <textarea 
                      value={auditMessage}
                      onChange={(e) => setAuditMessage(e.target.value)}
                      placeholder="거절 사유 또는 안내사항을 입력하세요 (거절 시 사용자에게 전달됩니다)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-300 focus:border-amber-500/50 focus:outline-none transition-all resize-none mb-6 h-32"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                         onClick={() => handleAudit('rejected')}
                         className="py-4 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 text-zinc-500 hover:text-red-500 font-bold rounded-2xl transition-all flex items-center justify-center"
                      >
                        <XCircle size={18} className="mr-2" /> 신청 거절
                      </button>
                      <button 
                        onClick={() => handleAudit('active')}
                        className="py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center"
                      >
                        <CheckCircle2 size={18} className="mr-2" /> 최종 승인
                      </button>
                    </div>
                  </section>

                  <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                    <div className="flex items-center space-x-3 text-zinc-500 mb-3">
                      <Calendar size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Timeline</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="w-[2px] h-full bg-zinc-800 absolute" />
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-1 mr-4 shrink-0" />
                        <div className="text-[10px]">
                          <span className="text-zinc-400">신청 접수됨</span> · <span className="text-zinc-600">{new Date(selectedShop.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
