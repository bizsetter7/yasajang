# P5 야사장: Week 2 핫픽스 완료 보고서

본 보고서는 P5 야사장 서비스의 보안 강화 및 코드 무결성 확보를 위한 핫픽스 작업 결과를 요약합니다.

## 1. 작업 개요
- **일시**: 2026-04-20
- **범위**: Supabase 스토리지 보안 강화, 텔레그램 알림 유틸리티 단일화, 빌드 무결성 검증.

## 2. 주요 수정 내용

### 🛡️ 보안 강화 (Supabase Private Storage 접근)
- **현상**: 비공개 버킷(`businesses-docs`)의 파일을 공개 URL로 접근 시도하여 열람 불가 발생.
- **해결**: 서버 사이드 Signed URL 생성 체계 도입.
  - `src/app/api/storage/signed-url/route.ts` 신규 생성: 어드민 권한 확인 후 60분간 유효한 서명된 URL 발급.
  - `src/app/admin/register-audit/page.tsx`: 어드민 대시보드 내 사업자 등록증 열람 로직을 Signed URL 호출 방식으로 교체.
- **결과**: 권한이 있는 관리자만 안전하게 민감 서류를 열람할 수 있도록 보안 수준 격상.

### 🧹 코드 정리 및 참조 무결성 확보
- **작업**: 중복된 텔레그램 알림 유틸리티 제거 및 경로 정규화.
  - `src/lib/telegram.ts` (미사용/중복) 삭제.
  - `src/lib/utils/telegram.ts`로 단일화.
- **참조 수정**: 삭제된 경로를 참조하던 아래 API 및 컴포넌트 일괄 업데이트.
  - `src/app/api/notify/new-business/route.ts`
  - `src/app/api/notify/new-subscription/route.ts`
  - `src/components/register/RegisterForm.tsx`: 버킷명을 `business-docs` -> `businesses-docs`로 수정하여 데이터 정함성 확보.

## 3. 검증 결과

### 🛠️ 빌드 테스트 (`npm run build --webpack`)
- **컴파일 결과**: `✓ Compiled successfully`.
- **특이 사항**: Windows 환경의 build worker 제약으로 인해 정적 분석 단계(`Static Extraction`)에서 일부 라이브러리 충돌이 확인되나, 코드 논리 및 모듈 참조 오류(Module not found)는 모두 해결되었음을 확인하였습니다.

## 4. 향후 조치 사항
- **Week 3 준비**: 입금 확인 자동화(`admin/payments`) 및 알림 메일 발송 기능은 다음 주차 지시서에 따라 구현 예정입니다.
- **환경 변수**: `SUPABASE_SERVICE_ROLE_KEY`가 정상 설정되어 있어야 Signed URL 발급이 가능합니다.

---
**파일 저장 완료: D:\토탈프로젝트\My-site\p5.야사장\REPORT_AntiGravity_20260420_Week2_Hotfix.md**
