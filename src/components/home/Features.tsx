import { Shield, Zap, Target, BarChart, Users, Globe } from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: '엄격한 멤버십 관리',
      description: '아무나 입점할 수 없습니다. 신원 확인 및 업소 실사를 통과한 검증된 비즈니스 파트너만을 선별합니다.',
      icon: Shield,
      color: 'text-amber-500',
    },
    {
      title: '압도적 마케팅 솔루션',
      description: '타겟 고객에게 정확히 노출되는 정교한 광고 시스템과 점프 기능을 통해 비즈니스 효율을 극대화합니다.',
      icon: Target,
      color: 'text-blue-500',
    },
    {
      title: '실시간 데이터 분석',
      description: '방문자 트래픽, 클릭률, 고객 선호도 등을 실시간으로 분석하여 대시보드로 제공합니다.',
      icon: BarChart,
      color: 'text-emerald-500',
    },
    {
      title: '프리미엄 네트워크',
      description: '업계 최고의 리더들이 모인 프라이빗 커뮤니티에서 실시간 정보를 공유하고 전략적 파트너십을 맺으세요.',
      icon: Users,
      color: 'text-purple-500',
    },
    {
      title: '업계 최저 수수료',
      description: '불필요한 중간 수수료를 제거하고 투명한 결제 시스템을 통해 사업주의 이익을 최우선으로 생각합니다.',
      icon: Zap,
      color: 'text-yellow-500',
    },
    {
      title: '글로벌 확장성',
      description: '전국 주요 지역은 물론, 해외 시장 진출을 위한 다양한 마케팅 지원 시스템을 갖추고 있습니다.',
      icon: Globe,
      color: 'text-indigo-500',
    },
  ];

  return (
    <section id="features" className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">
            Our Excellence
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            평범함을 거부하는<br className="md:hidden" /> 초격차 비즈니스 지원
          </h3>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            야사장은 사업주의 성공을 위해 필요한 모든 기술적, 네트워킹적 요소를 집약했습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 transform hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center mb-6 border border-zinc-800 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300">
                <feature.icon className={index === 0 ? 'text-amber-500 group-hover:text-black' : feature.color + ' group-hover:text-black'} size={28} />
              </div>
              <h4 className="text-xl font-bold text-white mb-4 group-hover:text-amber-400 transition-colors">
                {feature.title}
              </h4>
              <p className="text-zinc-500 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Blur */}
      <div className="absolute top-1/2 left-0 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />
    </section>
  );
}
