import { Check, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Pricing() {
  const tiers = [
    {
      name: 'Basic',
      price: 'Free',
      description: '비즈니스 네트워크의 시작',
      features: [
        '기본 업소 프로필 등록',
        '월 1회 무료 점프 기능',
        '커뮤니티 읽기/쓰기 권한',
        '기본 대시보드 제공',
      ],
      cta: '무료로 시작하기',
      href: '/register',
      mostPopular: false,
    },
    {
      name: 'Business Pro',
      price: '₩99,000',
      period: '/month',
      description: '압도적인 마케팅 성과를 위해',
      features: [
        'Basic 서비스의 모든 기능',
        '일일 점프 기능 (무제한)',
        '최상단 배너 광고 노출',
        '프로필 강조 효과 (Premium Badge)',
        '실시간 예약 알림 시스템',
        '우선 순위 고객 지원',
      ],
      cta: '프로로 업그레이드',
      href: '/register?tier=pro',
      mostPopular: true,
    },
    {
      name: 'Enterprise',
      price: '상담문의',
      description: '대규모 프랜차이즈를 위한 솔루션',
      features: [
        'Pro 서비스의 모든 기능',
        '다중 사업소 통합 관리',
        '전용 계정 관리자 배정',
        '맞춤형 마케팅 전략 수립',
        'API 연동 서비스',
        '오프라인 이벤트 브랜딩 지원',
      ],
      cta: '문의하기',
      href: '/contact',
      mostPopular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">
            Membership Plans
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            비즈니스 성장에<br className="md:hidden" /> 최적화된 멤버십
          </h3>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            당신의 사업 규모에 맞는 최적의 플랜을 선택하여 최고의 마케팅 성과를 거두세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                tier.mostPopular
                  ? 'bg-zinc-900 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.1)] scale-105 z-10'
                  : 'bg-zinc-900/50 border-zinc-800 scale-100'
              }`}
            >
              {tier.mostPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black text-[10px] uppercase font-black px-4 py-1.5 rounded-full tracking-widest flex items-center shadow-lg">
                  <Zap size={12} className="mr-1 fill-black" /> Most Popular
                </div>
              )}

              <div className="mb-8">
                <h4 className="text-xl font-bold text-white mb-2">{tier.name}</h4>
                <p className="text-zinc-500 text-sm">{tier.description}</p>
              </div>

              <div className="mb-10">
                <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                {tier.period && (
                  <span className="text-zinc-500 ml-1 font-medium">{tier.period}</span>
                )}
              </div>

              <ul className="space-y-4 mb-10">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start text-sm text-zinc-400">
                    <Check
                      size={18}
                      className={`mr-3 mt-0.5 shrink-0 ${
                        tier.mostPopular ? 'text-amber-500' : 'text-zinc-600'
                      }`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`w-full py-4 rounded-xl font-bold text-center transition-all flex items-center justify-center ${
                  tier.mostPopular
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
