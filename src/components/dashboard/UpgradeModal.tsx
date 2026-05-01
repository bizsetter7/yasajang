'use client';

import { useState } from 'react';
import { X, TrendingUp, Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  currentPlan: string;
  nextBillingAt: string | null;
}

const PLAN_ORDER = ['basic', 'standard', 'special', 'deluxe', 'premium'];
const PLAN_LABELS: Record<string, string> = {
  basic: '베이직', standard: '스탠다드', special: '스페셜', deluxe: '디럭스', premium: '프리미엄',
};
const PLAN_PRICES: Record<string, number> = {
  basic: 22000, standard: 66000, special: 88000, deluxe: 199000, premium: 399000,
};

export default function UpgradeModal({ isOpen, onClose, businessId, currentPlan, nextBillingAt }: UpgradeModalProps) {
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const upgradablePlans = PLAN_ORDER.slice(currentIdx + 1);

  const [selectedPlan, setSelectedPlan] = useState(upgradablePlans[0] || '');
  const [payerName, setPayerName] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen || upgradablePlans.length === 0) return null;

  const today = new Date();
  const billingDate = nextBillingAt ? new Date(nextBillingAt) : null;
  const remainingDays = billingDate
    ? Math.max(1, Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  const currentPrice = PLAN_PRICES[currentPlan] || 0;
  const newPrice = PLAN_PRICES[selectedPlan] || 0;
  const proRatedAmount = Math.ceil(((newPrice - currentPrice) / 30) * remainingDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName || !payDate) return;

    setIsSubmitting(true);
    try {
      const upgradeNote = `업그레이드: ${PLAN_LABELS[currentPlan]}→${PLAN_LABELS[selectedPlan]}, ${remainingDays}일 일할계산`;
      const res = await fetch('/api/subscriptions/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          plan: selectedPlan,
          period_months: 1,
          payerName,
          payDate,
          note: upgradeNote,
        }),
      });

      if (res.ok) {
        alert('업그레이드 신청이 완료되었습니다.\n입금 확인 후 플랜이 변경됩니다.');
        onClose();
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || '신청 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-md overflow-hidden relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-zinc-500 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 space-y-5">
          {/* 헤더 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">플랜 업그레이드</h2>
              <p className="text-xs text-zinc-500">현재: {PLAN_LABELS[currentPlan]} (₩{currentPrice.toLocaleString()}/월)</p>
            </div>
          </div>

          {/* 업그레이드 플랜 선택 */}
          <div className="bg-zinc-800/50 rounded-2xl p-4 space-y-3 border border-zinc-700/50">
            <p className="text-xs text-zinc-400 font-bold">업그레이드 플랜 선택</p>
            <div className="space-y-2">
              {upgradablePlans.map((planId) => (
                <button
                  key={planId}
                  type="button"
                  onClick={() => setSelectedPlan(planId)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border font-bold transition-all ${
                    selectedPlan === planId
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-zinc-950/50 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  <span className="text-sm font-black">{PLAN_LABELS[planId]}</span>
                  <span className={`text-xs ${selectedPlan === planId ? 'text-amber-400' : 'text-zinc-500'}`}>
                    ₩{PLAN_PRICES[planId].toLocaleString()}/월
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 일할계산 안내 */}
          {selectedPlan && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2">
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">지금 납부할 금액 (일할계산)</p>
              <p className="text-3xl font-black text-white">
                ₩{proRatedAmount.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                차액 ₩{(newPrice - currentPrice).toLocaleString()} ÷ 30일 × 남은 {remainingDays}일
              </p>
              <div className="pt-1 border-t border-amber-500/10">
                <p className="text-[11px] text-zinc-500">
                  다음 결제일({billingDate ? billingDate.toLocaleDateString('ko-KR') : '-'})부터
                  {' '}{PLAN_LABELS[selectedPlan]} ₩{newPrice.toLocaleString()}/월로 청구됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 계좌 안내 */}
          <div className="bg-zinc-800/50 rounded-2xl p-4 space-y-1.5 border border-zinc-700/50">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">입금 계좌</p>
            <p className="text-white font-bold tracking-tight">토스뱅크 1002-4683-1712</p>
            <p className="text-amber-500 text-sm font-medium">예금주: 고남우 (초코아이디어)</p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">입금자명</label>
              <input
                type="text"
                required
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="입금하신 성함 또는 상호명"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">입금 날짜</label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all [color-scheme:dark]"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mt-2 shadow-xl shadow-amber-500/20 active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>업그레이드 신청 <Send size={18} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
