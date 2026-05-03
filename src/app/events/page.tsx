import Link from 'next/link';
import { Zap } from 'lucide-react';

const events = [
  {
    tag: '진행중',
    tagColor: 'bg-amber-500 text-black',
    title: '🎉 오픈 기념 밤길 3개월 무료 체험',
    period: '2026.05.01 ~ 종료 시까지',
    desc: '야사장 정식 오픈을 기념하여 신규 등록 모든 업소에 밤길 지도 핀 노출 3개월을 무료로 제공합니다.',
    detail: [
      '대상: 야사장 신규 등록 업소 전체',
      '혜택: 밤길 지도 기본 핀 노출 3개월',
      '조건: 사업자등록증 + 영업허가증 제출 후 심사 통과',
      '별도 결제 없이 자동 적용',
    ],
    cta: '지금 무료 등록하기',
    ctaHref: '/register?plan=free',
    ctaColor: 'bg-amber-500 hover:bg-amber-400 text-black',
  },
  {
    tag: '진행중',
    tagColor: 'bg-emerald-500 text-black',
    title: '💰 장기 구독 최대 17% 할인',
    period: '상시 운영',
    desc: '3개월, 6개월, 12개월 장기 구독 시 할인 혜택을 드립니다.',
    detail: [
      '3개월 구독: 5% 할인',
      '6개월 구독: 10% 할인',
      '12개월 구독: 17% 할인 (2개월 무료 효과)',
      '모든 유료 플랜 적용',
    ],
    cta: '플랜 확인하기',
    ctaHref: '/#pricing',
    ctaColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-10">
          <Zap className="text-amber-500" size={24} />
          <h1 className="text-3xl font-black text-white">진행 중인 이벤트</h1>
        </div>

        <div className="space-y-6">
          {events.map((ev, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${ev.tagColor}`}>{ev.tag}</span>
                  <span className="text-xs text-zinc-500">{ev.period}</span>
                </div>
                <h2 className="text-xl font-black text-white mb-3">{ev.title}</h2>
                <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{ev.desc}</p>
                <ul className="space-y-2 mb-6">
                  {ev.detail.map((d, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
                <Link
                  href={ev.ctaHref}
                  className={`inline-flex px-6 py-2.5 rounded-xl text-sm font-black transition-all ${ev.ctaColor}`}
                >
                  {ev.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-xs text-zinc-600 hover:text-amber-400 transition-colors">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </main>
  );
}
