'use client';

import { Users, TrendingUp, HelpCircle } from 'lucide-react';

interface BamgilStatsCardProps {
  count: number;
}

export default function BamgilStatsCard({ count }: BamgilStatsCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
          <Users size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-black text-gray-900 leading-tight">밤길 이번 달 유입</h2>
          <p className="text-gray-500 text-xs mt-0.5 leading-snug">
            밤길(bamgil.kr) 서비스를 통한 잠재 고객 연결 현황
          </p>
        </div>
      </div>

      {/* 카운트 */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black text-gray-900">{count.toLocaleString()}</span>
          <span className="text-gray-500 font-bold text-lg">명</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg shrink-0">
          <TrendingUp size={10} />
          실시간 집계 중
        </div>
      </div>

      {/* 하단 설명 */}
      <div className="pt-3 border-t border-gray-100">
        {count > 0 ? (
          <p className="text-sm text-gray-600">
            밤길에서 이번 달 <span className="font-bold text-gray-900">{count}명</span>의 손님이 관심을 보였습니다.
          </p>
        ) : (
          <div className="flex items-start gap-2 text-gray-500">
            <HelpCircle size={14} className="mt-0.5 shrink-0 text-gray-400" />
            <p className="text-xs">
              야사장의 각 플랫폼을 통해 더 많은 손님과 연결하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
