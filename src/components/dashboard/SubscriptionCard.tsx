'use client';

import { useState } from 'react';
import { CreditCard, Calendar, CheckCircle2, AlertTriangle, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import PaymentModal from './PaymentModal';
import UpgradeModal from './UpgradeModal';

interface SubscriptionCardProps {
  subscription: {
    plan: string;
    status: string;
    trial_ends_at: string | null;
    next_billing_at: string | null;
    payment_reference: string | null;
  } | null;
  businessId: string;
  jumpBalance?: number | null;
}

export default function SubscriptionCard({ subscription, businessId, jumpBalance }: SubscriptionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const isPremium = subscription?.plan === 'premium';
  const isActive = subscription?.status === 'active';

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      basic: '베이직', standard: '스탠다드', special: '스페셜',
      deluxe: '디럭스', premium: '프리미엄',
    };
    return labels[plan] || plan;
  };

  const getPlanPrice = (plan: string) => {
    const prices: Record<string, string> = {
      basic: '₩22,000', standard: '₩66,000', special: '₩88,000',
      deluxe: '₩199,000', premium: '₩399,000',
    };
    return prices[plan] || '';
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* 플랜 정보 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
          <CreditCard size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-black text-gray-900">
              {subscription ? getPlanLabel(subscription.plan) : '무료 체험'}
            </span>
            {subscription && (
              <span className="text-xs font-bold text-gray-400">
                {getPlanPrice(subscription.plan)}/월
              </span>
            )}
            <span className="text-xs text-gray-400">구독 현황</span>
          </div>
          <div className="mt-0.5">
            {subscription?.status === 'active' ? (
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 size={11} /> 정기 구독 중
              </span>
            ) : subscription?.status === 'trial' ? (
              <span className="text-amber-600 text-xs font-bold flex items-center gap-1">
                <Clock size={11} /> 무료 체험 기간
              </span>
            ) : (
              <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                <AlertTriangle size={11} /> 구독 정보 없음
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 일정 */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">주요 일정</p>
        <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
          <Calendar size={13} className="text-gray-400 shrink-0" />
          <span className="flex-1">
            {subscription?.status === 'trial'
              ? `만료: ${formatDate(subscription.trial_ends_at)}`
              : `결제일: ${formatDate(subscription?.next_billing_at)}`}
          </span>
          {subscription?.status === 'active' && (
            <button
              disabled
              title="구독 연장 기능 준비 중"
              className="text-[10px] px-2 py-1 bg-gray-100 text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed font-bold shrink-0"
            >
              연장 준비중
            </button>
          )}
        </div>
      </div>

      {/* 점프 잔액 */}
      {jumpBalance != null && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">이번 달 점프 잔액</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-500">{jumpBalance}</span>
            <span className="text-gray-500 text-sm font-bold">회 남음</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-0.5">점프는 공고를 상단에 올려 노출을 높이는 기능입니다</p>
        </div>
      )}

      {/* CTA */}
      <div>
        {subscription?.status === 'trial' && !subscription.payment_reference && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-2 group/btn"
          >
            유료 전환 신청
            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        )}

        {subscription?.status === 'trial' && subscription.payment_reference && (
          <div className="w-full py-2.5 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 font-bold text-sm flex items-center justify-center gap-2">
            <Clock size={14} /> 입금 확인 대기 중
          </div>
        )}

        {isActive && (
          <div className="space-y-2">
            <div className="w-full py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-600 font-bold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={14} /> 활성화됨
            </div>
            {!isPremium && (
              <button
                onClick={() => setIsUpgradeOpen(true)}
                className="w-full py-2.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-2xl text-amber-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <TrendingUp size={14} /> 상위 플랜 업그레이드
              </button>
            )}
          </div>
        )}

        {subscription?.status === 'paused' && (
          <div className="w-full py-2.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 font-bold text-sm flex items-center justify-center gap-2">
            <AlertTriangle size={14} /> 일시정지됨
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessId={businessId}
        plan={subscription?.plan || 'basic'}
      />
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        businessId={businessId}
        currentPlan={subscription?.plan || 'basic'}
        nextBillingAt={subscription?.next_billing_at ?? null}
      />
    </div>
  );
}
