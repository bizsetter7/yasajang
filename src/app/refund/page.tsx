import Link from 'next/link';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const policies = [
  {
    title: '제1조 (환불의 원칙)',
    highlight: true,
    content: '야사장의 구독 서비스는 결제 완료 즉시 밤길·코코알바·웨이터존·선수존 등 연동 플랫폼에 광고 노출을 포함한 디지털 서비스 제공이 시작됩니다.\n\n이에 따라 결제 완료 후에는 원칙적으로 환불이 불가합니다.\n\n이는 「콘텐츠산업진흥법」 제28조 및 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 따른 디지털 콘텐츠 제공 즉시 청약철회 제한 규정에 근거합니다.',
  },
  {
    title: '제2조 (예외적 환불이 가능한 경우)',
    highlight: false,
    content: '아래 사유에 해당하는 경우에 한하여 고객센터를 통해 환불을 요청할 수 있습니다.\n\n① 이중 결제·오류 결제가 발생한 경우 (고의적 중복 신청 제외)\n② 시스템 오류로 인한 과금 또는 서비스 이용 불가가 발생한 경우\n③ 관계 법령에서 환불을 의무화하는 경우\n\n위 사유에 해당하더라도 이용약관 및 운영 정책 위반으로 광고가 강제 중단되거나 계정이 제한된 경우, 귀책사유가 회원에게 있으므로 환불을 제공하지 않습니다.',
  },
  {
    title: '제3조 (환불 처리 절차)',
    highlight: false,
    content: '환불 요청은 아래 절차로 진행됩니다.\n\n1. bizsetter7@gmail.com 으로 환불 요청 이메일 발송\n   - 제목: [환불 요청] 업소명\n   - 내용: 결제 날짜, 결제 금액, 환불 사유 (증빙 자료 첨부)\n\n2. 야사장은 사실 확인 후 영업일 기준 7일 이내에 환불 여부를 회신합니다.\n\n3. 환불이 승인된 경우, 입금한 계좌로 환급 처리합니다.\n   (무통장 입금 특성상 원결제 계좌 확인 후 처리)',
  },
  {
    title: '제4조 (장기 구독 중도 해지)',
    highlight: false,
    content: '3·6·12개월 장기 구독 결제 후 중도 해지를 원하는 경우, 아래와 같이 처리됩니다.\n\n· 원칙적으로 환불 불가 (디지털 서비스 제공 즉시 시작)\n· 단, 이용 기간 중 야사장 귀책 사유로 서비스가 불가한 경우, 미이용 기간에 대해 일할 계산하여 환불할 수 있습니다.',
  },
  {
    title: '제5조 (무료 체험)',
    highlight: false,
    content: '밤길 3개월 무료 체험은 결제 없이 제공되는 혜택으로 환불 대상이 아닙니다.\n\n무료 체험 기간 종료 후 유료 플랜으로 업그레이드하지 않으면 서비스가 자동 종료됩니다.',
  },
  {
    title: '제6조 (구독 해지 안내)',
    highlight: false,
    content: '환불과 구독 해지는 별개입니다.\n\n· 해지는 언제든 신청 가능하며, 해지 신청 후 현재 결제 주기가 끝나는 날까지 서비스가 유지됩니다.\n· 해지 이후에는 자동 갱신이 중단되며, 남은 이용 기간 동안 광고는 계속 노출됩니다.\n· 해지 신청은 대시보드 또는 이메일(bizsetter7@gmail.com)을 통해 요청하실 수 있습니다.',
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
        <p className="text-xs text-zinc-600 mb-8">시행일: 2026년 5월 1일</p>

        {/* 핵심 안내 배너 */}
        <div className="mb-8 p-5 bg-amber-500/8 border border-amber-500/30 rounded-2xl flex gap-3">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-black text-amber-400 mb-1">꼭 확인하세요</p>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>· 구독은 선결제이며, 결제 완료 즉시 디지털 서비스가 시작됩니다.</li>
              <li>· 단순 변심에 의한 환불은 불가합니다.</li>
              <li>· 해지하면 다음 결제일부터 자동 결제가 중단되며, 남은 기간 서비스는 계속 이용 가능합니다.</li>
              <li>· 중복 결제·시스템 오류 시 고객센터로 문의해 주세요.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {policies.map((p, i) => (
            <div
              key={i}
              className={`border rounded-2xl p-5 ${
                p.highlight
                  ? 'bg-red-950/20 border-red-800/40'
                  : 'bg-zinc-900/40 border-zinc-800/60'
              }`}
            >
              <h2 className={`text-sm font-black mb-3 ${p.highlight ? 'text-red-400' : 'text-amber-400'}`}>
                {p.title}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{p.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
          <p className="text-sm font-bold text-white mb-1">환불 문의</p>
          <p className="text-sm text-zinc-400">이메일: bizsetter7@gmail.com</p>
          <p className="text-sm text-zinc-400">운영 시간: 평일 10:00 ~ 18:00</p>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-xs text-zinc-600">
            본 환불규정은{' '}
            <Link href="/terms" className="text-amber-500/70 hover:text-amber-400">이용약관</Link>과 함께 적용됩니다.
          </p>
          <Link href="/" className="block text-xs text-zinc-600 hover:text-amber-400 transition-colors">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </main>
  );
}
