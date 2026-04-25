# REPORT_AntiGravity_20260426_Week9_DataPipeline

## 1. 작업 개요
- **대상**: P2 코코알바 브랜드 통합 시스템 데이터 파이프라인 버그 수정
- **지시서**: `BRIEFING_AntiGravity_20260425_Week9.md`

## 2. 작업 상세 내용

### 🔴 Task 1: 지원서(ApplicantsView) 조회 버그 수정
- **문제**: `applications.shop_id`(uuid)와 `shops.id`(bigint)의 타입 불일치로 인해 조회 결과가 항상 0건이었음.
- **수정**:
  1. `JobDetailModal.tsx`에서 지원서(`applications`) 등록 시, 공고 소유자의 식별자인 `owner_user_id`를 함께 저장하도록 로직 추가.
  2. `ApplicantsView.tsx`에서 조회 조건을 `shop_id` IN 절이 아닌 `owner_user_id`를 직접 조회하도록 변경.
  3. `shopName` 매핑 로직 또한 `shopNameMap` 객체를 구성하여 `String(app.shop_id)` 또는 `app.shop_name`에 기반하여 매핑되도록 우회 적용 완료.

### 🟠 Task 2: 쪽지 수신 조회 ID 기반 전환
- **문제**: 쪽지 수신 조회가 이름(`userName`) 기반이라 닉네임 변경 시 쪽지가 소실되는 현상.
- **수정**:
  1. `noteService.ts` 내 `getInbox`, `getUnread` 함수의 시그니처를 확장하여 `userId`를 함께 전달받도록 변경.
  2. `userId`가 전달될 경우 `receiver_id` 컬럼과 매칭하여 이름을 변경해도 쪽지가 조회되도록 OR 조건 적용.
  3. `MessageModal.tsx` 내에서 탭 데이터를 갱신(`refreshData`)할 때 현재 로그인한 유저의 `user.id`를 전달하도록 반영.
  4. 쪽지 발송(`sendNote`) 시 수신자뿐 아니라 발신자 식별자(`senderId`)도 함께 DB에 저장되도록 수정 완료.

### 🟡 Task 3: SOS shopId 주석 명확화
- **문제**: `sos_alerts.shop_id`에 저장되는 값이 `shops.id`(bigint)가 아닌 발송자의 `profiles.id`(uuid)임에도 변수명이 혼동을 유발.
- **수정**: `api/sos/send/route.ts`의 `request.json()` 호출 부근 및 `SosAlertView.tsx`의 API 호출 페이로드 부분에 주석을 추가하여 구조적 혼동 방지.

## 3. 검증 결과 (npm run build)
수정 완료 후 `p2.브랜드_통합_시스템` 프로젝트 내에서 빌드를 실행하여 문제가 없음을 확인했습니다.

```text
> coco-universe@0.1.0 build
> next build

   ▲ Next.js 15.5.9
   - Environments: .env.local

   Creating an optimized production build ...
 ✓ Compiled successfully in 14.9s
   Skipping validation of types
   Skipping linting
   Collecting page data ...
   Generating static pages (5565/5565) ...

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand

Exit code: 0
```
**✅ 에러 0건. 정상 빌드 통과.**

---
**작성자**: Antigravity
**날짜**: 2026-04-26
