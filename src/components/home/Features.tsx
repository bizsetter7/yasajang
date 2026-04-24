import { Shield, Zap, Target, BarChart, Users, MapPin } from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: '📍 밤길 지도 핀 노출',
      description: '내 업소가 밤길 지도에 핀으로 표시됩니다. 근처에 있는 손님이 실시간으로 위치를 확인하고 찾아옵니다. 프리미엄일수록 더 크고 눈에 띄는 핀으로 노출됩니다.',
      icon: MapPin,
      color: 'text-amber-500',
    },
    {
      title: '👔 웨이터 · 아가씨 구인',
      description: '빈자리가 생겼을 때 빠르게 구인 공고를 올리세요. 검증된 지원자들이 직접 연락합니다. 구직자와 업소를 직접 연결해 중간 수수료 없이 채용합니다.',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: '🛡️ 합법 영업 인증 배지',
      description: '영업허가 확인을 통과한 업소에 합법 인증 배지가 부여됩니다. 손님은 인증된 업소를 신뢰하고, 사장님은 신뢰도 있는 이미지로 더 많은 고객을 유치합니다.',
      icon: Shield,
      color: 'text-emerald-500',
    },
    {
      title: '📊 실시간 운영 대시보드',
      description: '내 업소 프로필 조회수, 전화 클릭수, 오픈톡 유입을 실시간으로 확인하세요. 어떤 요일, 어떤 시간대에 손님이 가장 많이 보는지 데이터로 파악합니다.',
      icon: BarChart,
      color: 'text-purple-500',
    },
    {
      title: '⚡ 광고 점프 기능',
      description: '목록 최상단으로 내 업소를 끌어올리는 점프 기능으로 경쟁 업소를 압도하세요. 스페셜 이상 구독 시 매일 무제한 점프가 가능합니다.',
      icon: Zap,
      color: 'text-yellow-500',
    },
    {
      title: '🎯 타겟 광고 노출',
      description: '특정 지역, 특정 카테고리를 검색하는 손님에게 정확히 노출됩니다. 불특정 다수 광고비를 절감하고, 실제 방문 의사가 있는 고객에게만 노출합니다.',
      icon: Target,
      color: 'text-indigo-500',
    },
  ];

  return (
    <section id="features" className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">
            야사장이 하는 일
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            손님 유입부터 직원 채용까지<br className="md:hidden" /> 모든 것을 해결합니다
          </h3>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            코코알바·웨이터나라·희야 등 여러 플랫폼에 따로 광고할 필요 없습니다.<br className="hidden md:block" />
            야사장 하나로 손님 모집, 직원 구인, 합법 인증까지 한 번에.
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
