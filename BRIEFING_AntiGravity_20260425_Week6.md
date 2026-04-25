# BRIEFING — 안티그래비티 Week 6 지시서
> 작성: 코부장 (Claude Code) | 날짜: 2026-04-25
> 필독 선행문서: `D:\토탈프로젝트\My-site\p1.choco-idea\MISTAKES_LOG.md`

---

## Week 5 인수인계 메모

- **SQL 완료**: `businesses.cocoalba_tier TEXT DEFAULT NULL` 컬럼 추가됨
- **OAuth 완료**: Supabase Kakao/Google Provider 설정 완료
- **코부장 수정**: `confirm-payment` API에서 `sub.plan` → `sub.plan_name` 버그 수정 완료
- **코부장 수정**: `PaymentModal.tsx` 가격 그리드 5단계 업데이트 완료

---

## Task 1: P5 야사장 — next.config.ts 타입 에러 근본 수정 🔴 필수

**현재 문제:**
```ts
// D:\토탈프로젝트\My-site\p5.야사장\next.config.ts
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },  // ← 위험: 타입 에러 숨김
  eslint: { ignoreDuringBuilds: true },      // ← 위험: ESLint 에러 숨김
};
```

**할 것:**
1. 위 두 줄 제거 후 `npm run build` 실행
2. 나오는 TypeScript/ESLint 에러 전부 수정
3. 에러 없이 `npm run build` 통과 확인
4. next.config.ts 최종 상태:
```ts
const nextConfig: NextConfig = {};
export default nextConfig;
```

> ⚠️ 에러가 많으면 파일별로 순서대로 수정. 에러 있는 상태에서 완료 보고 금지.

---

## Task 2: P5 / P2 / P6 Git Push → Vercel 배포 확인

Week 5 작업이 아직 로컬에만 있음. 순서대로 push:

```bash
# P5 야사장
cd "D:\토탈프로젝트\My-site\p5.야사장"
git add -p   # 변경 파일 검토
git commit -m "feat: Week5/6 — 5단계 구독 플랜, 기간 토글, OR 선택, cocoalba_tier 동기화"
git push origin main

# P2 코코알바
cd "D:\토탈프로젝트\My-site\p2.브랜드_통합_시스템\coco-universe"
git add -p
git commit -m "feat: Week5 — ShopDetailView 희야야 스타일, 목업 128개 삭제, cocoalba_tier 연동"
git push origin main

# P6 밤길
cd "D:\토탈프로젝트\My-site\p6.밤길"
git add -p
git commit -m "feat: Week5 — 서브지역 필터, 조회수 배지, SEO, 스켈레톤"
git push origin main
```

**확인:**
- Vercel 각 프로젝트 배포 로그에서 빌드 성공 확인 (실패 시 즉시 보고)
- yasajang.kr / www.cocoalba.kr / bamgil.kr 실제 접속 확인

---

## Task 3: P6 밤길 — 조회수 실시간 카운트 API

**현재 문제**: 상세 페이지에 조회수 배지가 있지만 DB 값이 아닌 정적 표시.

**P6 `businesses` 테이블에 `views` 컬럼이 있는지 먼저 확인:**
```sql
-- Supabase SQL Editor에서 확인
SELECT column_name FROM information_schema.columns
WHERE table_name = 'businesses' AND column_name = 'views';
```

없으면 대표님에게 확인 요청 (코부장이 처리).

**있으면 구현:**
1. `POST /api/businesses/view` — 조회 시 views +1
   ```ts
   // body: { businessId: string }
   // supabaseAdmin으로 increment
   await supabaseAdmin.rpc('increment_views', { business_id: businessId });
   // 또는 단순 UPDATE:
   await supabaseAdmin
     .from('businesses')
     .update({ views: supabase.rpc('increment', {}) }) // 실제 방법은 아래 패턴 사용
   ```
   실제 safe increment 패턴:
   ```sql
   UPDATE businesses SET views = COALESCE(views, 0) + 1 WHERE id = $1
   ```
   → Supabase에서는 `.rpc()` 또는 raw SQL 사용

2. P6 상세 페이지 `[businessId]/page.tsx` — 페이지 로드 시 API 호출 (useEffect)

3. 상세 페이지 조회수 배지에 실제 `business.views` 값 표시

---

## Task 4: P9 웨이터존 — Next.js 16 프로젝트 셋업

**경로:** `D:\토탈프로젝트\My-site\p9.웨이터존\waiterzone` (현재 빈 폴더)

**P5 야사장과 동일한 구조로 셋업:**

```bash
cd "D:\토탈프로젝트\My-site\p9.웨이터존\waiterzone"
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
```

**셋업 후 복사할 것 (P5 야사장 → P9 웨이터존):**
- `src/lib/supabase/` 전체 (client.ts / server.ts / middleware.ts)
- `src/lib/utils/telegram.ts`
- `.env.local` 템플릿 (같은 Supabase 프로젝트 공유)
- `AGENTS.md` 복사

**브랜딩 차이점:**
| 항목 | 야사장 (P5) | 웨이터존 (P9) |
|------|-----------|-------------|
| 컬러 | amber-500 | blue-500 |
| 대상 | 사장님 (업소) | 웨이터 구직자 |
| 도메인 | yasajang.kr | waiterzone.kr |
| 봇 토큰 | YASAJANG_BOT_TOKEN | WAITERZONE_BOT_TOKEN |

**Week 6에서 만들 페이지 (최소):**
1. 랜딩 (`/`) — 웨이터 구인 플랫폼 소개
2. 로그인 모달 — P5 AuthModal 복사 + 파란색 브랜딩
3. 구인 목록 (`/jobs`) — 야사장 구독 businesses 연동 (웨이터존 포함 플랜만)
4. 기본 레이아웃 (헤더/푸터)

> ⚠️ GitHub 레포 `bizsetter7/waiterzone` 생성 + push + Vercel 프로젝트 연결 + waiterzone.kr DNS도 설정

---

## 완료 기준

- [ ] P5 `npm run build` — ignoreBuildErrors 없이 에러 0개 통과
- [ ] P5/P2/P6 Vercel 배포 성공 (yasajang.kr / cocoalba.kr / bamgil.kr 접속 확인)
- [ ] P6 상세 페이지 조회 시 views 카운트 +1 동작
- [ ] P9 웨이터존 `npm run dev` 실행 가능 + 기본 4페이지 렌더링

---

## 절대 금지

1. P2 middleware.ts 어드민 리다이렉트 재추가 금지 (무한루프)
2. 전체 파일 덮어쓰기 금지 — Edit 도구 핀셋 수정
3. 빌드 에러 있는 상태에서 "완료" 보고 금지
4. P9에서 P5 컬러(amber) 그대로 사용 금지 — blue로 변경
