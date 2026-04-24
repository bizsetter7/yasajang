'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  CreditCard,
  Calendar,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPaymentsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const fetchPendingPayments = async () => {
    setLoading(true);
    // payment_reference가 있고 아직 trial인 항목 (입금 확인 대기)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, businesses(name, owner_id)')
      .not('payment_reference', 'is', null)
      .eq('status', 'trial')
      .order('updated_at', { ascending: false });

    if (!error) {
      setSubscriptions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleAction = async (subscriptionId: string, action: 'confirm' | 'reject') => {
    if (!confirm(`${action === 'confirm' ? '승인' : '반려'} 처리하시겠습니까?`)) return;

    setProcessingId(subscriptionId);
    try {
      const res = await fetch('/api/admin/confirm-payment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, action }),
      });

      if (res.ok) {
        alert('처리가 완료되었습니다.');
        fetchPendingPayments();
      } else {
        const data = await res.json();
        alert(data.error || '처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-black text-white tracking-tight">입금 확인 관리</h1>
          <p className="text-zinc-500 text-sm mt-1">무통장 입금 신청 내역을 확인하고 구독을 활성화합니다.</p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-zinc-500 font-medium">내역을 불러오는 중...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-[2rem]">
            <CheckCircle2 className="mx-auto mb-4 text-zinc-700" size={48} />
            <h3 className="text-xl font-bold text-zinc-500">대기 중인 입금 내역이 없습니다</h3>
            <p className="text-zinc-600 text-sm mt-2">모든 결제 신청이 처리되었습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {subscriptions.map((sub) => (
              <div 
                key={sub.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                    <Building2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">{sub.businesses?.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><CreditCard size={12} /> {sub.plan.toUpperCase()} 플랜</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> 신청일: {new Date(sub.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-grow max-w-md bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">입금 참조 정보</p>
                  <p className="text-sm text-zinc-300 font-medium break-all">{sub.payment_reference}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={() => handleAction(sub.id, 'reject')}
                    disabled={processingId === sub.id}
                    className="px-4 py-2 text-zinc-500 hover:text-rose-500 font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    반려
                  </button>
                  <button 
                    onClick={() => handleAction(sub.id, 'confirm')}
                    disabled={processingId === sub.id}
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black font-black rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2"
                  >
                    {processingId === sub.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>승인 완료 <CheckCircle2 size={16} /></>
                    )}
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
