import { createClient } from '@/lib/supabase/server';
import { Building2, CreditCard, Clock, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalBiz },
    { count: pendingBiz },
    { count: activeBiz },
    { count: pendingPay },
    { data: recentBiz },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('businesses').select('id, name, category, region_code, status, created_at').order('created_at', { ascending: false }).limit(6),
  ]);

  const statusColor: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    pending: 'text-amber-400 bg-amber-400/10',
    rejected: 'text-red-400 bg-red-400/10',
    inactive: 'text-zinc-500 bg-zinc-800',
  };

  const REGION_LABEL: Record<string, string> = {
    seoul: '서울', gyeonggi: '경기', incheon: '인천', busan: '부산',
    daegu: '대구', daejeon: '대전', gwangju: '광주', ulsan: '울산',
    sejong: '세종', gangwon: '강원', chungbuk: '충북', chungnam: '충남',
    jeonbuk: '전북', jeonnam: '전남', gyeongbuk: '경북', gyeongnam: '경남', jeju: '제주',
  };
  const CATEGORY_LABEL: Record<string, string> = {
    room_salon: '룸살롱', karaoke_bar: '노래주점', bar: '바(Bar)', other: '기타',
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">어드민 대시보드</h1>
        <p className="text-zinc-500 text-sm mt-1">야사장 전체 운영 현황입니다.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '전체 업소', value: totalBiz ?? 0, icon: Building2, color: 'text-zinc-400' },
          { label: '심사 대기', value: pendingBiz ?? 0, icon: Clock, color: 'text-amber-400', href: '/admin/register-audit' },
          { label: '활성 업소', value: activeBiz ?? 0, icon: CheckCircle2, color: 'text-green-400' },
          { label: '입금 확인 대기', value: pendingPay ?? 0, icon: CreditCard, color: 'text-blue-400', href: '/admin/payments' },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <div key={label} className={`bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 ${href ? 'hover:border-amber-500/30 transition-all' : ''}`}>
            {href ? (
              <Link href={href} className="block">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
                  <Icon size={16} className={color} />
                </div>
                <div className="text-3xl font-black text-white">{value}</div>
                {value > 0 && <p className="text-[10px] text-amber-500 font-bold mt-1">→ 처리 필요</p>}
              </Link>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
                  <Icon size={16} className={color} />
                </div>
                <div className="text-3xl font-black text-white">{value}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 바로가기 */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/admin/register-audit"
          className="flex items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-amber-500/30 transition-all group">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500 transition-all">
            <Building2 size={22} className="text-amber-500 group-hover:text-black transition-colors" />
          </div>
          <div>
            <p className="text-white font-black text-sm">업소 입점 심사</p>
            <p className="text-zinc-500 text-xs mt-0.5">서류 검토 및 승인/거절</p>
          </div>
        </Link>
        <Link href="/admin/payments"
          className="flex items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-blue-500/30 transition-all group">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-all">
            <CreditCard size={22} className="text-blue-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-white font-black text-sm">입금 확인</p>
            <p className="text-zinc-500 text-xs mt-0.5">무통장 입금 승인 처리</p>
          </div>
        </Link>
      </div>

      {/* 최근 등록 업소 */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={15} className="text-amber-500" />
          <h2 className="text-sm font-black uppercase tracking-wider">최근 등록 업소</h2>
        </div>
        <div className="space-y-3">
          {(recentBiz || []).map((b) => (
            <div key={b.id} className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-xl">
              <div className="w-9 h-9 bg-zinc-700 rounded-lg flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{b.name}</p>
                <p className="text-[11px] text-zinc-500">{REGION_LABEL[b.region_code] ?? b.region_code} · {CATEGORY_LABEL[b.category] ?? b.category}</p>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${statusColor[b.status] || ''}`}>
                {b.status}
              </span>
              <span className="text-[11px] text-zinc-600 shrink-0">
                {new Date(b.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
