# BRIEFING — P5 야사장 Week 10 (SEO/GEO + 코코알바 위젯 + 메뉴등록)
> 작성: 코부장 (Claude Code) | 2026-04-26
> 필독 선행문서:
> 1. `D:\토탈프로젝트\My-site\p1.choco-idea\MISTAKES_LOG.md`
> 2. `D:\토탈프로젝트\My-site\p1.choco-idea\MASTER_PLAN_CocoEcosystem_20260426.md`
> 3. `D:\토탈프로젝트\My-site\p5.야사장\BRIEFING_AntiGravity_20260425_Week9.md` (이전 작업 확인)

---

## 배경

Week 8~9 완료 상태:
- 영업허가증 업로드, 영업시간, 메뉴카테고리, 미리보기 UI ✅
- 데이터 파이프라인(applications/messages) 수정 ✅ (P2 대응)
- `businesses.permit_path TEXT` 컬럼 추가 완료 ✅

이번 주 목표: **SEO/GEO 지역별 정적 랜딩 + 코코알바 연동 위젯 + 메뉴/가격 필수등록**

---

## 🔴 Task 1: 지역별 SEO 정적 랜딩페이지 (P3 방식 적용)

### 목표 키워드
- "[지역] 룸살롱 사장님"
- "[지역] 유흥업 업소 관리"
- "업소 광고 저렴"

### 1-A. 타겟 지역 상수 파일 생성

**파일 신규**: `src/lib/regions.ts`

```ts
export const SEO_REGIONS = [
  { slug: 'gangnam',  name: '강남', display: '강남' },
  { slug: 'seoul',    name: '서울', display: '서울' },
  { slug: 'busan',    name: '부산', display: '부산' },
  { slug: 'daegu',    name: '대구', display: '대구' },
  { slug: 'incheon',  name: '인천', display: '인천' },
  { slug: 'suwon',    name: '수원', display: '수원' },
  { slug: 'daejeon',  name: '대전', display: '대전' },
  { slug: 'gwangju',  name: '광주', display: '광주' },
  { slug: 'ulsan',    name: '울산', display: '울산' },
  { slug: 'jeonju',   name: '전주', display: '전주' },
  { slug: 'cheongju', name: '청주', display: '청주' },
  { slug: 'changwon', name: '창원', display: '창원' },
  { slug: 'pohang',   name: '포항', display: '포항' },
  { slug: 'jeju',     name: '제주', display: '제주' },
  { slug: 'anyang',   name: '안양', display: '안양' },
  { slug: 'goyang',   name: '고양', display: '고양' },
  { slug: 'yongin',   name: '용인', display: '용인' },
] as const;

export type RegionSlug = typeof SEO_REGIONS[number]['slug'];
```

### 1-B. 지역별 정적 랜딩페이지 생성

**파일 신규**: `src/app/seo/[region]/page.tsx`

구조:
```tsx
import { SEO_REGIONS } from '@/lib/regions';
import { notFound } from 'next/navigation';

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
    alternates: { canonical: `/seo/${region}` },
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
    <main>
      {/* H1 최상단 */}
      <h1>{found.display} 룸살롱·유흥업 사장님 광고 플랫폼 — 야사장</h1>
      {/* 간결한 소개 텍스트 (최소 200자 이상 — SEO 필수) */}
      {/* 플랜 소개 카드 (베이직 22k ~ 프리미엄 399k) */}
      {/* CTA: 지금 등록하기 → /register */}
      {/* 내부 링크: 다른 지역 SEO 페이지들 */}
    </main>
  );
}
```

> **M-029 준수**: canonical URL에 트레일링 슬래시 금지.
> **M-006 준수**: 지역명은 SEO_REGIONS에서 가져오고 하드코딩 금지.

### 1-C. sitemap.xml 자동 생성

**파일 신규**: `src/app/sitemap.ts`

```ts
import { SEO_REGIONS } from '@/lib/regions';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://yasajang.kr';
  const regionPages = SEO_REGIONS.map(r => ({
    url: `${base}/seo/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/plans`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    ...regionPages,
  ];
}
```

### 1-D. robots.txt

**파일 신규**: `src/app/robots.ts`

```ts
import { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/dashboard'] },
    ],
    sitemap: 'https://yasajang.kr/sitemap.xml',
  };
}
```

---

## 🟠 Task 2: 코코알바 읽기전용 연동 위젯 (대시보드)

대시보드 메인 화면에 "내 코코알바 공고 현황" 카드 추가.
클릭 시 `https://cocoalba.kr/my-shop` 새탭 이동 (외부 링크, iframe 아님).

**파일**: `src/app/dashboard/page.tsx` (또는 대시보드 메인 컴포넌트)

### 구현 내용

코코알바 공고 수는 **Supabase 공유 DB**에서 직접 조회 (동일 프로젝트):

```tsx
// 대시보드 서버 컴포넌트에서
const { count } = await supabase
  .from('shops')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('source', 'cocoalba'); // source 컬럼이 없으면 단순 count만 표시
```

위젯 UI:
```tsx
<a
  href="https://cocoalba.kr/my-shop"
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  <div>코코알바 내 공고 현황</div>
  <div>{shopCount}개 공고 활성 중</div>
  <span>코코알바에서 관리 →</span>
</a>
```

> shops 테이블에 source 컬럼이 없으면: count 쿼리 없이 "코코알바 바로가기" 링크 카드만 표시해도 OK.
> 과도한 구현 금지 — 읽기전용 링크 위젯 수준으로.

---

## 🟡 Task 3: 메뉴/가격 필수등록 필드 추가 (업소등록 2단계)

**경쟁사 벤치마크**: 밤사장은 업소정보 2단계에서 대표메뉴·주류메뉴·안주메뉴와 가격을 필수 입력 받음.

업소 상세 페이지에서 메뉴/가격 정보가 보이면 사용자 신뢰도 상승.

### 3-A. DB 컬럼 추가 (대표님이 SQL 실행)

```sql
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS menu_main    TEXT,   -- 대표메뉴 (예: "양주 1병 80,000원")
  ADD COLUMN IF NOT EXISTS menu_liquor  TEXT,   -- 주류메뉴 목록 (줄바꿈 구분)
  ADD COLUMN IF NOT EXISTS menu_snack   TEXT;   -- 안주메뉴 목록
```

### 3-B. 업소 등록 폼에 메뉴 입력 섹션 추가

**파일**: `src/app/register/` 또는 업소등록 컴포넌트

```tsx
{/* 메뉴/가격 정보 섹션 */}
<section>
  <h3>메뉴 및 가격 정보</h3>
  <p className="text-sm text-zinc-400">메뉴 정보를 입력하면 손님 신뢰도가 높아집니다</p>

  <label>대표 메뉴</label>
  <input placeholder="예: 양주 1병 80,000원" name="menu_main" />

  <label>주류 메뉴 (줄바꿈으로 구분)</label>
  <textarea placeholder="예: 맥주 5,000원\n소주 4,000원" name="menu_liquor" rows={3} />

  <label>안주 메뉴 (줄바꿈으로 구분)</label>
  <textarea placeholder="예: 안주모듬 20,000원\n과일 30,000원" name="menu_snack" rows={3} />
</section>
```

### 3-C. 업소 상세 페이지 표시

`/dashboard/preview` 또는 밤길 연동 상세 페이지에 메뉴 섹션 추가:
```tsx
{business.menu_main && (
  <div>
    <h4>메뉴 정보</h4>
    <p>{business.menu_main}</p>
    {/* menu_liquor, menu_snack 동일 */}
  </div>
)}
```

---

## 📋 검증 절차

1. `npm run build` — 에러 0건 필수
2. `/seo/gangnam` 접속 → 메타태그 확인 (브라우저 소스 보기)
3. `/sitemap.xml` 접속 → 17개 지역 URL 포함 확인
4. `/robots.txt` 접속 → `/admin` disallow 확인
5. 대시보드 로그인 → "코코알바 내 공고 현황" 위젯 표시 확인
6. 업소 등록 페이지 → 메뉴 입력 필드 표시 확인

---

## 절대 금지

1. canonical/og:url에 트레일링 슬래시 금지 (M-029)
2. 지역명 하드코딩 금지 — 반드시 SEO_REGIONS 상수에서 참조 (M-006)
3. 파일 전체 덮어쓰기 금지 — Edit 핀셋 수정만
4. `next.config.ts`에서 `ignoreBuildErrors` 재추가 금지
5. 빌드 에러 있는 상태에서 "완료" 보고 금지
