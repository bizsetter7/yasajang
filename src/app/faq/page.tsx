import Link from 'next/link';
import { HelpCircle, ChevronRight } from 'lucide-react';

const faqs = [
  {
    q: '야사장은 어떤 서비스인가요?',
    a: '야사장은 밤 업소 사장님을 위한 통합 마케팅 플랫폼입니다. 밤길(손님 유입 지도), 코코알바(아가씨 구인), 웨이터존(웨이터 구인), 선수존(선수 구인) 4개 플랫폼에 하나의 구독으로 동시에 노출될 수 있습니다.',
  },
  {
    q: '어떻게 등록하나요?',
    a: '홈페이지 상단의 "업소 등록" 버튼을 클릭하여 사업자등록증과 영업허가증을 업로드하면 됩니다. 서류 심사 후 승인되면 각 플랫폼에 광고가 자동으로 게재됩니다.\n\n서류 OCR 자동 인식 기능이 있어 입력이 간편합니다.',
  },
  {
    q: '밤길 무료 체험은 어떻게 신청하나요?',
    a: '"밤길 3개월 무료 등록" 버튼을 클릭하여 업소를 등록하시면 자동으로 무료 체험이 시작됩니다. 별도 결제 없이 3개월간 밤길 지도에 업소 핀이 노출됩니다.',
  },
  {
    q: '구독 플랜은 어떻게 구성되어 있나요?',
    a: '무료(밤길 3개월), 베이직(₩22,000/월), 스탠다드(₩66,000/월), 스페셜(₩88,000/월), 디럭스(₩199,000/월), 프리미엄(₩399,000/월) 6가지 플랜이 있습니다.\n\n3·6·12개월 장기 결제 시 최대 17% 할인이 적용됩니다.',
  },
  {
    q: '결제 방법은 무엇인가요?',
    a: '현재 무통장 입금 방식으로 운영됩니다. 구독 신청 후 입금 정보를 확인하여 입금하시면, 관리자 확인 후 광고가 활성화됩니다.',
  },
  {
    q: '광고 점프 기능이란 무엇인가요?',
    a: '광고 점프는 목록 최상단으로 광고를 끌어올리는 기능입니다.\n\n스페셜: 자동 3회/일 + 수동 10회/월\n디럭스: 자동 6회/일 + 수동 30회/월\n프리미엄: 자동 8회/일 + 수동 30회/월 + 매일 +1회\n\n점프를 사용하면 경쟁 업소보다 상단에 노출됩니다.',
  },
  {
    q: '언제든지 해지할 수 있나요?',
    a: '네, 언제든지 해지 가능합니다. 구독 기간 중 해지 시 남은 기간에 대한 환불 정책은 환불규정 페이지를 확인해주세요.',
  },
  {
    q: '영업진이 여러 명인 경우 어떻게 등록하나요?',
    a: '같은 사업장에 소속된 영업진은 각자 별도 계정으로 야사장에 등록할 수 있습니다. 동일 사업자등록번호로 등록 시 밤길에서 자동으로 그룹핑되어 표시됩니다.',
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-10">
          <HelpCircle className="text-amber-500" size={24} />
          <h1 className="text-3xl font-black text-white">자주 묻는 질문</h1>
        </div>

        <div className="space-y-3">
          {faqs.map((item, i) => (
            <details
              key={i}
              className="group bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none hover:bg-zinc-800/50 transition-colors">
                <span className="text-amber-500 font-black text-sm shrink-0">Q.</span>
                <span className="text-sm font-semibold text-white flex-1">{item.q}</span>
                <ChevronRight size={14} className="text-zinc-600 group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <div className="px-5 pb-5 pt-3 border-t border-zinc-800">
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line pl-5 border-l-2 border-amber-500/30">{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-center">
          <p className="text-sm text-zinc-400 mb-2">원하는 답변을 찾지 못하셨나요?</p>
          <p className="text-sm font-bold text-amber-400">bizsetter7@gmail.com</p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-zinc-600 hover:text-amber-400 transition-colors">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </main>
  );
}
