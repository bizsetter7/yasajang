# PLAN_AntiGravity_20260420_Week2_Hotfix2
> 작성: 코부장 | 대상: Antigravity | 날짜: 2026-04-20

## 문제 요약
Hotfix 1에서 `src/lib/telegram.ts` 삭제 후 import 경로 통일이 불완전하게 처리됨.

### 현재 상태 (버그)
`src/lib/utils/telegram.ts`에 존재하는 함수:
```ts
export async function sendTelegramMessage(message: string) { ... }
```

아래 두 파일이 존재하지 않는 `sendTelegramAlert`를 import 중:
```ts
// new-business/route.ts
import { sendTelegramAlert } from '@/lib/utils/telegram'; // ❌ 없는 함수

// new-subscription/route.ts  
import { sendTelegramAlert } from '@/lib/utils/telegram'; // ❌ 없는 함수
```

빌드 시 Static Extraction 단계에서 충돌 발생한 이유가 바로 이것.
런타임에서 텔레그램 알림 호출 시 undefined 오류로 알림 발송 실패함.

---

## 수정 지시

### Fix A — `src/lib/utils/telegram.ts`에 함수명 alias 추가

기존 파일에 아래 한 줄 추가:
```ts
// sendTelegramAlert는 sendTelegramMessage의 alias (하위호환)
export const sendTelegramAlert = sendTelegramMessage;
```

파일 최하단에 추가하면 됨. 기존 `sendTelegramMessage` 함수는 그대로 유지.

---

## 완료 보고 형식
- 파일명: `REPORT_AntiGravity_20260420_Week2_Hotfix2.md`
- 저장 위치: `D:\토탈프로젝트\My-site\p5.야사장\`
- 언어: **한국어 필수**
- 내용: alias 추가 확인 + `npm run build --webpack` Exit Code 0 확인 (워커 오류 없이 클린 빌드여야 함)
