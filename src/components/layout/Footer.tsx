import Link from 'next/link';
import { Mail, Shield, FileText, Info } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-900 bg-zinc-950 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent mb-4 block">
              야사장 (YASAJANG)
            </span>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              밤의 세계를 이끄는 비즈니스 리더들의 전용 플랫폼. 
              검증된 파트너십과 혁신적인 마케팅 솔루션을 제공합니다.
            </p>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-6 flex items-center">
              <Info size={16} className="mr-2 text-amber-500" /> 커뮤니티
            </h3>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><Link href="/notice" className="hover:text-amber-400 transition-colors">공지사항</Link></li>
              <li><Link href="/faq" className="hover:text-amber-400 transition-colors">자주 묻는 질문</Link></li>
              <li><Link href="/events" className="hover:text-amber-400 transition-colors">진행 중인 이벤트</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-6 flex items-center">
              <Shield size={16} className="mr-2 text-amber-500" /> 법적고지
            </h3>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><Link href="/terms" className="hover:text-amber-400 transition-colors">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-amber-400 transition-colors text-zinc-300 font-medium border-b border-zinc-800 pb-0.5">개인정보처리방침</Link></li>
              <li><Link href="/refund" className="hover:text-amber-400 transition-colors">환불규정</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-zinc-100 font-semibold mb-6 flex items-center">
              <Mail size={16} className="mr-2 text-amber-500" /> 고객지원
            </h3>
            <p className="text-sm text-zinc-500 mb-2">상담 가능 시간: 평일 10:00 - 18:00</p>
            <p className="text-sm text-zinc-300 font-medium">bizsetter7@gmail.com</p>
            <div className="mt-6 flex space-x-4">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-amber-400 cursor-pointer transition-all">
                <FileText size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900/50 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-xs text-zinc-600">
            © {currentYear} YASAJANG. All rights reserved.
          </div>
          <div className="flex space-x-6 text-xs text-zinc-600">
            <span>사업자등록번호: 준비중</span>
            <span>대표: 비즈세터</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
