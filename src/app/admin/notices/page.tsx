'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Pin, Eye, EyeOff, X } from 'lucide-react';

type Notice = {
  id: string;
  badge: string;
  title: string;
  content: string;
  platforms: string[];
  is_pinned: boolean;
  is_published: boolean;
  published_at: string;
  expires_at: string | null;
  created_at: string;
};

const ALL_PLATFORMS = ['yasajang', 'bamgil', 'cocoalba', 'waiterzone', 'sunsuzone'];
const PLATFORM_LABELS: Record<string, string> = {
  yasajang: '야사장', bamgil: '밤길', cocoalba: '코코알바',
  waiterzone: '웨이터존', sunsuzone: '선수존',
};
const BADGE_OPTIONS = ['공지', '업데이트', '점검', '이벤트', '중요'];

const EMPTY_FORM = {
  badge: '공지',
  title: '',
  content: '',
  platforms: ALL_PLATFORMS,
  is_pinned: false,
  is_published: true,
  expires_at: '',
};

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/notices');
    const json = await res.json();
    setNotices(json.notices || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (n: Notice) => {
    setEditing(n);
    setForm({
      badge: n.badge || '공지',
      title: n.title,
      content: n.content,
      platforms: n.platforms || ALL_PLATFORMS,
      is_pinned: n.is_pinned,
      is_published: n.is_published,
      expires_at: n.expires_at ? n.expires_at.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      ...(editing ? { id: editing.id } : {}),
    };
    const res = await fetch('/api/admin/notices', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await load();
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await fetch('/api/admin/notices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  const togglePublish = async (n: Notice) => {
    await fetch('/api/admin/notices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: n.id, is_published: !n.is_published }),
    });
    await load();
  };

  const togglePlatform = (p: string) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p],
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">공지사항 관리</h1>
          <p className="text-zinc-500 text-sm mt-1">전체 플랫폼 공지를 작성하고 관리합니다.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> 공지 작성
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-white">{editing ? '공지 수정' : '공지 작성'}</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="w-32">
                  <label className="text-xs font-bold text-zinc-400 mb-1 block">배지</label>
                  <select
                    value={form.badge}
                    onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-amber-500"
                  >
                    {BADGE_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={form.is_pinned}
                    onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  <span className="text-xs text-zinc-400 font-bold">고정</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  <span className="text-xs text-zinc-400 font-bold">발행</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1 block">제목 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                  placeholder="공지 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1 block">내용 *</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={5}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 outline-none resize-none"
                  placeholder="공지 내용을 입력하세요"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 mb-2 block">게시 플랫폼</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORMS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                        form.platforms.includes(p)
                          ? 'bg-amber-500 text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {PLATFORM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1 block">만료일 (선택)</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-zinc-800 text-zinc-400 font-bold rounded-xl text-sm hover:bg-zinc-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black rounded-xl text-sm transition-colors"
              >
                {saving ? '저장 중...' : editing ? '수정하기' : '작성하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice list */}
      {loading ? (
        <div className="text-zinc-500 text-sm">불러오는 중...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">등록된 공지가 없습니다. 공지를 작성해보세요.</div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div
              key={n.id}
              className={`bg-zinc-900/50 border rounded-2xl p-5 ${n.is_pinned ? 'border-amber-500/30' : 'border-zinc-800'}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {n.is_pinned && <Pin size={11} className="text-amber-500 shrink-0" />}
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                      {n.badge || '공지'}
                    </span>
                    {!n.is_published && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">미발행</span>
                    )}
                    <span className="text-[10px] text-zinc-600 ml-auto shrink-0">
                      {new Date(n.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm font-black text-white mb-1">{n.title}</p>
                  <p className="text-xs text-zinc-500 line-clamp-2">{n.content}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {(n.platforms || []).map(p => (
                      <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                        {PLATFORM_LABELS[p] || p}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePublish(n)}
                    title={n.is_published ? '발행 취소' : '발행'}
                    className="p-2 text-zinc-500 hover:text-amber-400 transition-colors"
                  >
                    {n.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => openEdit(n)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(n.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
