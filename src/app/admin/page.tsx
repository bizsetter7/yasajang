import { createClient } from '@supabase/supabase-js';
import { Building2, CreditCard, Clock, CheckCircle2, TrendingUp, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  // service_role — RLS 우회하여 전체 데이터 조회
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    { count: totalBiz },
    { count: pendingBiz },
    { count: activeBiz },
    { count: pendingPay },
    { data: recentBiz },
    { count: bamgilCount },
    { count: cocoCount },
    { count: waiterCount },
    { count: sunsuCount },
    { data: expiringSubs },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('businesses').select('id, name, category, region_code, status, created_at').order('created_at', { ascending: false }).limit(8),
    // Phase 1: 플랫폼별 활성 광고 수
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('platform', 'cocoalba'),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('platform', 'waiterzone'),
    supabase.from('shops').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('platform', 'sunsuzone'),
    // Phase 1: 만료 임박 구독 (7일 이내)
    supabase.from('subscriptions')
      .select('id, business_id, plan, next_billing_at, status')
      .in('status', ['active', 'trial'])
      .gte('next_billing_at', now.toISOString())
      .lte('next_billing_at', in7Days.toISOString())
      .order('next_billing_at', { ascending: true }),
  ]);

  // 만료 임박 구독 업소명 매핑
  type ExpiringSub = { id: string; business_id: string; plan: string; next_billing_at: string; status: string; business_name: string | null };
  let expiringWithNames: ExpiringSub[] = [];
  if (expiringSubs && expiringSubs.length > 0) {
    const bizIds = expiringSubs.map(s => s.business_id).filter(Boolean);
    const { data: bizNames } = await supabase.from('businesses').select('id, name').in('id', bizIds);
    const nameMap = new Map((bizNames ?? []).map(b => [b.id as string, b.name as string]));
    expiringWithNames = expiringSubs.map(s => ({ ...s, business_name: nameMap.get(s.business_id) ?? null }));
  }

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

      {/* Stats — actionRequired: 진짜 어드민 액션이 필요한 항목만 '처리 필요' 표시 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '전체 업소', value: totalBiz ?? 0, icon: Building2, color: 'text-zinc-400', actionRequired: false },
          { label: '심사 대기', value: pendingBiz ?? 0, icon: Clock, color: 'text-amber-400', href: '/admin/register-audit', actionRequired: true },
          { label: '활성 업소', value: activeBiz ?? 0, icon: CheckCircle2, color: 'text-green-400', href: '/admin/register-audit?status=active', actionRequired: false, hint: '운영중' },
          { label: '입금 확인 대기', value: pendingPay ?? 0, icon: CreditCard, color: 'text-blue-400', href: '/admin/payments', actionRequired: true },
        ].map(({ label, value, icon: Icon, color, href, actionRequired, hint }) => (
          <div key={label} className={`bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 ${href ? 'hover:border-amber-500/30 transition-all' : ''}`}>
            {href ? (
              <Link href={href} className="block">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
                  <Icon size={16} className={color} />
                </div>
                <div className="text-3xl font-black text-white">{value}</div>
                {actionRequired && value > 0 && <p className="text-[10px] text-amber-500 font-bold mt-1">→ 처리 필요</p>}
                {!actionRequired && hint && value > 0 && <p className="text-[10px] text-green-500 font-bold mt-1">→ {hint}</p>}
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

      {/* Phase 1: 플랫폼별 활성 광고 현황 */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={13} className="text-amber-500" />
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">플랫폼별 활성 광고</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '밤길', count: bamgilCount ?? 0, color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-500', href: 'https://www.bamgil.kr' },
            { label: '코코알바', count: cocoCount ?? 0, color: 'text-pink-400', bg: 'bg-pink-400/10', dot: 'bg-pink-500', href: 'https://www.cocoalba.kr' },
            { label: '웨이터존', count: waiterCount ?? 0, color: 'text-blue-400', bg: 'bg-blue-400/10', dot: 'bg-blue-500', href: 'https://www.waiterzone.kr' },
            { label: '선수존', count: sunsuCount ?? 0, color: 'text-yellow-400', bg: 'bg-yellow-400/10', dot: 'bg-yellow-500', href: 'https://www.sunsuzone.kr' },
          ].map(({ label, count, color, bg, dot, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className={`${bg} border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-all`}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[11px] font-bold text-zinc-500">{label}</span>
              </div>
              <div className={`text-2xl font-black ${color}`}>{count}</div>
              <div className="text-[10px] text-zinc-600 font-bold mt-0.5">활성 광고</div>
            </a>
          ))}
        </div>
      </div>

      {/* Phase 1: 만료 임박 구독 경보 */}
      {expiringWithNames.length > 0 && (
        <div className="bg-zinc-900/50 border border-amber-500/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={13} className="text-amber-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-400">만료 임박 구독</h2>
            <span className="ml-auto text-[10px] text-amber-500/70 font-bold">{expiringWithNames.length}건 · 7일 이내</span>
          </div>
          <div className="space-y-2">
            {expiringWithNames.map(sub => {
              const daysLeft = Math.max(0, Math.ceil((new Date(sub.next_billing_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              const urgentCls = daysLeft <= 3 ? 'text-red-400 bg-red-400/10' : 'text-amber-400 bg-amber-400/10';
              return (
                <div key={sub.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${urgentCls}`}>
                    D-{daysLeft}
                  </span>
                  <span className="text-sm font-bold text-white flex-1 truncate">{sub.business_name ?? '(업소명 없음)'}</span>
                  <span className="text-[11px] text-zinc-500 capitalize shrink-0">{sub.plan}</span>
                  <span className="text-[11px] text-zinc-600 shrink-0">
                    {new Date(sub.next_billing_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 만료
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 바로가기 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        <Link href="/admin/settings"
          className="flex items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-green-500/30 transition-all group">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500 transition-all">
            <Users size={22} className="text-green-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-white font-black text-sm">회원 관리</p>
            <p className="text-zinc-500 text-xs mt-0.5">가입 회원 목록 및 역할</p>
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
