# PLAN_AntiGravity_20260420_Week2_Hotfix
> 작성: 코부장 | 대상: Antigravity | 날짜: 2026-04-20

## 개요
Week 2 코드 리뷰 후 발견된 버그 2건 + 확인 1건 즉시 수정 지시.

---

## 🔴 Fix 1 — Supabase 스토리지 버킷 이름 오류 (긴급)

### 문제
`src/app/admin/register-audit/page.tsx` 199번 줄:
```ts
// 현재 (잘못됨)
window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/business-docs/${selectedShop.license_path}`, '_blank')
```
- `business-docs` → 코코알바(P2) 버킷 (public). 잘못된 버킷 참조
- 야사장 전용 버킷은 `businesses-docs` (복수형, **private**)

### 수정 방법
private 버킷이므로 직접 URL 접근 불가. **Signed URL** 방식으로 변경한다.

**1단계**: `register-audit/page.tsx`에 서버 액션 또는 API 라우트로 signed URL 생성

`src/app/api/storage/signed-url/route.ts` 신규 생성:
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { path } = await req.json();
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 });

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data, error } = await supabase.storage
    .from('businesses-docs')
    .createSignedUrl(path, 60 * 60); // 1시간 유효

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
```

**2단계**: `register-audit/page.tsx` 사업자등록증 클릭 핸들러 수정:
```ts
// 기존 onClick → 아래로 교체
onClick={async () => {
  const res = await fetch('/api/storage/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: selectedShop.license_path }),
  });
  const { url, error } = await res.json();
  if (error) { alert('서류 조회 실패: ' + error); return; }
  window.open(url, '_blank');
}}
```

**환경변수 확인**: `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 없으면 추가 필요.

---

## 🟡 Fix 2 — telegram.ts 중복 파일 정리

### 문제
- `src/lib/telegram.ts` — `sendTelegramAlert()` 함수 (현재 아무 곳에서도 import 안 함, 데드코드)
- `src/lib/utils/telegram.ts` — `sendTelegramMessage()` 함수 (실제 사용 중)

### 수정 방법
`src/lib/telegram.ts` 파일 삭제.
`src/lib/utils/telegram.ts` 하나로 단일화.

삭제 명령:
```bash
rm src/lib/telegram.ts
```

---

## 🔵 확인 사항 — 입금확인 어드민 구현 여부

Week 2 지시서(`BRIEFING_AntiGravity_20260420_Week2.md`)에 포함된 항목:
- `/admin/payments` — 입금확인 어드민 (무통장 입금 확인 → subscriptions 활성화)

보고서에 해당 항목이 언급되지 않았음.

**구현했으면**: 경로와 기능 간략히 보고  
**미구현이면**: Week 3 지시서에 포함할 예정이니 "미구현" 으로 보고

---

## 완료 보고 형식
수정 완료 후 아래 파일로 보고:
- 파일명: `REPORT_AntiGravity_20260420_Week2_Hotfix.md`
- 저장 위치: `D:\토탈프로젝트\My-site\p5.야사장\`
- 언어: **한국어 필수**
- 내용: Fix 1 수정 결과 / Fix 2 삭제 완료 / 입금확인 구현 여부

빌드 재확인(`npm run build --webpack`) 후 Exit Code 0 확인 필수.
