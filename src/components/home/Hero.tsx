'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Play } from 'lucide-react';

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
            Premium Business Network
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] mb-8 tracking-tight">
            밤의 비즈니스를<br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 bg-clip-text text-transparent">
              압도적으로 리드하다
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-12 leading-relaxed max-w-2xl">
            야사장은 검증된 사업주와 파트너를 위한 독점적인 네트워크를 제공합니다. 
            최상의 마케팅 도구와 커뮤니티를 통해 당신의 비즈니스를 한 단계 더 격상시키세요.
          </p>

          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-1"
            >
              지금 바로 입점 신청 <ChevronRight className="ml-2" size={20} />
            </Link>
            
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 flex items-center justify-center transition-all backdrop-blur-sm group">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 group-hover:bg-amber-500 group-hover:text-black transition-all">
                <Play size={14} fill="currentColor" />
              </div>
              서비스 소개 영상
            </button>
          </div>

          <div className="mt-16 flex items-center space-x-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">500+</span>
              <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Partners</span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">98%</span>
              <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Retention</span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">24/7</span>
              <span className="text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">Support</span>
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
