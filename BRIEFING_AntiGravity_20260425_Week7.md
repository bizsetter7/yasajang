# BRIEFING — 안티그래비티 Week 7 지시서
> 작성: 코부장 (Claude Code) | 날짜: 2026-04-25
> 필독 선행문서: `D:\토탈프로젝트\My-site\p1.choco-idea\MISTAKES_LOG.md`

---

## Week 6 인수인계 메모

- **P5/P2/P6** git push + Vercel 배포 완료
- **P6 views 컬럼** SQL 추가 완료 (`businesses.views INTEGER DEFAULT 0`)
- **P9 웨이터존** 랜딩 페이지만 구현됨 — Vercel/DNS 미연결 상태
- **P2 ShopDetailView** 파일은 존재하나 아무 라우트에도 연결 안 됨 (Week 7 핵심)

---

## 🔴 핵심 배경 — P2 광고 상세 데이터 파이프라인 (반드시 이해 후 작업)

현재 P2 코코알바는 **6개 진입점이 단일 컴포넌트(`JobDetailContent`)로 통일**되어 있음.
이 구조를 깨지 않으면서 `ShopDetailView`(희야야 스타일)로 교체하는 것이 이번 Week 7 핵심.

```
[진입점 1] 퍼블릭 목록 카드 클릭
  → JobDetailModal(modal) → JobDetailContent(shop: Shop)
  파일: src/components/jobs/JobDetailModal.tsx:653

[진입점 2] 퍼블릭 상세 URL /coco/[region]/[id]/
  → SSG 정적JSON → JobDetailContent(shop: Shop)
  파일: src/app/coco/[region]/[id]/page.tsx:289

[진입점 3] 퍼블릭 상세 URL /jobs/[id]/
  → JobDetailContent(shop: Shop)
  파일: src/app/jobs/[id]/page.tsx:132

[진입점 4+5] my-shop 진행중공고 / 결제내역 클릭
  → AdDetailModal → anyAdToShop(ad) → JobDetailContent(shop, onClose)
  파일: src/app/my-shop/components/AdDetailModal.tsx:32

[진입점 6] 어드민 광고심사 / 결제내역 클릭
  → anyAdToShop(selectedAdForModal) → JobDetailContent(shop, onClose)
  파일: src/app/admin/page.tsx:662~665
```

**교체 원칙:**
- `anyAdToShop()` 어댑터 **절대 수정 금지** — 이게 통일 파이프라인의 핵심
- `ShopDetailView`의 props는 `JobDetailContent`와 동일: `shop: Shop, onClose?: () => void`
- 6개 진입점 **전부** 교체. 일부만 하면 UI 불일치 발생

---

## Task 1: P2 코코알바 — ShopDetailView 6개 진입점 전면 교체

### 1-A. AdDetailModal.tsx (my-shop 팝업 — 진입점 4+5)

**파일:** `src/app/my-shop/components/AdDetailModal.tsx`

```tsx
// 변경 전
import { JobDetailContent } from '@/components/jobs/JobDetailModal';
// ...
<JobDetailContent shop={shop} onClose={onClose} />

// 변경 후
import ShopDetailView from '@/components/jobs/ShopDetailView';
// ...
<ShopDetailView shop={shop} onClose={onClose} />
```

모달 컨테이너(div 구조) 그대로 유지. 내부 컴포넌트만 교체.

### 1-B. admin/page.tsx (어드민 팝업 — 진입점 6)

**파일:** `src/app/admin/page.tsx`

```tsx
// 변경 전 (line 33)
import { JobDetailContent } from '@/components/jobs/JobDetailModal';
// 변경 후
import ShopDetailView from '@/components/jobs/ShopDetailView';

// 변경 전 (line 662~665)
<JobDetailContent
  shop={anyAdToShop(selectedAdForModal)}
  onClose={() => setSelectedAdForModal(null)}
/>
// 변경 후
<ShopDetailView
  shop={anyAdToShop(selectedAdForModal)}
  onClose={() => setSelectedAdForModal(null)}
/>
```

### 1-C. /coco/[region]/[id]/page.tsx (퍼블릭 상세 URL — 진입점 2)

**파일:** `src/app/coco/[region]/[id]/page.tsx`

```tsx
// 변경 전 (line 3)
import JobDetailModal, { JobDetailContent } from '@/components/jobs/JobDetailModal';
// 변경 후
import ShopDetailView from '@/components/jobs/ShopDetailView';

// 변경 전 (line 289)
<JobDetailContent shop={shop} />
// 변경 후
<ShopDetailView shop={shop} />
```

> ⚠️ `generateStaticParams` 건드리지 말 것. SSG 구조 유지.
> 빌드 후 `/coco/서울/...` 같은 URL에서 새 디자인 확인.

### 1-D. /jobs/[id]/page.tsx (퍼블릭 상세 URL — 진입점 3)

**파일:** `src/app/jobs/[id]/page.tsx`

```tsx
// 변경 전 (line 7)
import { JobDetailContent } from '@/components/jobs/JobDetailModal';
// 변경 후
import ShopDetailView from '@/components/jobs/ShopDetailView';

// 변경 전 (line 132)
<JobDetailContent shop={shop} />
// 변경 후
<ShopDetailView shop={shop} />
```

### 1-E. JobDetailModal.tsx (퍼블릭 목록 모달 — 진입점 1)

**파일:** `src/components/jobs/JobDetailModal.tsx`

line 653 근처:
```tsx
// 변경 전
<JobDetailContent shop={...} onClose={...} />
// 변경 후
import ShopDetailView from './ShopDetailView';
<ShopDetailView shop={...} onClose={...} />
```

> ⚠️ `JobDetailContent` 함수 자체는 삭제하지 말 것.
> 다른 곳에서 참조하고 있을 수 있으므로 일단 유지, 사용처만 교체.

---

## Task 2: P2 코코알바 — ShopDetailView에 cocoalba_tier 배지 추가

**목표:** 상세 페이지 상단에 야사장 구독 등급 배지 표시 (스탠다드/프리미엄).

**파일:** `src/components/jobs/ShopDetailView.tsx`

상단 업소명/급여 영역에 아래 로직 추가:

```tsx
const [tier, setTier] = useState<string | null>(null);

useEffect(() => {
  if (!shop.user_id) return;
  const supabase = createClient(); // @/lib/supabase (client)
  supabase
    .from('businesses')
    .select('cocoalba_tier')
    .eq('owner_id', shop.user_id)
    .single()
    .then(({ data }) => {
      if (data?.cocoalba_tier) setTier(data.cocoalba_tier);
    });
}, [shop.user_id]);

// 배지 렌더링 (업소명 옆)
{tier === 'premium' && (
  <span className="text-[10px] bg-yellow-400 text-black font-black px-2 py-0.5 rounded-full">
    PREMIUM
  </span>
)}
{tier === 'standard' && (
  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
    스탠다드
  </span>
)}
```

> P2 Supabase client import 경로: `@/lib/supabase` (P2 기존 방식 확인 후 사용)

---

## Task 3: P9 웨이터존 — Vercel 연결 + DNS + 기본 페이지 완성

### 3-A. GitHub + Vercel 연결

```bash
cd "D:\토탈프로젝트\My-site\p9.웨이터존\waiterzone"
git init
git add .
git commit -m "feat: initial waiterzone setup"
# GitHub에서 bizsetter7/waiterzone 레포 생성 후:
git remote add origin https://github.com/bizsetter7/waiterzone.git
git push -u origin main
```

Vercel:
- New Project → `bizsetter7/waiterzone` import
- 환경변수 추가: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (P5와 동일값)
- 도메인: `waiterzone.kr` 연결 (A레코드 76.76.21.21 + CNAME www → cname.vercel-dns.com)

### 3-B. 기본 페이지 추가

아직 없는 페이지 2개 추가:

**로그인 모달** (`src/components/auth/AuthModal.tsx`)
P5 야사장 AuthModal.tsx를 그대로 복사 후 파란색 브랜딩으로 수정:
- amber-500 → blue-500
- "야사장 로그인" → "웨이터존 로그인"

**구인목록** (`src/app/jobs/page.tsx`)
- Supabase `businesses` 테이블에서 `cocoalba_tier IN ('standard', 'premium')` 조회
- 단, `platform_choice = 'seonsuzone'`인 항목만 표시
  ```ts
  .from('businesses')
  .select('*')
  .eq('platform_choice', 'seonsuzone') // 또는 subscriptions 조인
  ```
  > 실제 필터 방법: businesses → subscriptions 조인 후 platform_choice 확인 필요
- 카드 UI는 P6 밤길 HomeClient 카드 스타일 참고 (파란색 테마)

---

## 완료 기준

- [ ] P2: 6개 진입점 전부 ShopDetailView 표시 확인
  - 퍼블릭 목록 모달, 퍼블릭 상세 URL, my-shop 팝업, 어드민 팝업
- [ ] P2: `npm run build` 에러 0개
- [ ] P2: cocoalba_tier 배지 — businesses에 tier 있는 업소 상세에서 확인
- [ ] P9: `waiterzone.vercel.app` 배포 확인
- [ ] P9: `waiterzone.kr` DNS Valid 확인
- [ ] P9: `npm run build` 에러 0개

---

## 절대 금지

1. `anyAdToShop()` 함수 수정 금지 — 파이프라인 전체가 의존
2. `generateStaticParams` 제거 금지 — SEO SSG 구조 파괴
3. P2 middleware.ts 어드민 리다이렉트 재추가 금지 (무한루프)
4. `JobDetailContent` 함수 삭제 금지 — 일단 유지
5. 전체 파일 덮어쓰기 금지 — Edit 도구 핀셋 수정
6. 빌드 에러 있는 상태에서 "완료" 보고 금지
