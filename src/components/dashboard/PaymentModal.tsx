'use client';

import { useState } from 'react';
import { X, Landmark, Send, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

export default function PaymentModal({ isOpen, onClose, businessId }: PaymentModalProps) {
  const [payerName, setPayerName] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName || !payDate) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/subscriptions/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          payerName,
          payDate,
          note,
        }),
      });

      if (res.ok) {
        alert('입금 확인 신청이 완료되었습니다.');
        onClose();
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || '신청 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] w-full max-w-md overflow-hidden relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Landmark size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">유료 전환 신청</h2>
          </div>

          <div className="bg-zinc-800/50 rounded-2xl p-4 space-y-2 border border-zinc-700/50">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">계좌 정보</p>
            <p className="text-white font-bold tracking-tight">토스뱅크 1002-4683-1712</p>
            <p className="text-amber-500 text-sm font-medium">예금주: 고남우 (초코아이디어)</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-[10px] text-center p-2 rounded-lg bg-zinc-950/50">
                <p className="text-zinc-500">베이직</p>
                <p className="text-white font-bold">9.9만</p>
              </div>
              <div className="text-[10px] text-center p-2 rounded-lg bg-zinc-950/50 border border-amber-500/30">
                <p className="text-zinc-500">스탠다드</p>
                <p className="text-amber-500 font-bold">19.9만</p>
              </div>
              <div className="text-[10px] text-center p-2 rounded-lg bg-zinc-950/50">
                <p className="text-zinc-500">프리미엄</p>
                <p className="text-white font-bold">49.9만</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">입금자명</label>
              <input 
                type="text"
                required
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="입금하신 성함 또는 상호명"
                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">입금 날짜</label>
              <input 
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all [color-scheme:dark]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">비고 (선택)</label>
              <input 
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="추가 전달 사항"
                className="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 shadow-xl shadow-amber-500/20 active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  신청 완료 <Send size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
