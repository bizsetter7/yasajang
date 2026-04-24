'use client';

import { Building2, MapPin, Phone, CheckCircle2, Clock } from 'lucide-react';

interface BusinessCardProps {
  business: {
    name: string;
    category: string;
    region_code: string;
    phone: string;
    is_verified: boolean;
  };
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-amber-500/10 blur-[80px] group-hover:bg-amber-500/20 transition-all duration-700" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{business.name}</h2>
              <p className="text-zinc-500 text-sm flex items-center gap-1.5">
                {business.category} <span className="w-1 h-1 rounded-full bg-zinc-700" /> {business.region_code}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Phone size={16} />
              <span>{business.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">심사 상태</span>
          {business.is_verified ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 font-bold text-sm">
              <CheckCircle2 size={16} />
              승인 완료
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 font-bold text-sm">
              <Clock size={16} />
              서류 심사 중
            </div>
          )}
          {!business.is_verified && (
            <p className="text-[10px] text-zinc-500 mt-1">영업일 기준 1~2일 소요됩니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
