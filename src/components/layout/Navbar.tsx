'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type User as SupabaseUser } from '@supabase/supabase-js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const navLinks = [
    { name: '홈', href: '/' },
    { name: '서비스 특징', href: '/#features' },
    { name: '요금제', href: '/#pricing' },
    { name: '업소 등록', href: '/register', protected: true },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass py-3' : 'bg-zinc-950/80 backdrop-blur-sm py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-yellow-500 transition-all">
              야사장
            </span>
            <span className="text-[10px] uppercase tracking-widest text-amber-500/50 font-medium">Business platform</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-amber-400',
                  pathname === link.href ? 'text-amber-400' : 'text-zinc-400'
                )}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="h-4 w-px bg-zinc-800 mx-2" />

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? '/admin' : '/dashboard'}
                  className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard size={15} />
                  대시보드
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                href="/?auth=login"
                className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
              >
                시작하기
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-white p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'md:hidden absolute top-full left-0 right-0 bg-zinc-950 border-t border-zinc-900 transition-all duration-300 overflow-hidden',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block px-3 py-4 text-base font-medium text-zinc-400 hover:text-amber-400 hover:bg-zinc-900/50 rounded-lg transition-all"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          {/* 대시보드 탭 — 로그인 시 해당 페이지, 비로그인 시 로그인 팝업 */}
          <Link
            href={user
              ? (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? '/admin' : '/dashboard')
              : '/?auth=login'
            }
            className="flex items-center gap-2 px-3 py-4 text-base font-bold text-amber-400 hover:text-amber-300 hover:bg-zinc-900/50 rounded-lg transition-all"
            onClick={() => setIsOpen(false)}
          >
            <LayoutDashboard size={18} />
            대시보드
          </Link>

          <div className="pt-4 mt-2 border-t border-zinc-900">
            {user ? (
              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-zinc-500 truncate max-w-[180px]">{user.email}</span>
                <button onClick={handleSignOut} className="text-red-400 text-sm font-medium shrink-0">로그아웃</button>
              </div>
            ) : (
              <Link
                href="/?auth=login"
                className="block w-full text-center bg-amber-500 text-black py-3 rounded-xl font-bold"
                onClick={() => setIsOpen(false)}
              >
                시작하기
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
