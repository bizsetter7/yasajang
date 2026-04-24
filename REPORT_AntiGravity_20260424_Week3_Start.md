# REPORT_AntiGravity_20260424_Week3_Start

## 1. 프로젝트 확인 및 요약
- **현재 프로젝트**: P5 야사장 (yasajang.kr)
- **CLAUDE.md 요약**: Next.js 15+ 환경 (async cookies 등 최신 API 사용). `AGENTS.md`에 따라 기존 학습 데이터와 다른 구조 및 컨벤션 준수 필요.

## 2. 공통 실수 방지 (MISTAKES_LOG.md)
- **[M-002] 인코딩**: 한글 데이터 수정 후 `view_file`로 최종 검증 필수.
- **[M-015] DB 타입**: Supabase `int8`(bigint) 비교 시 `Number()` 변환 사용.
- **[M-010] 인증**: 클라이언트 fetch 시 `Authorization` 헤더 누락 금지.
- **[M-026] 빌드 검증**: 작업 완료 보고 전 `npm run build` 성공 여부 확인 필수.

## 3. 이번 세션 작업 범위 (Week 3 지시서 기준)
### P5 야사장
- 사장님 대시보드 (`/dashboard`): 업소 현황, 구독 상태, 밤길 유입 카운터, 입금 신청 모달.
- 어드민 입금 확인 (`/admin/payments`): 무통장 입금 신청 목록 조회 및 승인/반려 기능.

### P6 밤길 (Week 1 착수)
- 기본 레이아웃 및 메인 페이지 (지역/업종 필터 + 카카오맵 + 업소 카드).
- 업소 상세 페이지 및 밤길 유입 카운터 API (`/api/contacts`).

## 4. 현재 상태 (Git Status)
- `On branch main`, `Your branch is up to date with 'origin/main'`.
- `nothing to commit, working tree clean`.

---
작업 준비 완료되었습니다. 지시서에 따라 구현 계획(PLAN)을 수립하겠습니다.
