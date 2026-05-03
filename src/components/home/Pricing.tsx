'use client';

import { Check, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef } from 'react';

const PLATFORM_CHIP: Record<string, string> = {
  '밤길': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  '웨이터존': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  '코코알바 또는 선수존': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

// 기간별 할인율
const PERIOD_OPTIONS = [
  { label: '1개월', months: 1, discount: 0 },
  { label: '3개월', months: 3, discount: 0.05 },   // 5% 할인
  { label: '6개월', months: 6, discount: 0.10 },   // 10% 할인
  { label: '1년', months: 12, discount: 0.17 },    // 2개월 무료 ≈ 17% 할인
];

// 월 기준 기본가 (원)
const BASE_PRICE: Record<string, number> = {
  free: 0,
  basic: 22000,
  standard: 66000,
  special: 88000,
  deluxe: 199000,
  premium: 399000,
};

function calcPrice(planKey: string, months: number, discount: number) {
  const monthly = BASE_PRICE[planKey] ?? 0;
  const total = Math.floor((monthly * months * (1 - discount)) / 100) * 100;
  return total.toLocaleString('ko-KR');
}

function calcMonthlyPrice(planKey: string, discount: number) {
  const monthly = BASE_PRICE[planKey] ?? 0;
  const price = Math.floor((monthly * (1 - discount)) / 100) * 100;
  return price.toLocaleString('ko-KR');
}

const tiers = [
  {
    name: '무료',
    badge: null,
    price: '0',
    description: '밤길 3개월 무료 체험',
    platforms: ['밤길'],
    features: [
      '밤길 지도 기본 핀 노출',
      '3개월 무료 체험',
      '※ 코코알바·웨이터존·선수존 미노출',
    ],
    cta: '무료로 시작하기',
    href: '/register?plan=free',
    mostPopular: false,
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-800',
    cardBg: 'bg-zinc-900/40',
    checkColor: 'text-zinc-500',
    btnClass: 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10',
    badgeClass: '',
  },
  {
    name: '베이직',
    badge: null,
    price: '22,000',
    description: '밤길 지도 + 웨이터 구인 시작',
    platforms: ['밤길', '웨이터존'],
    features: [
      '밤길 지도 기본 핀 노출',
      '웨이터존 구인 공고 등록',
      '합법 영업 인증 배지',
      '기본 운영 대시보드',
    ],
    cta: '베이직 시작하기',
    href: '/register?plan=basic',
    mostPopular: false,
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-800',
    cardBg: 'bg-zinc-900/40',
    checkColor: 'text-zinc-500',
    btnClass: 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10',
    badgeClass: '',
  },
  {
    name: '스탠다드',
    badge: null,
    price: '66,000',
    description: '밤길 + 구인 플랫폼 1개 선택',
    platforms: ['밤길', '코코알바 또는 선수존'],
    features: [
      '밤길 지도 표준 핀 노출',
      '코코알바·선수존 중 1개 선택',
      '구인 공고 등록',
      '합법 영업 인증 배지',
      '실시간 유입 통계',
    ],
    cta: '스탠다드 시작하기',
    href: '/register?plan=standard',
    mostPopular: false,
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-800/40',
    cardBg: 'bg-zinc-900/40',
    checkColor: 'text-emerald-500',
    btnClass: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    badgeClass: '',
  },
  {
    name: '스페셜',
    badge: 'Best Value',
    price: '88,000',
    description: '3개 플랫폼 동시 노출',
    platforms: ['밤길', '웨이터존', '코코알바 또는 선수존'],
    features: [
      '밤길 지도 강조 핀 노출',
      '웨이터존 구인 공고 등록',
      '코코알바·선수존 중 1개 선택',
      '광고 점프:\n자동 3회/일 + 수동 10회/월',
      '실시간 유입 통계',
      '합법 영업 인증 배지',
    ],
    cta: '스페셜 시작하기',
    href: '/register?plan=special',
    mostPopular: true,
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    cardBg: 'bg-zinc-900',
    checkColor: 'text-amber-500',
    btnClass: 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20',
    badgeClass: 'bg-amber-500 text-black',
  },
  {
    name: '디럭스',
    badge: null,
    price: '199,000',
    description: '강조 효과로 경쟁 업소 압도',
    platforms: ['밤길', '웨이터존', '코코알바 또는 선수존'],
    features: [
      '스페셜의 모든 기능 포함',
      '인기 업소 아이콘 강조 표시',
      '밤길 대형 핀 노출',
      '광고 점프:\n자동 6회/일 + 수동 30회/월',
    ],
    cta: '디럭스 시작하기',
    href: '/register?plan=deluxe',
    mostPopular: false,
    textColor: 'text-purple-400',
    borderColor: 'border-purple-700/40',
    cardBg: 'bg-zinc-900/60',
    checkColor: 'text-purple-400',
    btnClass: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30',
    badgeClass: '',
  },
  {
    name: '프리미엄',
    badge: 'ELITE',
    price: '399,000',
    description: 'PC·모바일 최상단 압도적 노출',
    platforms: ['밤길', '웨이터존', '코코알바 또는 선수존'],
    features: [
      '디럭스의 모든 기능 포함',
      'PC·모바일 목록 최상단 고정',
      '밤길 ELITE 핀 (최상단·대형)',
      '코코알바 프리미엄 크기 노출',
      '광고 점프:\n자동 8회/일 + 수동 30회/월\n+ 매일 +1회 추가',
      '우선 고객 지원',
    ],
    cta: '프리미엄 문의하기',
    href: '/register?plan=premium',
    mostPopular: false,
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    cardBg: 'bg-zinc-900/60',
    checkColor: 'text-yellow-400',
    btnClass: 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-500/30',
    badgeClass: 'bg-yellow-400 text-black',
  },
];

export default function Pricing() {
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[0]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollCards = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector('[class*="snap-center"]') as HTMLElement;
    const cardWidth = card ? card.offsetWidth + 16 : 300;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
  };

  return (
    <section id="pricing" className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">
            구독 플랜
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            비즈니스 성장에 맞는<br className="md:hidden" /> 플랜을 선택하세요
          </h3>
          <p className="text-zinc-500 text-base max-w-2xl mx-auto">
            하나의 구독으로 밤길·웨이터존·코코알바·선수존 동시 노출.<br className="hidden md:block" />
            언제든지 플랜 변경·해지 가능합니다.
          </p>
        </div>

        {/* 기간 선택 토글 */}
        <div className="flex bg-zinc-900 rounded-2xl p-1 border border-zinc-800 w-fit mx-auto mb-12 relative z-20 gap-0.5">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.months}
              onClick={() => setSelectedPeriod(opt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center min-w-[52px] ${
                selectedPeriod.months === opt.months
                  ? 'bg-amber-500 text-black shadow-lg'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{opt.label}</span>
              {opt.discount > 0 ? (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black mt-0.5 ${
                  selectedPeriod.months === opt.months ? 'bg-black/20 text-black' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  -{Math.round(opt.discount * 100)}%
                </span>
              ) : (
                <span className="h-[18px]" />
              )}
            </button>
          ))}
        </div>

        {/* 카드 그리드: 모바일 스와이프 / PC 3열 × 2행 (무료 + 5단계 = 6개) */}
        <div className="relative">
          {/* 모바일 좌우 화살표 */}
          <button
            onClick={() => scrollCards('left')}
            className="xl:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-zinc-800/90 border border-zinc-700 rounded-full text-white shadow-lg hover:bg-zinc-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollCards('right')}
            className="xl:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-zinc-800/90 border border-zinc-700 rounded-full text-white shadow-lg hover:bg-zinc-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>

        <div ref={scrollRef} className="
          flex xl:grid xl:grid-cols-3
          gap-4
          overflow-x-auto xl:overflow-visible
          snap-x snap-mandatory xl:snap-none
          -mx-4 px-8 xl:mx-0 xl:px-0
          pt-6
          pb-6 xl:pb-0
          [&::-webkit-scrollbar]:hidden
          [-ms-overflow-style:none]
          [scrollbar-width:none]
        ">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`
                relative flex flex-col rounded-3xl border p-5 transition-all duration-300
                flex-shrink-0 w-[80vw] sm:w-[58vw] md:w-[40vw] xl:w-auto
                snap-center
                ${tier.cardBg} ${tier.borderColor}
                ${tier.mostPopular ? 'shadow-[0_0_35px_rgba(245,158,11,0.12)] xl:scale-[1.04] xl:z-10' : ''}
              `}
            >
              {/* 배지 */}
              {tier.badge && (
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest flex items-center gap-1 shadow-md ${tier.badgeClass}`}>
                  <Zap size={10} className="fill-current" />
                  {tier.badge}
                </div>
              )}

              {/* 플랜명 + 설명 */}
              <div className="mb-4">
                <h4 className={`text-lg font-black mb-0.5 ${tier.textColor}`}>{tier.name}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">{tier.description}</p>
              </div>

              {/* 가격 */}
              <div className="mb-4">
                {tier.name === '무료' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">무료</span>
                    <span className="text-zinc-500 text-xs font-medium">/3개월</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xs text-zinc-500 font-medium">₩</span>
                      <span className="text-3xl font-extrabold text-white">
                        {calcMonthlyPrice(tier.name === '베이직' ? 'basic' :
                                   tier.name === '스탠다드' ? 'standard' :
                                   tier.name === '스페셜' ? 'special' :
                                   tier.name === '디럭스' ? 'deluxe' : 'premium',
                                   selectedPeriod.discount)}
                      </span>
                      <span className="text-zinc-500 text-xs font-medium">/월</span>
                    </div>
                    {selectedPeriod.months > 1 && (
                      <p className="text-[10px] text-zinc-600 mt-1 font-medium">
                        {selectedPeriod.label} 총 ₩{calcPrice(tier.name === '베이직' ? 'basic' :
                                   tier.name === '스탠다드' ? 'standard' :
                                   tier.name === '스페셜' ? 'special' :
                                   tier.name === '디럭스' ? 'deluxe' : 'premium',
                                   selectedPeriod.months, selectedPeriod.discount)}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* 플랫폼 칩 */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {tier.platforms.map((p) => (
                  <span
                    key={p}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      PLATFORM_CHIP[p] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* 기능 목록 */}
              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                    <Check size={13} className={`mt-0.5 shrink-0 ${tier.checkColor}`} />
                    <span className="whitespace-pre-line">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={tier.href}
                className={`w-full py-3 rounded-xl font-black text-center transition-all text-xs flex items-center justify-center ${tier.btnClass}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
        </div>

        {/* 모바일 스와이프 안내 */}
        <p className="xl:hidden text-center text-zinc-600 text-xs mt-4 font-medium">
          ← 좌우로 밀어 플랜 비교 →
        </p>

        {/* 하단 안내 */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-zinc-600 text-sm">무통장 입금 · 언제든 해지 가능</p>
          <p className="text-zinc-700 text-xs">
            구독 관련 문의: 카카오톡 채널{' '}
            <span className="text-amber-500/70">@야사장</span>
          </p>
        </div>
      </div>
    </section>
  );
}
