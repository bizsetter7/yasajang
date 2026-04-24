'use client';

import { Users, TrendingUp, HelpCircle } from 'lucide-react';

interface BamgilStatsCardProps {
  count: number;
}

export default function BamgilStatsCard({ count }: BamgilStatsCardProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group">
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">밤길 이번 달 유입</h2>
              <p className="text-zinc-500 text-sm">밤길(bamgil.kr) 서비스를 통한 잠재 고객 연결 현황</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white">{count.toLocaleString()}</span>
            <span className="text-zinc-500 font-bold">명</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
            <TrendingUp size={10} />
            실시간 집계 중
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-800/50">
        {count > 0 ? (
          <p className="text-sm text-zinc-400">
            밤길에서 이번 달 {count}명의 손님이 사장님 업소에 관심을 보였습니다.
          </p>
        ) : (
          <div className="flex items-start gap-2 text-sm text-zinc-500">
            <HelpCircle size={16} className="mt-0.5 shrink-0" />
            <p>
              아직 밤길 유입이 없습니다. 밤길에 무료 등록하시면 더 많은 손님과 연결됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
