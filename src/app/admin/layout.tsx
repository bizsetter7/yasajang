import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
      <AdminSidebar email={user.email!} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/[0.02] via-transparent to-transparent">
        {children}
      </main>
    </div>
  );
}
