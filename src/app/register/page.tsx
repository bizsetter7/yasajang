import RegisterForm from "@/components/register/RegisterForm";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-16 pb-24 px-4 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            비즈니스 파트너 <span className="text-amber-500">입점 신청</span>
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            야사장과 함께 대한민국 유흥 업계의 새로운 표준을 만들어갈<br className="hidden md:block" /> 
            혁신적인 사업주님을 모십니다.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-20 text-zinc-500">로딩 중...</div>}>
          <RegisterForm />
        </Suspense>
        
        {/* Helper Footer */}
        <div className="mt-16 text-center">
          <p className="text-zinc-600 text-sm">
            도움이 필요하신가요? <span className="text-amber-500/80 cursor-pointer hover:text-amber-500 transition-colors">실시간 채팅 상담</span> 또는 <span className="text-zinc-400 font-bold">bizsetter7@gmail.com</span>으로 문의주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
