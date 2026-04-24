# PLAN_AntiGravity_20260424_Week3

## 1. 개요
- **목표**: P5 야사장 사장님 대시보드 및 어드민 정산 기능 구현, P6 밤길 사이트 기본 기능 구축.
- **기간**: Week 3 (2026-04-24 ~ )
- **주요 기술**: Next.js 15+, Supabase (Shared DB), Tailwind CSS, Kakao Map SDK.

## 2. 상세 작업 계획

### [P5 야사장]
#### 2-1. 사장님 대시보드 (`/dashboard`)
- [ ] `src/app/dashboard/page.tsx` 생성: 서버 사이드에서 업소 정보, 구독 정보, 밤길 유입 통계 Fetch.
- [ ] `src/components/dashboard/BusinessCard.tsx`: 업소 기본 정보 및 심사 상태 표시.
- [ ] `src/components/dashboard/SubscriptionCard.tsx`: 구독 상태별 분기 처리 (trial, active, paused).
- [ ] `src/components/dashboard/BamgilStatsCard.tsx`: 이번 달 밤길 유입수 표시.
- [ ] `src/components/dashboard/PaymentModal.tsx`: 무통장 입금 신청 모달 (입금자명, 날짜 입력).
- [ ] `src/app/api/subscriptions/payment-request/route.ts`: 입금 신청 처리 및 텔레그램 알림 발송.

#### 2-2. 어드민 입금 확인 (`/admin/payments`)
- [ ] `src/app/admin/payments/page.tsx` 생성: 입금 대기 중인 구독 목록 조회 및 승인/반려 UI.
- [ ] `src/app/api/admin/confirm-payment/route.ts`: 입금 확인 승인(구독 활성화) 또는 반려 처리.

### [P6 밤길]
#### 2-3. 기본 환경 및 레이아웃
- [ ] `src/app/layout.tsx`: 카카오맵 SDK 로드 스크립트 추가.
- [ ] `src/components/layout/Header.tsx`, `Footer.tsx` 구현.

#### 2-4. 메인 페이지 및 지도
- [ ] `src/app/page.tsx`: 업종 필터, 카카오맵 연동, 업소 카드 목록 구현.
- [ ] `src/components/map/KakaoMap.tsx`: 'use client' 기반 카카오맵 렌더링 및 핀 표시.
- [ ] `src/components/business/BusinessCard.tsx`: 밤길 전용 업소 카드.

#### 2-5. 상세 페이지 및 카운터
- [ ] `src/app/places/[businessId]/page.tsx`: 업소 상세 정보 및 담당자 목록 표시.
- [ ] `src/app/places/[businessId]/ContactButton.tsx`: 연락 버튼 클릭 시 유입 통계 API 호출.
- [ ] `src/app/api/contacts/route.ts`: `bamgil_contacts` 테이블에 데이터 Insert (service_role 사용).

## 3. 검증 계획
- [ ] 각 기능 구현 후 로컬 개발 서버에서 동작 확인.
- [ ] `npm run build` 실행하여 빌드 오류 없는지 확인 (P5, P6 각각).
- [ ] 텔레그램 알림 정상 발송 확인.

## 4. 주의 사항 (MISTAKES_LOG 기반)
- `cookies()` 호출 시 `await` 필수 (Next.js 15).
- Supabase `bigint` 타입 처리 시 `Number()` 변환 준수.
- 파일 수정 시 핀셋 수정(Edit) 원칙 준수, 전체 덮어쓰기 금지.
- 한국어 데이터 인코딩 파손 주의.

---
위 계획에 따라 작업을 시작하도록 하겠습니다. 승인 부탁드립니다.
