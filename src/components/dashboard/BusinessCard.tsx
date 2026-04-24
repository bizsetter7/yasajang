'use client';

import { Building2, MapPin, Phone, CheckCircle2, Clock, Edit2, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    category: string;
    region_code: string;
    phone: string;
    is_verified: boolean;
  };
  subscription?: {
    plan: string;
    status: string;
  } | null;
}

export default function BusinessCard({ business, subscription }: BusinessCardProps) {
  const getExposureLabel = () => {
    if (!subscription || subscription.status !== 'active') {
      return { label: '밤길 노출: 미노출', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
    
    switch (subscription.plan) {
      case 'premium':
        return { label: '밤길 노출: 최상단 고정', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'standard':
        return { label: '밤길 노출: 우선 노출', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'basic':
        return { label: '밤길 노출: 기본', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      default:
        return { label: '밤길 노출: 미노출', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
  };

  const exposure = getExposureLabel();

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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{business.name}</h2>
                <Link href="/dashboard/edit" className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                  <Edit2 size={14} />
                </Link>
              </div>
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
            
            {/* 노출 상태 배지 */}
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${exposure.color}`}>
              <Zap size={10} fill="currentColor" />
              {exposure.label}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">심사 상태</span>
          {business.is_verified ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 font-bold text-sm">
              <CheckCircle2 size={16} />
              승인 완료
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 font-bold text-sm">
              <Clock size={16} />
              심사 대기 중
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
