'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, ArrowLeft, X, AlertCircle, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

type Coupon = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_visit_count: number;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
};

const PLAN_LABEL: Record<string, string> = {
  free: '무료', basic: '베이직', standard: '스탠다드',
  special: '스페셜', deluxe: '디럭스', premium: '프리미엄',
};

const EMPTY_FORM = {
  title: '',
  description: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '',
  maxUses: '',
  minVisitCount: '0',
  validUntil: '',
};

function fmtDiscount(c: Coupon) {
  return c.discount_type === 'percent'
    ? `${c.discount_value}% 할인`
    : `${c.discount_value.toLocaleString()}원 할인`;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [planName, setPlanName] = useState('basic');
  const [couponLimit, setCouponLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/coupons');
    if (res.ok) {
      const json = await res.json();
      setCoupons(json.coupons ?? []);
      setPlanName(json.planName ?? 'basic');
      setCouponLimit(json.couponLimit ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = coupons.filter(c => c.is_active).length;
  const canCreate = couponLimit > 0 && activeCount < couponLimit;

  const handleCreate = async () => {
    if (!form.title.trim() || !form.discountValue) {
      setError('제목과 할인값은 필수입니다.');
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        minVisitCount: Number(form.minVisitCount) || 0,
        validUntil: form.validUntil || null,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? '오류가 발생했습니다.'); return; }
    setShowForm(false);
    setForm(EMPTY_FORM);
    await load();
  };

  const handleToggle = async (c: Coupon) => {
    setToggling(c.id);
    await fetch('/api/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
    });
    setToggling(null);
    await load();
  };

  const handleDelete = async (c: Coupon) => {
    if (c.used_count > 0) {
      alert('이미 사용된 쿠폰은 삭제할 수 없습니다. 비활성화 처리해주세요.');
      return;
    }
    if (!confirm('쿠폰을 삭제하시겠습니까?')) return;
    setDeleting(c.id);
    const res = await fetch('/api/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id }),
    });
    const json = await res.json();
    setDeleting(null);
    if (!res.ok) { alert(json.error ?? '삭제 실패'); return; }
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">쿠폰 관리</h1>
            <p className="text-gray-500 text-sm">밤길에 표시될 쿠폰을 발급하고 관리합니다.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Tag size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">
                  현재 플랜: <span className="text-amber-600">{PLAN_LABEL[planName] ?? planName}</span>
                </p>
                {couponLimit === 0 ? (
                  <p className="text-xs text-red-500 font-medium mt-0.5">이 플랜에서는 쿠폰 발급이 불가합니다.</p>
                ) : couponLimit >= 99 ? (
                  <p className="text-xs text-green-600 font-medium mt-0.5">쿠폰 무제한 발급 가능</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">
                    활성 쿠폰 <span className="font-black text-gray-800">{activeCount}</span> / {couponLimit}개 사용 중
                  </p>
                )}
              </div>
            </div>
            {couponLimit === 0 ? (
              <Link href="/dashboard" className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black text-xs font-black rounded-xl hover:bg-amber-400 transition-colors">
                <Sparkles size={13} /> 플랜 업그레이드
              </Link>
            ) : !canCreate ? (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl">
                <Lock size={12} /> 한도 초과
              </div>
            ) : (
              <button
                onClick={() => { setShowForm(true); setError(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-black rounded-xl transition-colors"
              >
                <Plus size={15} /> 쿠폰 발급
              </button>
            )}
          </div>
          {couponLimit > 0 && couponLimit < 99 && (
            <div className="mt-4">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.min((activeCount / couponLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-800">새 쿠폰 발급</h2>
              <button onClick={() => { setShowForm(false); setError(null); }} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-700">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">쿠폰 제목 *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                  placeholder="예: 첫방문 10% 할인"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">할인 유형 *</label>
                <select
                  value={form.discountType}
                  onChange={e => setForm(f => ({ ...f, discountType: e.target.value as 'percent' | 'fixed' }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-amber-400 outline-none"
                >
                  <option value="percent">% 할인</option>
                  <option value="fixed">정액 할인 (원)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">할인 값 *</label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                  placeholder={form.discountType === 'percent' ? '10 (= 10%)' : '5000'}
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">최대 사용 수 <span className="font-normal text-gray-400">(비우면 무제한)</span></label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                  placeholder="예: 100"
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">최소 방문 횟수 조건</label>
                <input
                  type="number"
                  value={form.minVisitCount}
                  onChange={e => setForm(f => ({ ...f, minVisitCount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                  placeholder="0 = 조건 없음"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">만료일 <span className="font-normal text-gray-400">(비우면 무기한)</span></label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">설명 <span className="font-normal text-gray-400">(선택)</span></label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-amber-400 outline-none"
                  placeholder="밤길 앱에 표시될 설명"
                  maxLength={80}
                />
              </div>
            </div>
            {form.title && form.discountValue && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-[10px] font-bold text-amber-600 uppercase mb-2">밤길 미리보기</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                    <Tag size={14} className="text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{form.title}</p>
                    {form.description && <p className="text-xs text-gray-500 truncate">{form.description}</p>}
                  </div>
                  <span className="text-sm font-black text-amber-600 shrink-0">
                    {form.discountType === 'percent' ? `${form.discountValue}% 할인` : `${Number(form.discountValue).toLocaleString()}원 할인`}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowForm(false); setError(null); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-500 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >취소</button>
              <button
                onClick={handleCreate}
                disabled={saving || !form.title.trim() || !form.discountValue}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-200 disabled:text-gray-400 text-black font-black text-sm rounded-xl transition-colors"
              >{saving ? '발급 중...' : '쿠폰 발급하기'}</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
            <Tag size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">아직 발급한 쿠폰이 없습니다.</p>
            {canCreate && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-5 py-2 bg-amber-500 text-black text-sm font-black rounded-xl hover:bg-amber-400 transition-colors"
              >첫 쿠폰 발급하기 →</button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {coupons.map(c => {
              const isExpired = c.valid_until ? new Date(c.valid_until) < new Date() : false;
              const isFull = c.max_uses !== null && c.used_count >= c.max_uses;
              return (
                <div
                  key={c.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${c.is_active && !isExpired && !isFull ? 'bg-white border-amber-100' : 'bg-gray-50 border-gray-200 opacity-70'}`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-amber-100">
                    <Tag size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-black text-gray-900">{c.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${c.is_active && !isExpired && !isFull ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {fmtDiscount(c)}
                      </span>
                      {!c.is_active && <span className="text-[10px] text-gray-400 font-bold">비활성</span>}
                      {isExpired && <span className="text-[10px] text-red-500 font-bold">만료됨</span>}
                      {isFull && <span className="text-[10px] text-blue-500 font-bold">한도 소진</span>}
                    </div>
                    {c.description && <p className="text-xs text-gray-500 truncate mb-0.5">{c.description}</p>}
                    <div className="text-[11px] text-gray-400 flex flex-wrap gap-2">
                      <span>코드: <span className="font-mono font-bold text-gray-600">{c.code}</span></span>
                      <span>사용: {c.used_count}{c.max_uses !== null ? `/${c.max_uses}명` : '명'}</span>
                      {c.min_visit_count > 0 && <span>최소 {c.min_visit_count}회 방문</span>}
                      {c.valid_until && <span className={isExpired ? 'text-red-400' : ''}>~{new Date(c.valid_until).toLocaleDateString('ko-KR')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggle(c)}
                      disabled={toggling === c.id}
                      title={c.is_active ? '비활성화' : '활성화'}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${c.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      {c.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={deleting === c.id || c.used_count > 0}
                      title={c.used_count > 0 ? '사용 이력이 있어 삭제 불가' : '삭제'}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    ><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-xs font-bold text-blue-600 mb-1.5">쿠폰 이용 안내</p>
          <ul className="text-xs text-blue-700/80 space-y-1 list-disc list-inside">
            <li>발급된 쿠폰은 밤길(bamgil.kr) 업소 상세 페이지에 자동 표시됩니다.</li>
            <li>손님이 쿠폰을 받으면 사용 횟수가 증가합니다.</li>
            <li>사용 이력이 있는 쿠폰은 삭제 불가 — 비활성화로 노출을 중단하세요.</li>
            <li>플랜 한도는 동시 활성 쿠폰 기준입니다. 비활성 쿠폰은 한도에서 제외됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
