'use client';

import { useState, useEffect } from 'react';
import { Users, Building2, Mail, Search, RefreshCw, Shield, Ban, Trash2 } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  provider: string;
  created_at: string;
  last_sign_in_at?: string;
  username?: string;
  role: string;
  business?: { name: string; status: string } | null;
  banned_until?: string | null;
}

const PROVIDER_BADGE: Record<string, string> = {
  google: 'text-blue-400 bg-blue-400/10 border border-blue-400/20',
  kakao: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
  email: 'text-zinc-400 bg-zinc-800 border border-zinc-700',
};

const BIZ_STATUS_BADGE: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10',
  pending: 'text-amber-400 bg-amber-400/10',
  rejected: 'text-red-400 bg-red-400/10',
};
const BIZ_STATUS_KR: Record<string, string> = {
  active: '활성', pending: '대기', rejected: '거절',
};

export default function SettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/members');
      const json = await res.json();
      setMembers(json.members || []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'ban' | 'unban' | 'delete', email: string) => {
    const labels = { ban: '정지', unban: '정지 해제', delete: '탈퇴 처리' };
    if (!window.confirm(`${email} 회원을 ${labels[action]}하시겠습니까?${action === 'delete' ? '\n\n⚠️ auth 계정만 삭제됩니다. 업소 데이터는 별도로 정리하세요.' : ''}`)) return;

    setActionLoading(userId + action);
    if (action === 'delete') {
      await fetch('/api/admin/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } else {
      await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
    }
    setActionLoading(null);
    await fetchMembers();
  };

  useEffect(() => { fetchMembers(); }, []);

  const filtered = members.filter(m =>
    (m.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (m.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (m.business?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const bizCount = members.filter(m => m.business).length;
  const activeCount = members.filter(m => m.business?.status === 'active').length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap gap-4 justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">회원 관리</h1>
          <p className="text-zinc-500 text-sm mt-1">가입된 전체 회원 목록과 업소 연결 현황을 확인합니다.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="이메일 / 업소명 검색..."
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:border-amber-500 outline-none transition-all w-52"
            />
          </div>
          <button
            onClick={fetchMembers}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '전체 회원', value: members.length, icon: Users, color: 'text-zinc-400' },
          { label: '업소 보유', value: bizCount, icon: Building2, color: 'text-amber-400' },
          { label: '활성 업소', value: activeCount, icon: Shield, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
              <Icon size={15} className={color} />
            </div>
            <div className="text-3xl font-black text-white">{loading ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* Member Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[2rem]">
          <Users className="mx-auto mb-4 text-zinc-700" size={48} />
          <h3 className="text-xl font-bold text-zinc-500">
            {search ? '검색 결과가 없습니다' : '가입 회원이 없습니다'}
          </h3>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_120px_160px_120px_auto] gap-3 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>회원 정보</span>
            <span>가입 경로</span>
            <span>역할</span>
            <span>연결 업소</span>
            <span>가입일</span>
            <span>액션</span>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_100px_120px_160px_120px_auto] gap-3 px-5 py-4 items-center hover:bg-zinc-900/40 transition-colors"
              >
                {/* 회원 정보 */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-zinc-800 rounded-full flex items-center justify-center shrink-0">
                      <Mail size={12} className="text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{m.email}</p>
                      {m.username && <p className="text-[11px] text-zinc-600 truncate">@{m.username}</p>}
                    </div>
                  </div>
                </div>

                {/* 가입 경로 */}
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PROVIDER_BADGE[m.provider] || PROVIDER_BADGE.email}`}>
                    {m.provider}
                  </span>
                </div>

                {/* 역할 */}
                <div>
                  <span className="text-xs text-zinc-400 font-medium capitalize">{m.role}</span>
                </div>

                {/* 연결 업소 */}
                <div>
                  {m.business ? (
                    <div>
                      <p className="text-xs font-bold text-white truncate">{m.business.name}</p>
                      <span className={`text-[10px] font-bold ${BIZ_STATUS_BADGE[m.business.status] || ''}`}>
                        {BIZ_STATUS_KR[m.business.status] ?? m.business.status}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-700">업소 없음</span>
                  )}
                </div>

                {/* 가입일 */}
                <div className="text-[11px] text-zinc-600">
                  {new Date(m.created_at).toLocaleDateString('ko-KR')}
                </div>

                {/* 액션 */}
                <div className="flex gap-1.5">
                  {m.banned_until ? (
                    <button
                      onClick={() => handleAction(m.id, 'unban', m.email)}
                      disabled={actionLoading === m.id + 'unban'}
                      title="정지 해제"
                      className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-all disabled:opacity-40"
                    >
                      <Shield size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(m.id, 'ban', m.email)}
                      disabled={actionLoading === m.id + 'ban'}
                      title="계정 정지"
                      className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-all disabled:opacity-40"
                    >
                      <Ban size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(m.id, 'delete', m.email)}
                    disabled={actionLoading === m.id + 'delete'}
                    title="탈퇴 처리"
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
