'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText,
  BadgeCheck,
  Building,
  MapPin,
  Phone,
  User,
  RefreshCw,
  ShieldOff,
  AlertCircle,
  Hash,
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
  business_reg_number?: string;
  is_verified?: boolean;
  verified_at?: string | null;
  status: string;
  audit_note?: string;
  owner_id?: string;
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

const TABS = [
  { key: 'unverified', label: '미인증' },
  { key: 'verified', label: '인증완료' },
  { key: 'all', label: '전체' },
] as const;

function formatPhone(phone?: string | null): string {
  if (!phone) return '미입력';
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function maskBizNumber(num?: string | null): string {
  if (!num) return '미등록';
  const digits = num.replace(/\D/g, '');
  if (digits.length !== 10) return num;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function BusinessVerifyPage() {
  const [tab, setTab] = useState<'unverified' | 'verified' | 'all'>('unverified');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Business | null>(null);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/business-verify?status=${tab}`);
      const json = await res.json();
      setBusinesses(json.businesses || []);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVerify = async (isVerified: boolean) => {
    if (!selected) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/business-verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: selected.id, isVerified, note }),
      });
      if (res.ok) {
        alert(isVerified ? '✅ 사업자 인증 완료!' : '인증 해제 처리 완료');
        setSelected(null);
        setNote('');
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || '처리 중 오류');
      }
    } catch {
      alert('서버 통신 오류');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = businesses.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    (REGION_LABEL[b.region_code] ?? b.region_code)?.includes(search) ||
    (b.business_reg_number ?? '').includes(search)
  );

  const docMissing = businesses.filter(b => !b.business_reg_url).length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <BadgeCheck className="text-amber-400" size={28} />
            사업자 인증 심사
          </h1>
          <p className="text-zinc-500 text-sm mt-1">사업자등록증·사업자번호를 검토하여 사업자 인증을 부여합니다.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="업소명/지역/사업자번호..."
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-amber-500 outline-none transition-all w-64"
            />
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* 안내 박스 */}
      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-3">
        <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={16} />
        <div className="text-xs text-zinc-400 leading-relaxed">
          <p className="font-bold text-blue-300 mb-1">사업자 인증과 입점 심사는 별개입니다.</p>
          <p>· <span className="text-zinc-300">사업자 인증</span>(이 페이지) — 사업자등록증·사업자번호의 진위 확인 → <code className="text-amber-400">is_verified</code> 토글</p>
          <p>· <span className="text-zinc-300">업소 입점 심사</span> — 영업허가증·운영 적합성 검토 → <code className="text-amber-400">status</code> 변경</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 items-center">
        {TABS.map(({ key, label }) => (
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
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-600">
          총 {filtered.length}건 {tab === 'unverified' && docMissing > 0 && (
            <span className="text-red-400 ml-2">· 서류 미제출 {docMissing}건</span>
          )}
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
            {search ? '검색 결과가 없습니다' : '해당 조건의 업소가 없습니다'}
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((biz) => {
            const docOk = !!biz.business_reg_url && !!biz.business_reg_number;
            return (
              <div
                key={biz.id}
                className="group p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer"
                onClick={() => { setSelected(biz); setNote(biz.audit_note || ''); }}
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-amber-500 group-hover:text-black transition-all shrink-0">
                    <Building size={22} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate flex items-center gap-2">
                      {biz.name}
                      {biz.is_verified && (
                        <BadgeCheck size={16} className="text-amber-400 shrink-0" />
                      )}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {REGION_LABEL[biz.region_code] ?? biz.region_code}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash size={11} />
                        {maskBizNumber(biz.business_reg_number)}
                      </span>
                      <span>{CATEGORY_LABEL[biz.category] ?? biz.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!docOk && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded-full">
                      서류 미비
                    </span>
                  )}
                  {biz.is_verified ? (
                    <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full uppercase">
                      인증완료
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-zinc-500 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full uppercase">
                      미인증
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-7 border-b border-zinc-900 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg">
                  <BadgeCheck size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">{selected.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selected.is_verified ? (
                      <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full uppercase">
                        인증완료
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full uppercase">
                        미인증
                      </span>
                    )}
                    <span className="text-zinc-600 text-xs">
                      {REGION_LABEL[selected.region_code] ?? selected.region_code} · {CATEGORY_LABEL[selected.category] ?? selected.category}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* 사업자 정보 */}
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">사업자 정보</h4>
                <div className="space-y-2">
                  {[
                    { icon: Hash, label: '사업자등록번호', value: maskBizNumber(selected.business_reg_number), highlight: !selected.business_reg_number },
                    { icon: User, label: '대표자(실장)', value: selected.manager_name || '미입력' },
                    { icon: Phone, label: '연락처', value: formatPhone(selected.phone) },
                    { icon: MapPin, label: '주소', value: selected.address || '미입력' },
                  ].map(({ icon: Icon, label, value, highlight }) => (
                    <div key={label} className={`flex items-center justify-between p-4 rounded-xl border ${highlight ? 'bg-red-500/5 border-red-500/20' : 'bg-zinc-900/50 border-zinc-800'}`}>
                      <span className="text-zinc-500 text-sm flex items-center gap-2"><Icon size={13} /> {label}</span>
                      <span className={`font-bold text-sm truncate max-w-[60%] text-right ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 사업자등록증 */}
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">사업자등록증 원본</h4>
                {selected.business_reg_url ? (
                  <button
                    className="w-full group p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between hover:border-amber-500/50 transition-all"
                    onClick={async () => {
                      const res = await fetch('/api/storage/signed-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: selected.business_reg_url }),
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
                  <div className="p-4 bg-red-500/5 border border-red-500/20 border-dashed rounded-2xl flex items-center gap-3">
                    <FileText size={15} className="text-red-400" />
                    <p className="text-sm text-red-400 font-bold">사업자등록증 미제출 — 인증 보류</p>
                  </div>
                )}
              </section>

              {/* 메모 */}
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">심사 메모 (선택)</h4>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="인증 사유, 거절 사유, 보류 사유 등을 기록..."
                  className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder-zinc-600 focus:border-amber-500 outline-none transition-all resize-none"
                />
              </section>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-900 flex gap-3 shrink-0">
              {selected.is_verified ? (
                <button
                  onClick={() => handleVerify(false)}
                  disabled={processing}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 font-black rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <ShieldOff size={16} />
                  {processing ? '처리 중...' : '인증 해제'}
                </button>
              ) : (
                <button
                  onClick={() => handleVerify(true)}
                  disabled={processing || !selected.business_reg_url}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <BadgeCheck size={16} />
                  {processing ? '처리 중...' : '사업자 인증 승인'}
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-bold rounded-xl transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
