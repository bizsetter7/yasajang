'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, ToggleLeft, ToggleRight, Trash2, Sparkles, X, Pin } from 'lucide-react';

interface BusinessNotice {
  id: string;
  title: string;
  content: string | null;
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<BusinessNotice[]>([]);
  const [planName, setPlanName] = useState('free');
  const [noticeLimit, setNoticeLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/notices');
      const d = await r.json();
      if (d.error) { setLoading(false); return; }
      setNotices(d.notices ?? []);
      setPlanName(d.planName ?? 'free');
      setNoticeLimit(d.noticeLimit ?? 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, []);

  const resetForm = () => {
    setTitle(''); setContent(''); setIsPinned(false); setError('');
    setShowForm(false);
  };

  const handleCreate = async () => {
    setError('');
    if (!title.trim()) { setError('제목은 필수입니다.'); return; }
    setSaving(true);
    const r = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, isPinned }),
    });
    const d = await r.json();
    setSaving(false);
    if (d.error) { setError(d.error); return; }
    resetForm();
    fetchNotices();
  };

  const handleToggle = async (id: string, current: boolean) => {
    setToggling(id);
    await fetch('/api/notices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    setToggling(null);
    fetchNotices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 공지를 삭제하시겠습니까?')) return;
    setDeleting(id);
    await fetch('/api/notices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    fetchNotices();
  };

  const activeCount = notices.filter(n => n.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Megaphone size={22} className="text-amber-500" />
              공지 관리
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">밤길 업소 페이지에 표시되는 공지를 관리합니다.</p>
          </div>
          <a href="/dashboard" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">← 대시보드</a>
        </div>

        {/* 플랜 한도 바 */}
        <div className="p-4 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              공지 사용량 · <span className="text-amber-600">{planName}</span> 플랜
            </span>
            <span className="text-xs font-bold text-gray-700">
              {activeCount} / {noticeLimit}개
            </span>
          </div>
          {noticeLimit > 0 && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min((activeCount / noticeLimit) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* 업그레이드 안내 */}
        {noticeLimit === 0 && (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-700 text-sm">공지 기능은 베이직 플랜부터 사용 가능합니다</p>
              <p className="text-amber-600/80 text-xs mt-0.5">업그레이드 후 밤길 업소 페이지에 공지를 노출해보세요.</p>
              <a href="/dashboard" className="mt-2 inline-block text-xs font-black text-amber-700 underline underline-offset-2">
                플랜 업그레이드 →
              </a>
            </div>
          </div>
        )}

        {/* 신규 공지 등록 버튼 */}
        {noticeLimit > 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={activeCount >= noticeLimit}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 disabled:text-gray-400 text-black font-black rounded-2xl transition-colors text-sm"
          >
            <Plus size={16} />
            {activeCount >= noticeLimit ? `한도 도달 (${noticeLimit}개)` : '공지 추가'}
          </button>
        )}

        {/* 공지 등록 폼 */}
        {showForm && (
          <div className="p-5 bg-white border border-amber-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-sm">새 공지 등록</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* 제목 */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">제목 *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 영업시간 변경 안내"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">내용 (선택)</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={3}
                placeholder="공지 세부 내용을 입력하세요"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* 상단 고정 */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                <Pin size={12} /> 상단 고정
              </span>
            </label>

            {/* 미리보기 */}
            {title && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 mb-2">미리보기</p>
                <div className="flex items-start gap-2">
                  {isPinned && <Pin size={11} className="text-amber-500 shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{title}</p>
                    {content && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{content}</p>}
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={resetForm}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black rounded-xl text-sm transition-colors"
              >
                {saving ? '등록 중...' : '공지 등록'}
              </button>
            </div>
          </div>
        )}

        {/* 공지 목록 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">로딩 중...</div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Megaphone size={32} className="mx-auto mb-3 text-gray-200" />
            <p>등록된 공지가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notices.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border ${
                  n.is_active ? 'border-amber-100 bg-white' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.is_pinned && <Pin size={12} className="text-amber-500 shrink-0" />}
                    <span className="text-sm font-black text-gray-800 truncate">{n.title}</span>
                    {!n.is_active && <span className="text-[10px] text-gray-400 font-bold">비활성</span>}
                  </div>
                  {n.content && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{n.content}</p>
                  )}
                  <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(n.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(n.id, n.is_active)}
                    disabled={toggling === n.id}
                    className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
                      n.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={n.is_active ? '비활성화' : '활성화'}
                  >
                    {n.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    disabled={deleting === n.id}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition disabled:opacity-40"
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
