'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, ToggleLeft, ToggleRight, Trash2, Sparkles, X } from 'lucide-react';

interface BusinessEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

const EVENT_TYPES = [
  { value: '이벤트', label: '이벤트', color: 'bg-amber-100 text-amber-700' },
  { value: '할인', label: '할인', color: 'bg-green-100 text-green-700' },
  { value: '신규', label: '신규', color: 'bg-blue-100 text-blue-700' },
  { value: '공지', label: '공지', color: 'bg-zinc-100 text-zinc-700' },
];

function typeColor(t: string) {
  return EVENT_TYPES.find(e => e.value === t)?.color ?? 'bg-gray-100 text-gray-600';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}

export default function EventsPage() {
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [planName, setPlanName] = useState('free');
  const [eventLimit, setEventLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('이벤트');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/events');
      const d = await r.json();
      if (d.error) { setLoading(false); return; }
      setEvents(d.events ?? []);
      setPlanName(d.planName ?? 'free');
      setEventLimit(d.eventLimit ?? 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setEventType('이벤트');
    setStartsAt(''); setEndsAt(''); setError('');
    setShowForm(false);
  };

  const handleCreate = async () => {
    setError('');
    if (!title.trim() || !startsAt) { setError('제목과 시작일은 필수입니다.'); return; }
    setSaving(true);
    const r = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, eventType, startsAt, endsAt: endsAt || null }),
    });
    const d = await r.json();
    setSaving(false);
    if (d.error) { setError(d.error); return; }
    resetForm();
    fetchEvents();
  };

  const handleToggle = async (id: string, current: boolean) => {
    setToggling(id);
    await fetch('/api/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    setToggling(null);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 이벤트를 삭제하시겠습니까?')) return;
    setDeleting(id);
    await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    fetchEvents();
  };

  const activeCount = events.filter(e => e.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Calendar size={22} className="text-amber-500" />
              이벤트 관리
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">밤길 업소 페이지에 표시되는 이벤트를 관리합니다.</p>
          </div>
          <a href="/dashboard" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">← 대시보드</a>
        </div>

        {/* 플랜 한도 바 */}
        <div className="p-4 bg-white border border-gray-200 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              이벤트 사용량 · <span className="text-amber-600">{planName}</span> 플랜
            </span>
            <span className="text-xs font-bold text-gray-700">
              {activeCount} / {eventLimit === 99 ? '무제한' : eventLimit}개
            </span>
          </div>
          {eventLimit > 0 && eventLimit < 99 && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${Math.min((activeCount / eventLimit) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* 업그레이드 안내 */}
        {eventLimit === 0 && (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-amber-700 text-sm">이벤트 기능은 베이직 플랜부터 사용 가능합니다</p>
              <p className="text-amber-600/80 text-xs mt-0.5">업그레이드 후 밤길 업소 페이지에 이벤트를 노출해보세요.</p>
              <a href="/dashboard" className="mt-2 inline-block text-xs font-black text-amber-700 underline underline-offset-2">
                플랜 업그레이드 →
              </a>
            </div>
          </div>
        )}

        {/* 신규 이벤트 등록 버튼 */}
        {eventLimit > 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={activeCount >= eventLimit}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 disabled:text-gray-400 text-black font-black rounded-2xl transition-colors text-sm"
          >
            <Plus size={16} />
            {activeCount >= eventLimit ? `한도 도달 (${eventLimit}개)` : '이벤트 추가'}
          </button>
        )}

        {/* 이벤트 등록 폼 */}
        {showForm && (
          <div className="p-5 bg-white border border-amber-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-sm">새 이벤트 등록</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* 유형 */}
            <div className="flex gap-2 flex-wrap">
              {EVENT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setEventType(t.value)}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-all border ${
                    eventType === t.value
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 제목 */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">제목 *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 오픈 기념 20% 할인 이벤트"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* 기간 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">시작일 *</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={e => setStartsAt(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">종료일 (선택)</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* 설명 */}
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1 block">상세 설명 (선택)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="이벤트 세부 내용을 입력하세요"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* 미리보기 */}
            {title && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 mb-2">미리보기</p>
                <div className="flex items-start gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${typeColor(eventType)}`}>
                    {eventType}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{title}</p>
                    {startsAt && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {fmtDate(startsAt)}{endsAt ? ` ~ ${fmtDate(endsAt)}` : ' ~'}
                      </p>
                    )}
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
                {saving ? '등록 중...' : '이벤트 등록'}
              </button>
            </div>
          </div>
        )}

        {/* 이벤트 목록 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">로딩 중...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Calendar size={32} className="mx-auto mb-3 text-gray-200" />
            <p>등록된 이벤트가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map(ev => (
              <div
                key={ev.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border ${
                  ev.is_active ? 'border-amber-100 bg-white' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${typeColor(ev.event_type)}`}>
                      {ev.event_type}
                    </span>
                    <span className="text-sm font-black text-gray-800 truncate">{ev.title}</span>
                    {!ev.is_active && <span className="text-[10px] text-gray-400 font-bold">비활성</span>}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {fmtDate(ev.starts_at)}{ev.ends_at ? ` ~ ${fmtDate(ev.ends_at)}` : ' ~'}
                  </p>
                  {ev.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ev.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(ev.id, ev.is_active)}
                    disabled={toggling === ev.id}
                    className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
                      ev.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={ev.is_active ? '비활성화' : '활성화'}
                  >
                    {ev.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    disabled={deleting === ev.id}
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
