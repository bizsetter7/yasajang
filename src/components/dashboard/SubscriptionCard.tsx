'use client';

import { useState } from 'react';
import { CreditCard, Calendar, CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import PaymentModal from './PaymentModal';

interface SubscriptionCardProps {
  subscription: {
    plan: string;
    status: string;
    trial_ends_at: string | null;
    next_billing_at: string | null;
    payment_reference: string | null;
  } | null;
  businessId: string;
}

export default function SubscriptionCard({ subscription, businessId }: SubscriptionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      basic: '베이직',
      standard: '스탠다드',
      special: '스페셜',
      deluxe: '디럭스',
      premium: '프리미엄',
    };
    return labels[plan] || plan;
  };

  const getPlanPrice = (plan: string) => {
    const prices: Record<string, string> = {
      basic: '₩22,000',
      standard: '₩66,000',
      special: '₩88,000',
      deluxe: '₩199,000',
      premium: '₩399,000',
    };
    return prices[plan] || '';
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
              <CreditCard size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {subscription ? getPlanLabel(subscription.plan) : '무료 체험'}
                {subscription && (
                  <span className="text-sm font-medium text-gray-400">{getPlanPrice(subscription.plan)}/월</span>
                )}
                구독 현황
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {subscription?.status === 'active' ? (
                  <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> 정기 구독 중
                  </span>
                ) : subscription?.status === 'trial' ? (
                  <span className="text-amber-600 text-xs font-bold flex items-center gap-1">
                    <Clock size={12} /> 무료 체험 기간
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> 구독 정보 없음
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">주요 일정</p>
            <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
              <Calendar size={14} className="text-gray-400" />
              <span>
                {subscription?.status === 'trial'
                  ? `만료: ${formatDate(subscription.trial_ends_at)}`
                  : `결제일: ${formatDate(subscription?.next_billing_at)}`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          {subscription?.status === 'trial' && !subscription.payment_reference && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all shadow-sm flex items-center gap-2 group/btn"
            >
              유료 전환 신청 <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          )}

          {subscription?.status === 'trial' && subscription.payment_reference && (
            <div className="flex flex-col items-end gap-1.5">
              <div className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-gray-500 font-bold text-sm flex items-center gap-2">
                <Clock size={14} /> 입금 확인 대기 중
              </div>
              <p className="text-[10px] text-gray-400 mr-2">
                참조: {subscription.payment_reference}
              </p>
            </div>
          )}

          {subscription?.status === 'active' && (
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-600 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 size={14} /> 활성화됨
            </div>
          )}

          {subscription?.status === 'paused' && (
            <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-full text-rose-600 font-bold text-sm flex items-center gap-2">
              <AlertTriangle size={14} /> 일시정지됨
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessId={businessId}
        plan={subscription?.plan || 'basic'}
      />
    </div>
  );
}
