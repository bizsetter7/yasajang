'use client';

import { Users, Phone, MessageCircle, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BamgilStatsCardProps {
  count: number;
  lastMonthCount: number;
  callCount: number;
  chatCount: number;
  visitCount: number;
  daily7d: number[];
}

const DAY_LABELS = ['6일전', '5일전', '4일전', '3일전', '어제', '어제', '오늘'];
const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

function getDayLabels(): string[] {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(WEEKDAY_SHORT[d.getDay()]);
  }
  return labels;
}

export default function BamgilStatsCard({
  count,
  lastMonthCount,
  callCount,
  chatCount,
  visitCount,
  daily7d,
}: BamgilStatsCardProps) {
  const diff = count - lastMonthCount;
  const diffPct = lastMonthCount > 0 ? Math.round((diff / lastMonthCount) * 100) : null;
  const maxDay = Math.max(...daily7d, 1);
  const dayLabels = getDayLabels();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
          <Users size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-black text-gray-900 leading-tight">밤길 이번 달 유입</h2>
          <p className="text-gray-500 text-xs mt-0.5">잠재 고객 연결 현황</p>
        </div>
      </div>

      {/* 이번달 수치 + 전월 비교 */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black text-gray-900">{count.toLocaleString()}</span>
          <span className="text-gray-500 font-bold text-lg">명</span>
        </div>
        {lastMonthCount > 0 || count > 0 ? (
          <div className="flex items-center gap-1 text-xs font-bold shrink-0">
            {diff > 0 ? (
              <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                <TrendingUp size={11} />
                {diffPct !== null ? `+${diffPct}%` : `+${diff}`}
              </span>
            ) : diff < 0 ? (
              <span className="flex items-center gap-0.5 text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
                <TrendingDown size={11} />
                {diffPct !== null ? `${diffPct}%` : `${diff}`}
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                <Minus size={11} />
                전월 동일
              </span>
            )}
            <span className="text-gray-400 text-[10px]">전월 {lastMonthCount}명</span>
          </div>
        ) : null}
      </div>

      {/* 7일 미니 바 차트 */}
      {daily7d.some(v => v > 0) && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">최근 7일 추이</p>
          <div className="flex items-end gap-1 h-10">
            {daily7d.map((val, i) => {
              const heightPct = Math.round((val / maxDay) * 100);
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex items-end justify-center h-8">
                    <div
                      className={`w-full rounded-t-sm transition-all ${isToday ? 'bg-amber-400' : 'bg-gray-200'}`}
                      style={{ height: `${Math.max(heightPct, val > 0 ? 8 : 2)}%` }}
                      title={`${dayLabels[i]}: ${val}명`}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold">{dayLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 유형별 분류 */}
      {count > 0 && (callCount + chatCount + visitCount) > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">유형별</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1.5 p-2.5 bg-amber-50 rounded-xl">
              <Phone size={12} className="text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold">전화</p>
                <p className="text-sm font-black text-gray-900">{callCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-2.5 bg-blue-50 rounded-xl">
              <MessageCircle size={12} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold">채팅</p>
                <p className="text-sm font-black text-gray-900">{chatCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-2.5 bg-green-50 rounded-xl">
              <MapPin size={12} className="text-green-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold">방문</p>
                <p className="text-sm font-black text-gray-900">{visitCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 유입 없을 때 */}
      {count === 0 && (
        <div className="pt-3 border-t border-gray-100 text-xs text-gray-400">
          야사장의 각 플랫폼을 통해 더 많은 손님과 연결하세요.
        </div>
      )}
    </div>
  );
}
