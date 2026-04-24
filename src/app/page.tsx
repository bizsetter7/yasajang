import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import Pricing from "@/components/home/Pricing";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <Features />
      <Pricing />
      
      {/* Final CTA Section */}
      <section className="py-24 bg-zinc-950 px-4">
        <div className="max-w-4xl mx-auto p-12 rounded-[2.5rem] bg-gradient-to-br from-amber-500 to-yellow-600 relative overflow-hidden text-center group">
          {/* Background Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150 group-hover:scale-100 transition-transform duration-1000" />
          
          <h2 className="text-3xl md:text-5xl font-black text-black mb-6 tracking-tight">
            당신의 비즈니스를<br />지금 바로 격상시키세요
          </h2>
          <p className="text-black/70 text-lg mb-10 max-w-xl mx-auto font-medium">
            야사장 멤버십은 단순한 홍보를 넘어, 검증된 프리미엄 네트워크로의 진입을 의미합니다. 
            준비된 파트너와 함께 최고의 성과를 만드세요.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/register"
              className="px-10 py-5 bg-black text-white font-bold rounded-2xl hover:bg-zinc-900 transition-all shadow-xl hover:shadow-black/20 flex items-center"
            >
              입점 신청하기 <ChevronRight className="ml-2" size={20} />
            </Link>
            <Link
              href="/contact"
              className="px-10 py-5 bg-white/20 hover:bg-white/30 text-black font-bold rounded-2xl transition-all backdrop-blur-md"
            >
              상담 예약하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
