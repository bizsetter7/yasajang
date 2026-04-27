'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.png"
          alt="Luxury Business Lounge"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase mb-8 animate-fade-in">
            🔥 밤 업소 사장님 전용 마케팅 플랫폼
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight">
            손님 모집부터<br />
            직원 채용까지<br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
              야사장 하나로
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-6 leading-relaxed max-w-2xl">
            밤길 지도에 내 업소 핀이 꽂힙니다.<br className="hidden sm:block" />
            손님이 실시간으로 위치를 보고 찾아옵니다.
          </p>

          {/* 노출 플랫폼 표시 */}
          <div className="flex items-center gap-3 mb-10 flex-wrap">
            <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">노출 플랫폼</span>
            <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-full">📍 밤길 지도</span>
            <span className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-black rounded-full">🏢 야사장 프로필</span>
            <span className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-black rounded-full">👔 구인·구직</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/register?plan=free"
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-1 text-lg"
            >
              밤길 3개월 무료 등록 <ChevronRight className="ml-2" size={20} />
            </Link>
            <Link
              href="#pricing"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 flex items-center justify-center transition-all backdrop-blur-sm"
            >
              구독 플랜 보기
            </Link>
          </div>

          <div className="mt-12 flex items-center space-x-8">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">300+</span>
              <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">등록 업소</span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">월 5만+</span>
              <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">밤길 방문자</span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">3개월</span>
              <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">밤길 무료 등록</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
    </section>
  );
}
