# BRIEFING — 안티그래비티 Week 5 지시서
> 작성: 코부장 (Claude Code) | 날짜: 2026-04-25
> 필독 선행문서: `D:\토탈프로젝트\My-site\p1.choco-idea\MISTAKES_LOG.md`

---

## 이번 Week 목표

구독 플랜 체계 전면 교체에 따른 P5 야사장 + P2 코코알바 연동.
**핵심: 더 이상 코코알바 자체 결제 없음. 야사장 구독 → 코코알바 노출 자동 결정.**

---

## 확정된 플랜 구조 (절대 임의 변경 금지)

| 플랜 | 포함 플랫폼 | 월 기본가 |
|------|-----------|---------|
| basic | 밤길 + 웨이터존 | ₩22,000 |
| standard | 밤길 + (코코알바 OR 선수존) | ₩66,000 |
| special | 밤길 + 웨이터존 + (코코알바 OR 선수존) | ₩88,000 |
| deluxe | special + 강조효과 + PC 사이드바 | ₩199,000 |
| premium | special + PC/모바일 최상단 + 강조효과 | ₩399,000 |

**코코알바 노출 크기:**
- standard / special / deluxe → ShopCard T3(Deluxe)/T4(Special) 크기로 노출
- premium → AdBannerCard T2(Premium) 크기로 노출
- basic → 코코알바 미노출

---

## Task 1: P5 야사장 — Pricing.tsx 기간 토글 UI 연결

**파일:** `D:\토탈프로젝트\My-site\p5.야사장\src\components\home\Pricing.tsx`

코부장이 이미 상수/함수 추가 완료:
- `PERIOD_OPTIONS`: 1/3/6/12개월, 할인율 0/5/10/17%
- `BASE_PRICE`: 플랜별 월 기본가
- `calcPrice(planKey, months, discount)`: 총액 계산

**안티가 추가할 것:**
1. `useState`로 `selectedPeriod` 관리 (기본값: 1개월)
2. 헤더 섹션 아래 기간 선택 토글 버튼 UI (1개월/3개월/6개월/1년)
3. 카드 내 가격 표시: `₩{price}` → `₩{calcPrice(planKey, months, discount)}`
4. 기간 > 1개월이면 "총 X개월 ₩YYY" 서브텍스트 추가
5. 할인율 > 0이면 배지 표시 (예: "10% 할인", "2개월 무료")

토글 스타일 예시 (Tailwind dark):
```tsx
<div className="flex bg-zinc-900 rounded-full p-1 border border-zinc-800 w-fit mx-auto mb-10">
  {PERIOD_OPTIONS.map(opt => (
    <button
      key={opt.months}
      onClick={() => setSelectedPeriod(opt)}
      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
        selectedPeriod.months === opt.months
          ? 'bg-amber-500 text-black'
          : 'text-zinc-400 hover:text-white'
      }`}
    >
      {opt.label}
      {opt.discount > 0 && (
        <span className="ml-1 text-[9px] opacity-70">
          -{Math.round(opt.discount * 100)}%
        </span>
      )}
    </button>
  ))}
</div>
```

---

## Task 2: P5 야사장 — SubscriptionCard 플랜명 5단계 업데이트

> ✅ **이미 완료됨** — 코부장 사전 점검 결과, `getPlanLabel` + `getPlanPrice` 함수가 5단계 모두 정확히 구현되어 있음. 건너뛰어도 됨.

---

## Task 3: P5 야사장 — 구독 신청 플로우에 OR 선택 화면 추가

> ✅ **이미 완료됨** — 코부장 사전 점검 결과:
> - `PaymentModal.tsx`: `platformChoice` state + 코코알바/선수존 선택 버튼 UI 구현됨
> - `/api/subscriptions/payment-request`: `platform_choice` 받아서 subscriptions 저장 완료
> 건너뛰어도 됨.

---

## Task 4: P2 코코알바 — 목업 광고 96개 삭제

**먼저 SELECT로 확인:**
```sql
SELECT id, name, title, user_id, created_at
FROM shops
WHERE user_id LIKE '6fc68887%'
ORDER BY created_at DESC;
```
96개 맞는지 확인 후 대표님 승인 받고:
```sql
DELETE FROM shops WHERE user_id LIKE '6fc68887%';
```

---

## Task 5: P2 코코알바 — 야사장 subscription 기반 노출 연동

**핵심 설계:** 코코알바에서 업체 광고 표시 시 야사장 subscriptions 테이블 조회.

```
현재: shops.product_type (T1~T7) 기반으로 카드 크기/뱃지 결정
변경: subscriptions.plan_name 기반으로 결정
  - standard/special/deluxe → T4(Special) 크기 ShopCard
  - premium → T2(Premium) 크기 AdBannerCard
  - 없거나 basic → 코코알바 미표시
```

**구현 방법:**
1. `shops` 테이블 외래키 없음 → `businesses.owner_id = profiles.id` 조인
2. 야사장 `subscriptions` 테이블에서 `business_id` → `businesses` → `owner_id` 역추적
3. 또는: `businesses` 테이블에 `subscription_plan TEXT` 컬럼 추가 → 야사장 어드민 승인 시 동기화

**추천 방법 (간단):** `businesses` 테이블에 `cocoalba_tier TEXT` 컬럼 추가.
야사장 어드민에서 구독 승인 시 → 해당 컬럼 업데이트.
코코알바는 이 컬럼만 읽으면 됨.

SQL (Supabase 실행):
```sql
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS cocoalba_tier TEXT DEFAULT NULL;
-- NULL = 미노출, 'standard' = T3/T4, 'premium' = T2
```

---

## Task 6: P2 코코알바 — 업체 광고 상세 페이지 리디자인

**목표:** 희야야 스타일 + 코코알바 기존 상세정보 아코디언 접목

**구조 (최종 확정):**
```
[히어로] 업소 대표사진 (전체너비)
[상단] 업소명 + 급여 + 배지(구독티어)
[안심하고 지원하세요] 섹션  ← 탭 위에 위치
  합법 인증 마크 + 업소 신뢰 지표
  [광고 펼쳐보기 ▼] 아코디언 → 업체가 입력한 상세 어필 내용 (현재 코코알바 content 필드)
[탭] 근무조건 / 복지혜택 / 업소위치 / 상세정보
[하단 고정] 전화하기 / 문자 지원하기 버튼
```

**참고 파일:**
- 현재 상세 팝업: `src/components/jobs/JobDetailModal.tsx` (JobDetailContent)
- 희야야 UI: `D:\토탈프로젝트\작업\사업자관련\경쟁사분석\희야야\` 폴더

**주의:** JobDetailContent를 수정하면 5개 팝업 전부 영향. 별도 페이지 컴포넌트 신규 생성 권장.
라우트: `/coco/[region]/[id]/page.tsx` → 기존 SSR 페이지에 새 레이아웃 적용.

---

## 완료 기준 (빌드 통과 필수)

- [ ] `npm run build` 에러 없음
- [ ] P5 Pricing 기간 토글 정상 동작
- [ ] P5 SubscriptionCard 5단계 플랜명 표시
- [ ] P2 목업 96개 삭제 확인 (DB)
- [ ] P2 업체 상세 페이지 희야야 스타일 렌더링

---

## 절대 금지

1. P2 middleware.ts 어드민 리다이렉트 재추가 금지 (무한루프)
2. 전체 파일 덮어쓰기 금지 — Edit 도구 핀셋 수정
3. PROTECTED 색상/배지 임의 변경 금지 (PAY_BADGE_STANDARDS v2.0)
4. 빌드 에러 있는 상태에서 "완료" 보고 금지
