import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

const policies = [
  {
    title: '구독 취소 및 해지',
    content: '구독은 언제든지 해지할 수 있습니다. 해지는 야사장 대시보드 또는 이메일(bizsetter7@gmail.com) 문의를 통해 신청 가능합니다.\n\n해지 신청 후 현재 결제 주기가 끝나는 날까지 서비스가 유지되며, 이후 자동 갱신이 중단됩니다.',
  },
  {
    title: '환불 정책',
    content: '야사장은 무통장 입금 방식으로 운영되며, 아래 기준에 따라 환불이 처리됩니다.\n\n[환불 가능 경우]\n· 결제 후 7일 이내이며 광고 미게재 상태인 경우: 전액 환불\n· 서비스 오류로 인해 광고가 정상 게재되지 않은 기간: 일할 계산 환불\n\n[환불 불가 경우]\n· 결제 후 7일 이상 경과한 경우\n· 광고가 정상 게재된 이후 단순 변심에 의한 해지\n· 이용자 귀책 사유(허위 정보 제출, 약관 위반)로 인한 서비스 제한',
  },
  {
    title: '환불 처리 절차',
    content: '환불 요청은 아래 절차로 진행됩니다.\n\n1. bizsetter7@gmail.com 으로 환불 요청 이메일 발송\n   - 제목: [환불 요청] 업소명\n   - 내용: 구독 ID, 결제 날짜, 환불 사유, 환불 계좌 정보\n\n2. 영업일 기준 1~3일 이내 검토 후 처리\n\n3. 승인된 환불은 영업일 기준 3~5일 이내 입금',
  },
  {
    title: '장기 구독 할인 환불',
    content: '3개월·6개월·12개월 장기 구독 결제 후 중도 해지 시, 실제 이용 기간에 해당하는 월 기본가(1개월 요금)를 적용하여 차액을 환불합니다.\n\n예시) 12개월(17% 할인) 결제 후 3개월 사용 시:\n· 납부 금액 - (1개월 기본가 × 3개월) = 환불 금액',
  },
  {
    title: '무료 체험 관련',
    content: '무료 체험(밤길 3개월 무료)은 결제 없이 제공되는 혜택으로, 별도의 환불 대상이 아닙니다.\n\n무료 체험 기간 중 유료 플랜으로 업그레이드하지 않으면 체험 종료 후 자동으로 서비스가 중단됩니다.',
  },
];

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <RefreshCw className="text-amber-500" size={24} />
          <h1 className="text-3xl font-black text-white">환불규정</h1>
        </div>
        <p className="text-xs text-zinc-600 mb-10">시행일: 2026년 5월 1일</p>

        <div className="space-y-6">
          {policies.map((p, i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5">
              <h2 className="text-sm font-black text-amber-400 mb-3">{p.title}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{p.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
          <p className="text-sm font-bold text-amber-400 mb-1">환불 문의</p>
          <p className="text-sm text-zinc-400">bizsetter7@gmail.com · 평일 10:00~18:00</p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-zinc-600 hover:text-amber-400 transition-colors">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </main>
  );
}
