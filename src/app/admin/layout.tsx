import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { LayoutDashboard, ClipboardCheck, Settings, LogOut, ShieldCheck } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Basic Admin Protection
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'bizsetter7@gmail.com';
  if (!user || user.email !== adminEmail) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-900 flex flex-col fixed inset-y-0 shadow-2xl z-50 bg-zinc-950/50 backdrop-blur-xl">
        <div className="p-8">
          <Link href="/admin" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter">야사장 <span className="text-zinc-500 font-medium">ADMIN</span></span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link href="/admin" className="flex items-center px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
            <LayoutDashboard size={18} className="mr-3" /> 대시보드
          </Link>
          <Link href="/admin/register-audit" className="flex items-center px-4 py-3 text-sm font-bold text-white bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg transition-all">
            <ClipboardCheck size={18} className="mr-3 text-amber-500" /> 업소 입점 심사
          </Link>
          <Link href="/admin/settings" className="flex items-center px-4 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
            <Settings size={18} className="mr-3" /> 플랫폼 설정
          </Link>
        </nav>

        <div className="p-6 border-t border-zinc-900">
          <div className="flex items-center space-x-4 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">ADM</div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold truncate">{user.email}</div>
              <div className="text-[10px] text-zinc-500 font-medium">Master Admin</div>
            </div>
            <button className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/[0.02] via-transparent to-transparent">
        {children}
      </main>
    </div>
  );
}
