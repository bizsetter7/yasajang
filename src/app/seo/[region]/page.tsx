import { SEO_REGIONS } from '@/lib/regions';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  return SEO_REGIONS.map(r => ({ region: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const found = SEO_REGIONS.find(r => r.slug === region);
  if (!found) return {};
  
  return {
    title: `${found.display} 룸살롱 사장님 광고 플랫폼 | 야사장`,
    description: `${found.display} 유흥업 업소 광고, 야사장에서 시작하세요. 월 22,000원부터 밤길·웨이터존·코코알바 동시 노출.`,
    alternates: { canonical: `https://yasajang.kr/seo/${region}` },
    openGraph: {
      title: `${found.display} 유흥업 사장님 전용 광고 플랫폼 | 야사장`,
      description: `${found.display} 지역 업소를 야사장에 등록하면 밤길·웨이터존 동시 광고. 가장 저렴한 업소 광고 플랫폼.`,
    },
  };
}

export default async function RegionSeoPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  const found = SEO_REGIONS.find(r => r.slug === region);
  if (!found) notFound();

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-black text-amber-500 mb-8 tracking-tight">
          {found.display} 룸살롱·유흥업 사장님 광고 플랫폼 — 야사장
        </h1>
        
        <div className="prose prose-invert max-w-none mb-12">
          <p className="text-lg text-zinc-300 leading-relaxed">
            {found.display} 지역에서 유흥업소를 운영 중이신 사장님들을 위한 최고의 광고 솔루션, <strong>야사장</strong>입니다. 
            매월 부담스러운 광고비 때문에 고민이신가요? 야사장에서는 월 22,000원이라는 합리적인 비용으로 
            업소 홍보부터 구인 구직까지 한 번에 해결할 수 있습니다. 
            {found.display} 지역 최고의 유흥업소로 자리매김하기 위한 필수 선택, 이제 야사장과 함께하세요. 
            단 한 번의 등록으로 밤길, 웨이터존, 코코알바 등 다양한 유흥 전문 플랫폼에 귀하의 업소가 동시 노출되어 
            탁월한 광고 효과를 경험하실 수 있습니다. 지금 바로 시작해 보세요!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">베이직 플랜</h3>
            <p className="text-amber-500 text-3xl font-black mb-6">월 22,000원</p>
            <ul className="text-zinc-400 space-y-2 mb-8">
              <li>✅ 업소 기본 정보 등록</li>
              <li>✅ 밤길 일반 리스트 노출</li>
              <li>✅ 웨이터존 제휴 노출</li>
            </ul>
          </div>
          
          <div className="p-8 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">프리미엄 플랜</h3>
            <p className="text-amber-500 text-3xl font-black mb-6">월 399,000원</p>
            <ul className="text-zinc-400 space-y-2 mb-8">
              <li>⭐ 메인 최상단 VIP 노출</li>
              <li>⭐ 코코알바 구인 최우선 노출</li>
              <li>⭐ 전담 매니저 1:1 관리</li>
            </ul>
          </div>
        </div>

        <div className="text-center mb-16">
          <Link href="/register" className="inline-block px-10 py-5 bg-amber-500 text-black font-black rounded-2xl text-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">
            지금 업소 등록하기 →
          </Link>
        </div>

        <div className="pt-12 border-t border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-400 mb-6">다른 지역 둘러보기</h3>
          <div className="flex flex-wrap gap-3">
            {SEO_REGIONS.filter(r => r.slug !== region).map(r => (
              <Link 
                key={r.slug} 
                href={`/seo/${r.slug}`}
                className="px-4 py-2 bg-zinc-900 text-zinc-400 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors text-sm"
              >
                {r.display}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
