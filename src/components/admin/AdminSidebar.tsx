'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { LayoutDashboard, ClipboardCheck, Settings, LogOut, ShieldCheck, Users } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard, exact: true },
  { href: '/admin/register-audit', label: '업소 입점 심사', icon: ClipboardCheck, exact: false },
  { href: '/admin/settings', label: '회원 관리', icon: Users, exact: false },
  { href: '/admin/platform-settings', label: '플랫폼 설정', icon: Settings, exact: false },
] as const;

interface AdminSidebarProps {
  email: string;
}

export default function AdminSidebar({ email }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-zinc-900 flex flex-col fixed inset-y-0 shadow-2xl z-50 bg-zinc-950/50 backdrop-blur-xl">
      <div className="p-8">
        <Link href="/admin" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter">야사장 <span className="text-zinc-500 font-medium">ADMIN</span></span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                active
                  ? 'text-white bg-zinc-900 border border-zinc-800 shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Icon size={18} className={`mr-3 ${active ? 'text-amber-500' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-zinc-900">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-amber-500 shrink-0">ADM</div>
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-bold truncate text-zinc-300">{email}</div>
            <div className="text-[10px] text-zinc-500 font-medium">Master Admin</div>
          </div>
          <button
            onClick={handleLogout}
            title="로그아웃"
            className="text-zinc-600 hover:text-red-400 transition-colors p-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
