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
      premium: '프리미엄',
    };
    return labels[plan] || plan;
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
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400">
              <CreditCard size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {subscription ? getPlanLabel(subscription.plan) : '무료 체험'} 구독 현황
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {subscription?.status === 'active' ? (
                  <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> 정기 구독 중
                  </span>
                ) : subscription?.status === 'trial' ? (
                  <span className="text-amber-500 text-xs font-bold flex items-center gap-1">
                    <Clock size={12} /> 무료 체험 기간
                  </span>
                ) : (
                  <span className="text-zinc-500 text-xs font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> 구독 정보 없음
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-2">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">주요 일정</p>
              <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium">
                <Calendar size={14} className="text-zinc-500" />
                <span>
                  {subscription?.status === 'trial' 
                    ? `만료: ${formatDate(subscription.trial_ends_at)}`
                    : `결제일: ${formatDate(subscription?.next_billing_at)}`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          {subscription?.status === 'trial' && !subscription.payment_reference && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all shadow-lg flex items-center gap-2 group/btn"
            >
              유료 전환 신청 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {subscription?.status === 'trial' && subscription.payment_reference && (
            <div className="flex flex-col items-end gap-1.5">
              <div className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 font-bold text-sm flex items-center gap-2">
                <Clock size={14} /> 입금 확인 대기 중
              </div>
              <p className="text-[10px] text-zinc-500 mr-2">
                참조: {subscription.payment_reference}
              </p>
            </div>
          )}

          {subscription?.status === 'active' && (
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 size={14} /> 활성화됨
            </div>
          )}

          {subscription?.status === 'paused' && (
            <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-500 font-bold text-sm flex items-center gap-2">
              <AlertTriangle size={14} /> 일시정지됨
            </div>
          )}
        </div>
      </div>

      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        businessId={businessId}
      />
    </div>
  );
}
