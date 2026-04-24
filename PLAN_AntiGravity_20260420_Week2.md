# P5 야사장 Week 2 개발 계획: 랜딩 페이지 및 업소 등록

본 계획서는 P5 야사장 플랫폼의 Week 2 목표인 프리미엄 랜딩 페이지 구축과 업소 등록(Step 1-3) 기능 구현을 위한 상세 설계를 담고 있습니다.

## User Review Required

> [!IMPORTANT]
> **디자인 테마**: '프리미엄 비즈니스 커뮤니티' 컨셉에 맞춰 **Dark Mode와 Amber/Gold** 색상을 주축으로 한 고급스러운 디자인을 지향합니다.
> **인증 연동**: `Navbar`의 로그인 버튼 클릭 시 지난 번 구현한 `AuthModal`이 `?auth=login` 쿼리 파라미터를 통해 활성화됩니다.
> **Storage 설정**: 업소 등록 시 문서 업로드를 위해 Supabase Storage에 `businesses-docs` 버킷(Private)이 수동으로 생성되어 있어야 합니다.

## Proposed Changes

### 1. 전역 레이아웃 및 내비게이션

#### [NEW] [Navbar.tsx](file:///D:/토탈프로젝트/My-site/p5.야사장/src/components/layout/Navbar.tsx)
- Glassmorphism 효과가 적용된 상단 고정 바.
- 로고, 서비스 소개, 구독 플랜, 커뮤니티 링크 포함.
- 로그인 상태에 따른 버튼 전환 (로그인/회원가입 -> 관리자/내정보).

#### [NEW] [Footer.tsx](file:///D:/토탈프로젝트/My-site/p5.야사장/src/components/layout/Footer.tsx)
- 플랫폼 정보, 고객센터 안내, 이용약관 및 개인정보처리방침 링크.

#### [MODIFY] [layout.tsx](file:///D:/토탈프로젝트/My-site/p5.야사장/src/app/layout.tsx)
- `Navbar`와 `Footer`를 전역 레이아웃에 배치.

---

### 2. 랜딩 페이지 (Home)

#### [NEW] [Hero.tsx](file:///D:/토탈프로젝트/My-site/p5.야사장/src/components/landing/Hero.tsx)
- 강렬한 메시지와 CTA(업소 등록하기) 버튼이 포함된 히어로 섹션.
- 고해상도 배경 이미지 또는 그라데이션 적용.

#### [NEW] [Features.tsx](file:///D:/토탈프로젝트/My-site/p5.야사장/src/components/landing/Features.tsx)
- 검색 시스템, 마케팅 지원, 구인구직 등 주요 서비스 소개 카드.

#### [NEW] [Pricing.tsx](file:///D:/토탈프로젝트/My-site/p5.야사장/src/components/landing/Pricing.tsx)
- Free, Basic(9,900원), Pro(29,900원) 플랜 비교 테이블.

#### [MODIFY] [page.tsx](file:///D:/토탈프로젝트/My-site/p5.야사장의/src/app/page.tsx)
- 위 컴포넌트들을 조립하여 메인 페이지 구성.

---

### 3. 업소 등록 시스템 (Register)

#### [NEW] [RegisterForm.tsx](file:///D:/토탈프로젝트/My-site/p5.야사장/src/components/business/RegisterForm.tsx)
- **Step 1**: 기본 정보 (업소명, 카테고리, 지역, 연락처).
- **Step 2**: 서비스 상세 (영업시간, 서비스 내용, 특징).
- **Step 3**: 서류 인증 및 제출 (사업자등록증 업로드).
- Supabase Auth를 통한 사용자 ID 연동 및 `shops` 테이블 데이터 저장.

#### [NEW] [register/page.tsx](file:///D:/토탈프로젝트/My-site/p5.야사장/src/app/register/page.tsx)
- 업소 등록 페이지 엔트리.

## Open Questions

- **이미지 에셋**: 히어로 섹션에 사용할 고품질 배경 이미지가 필요합니다. `generate_image` 툴을 사용하여 제작할까요?
- **푸터 상세 정보**: 프로젝트의 공식 사업자 정보(사업자 번호 등)가 확정 전이라면 더미 데이터로 유지할지 확인 부탁드립니다.

## Verification Plan

### Automated Tests
- `npm run build`: 빌드 에러 여부 상시 확인.
- `Auth` 흐름 테스트: `Navbar`를 통한 로그인 유도 및 리다이렉트 확인.

### Manual Verification
- 브라우저를 통한 업소 등록 폼 동작 및 Supabase DB 저장 확인.
- 텔레그램 알림 발송 여부 확인.
