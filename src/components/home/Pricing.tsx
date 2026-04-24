'use client';

import { Check, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Pricing() {
  const tiers = [
    {
      name: '베이직',
      badge: null,
      price: '₩99,000',
      period: '/월',
      description: '야사장 시작을 위한 기본 등록 플랜',
      features: [
        '야사장 업소 프로필 등록',
        '밤길 지도 기본 핀 노출 (회색·소형)',
        '합법 영업 인증 배지',
        '월 3회 광고 점프 기능',
        '기본 운영 대시보드',
        '사장님 커뮤니티 읽기/쓰기 권한',
      ],
      cta: '베이직으로 시작하기',
      href: '/register?tier=basic',
      mostPopular: false,
      accentColor: 'text-zinc-400',
      borderColor: 'border-zinc-800',
    },
    {
      name: '스탠다드',
      badge: 'Most Popular',
      price: '₩199,000',
      period: '/월',
      description: '손님 유입을 극대화하는 핵심 플랜',
      features: [
        '베이직의 모든 기능 포함',
        '밤길 지도 강조 핀 (파란색·중형)',
        '매일 무제한 광고 점프',
        '구인 광고 월 5건',
        '실시간 조회수·클릭수 통계',
        '스탠다드 배지 표시',
        '전화 클릭 알림',
      ],
      cta: '스탠다드로 시작하기',
      href: '/register?tier=standard',
      mostPopular: true,
      accentColor: 'text-amber-500',
      borderColor: 'border-amber-500/50',
    },
    {
      name: '프리미엄',
      badge: 'ELITE',
      price: '₩499,000',
      period: '/월',
      description: '압도적 노출로 업계 최상위를 목표로',
      features: [
        '스탠다드의 모든 기능 포함',
        '밤길 지도 ELITE 핀 (주황·대형·최상단)',
        '구인 광고 무제한',
        '메인 배너 광고 노출',
        '전담 매니저 배정',
        '맞춤 마케팅 전략 상담',
        '우선 고객 지원 (24시간)',
      ],
      cta: '프리미엄 문의하기',
      href: '/register?tier=premium',
      mostPopular: false,
      accentColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 md:mb-20">
          <h2 className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">
            구독 플랜
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            비즈니스 성장에<br className="md:hidden" /> 맞는 플랜을 선택하세요
          </h3>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            무료로 시작해서 성과에 따라 업그레이드하세요.<br className="hidden md:block" />
            언제든지 플랜 변경·해지가 가능합니다.
          </p>
        </div>

        {/* 모바일: 가로 스와이프 / PC: 3열 그리드 */}
        <div className="
          flex md:grid md:grid-cols-3
          gap-5
          overflow-x-auto md:overflow-visible
          snap-x snap-mandatory md:snap-none
          -mx-4 px-4 md:mx-0 md:px-0
          pb-6 md:pb-0
          scroll-smooth
          [&::-webkit-scrollbar]:hidden
          [-ms-overflow-style:none]
          [scrollbar-width:none]
        ">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`
                relative p-7 rounded-3xl border transition-all duration-300
                flex-shrink-0 w-[82vw] sm:w-[70vw] md:w-auto
                snap-center
                ${tier.mostPopular
                  ? 'bg-zinc-900 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.12)] md:scale-105 md:z-10'
                  : tier.name === '프리미엄'
                  ? 'bg-zinc-900/60 border-yellow-500/25'
                  : 'bg-zinc-900/50 border-zinc-800'
                }
              `}
            >
              {/* 배지 */}
              {tier.badge && (
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black text-[10px] uppercase font-black px-4 py-1.5 rounded-full tracking-widest flex items-center shadow-lg ${
                  tier.name === '프리미엄' ? 'bg-yellow-400' : 'bg-amber-500'
                }`}>
                  <Zap size={11} className="mr-1 fill-black" /> {tier.badge}
                </div>
              )}

              {/* 플랜명 */}
              <div className="mb-6">
                <h4 className={`text-xl font-black mb-1 ${tier.accentColor}`}>{tier.name}</h4>
                <p className="text-zinc-500 text-sm">{tier.description}</p>
              </div>

              {/* 가격 */}
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                {tier.period && (
                  <span className="text-zinc-500 ml-1 font-medium text-sm">{tier.period}</span>
                )}
              </div>

              {/* 기능 목록 */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start text-sm text-zinc-400">
                    <Check
                      size={16}
                      className={`mr-2.5 mt-0.5 shrink-0 ${
                        tier.mostPopular ? 'text-amber-500' : tier.name === '프리미엄' ? 'text-yellow-400' : 'text-zinc-600'
                      }`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`w-full py-4 rounded-xl font-black text-center transition-all flex items-center justify-center text-sm ${
                  tier.mostPopular
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                    : tier.name === '프리미엄'
                    ? 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* 모바일 스와이프 안내 */}
        <p className="md:hidden text-center text-zinc-600 text-xs mt-4 font-medium">
          ← 좌우로 밀어 플랜 비교 →
        </p>

        {/* 하단 안내 */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-zinc-600 text-sm">카드 자동결제 · 언제든 해지 가능 · 연간 결제 시 2개월 무료</p>
          <p className="text-zinc-700 text-xs">구독 관련 문의: 카카오톡 채널 <span className="text-amber-500/70">@야사장</span></p>
        </div>
      </div>
    </section>
  );
}
