'use client';

import { Users, TrendingUp, HelpCircle } from 'lucide-react';

interface BamgilStatsCardProps {
  count: number;
}

export default function BamgilStatsCard({ count }: BamgilStatsCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">밤길 이번 달 유입</h2>
              <p className="text-gray-500 text-sm">밤길(bamgil.kr) 서비스를 통한 잠재 고객 연결 현황</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-gray-900">{count.toLocaleString()}</span>
            <span className="text-gray-500 font-bold">명</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
            <TrendingUp size={10} />
            실시간 집계 중
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        {count > 0 ? (
          <p className="text-sm text-gray-600">
            밤길에서 이번 달 <span className="font-bold text-gray-900">{count}명</span>의 손님이 사장님 업소에 관심을 보였습니다.
          </p>
        ) : (
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <HelpCircle size={16} className="mt-0.5 shrink-0 text-gray-400" />
            <p>
              아직 밤길 유입이 없습니다. 밤길에 무료 등록하시면 더 많은 손님과 연결됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
