'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  MapPin,
  Clock,
  Building,
  Phone,
  ShieldCheck,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  category: string;
  region_code: string;
  address?: string;
  created_at: string;
  manager_name?: string;
  phone: string;
  business_reg_url?: string;
  permit_path?: string;
  status: string;
  audit_note?: string;
  audited_at?: string;
  owner_id?: string;
  subscription?: { plan: string; status: string; trial_ends_at: string } | null;
}

const REGION_LABEL: Record<string, string> = {
  seoul: '서울', gyeonggi: '경기', incheon: '인천', busan: '부산',
  daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
  sejong: '세종', gangwon: '강원', chungbuk: '충북', chungnam: '충남',
  jeonbuk: '전북', jeonnam: '전남', gyeongbuk: '경북', gyeongnam: '경남', jeju: '제주',
};

/** "경기 평택시 특구로5번길 9" → "평택시" */
function extractSubRegion(address?: string | null): string {
  if (!address) return '';
  const parts = address.trim().split(/\s+/);
  return parts.length >= 2 ? parts[1] : '';
}

/** "01038384335" → "010-3838-4335" */
function formatPhone(phone?: string | null): string {
  if (!phone) return '미입력';
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}
const CATEGORY_LABEL: Record<string, string> = {
  room_salon: '룸살롱', karaoke_bar: '노래주점', bar: '바(Bar)', other: '기타',
};

const STATUS_TABS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '심사 대기' },
  { key: 'active', label: '활성' },
  { key: 'rejected', label: '거절됨' },
] as const;

const STATUS_BADGE: Record<string, string> = {
  active:   'text-green-400 bg-green-400/10 border border-green-400/20',
  approved: 'text-green-400 bg-green-400/10 border border-green-400/20', // alias
  pending:  'text-amber-400 bg-amber-400/10 border border-amber-400/20',
  rejected: 'text-red-400 bg-red-400/10 border border-red-400/20',
  inactive: 'text-zinc-500 bg-zinc-800',
};
const STATUS_KR: Record<string, string> = {
  active: '활성', approved: '활성', pending: '대기', rejected: '거절', inactive: '비활성',
};

export default function RegisterAuditPage() {
  const [tab, setTab] = useState<'all' | 'pending' | 'active' | 'rejected'>('pending');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedShop, setSelectedShop] = useState<Business | null>(null);
  const [auditMessage, setAuditMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/businesses?status=${tab}`);
      const json = await res.json();
      setBusinesses(json.businesses || []);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const handleAudit = async (status: 'active' | 'rejected') => {
    if (!selectedShop) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/business-audit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: selectedShop.id, status, auditNote: auditMessage }),
      });
      if (res.ok) {
        alert(`${status === 'active' ? '승인' : '거절'} 처리 완료!`);
        setSelectedShop(null);
        setAuditMessage('');
        fetchBusinesses();
      } else {
        const d = await res.json();
        alert(d.error || '처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버 통신 오류');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (biz: Business) => {
    if (!confirm(`"${biz.name}" 업소를 삭제하시겠습니까?\n연관 구독, 연락 이력도 함께 삭제됩니다.`)) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: biz.id }),
      });
      if (res.ok) {
        alert('삭제 완료');
        if (selectedShop?.id === biz.id) setSelectedShop(null);
        fetchBusinesses();
      } else {
        const d = await res.json();
        alert(d.error || '삭제 실패');
      }
    } catch {
      alert('서버 통신 오류');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = businesses.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    (REGION_LABEL[b.region_code] ?? b.region_code)?.includes(search)
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">업소 입점 심사</h1>
          <p className="text-zinc-500 text-sm mt-1">서류 검토, 승인/거절, 업소 삭제를 처리합니다.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="업소명 / 지역 검색..."
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-amber-500 outline-none transition-all w-52"
            />
          </div>
          <button
            onClick={fetchBusinesses}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === key
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            {label}
            {key === 'pending' && businesses.filter(b => b.status === 'pending').length > 0 && tab !== 'pending' && (
              <span className="ml-2 text-[10px] bg-amber-500 text-black rounded-full px-1.5 py-0.5 font-black">
                {businesses.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-600 self-center">
          총 {filtered.length}개 업소
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[2rem]">
          <CheckCircle2 className="mx-auto mb-4 text-zinc-700" size={48} />
          <h3 className="text-xl font-bold text-zinc-500">
            {search ? '검색 결과가 없습니다' : '해당 상태의 업소가 없습니다'}
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((biz) => (
            <div
              key={biz.id}
              className="group p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:bg-zinc-900 hover:border-zinc-700 transition-all"
            >
              <div
                className="flex items-center gap-5 flex-1 cursor-pointer"
                onClick={() => { setSelectedShop(biz); setAuditMessage(biz.audit_note || ''); }}
              >
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-amber-500 group-hover:text-black transition-all shrink-0">
                  <Building size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{biz.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {REGION_LABEL[biz.region_code] ?? biz.region_code}
                      {extractSubRegion(biz.address) && ` ${extractSubRegion(biz.address)}`}
                    </span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {new Date(biz.created_at).toLocaleDateString('ko-KR')}</span>
                    <span>{CATEGORY_LABEL[biz.category] ?? biz.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {biz.subscription && (
                  <span className="text-[10px] text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1 rounded-full font-bold uppercase">
                    {biz.subscription.plan}
                  </span>
                )}
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${STATUS_BADGE[biz.status] || ''}`}>
                  {STATUS_KR[biz.status] ?? biz.status}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(biz); }}
                  disabled={processing}
                  title="업소 삭제"
                  className="p-2 text-zinc-700 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-7 border-b border-zinc-900 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">{selectedShop.name}</h2>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${STATUS_BADGE[selectedShop.status] || ''}`}>
                      {STATUS_KR[selectedShop.status] ?? selectedShop.status}
                    </span>
                    <span className="text-zinc-600 text-xs">
                      {REGION_LABEL[selectedShop.region_code] ?? selectedShop.region_code}
                      {extractSubRegion(selectedShop.address) && ` ${extractSubRegion(selectedShop.address)}`}
                      {' · '}{CATEGORY_LABEL[selectedShop.category] ?? selectedShop.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedShop)}
                  disabled={processing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 text-zinc-500 hover:text-red-400 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                >
                  <Trash2 size={14} /> 삭제
                </button>
                <button
                  onClick={() => setSelectedShop(null)}
                  className="w-9 h-9 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left col */}
                <div className="space-y-7">
                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">기본 정보</h4>
                    <div className="space-y-2">
                      {[
                        { icon: User, label: '대표자(실장)명', value: selectedShop.manager_name || '미입력' },
                        { icon: Phone, label: '연락처', value: formatPhone(selectedShop.phone) },
                        { icon: MapPin, label: '주소', value: selectedShop.address || '미입력' },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                          <span className="text-zinc-500 text-sm flex items-center gap-2"><Icon size={13} /> {label}</span>
                          <span className="text-white font-bold text-sm truncate max-w-[60%] text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">인증 서류</h4>
                    <div className="space-y-2">
                      {/* 사업자등록증 */}
                      {selectedShop.business_reg_url ? (
                        <button
                          className="w-full group p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:border-amber-500/50 transition-all"
                          onClick={async () => {
                            const res = await fetch('/api/storage/signed-url', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ path: selectedShop.business_reg_url }),
                            });
                            const { url, error } = await res.json();
                            if (error) { alert('조회 실패: ' + error); return; }
                            window.open(url, '_blank');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 group-hover:text-amber-500">
                              <FileText size={16} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-white">사업자등록증</p>
                              <p className="text-[10px] text-zinc-600">클릭하여 원본 보기</p>
                            </div>
                          </div>
                          <ExternalLink size={13} className="text-zinc-700 group-hover:text-white" />
                        </button>
                      ) : (
                        <div className="p-4 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl flex items-center gap-3">
                          <FileText size={15} className="text-zinc-700" />
                          <p className="text-sm text-zinc-600">사업자등록증 — 미제출</p>
                        </div>
                      )}

                      {/* 영업허가증 */}
                      {selectedShop.permit_path ? (
                        <button
                          className="w-full group p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:border-emerald-500/50 transition-all"
                          onClick={async () => {
                            const res = await fetch('/api/storage/signed-url', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ path: selectedShop.permit_path }),
                            });
                            const { url, error } = await res.json();
                            if (error) { alert('조회 실패: ' + error); return; }
                            window.open(url, '_blank');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 group-hover:text-emerald-400">
                              <FileText size={16} />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-white">영업허가증</p>
                              <p className="text-[10px] text-zinc-600">클릭하여 원본 보기</p>
                            </div>
                          </div>
                          <ExternalLink size={13} className="text-zinc-700 group-hover:text-white" />
                        </button>
                      ) : (
                        <div className="p-4 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl flex items-center gap-3">
                          <FileText size={15} className="text-zinc-700" />
                          <p className="text-sm text-zinc-600">영업허가증 — 미제출</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Right col */}
                <div className="space-y-7">
                  <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">심사 의견</h4>
                    <textarea
                      value={auditMessage}
                      onChange={e => setAuditMessage(e.target.value)}
                      placeholder="거절 사유 또는 안내사항 (거절 시 사용자에게 전달)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-sm text-zinc-300 focus:border-amber-500/50 focus:outline-none resize-none h-32 mb-4"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAudit('rejected')}
                        disabled={processing}
                        className="py-3.5 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 text-zinc-500 hover:text-red-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                      >
                        <XCircle size={16} /> 신청 거절
                      </button>
                      <button
                        onClick={() => handleAudit('active')}
                        disabled={processing}
                        className="py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-40"
                      >
                        <CheckCircle2 size={16} /> 최종 승인
                      </button>
                    </div>
                  </section>

                  {/* Timeline */}
                  <div className="p-5 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-500 mb-3">
                      <Calendar size={13} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Timeline</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                        <p className="text-[11px] text-zinc-500">
                          신청 접수 · <span className="text-zinc-600">{new Date(selectedShop.created_at).toLocaleString('ko-KR')}</span>
                        </p>
                      </div>
                      {selectedShop.audited_at && (
                        <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <p className="text-[11px] text-zinc-500">
                            심사 완료 · <span className="text-zinc-600">{new Date(selectedShop.audited_at).toLocaleString('ko-KR')}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subscription info */}
                  {selectedShop.subscription && (
                    <div className="p-5 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">구독 정보</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300 font-bold capitalize">{selectedShop.subscription.plan} 플랜</span>
                        <span className="text-xs text-zinc-500">{selectedShop.subscription.status}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
