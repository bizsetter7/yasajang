'use client';

import { Building2, Phone, CheckCircle2, Clock, Edit2, Zap } from 'lucide-react';
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
      return { label: '밤길 노출: 미노출', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
    switch (subscription.plan) {
      case 'premium':
        return { label: '밤길 노출: 최상단 고정', color: 'bg-amber-50 text-amber-600 border-amber-200' };
      case 'standard':
        return { label: '밤길 노출: 우선 노출', color: 'bg-blue-50 text-blue-600 border-blue-200' };
      case 'basic':
        return { label: '밤길 노출: 기본', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      default:
        return { label: '밤길 노출: 미노출', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
  };

  const exposure = getExposureLabel();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
                <Link href="/dashboard/edit" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
                  <Edit2 size={14} />
                </Link>
              </div>
              <p className="text-gray-500 text-sm flex items-center gap-1.5">
                {business.category} <span className="w-1 h-1 rounded-full bg-gray-300" /> {business.region_code}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Phone size={16} className="text-gray-400" />
              <span>{business.phone}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${exposure.color}`}>
              <Zap size={10} fill="currentColor" />
              {exposure.label}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">심사 상태</span>
          {business.is_verified ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-600 font-bold text-sm">
              <CheckCircle2 size={16} />
              승인 완료
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-600 font-bold text-sm">
              <Clock size={16} />
              심사 대기 중
            </div>
          )}
          {!business.is_verified && (
            <p className="text-[10px] text-gray-400 mt-1">영업일 기준 1~2일 소요됩니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
