'use client';

import { useState } from 'react';
import { MapPin, Users, Briefcase, Star, ExternalLink } from 'lucide-react';

const PLATFORMS = [
  {
    key: 'bamgil',
    label: '밤길',
    url: 'bamgil.kr',
    icon: MapPin,
    color: 'text-amber-500',
    activeColor: 'border-amber-500 text-amber-500',
    tagline: '손님용 업소 탐색 지도',
    description: '영업시간·메뉴 등 정보만 입력하면\n손님이 알아서 찾아와요.',
    cta: '밤길 둘러보기',
    ctaHref: 'https://bamgil.kr',
    badge: '내 업소 노출\n지도에서 업소 위치가 표시돼요',
    mockup: 'map',
    mockupBg: 'from-zinc-800 to-zinc-900',
    pins: [
      { top: '30%', left: '25%', size: 'lg', plan: 'premium' },
      { top: '45%', left: '55%', size: 'md', plan: 'standard' },
      { top: '60%', left: '35%', size: 'md', plan: 'standard' },
      { top: '25%', left: '65%', size: 'sm', plan: 'basic' },
      { top: '70%', left: '70%', size: 'sm', plan: 'basic' },
    ],
    card: {
      name: '나이트클럽 루나',
      region: '서울 강남구',
      tag: '#유흥주점',
      sub: '오후 6시 ~ 새벽 4시',
      plan: 'PREMIUM',
    },
  },
  {
    key: 'waiterzone',
    label: '웨이터존',
    url: 'waiterzone.kr',
    icon: Users,
    color: 'text-blue-400',
    activeColor: 'border-blue-400 text-blue-400',
    tagline: '웨이터 구인 플랫폼',
    description: '오늘 당장 필요한 웨이터,\n오늘 바로 채용할 수 있어요.',
    cta: '웨이터존 둘러보기',
    ctaHref: 'https://waiterzone.kr',
    badge: '구인 노출 정보가\n바로 보여요',
    mockup: 'grid',
    mockupBg: 'from-slate-900 to-zinc-900',
    cards: [
      { name: '수 노래방', region: '#서울 #강남', wage: '월 4,500,000원', plan: 'N' },
      { name: '위상턴클럽', region: '#서울 #인천', wage: '월 3,800,000원', plan: 'N' },
      { name: '단테노래클럽', region: '#충남 #천안', wage: '월 200,000원', plan: '' },
      { name: '블리어링 광고', region: '#경기 #수원', wage: '월 120,000원', plan: '' },
    ],
  },
  {
    key: 'cocoalba',
    label: '코코알바',
    url: 'cocoalba.kr',
    icon: Briefcase,
    color: 'text-rose-400',
    activeColor: 'border-rose-400 text-rose-400',
    tagline: '아가씨·접객원 구인',
    description: '접객원 구인도 쉽고 간편하게,\n합법적으로 모집하세요.',
    cta: '코코알바 둘러보기',
    ctaHref: 'https://cocoalba.kr',
    badge: '아가씨 구인 정보가\n바로 보여요',
    mockup: 'grid',
    mockupBg: 'from-zinc-900 to-zinc-950',
    cards: [
      { name: '아우라(AURA)', region: '#서울 #강남', wage: '최저 TC 50,000원', plan: 'N' },
      { name: '갤럭시', region: '#경기 #성남', wage: '최저 TC 80,000원', plan: 'N' },
      { name: '상상음악홀', region: '#서울 #인천', wage: '최저 TC 70,000원', plan: '' },
      { name: '하루로', region: '#부산 #해운대', wage: '최저 TC 90,000원', plan: '' },
    ],
  },
  {
    key: 'sunsuzone',
    label: '선수존',
    url: 'sunsuzone.kr',
    icon: Star,
    color: 'text-purple-400',
    activeColor: 'border-purple-400 text-purple-400',
    tagline: '선수 구인 플랫폼',
    description: '업소 전문 선수 구인,\n빠르게 검증된 인재를 연결합니다.',
    cta: '선수존 둘러보기',
    ctaHref: 'https://sunsuzone.kr',
    badge: '선수 구인 정보가\n바로 보여요',
    mockup: 'grid',
    mockupBg: 'from-purple-950/30 to-zinc-950',
    cards: [
      { name: '블랙다이아', region: '#서울 #강남', wage: '일급 250,000원', plan: 'N' },
      { name: '럭셔리클럽', region: '#경기 #성남', wage: '일급 200,000원', plan: 'N' },
      { name: '클럽엘리트', region: '#부산 #해운대', wage: '일급 180,000원', plan: '' },
      { name: '골드나이트', region: '#대구 #중구', wage: '일급 160,000원', plan: '' },
    ],
  },
];

function MapMockup({ platform }: { platform: typeof PLATFORMS[0] }) {
  return (
    <div className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${platform.mockupBg} overflow-hidden`}>
      {/* 지도 격자 */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
      {/* 도로선 */}
      <div className="absolute top-[38%] left-0 right-0 h-[2px] bg-zinc-600/50" />
      <div className="absolute top-[60%] left-0 right-0 h-[2px] bg-zinc-600/30" />
      <div className="absolute left-[40%] top-0 bottom-0 w-[2px] bg-zinc-600/50" />
      <div className="absolute left-[65%] top-0 bottom-0 w-[2px] bg-zinc-600/30" />

      {/* 핀들 */}
      {platform.pins?.map((pin, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ top: pin.top, left: pin.left }}
        >
          <div className={`rounded-full shadow-lg flex items-center justify-center font-black text-white
            ${pin.plan === 'premium' ? 'w-7 h-7 text-[10px] bg-amber-500 shadow-amber-500/50' :
              pin.plan === 'standard' ? 'w-5 h-5 text-[9px] bg-blue-500 shadow-blue-500/50' :
              'w-3.5 h-3.5 bg-zinc-500'}`}>
            {pin.plan === 'basic' ? '' : i + 1}
          </div>
          <div className={`w-0.5 h-2 ${pin.plan === 'premium' ? 'bg-amber-500' : pin.plan === 'standard' ? 'bg-blue-500' : 'bg-zinc-500'}`} />
        </div>
      ))}

      {/* 말풍선 배지 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg text-center whitespace-pre leading-tight">
        {platform.badge}
      </div>

      {/* 하단 카드 */}
      {platform.card && (
        <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 border-t border-zinc-800 p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-700 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded">{platform.card.plan}</span>
              <span className="text-white text-[11px] font-bold truncate">{platform.card.name}</span>
            </div>
            <p className="text-zinc-500 text-[10px]">{platform.card.region}</p>
            <p className="text-zinc-500 text-[9px]">{platform.card.sub}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function GridMockup({ platform }: { platform: typeof PLATFORMS[0] }) {
  return (
    <div className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${platform.mockupBg} overflow-hidden p-3`}>
      {/* 헤더 필터 */}
      <div className="flex gap-1.5 mb-3">
        <div className="bg-zinc-800 rounded-full px-2 py-0.5 text-[9px] text-zinc-400">지역 전체 ▾</div>
        <div className="bg-zinc-800 rounded-full px-2 py-0.5 text-[9px] text-zinc-400">업종 전체 ▾</div>
        <div className="ml-auto bg-zinc-800 rounded-full px-2 py-0.5 text-[9px] text-zinc-400">인기순 ▾</div>
      </div>

      {/* 말풍선 배지 (첫 카드 위) */}
      <div className="absolute top-12 left-3 bg-amber-500 text-black text-[9px] font-black px-2 py-1 rounded-lg shadow-lg whitespace-pre leading-tight z-10">
        {platform.badge}
      </div>

      {/* 카드 그리드 2열 */}
      <div className="grid grid-cols-2 gap-2">
        {(platform.cards || []).map((card, i) => (
          <div key={i} className={`relative rounded-xl overflow-hidden bg-zinc-800 ${i === 0 ? 'ring-2 ring-amber-500' : ''}`}>
            <div className="h-14 bg-zinc-700 relative">
              {card.plan && (
                <span className="absolute top-1 right-1 bg-amber-500 text-black text-[8px] font-black px-1 py-0.5 rounded">
                  {card.plan}
                </span>
              )}
            </div>
            <div className="p-1.5">
              <p className="text-white text-[9px] font-bold truncate">{card.name}</p>
              <p className="text-zinc-500 text-[8px]">{card.region}</p>
              <p className="text-amber-400 text-[8px] font-bold">{card.wage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlatformShowcase() {
  const [active, setActive] = useState(0);
  const platform = PLATFORMS[active];

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* bg glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(245,158,11,0.04)_0%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* 타이틀 */}
        <div className="text-center mb-12">
          <h2 className="text-amber-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">노출 효과</h2>
          <h3 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            여기에 노출됩니다
          </h3>
          <p className="text-zinc-500 text-base">
            야사장 하나로 손님유입부터 직원채용까지 한번에
          </p>
        </div>

        {/* 탭 */}
        <div className="flex justify-center mb-12">
          <div className="flex gap-1 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-1.5">
            {PLATFORMS.map((p, i) => (
              <button
                key={p.key}
                onClick={() => setActive(i)}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 min-w-[64px] ${
                  active === i
                    ? `bg-zinc-800 border ${p.activeColor}`
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <p.icon size={16} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* 폰 목업 */}
          <div className="flex justify-center">
            <div className="relative">
              {/* 폰 프레임 */}
              <div className="w-[220px] h-[440px] bg-zinc-950 rounded-[36px] border-4 border-zinc-800 shadow-2xl shadow-black/60 overflow-hidden relative">
                {/* 상단 노치 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-zinc-950 rounded-b-2xl z-20" />
                {/* 상태바 */}
                <div className="absolute top-1 left-0 right-0 flex justify-between items-center px-5 z-10">
                  <span className="text-white text-[8px] font-bold">9:41</span>
                  <span className="text-white text-[8px]">▪▪▪</span>
                </div>
                {/* 앱 헤더 */}
                <div className="absolute top-5 left-0 right-0 px-3 z-10">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-black ${platform.color}`}>{platform.label}</span>
                    <div className="flex gap-2 text-zinc-400">
                      <span className="text-xs">🔍</span>
                      <span className="text-xs">☰</span>
                    </div>
                  </div>
                </div>
                {/* 콘텐츠 영역 */}
                <div className="absolute inset-0 top-12 bottom-0">
                  {platform.mockup === 'map'
                    ? <MapMockup platform={platform} />
                    : <GridMockup platform={platform} />
                  }
                </div>
              </div>

              {/* glow */}
              <div className={`absolute -inset-4 rounded-full blur-3xl opacity-10 pointer-events-none
                ${active === 0 ? 'bg-amber-500' : active === 1 ? 'bg-blue-500' : active === 2 ? 'bg-rose-500' : 'bg-purple-500'}`} />
            </div>
          </div>

          {/* 텍스트 설명 */}
          <div className="space-y-6">
            <div>
              <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3 ${platform.color}`}>
                <platform.icon size={14} />
                {platform.url}
              </div>
              <h4 className="text-3xl font-black text-white mb-3 leading-tight">
                {platform.tagline}
              </h4>
              <p className="text-zinc-400 text-lg leading-relaxed whitespace-pre-line">
                {platform.description}
              </p>
            </div>

            <div className="space-y-3">
              {active === 0 && (
                <>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">카카오맵 기반 풀스크린 지도에 업소 핀으로 표시</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">프리미엄일수록 더 크고 눈에 띄는 핀으로 상위 노출</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">로그인 없이 누구나 바로 조회 → 손님 유입 극대화</p>
                  </div>
                </>
              )}
              {active === 1 && (
                <>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">웨이터 전문 구직 플랫폼에 구인 공고 자동 게재</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">지역·업종 필터로 딱 맞는 웨이터에게 바로 노출</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">중간 수수료 없이 구직자와 직접 연결</p>
                  </div>
                </>
              )}
              {active === 2 && (
                <>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">여성 구직자 전문 플랫폼 코코알바에 구인 공고 노출</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">TC·급여 정보 카드로 지원자가 직접 선택</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">합법 인증 배지로 신뢰도 있는 업소 이미지 구축</p>
                  </div>
                </>
              )}
              {active === 3 && (
                <>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">업소 전문 선수 구인 플랫폼 선수존에 공고 자동 게재</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">일급·조건 카드로 검증된 선수에게 바로 노출</p>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                    <p className="text-zinc-400 text-xs">중간 수수료 없이 선수와 업소 직접 연결</p>
                  </div>
                </>
              )}
            </div>

            <a
              href={platform.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 text-sm font-bold transition-colors ${platform.color} hover:opacity-80`}
            >
              {platform.cta} <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
