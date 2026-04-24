# PLAN_AntiGravity_20260424_Week4

## 1. 개요
- **목표**: P5 야사장 어드민 버그 수정 및 정보 수정 기능 구현, P6 밤길 지역 필터 및 UI 고도화.
- **기간**: Week 4 (2026-04-24 ~ )
- **주요 변경**: `shops` 테이블을 `businesses` 테이블로 통합 및 UI 보강.

## 2. 상세 작업 계획

### [P5 야사장]
#### 2-1. [버그 수정] 어드민 입점 심사 (`/admin/register-audit`)
- [ ] `src/app/admin/register-audit/page.tsx` 수정:
  - `shops` 테이블 참조를 `businesses`로 변경.
  - `status` 필터를 `PENDING_REVIEW`에서 `pending`으로 변경.
  - 승인 로직: `is_verified: true, is_active: true, status: 'active'` 업데이트.
  - `sendTelegramAlert` 직접 호출로 변경.

#### 2-2. 업소 정보 수정 기능
- [ ] `src/app/api/businesses/update/route.ts` (신규): PATCH 요청 처리, owner_id 검증, 재심사 상태(`pending`)로 변경.
- [ ] `src/app/dashboard/edit/page.tsx` (신규): 정보 수정 폼 구현.

#### 2-3. UI 보강
- [ ] `src/components/dashboard/BusinessCard.tsx`: 구독 플랜별 밤길 노출 상태 배지 추가.

### [P6 밤길]
#### 2-4. 필터 및 SEO
- [ ] `src/app/page.tsx`: 지역별 필터(`REGION_LABELS`) 추가 및 URL 파라미터 연동.
- [ ] `src/app/layout.tsx`: SEO 메타태그(title, og:title 등) 강화.

#### 2-5. UI 및 로딩 처리
- [ ] `src/components/business/BusinessCard.tsx`: `bamgil_contacts` count를 활용한 조회수 배지 추가.
- [ ] `src/app/places/[businessId]/page.tsx`: 구독 플랜별 배지(프리미엄, 공식 파트너) 추가.
- [ ] `src/app/loading.tsx` (신규): 카드 및 지도 영역 스켈레톤 로딩 구현.

## 3. 검증 계획
- [ ] P5 어드민에서 `businesses` 테이블 데이터 정상 조회 및 심사 동작 확인.
- [ ] P5 사장님 대시보드에서 정보 수정 후 심사 상태 변경 확인.
- [ ] P6 지역 필터 클릭 시 URL 파라미터 및 목록 갱신 확인.
- [ ] `npm run build --webpack` (P5, P6 각각) 및 `tsc --noEmit` 통과 확인.

## 4. 주의 사항 (MISTAKES_LOG)
- `shops` 테이블 참조 코드 완전 제거.
- `cookies()` await 준수 (Next.js 15+).
- 핀셋(Edit) 수정 원칙 준수.

---
위 계획에 따라 작업을 시작하도록 하겠습니다. 승인 부탁드립니다.
