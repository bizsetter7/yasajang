# 지시서 v2.0 — 2026-04-20 (Week 2)
**작성: 코부장 (Claude Code)**
**대상: 안티그래비티**
**프로젝트: P5 야사장 (yasajang.kr)**

---

## ⚠️ 작업 전 필독 (절대 규칙)

1. **이 지시서에 명시된 것만 만든다.** 임의 추가·변경·삭제 금지.
2. **컬럼명·타입은 이 문서 기준.** Week 1 SQL 스키마와 이 문서 수정 SQL 모두 반영.
3. **완료 후 REPORT_AntiGravity_20260420_Week2.md 작성 필수.**
4. **`npm run build` 성공 캡처 첨부 필수.** 빌드 에러 상태 완료 보고 = 허위 보고.
5. 막히는 부분은 임의 해결 말고 보고서 "미완료 사항"에 명시.

---

## 1. 이번 지시 범위 — Week 2

- [ ] DB 수정 SQL 실행 (대표님이 Supabase에서 실행)
- [ ] `src/lib/telegram.ts` 생성 (P2 패턴 이식)
- [ ] 야사장 메인 페이지 (`src/app/page.tsx`) — 랜딩 + CTA
- [ ] 로그인 구현 (카카오 + 구글 + 이메일/비밀번호 3가지)
- [ ] 업소 등록 폼 (`src/app/register/page.tsx`) — Step 1~3
- [ ] 텔레그램 알림 API 2개
- [ ] 어드민 기본 페이지 (`src/app/admin/page.tsx`) — 입금 확인 + 활성화

---

## 2. DB 수정 SQL (대표님이 Supabase SQL Editor에서 실행)

> ⚠️ 이 SQL은 안티가 실행하지 않고 **대표님이 직접 Supabase 대시보드**에서 실행.
> 안티는 이 내용을 보고서에 "대기 중" 표시만 할 것.

```sql
-- subscriptions 테이블 수정: 토스페이먼츠 → 범용 결제 참조
ALTER TABLE subscriptions
  RENAME COLUMN toss_payment_key TO payment_reference;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bank_transfer'
    CHECK (payment_method IN ('bank_transfer','card','kakao','naver'));

-- 어드민 입금 확인 기록용 컬럼 추가
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by text;
  -- confirmed_by: 확인한 어드민 이메일
```

---

## 3. 텔레그램 유틸 (`src/lib/telegram.ts`)

P2 코코알바 패턴 **그대로** 복사. 아래 내용으로 생성:

```typescript
// 야사장 텔레그램 관리자 알림 유틸
// P2 코코알바(telegram.ts) 패턴 동일 적용

const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function sendTelegramAlert(message: string): Promise<boolean> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
```

---

## 4. 텔레그램 알림 API

### 4-1. 업소 등록 알림 (`src/app/api/notify/new-business/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { sendTelegramAlert } from '@/lib/telegram';

// POST /api/notify/new-business — 업소 등록 신청 시 관리자 알림
export async function POST(request: Request) {
  try {
    const { businessName, category, region, ownerEmail } = await request.json();

    const msg =
      `🏪 <b>새 업소 등록 신청</b>\n\n` +
      `📌 업소명: <b>${businessName}</b>\n` +
      `🏷 업종: ${category}\n` +
      `📍 지역: ${region}\n` +
      `👤 신청자: ${ownerEmail}\n\n` +
      `👉 야사장 어드민에서 서류 확인 후 승인해주세요.`;

    await sendTelegramAlert(msg);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

### 4-2. 구독 신청(무통장 입금 요청) 알림 (`src/app/api/notify/new-subscription/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { sendTelegramAlert } from '@/lib/telegram';

const PLAN_LABELS: Record<string, string> = {
  basic: '베이직 (99,000원)',
  standard: '스탠다드 (199,000원)',
  premium: '프리미엄 (499,000원)',
};

// POST /api/notify/new-subscription — 구독 플랜 선택 후 입금 요청 시 알림
export async function POST(request: Request) {
  try {
    const { businessName, plan, ownerEmail } = await request.json();

    const msg =
      `🔔 <b>구독 신청 (무통장 입금 대기)</b>\n\n` +
      `🏪 업소명: <b>${businessName}</b>\n` +
      `📦 플랜: ${PLAN_LABELS[plan] ?? plan}\n` +
      `👤 신청자: ${ownerEmail}\n\n` +
      `💳 입금 확인 후 어드민 → 구독 관리에서 활성화 버튼 클릭.`;

    await sendTelegramAlert(msg);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 5. 로그인 (`src/components/auth/AuthModal.tsx`)

### 로그인 방식 3가지 (야사장 = 사장님 타겟, 이메일 필수)

```
[카카오로 시작하기]   ← 카카오 OAuth
[구글로 시작하기]     ← 구글 OAuth
─────────────────
이메일 __________
비밀번호 __________
[로그인] / [회원가입]
```

### Supabase Auth 사용

```typescript
// 카카오
supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` } })

// 구글
supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` } })

// 이메일
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signUp({ email, password })
```

### 필수 파일

- `src/components/auth/AuthModal.tsx` — 모달 UI (탭: 로그인/회원가입)
- `src/app/auth/callback/route.ts` — OAuth 콜백 처리
- `src/middleware.ts` — 보호 라우트 (`/dashboard`, `/register`, `/admin`)

### middleware.ts 기본 (P2 패턴 참고)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/register', '/subscribe', '/admin']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  // Supabase 세션 갱신 + 보호 라우트 리다이렉트
  // ... (createServerClient 패턴 적용)
  return response
}

export const config = { matcher: ['/((?!_next|favicon.ico|api).*)'] }
```

---

## 6. 야사장 메인 페이지 (`src/app/page.tsx`)

### 구성 (위→아래)

```
[헤더 — 로고 + 로그인 버튼]

[히어로]
  "유흥업소 사장님을 위한 올인원 광고 플랫폼"
  부제: 밤길·코코알바·웨이터존·선수존 — 한 번에 관리
  CTA 버튼: [지금 무료로 시작하기] → /register

[서비스 소개 — 3카드]
  ✅ 3개월 무료체험
  ✅ 5개 플랫폼 동시 노출
  ✅ 업소 임대·매매 별도 섹션

[구독 플랜 — 3열]
  베이직 99,000원 / 스탠다드 199,000원 / 프리미엄 499,000원
  각 플랜 포함 플랫폼 목록 명시

[경쟁사 대비 강점 (암시적, 직접 언급 금지)]
  "SEO 기반 노출", "리뷰·별점 시스템", "AI 서류 검증(예정)"

[푸터]
  사업자 정보 플레이스홀더
```

### 스타일 기준

- 다크 테마 기본 (배경: `gray-950`, 강조: `amber-500`)
- 모바일 우선 (`max-w-screen-lg` 센터 정렬)
- Tailwind CSS v4 (동적 클래스 절대 금지 — PATTERN-02 준수)

---

## 7. 업소 등록 폼 (`src/app/register/page.tsx`)

### 3단계 구성

**Step 1 — 기본정보**
```
업소명 (text, 필수)
업종 선택 (select — BUSINESS_CATEGORIES 상수 사용)
지역 선택 (시/도 → 구/군 2단계 — REGIONS_MAP 상수 사용)
상세주소 (text)
대표 연락처 (text)
카카오 오픈채팅 URL (text, 선택)
```

**Step 2 — 서류 업로드**
```
사업자등록증 (파일 업로드 → Supabase Storage: businesses-docs/{user_id}/reg.jpg)
영업허가증 (파일 업로드 → Supabase Storage: businesses-docs/{user_id}/license.jpg)
안내: "서류는 어드민 검토 후 승인됩니다 (영업일 1~2일)"
```

**Step 3 — 구독 플랜 선택**
```
3개 플랜 카드 (베이직/스탠다드/프리미엄)
플랜 선택 후 [신청 완료] 버튼
완료 시:
  1. businesses 테이블 INSERT
  2. subscriptions 테이블 INSERT (status: 'trial', trial_ends_at: now+90일)
  3. POST /api/notify/new-business → 텔레그램 알림
  4. 구독 결제 신청이면 POST /api/notify/new-subscription → 텔레그램 알림
  5. /dashboard 리다이렉트
```

### Supabase Storage 버킷

- 버킷명: `businesses-docs`
- **Public: false** (어드민만 접근)
- 이 버킷은 대표님이 Supabase 대시보드 Storage에서 수동 생성 필요 (보고서에 명시)

---

## 8. 어드민 기본 (`src/app/admin/page.tsx`)

### 접근 제한

```typescript
// 어드민 이메일만 접근 가능
const ADMIN_EMAIL = process.env.ADMIN_EMAIL  // .env.local에 추가 필요
```

### 탭 구성 (Week 2 범위)

**탭 1 — 업소 심사**
- 미승인 업소 목록 (is_verified = false)
- 각 항목: 업소명 / 업종 / 지역 / 신청일 / 사업자등록증 링크 / 영업허가증 링크
- 버튼: [승인] → `UPDATE businesses SET is_verified=true, verified_at=now()`
- 버튼: [반려] → is_active=false

**탭 2 — 구독 입금 확인**
- status='trial' 중 구독 신청 목록
- 각 항목: 업소명 / 플랜 / 신청일 / 입금 여부
- 버튼: [입금 확인 완료] → `UPDATE subscriptions SET status='active', billing_starts_at=now(), confirmed_at=now(), confirmed_by='admin@email.com'`

---

## 9. 환경변수 추가 (`.env.local`에 추가)

```env
# 텔레그램 (야사장 관리자 알림용 — 코코알바와 동일 봇 사용 가능)
TELEGRAM_BOT_TOKEN=코코알바_TELEGRAM_BOT_TOKEN_값_복사
TELEGRAM_ADMIN_CHAT_ID=코코알바_TELEGRAM_ADMIN_CHAT_ID_값_복사

# 어드민
ADMIN_EMAIL=bizsetter7@gmail.com
```

> ⚠️ 코코알바 `.env.local`에서 `TELEGRAM_BOT_TOKEN`과 `TELEGRAM_ADMIN_CHAT_ID` 값 복사:
> `D:\토탈프로젝트\My-site\p2.브랜드_통합_시스템\.env.local`

---

## 10. 이번 지시에서 만들지 않는 것

Week 3 이후:
- ❌ 대시보드 (광고관리 + 밤길 유입 카운터)
- ❌ 구독 플랜 업그레이드/해지
- ❌ 커뮤니티
- ❌ 업소 임대·매매 (listing)
- ❌ 랭킹 페이지
- ❌ P6 밤길 (야사장 완성 후 착수)

---

## 11. 완료 기준 체크리스트

보고서에서 아래 항목 모두 ✅ 확인 후 제출:

**텔레그램**
- [ ] `src/lib/telegram.ts` 생성됨
- [ ] `/api/notify/new-business` 작동 확인 (로컬 테스트)
- [ ] `/api/notify/new-subscription` 작동 확인

**로그인**
- [ ] 카카오 OAuth 버튼 → Supabase 로그인 흐름 작동
- [ ] 구글 OAuth 버튼 → 작동
- [ ] 이메일/비밀번호 로그인·회원가입 작동
- [ ] `/auth/callback/route.ts` 생성됨
- [ ] `middleware.ts` 보호 라우트 적용됨

**메인 페이지**
- [ ] 히어로 + CTA 버튼 렌더링됨
- [ ] 구독 플랜 3열 카드 표시됨
- [ ] 모바일(360px) 레이아웃 확인

**업소 등록**
- [ ] Step 1~3 폼 작동
- [ ] businesses INSERT 확인 (Supabase Table Editor)
- [ ] subscriptions INSERT 확인
- [ ] 텔레그램 알림 실제 수신 확인 (대표님께 확인 요청)
- [ ] Supabase Storage `businesses-docs` 버킷 생성 필요 여부 명시

**어드민**
- [ ] 어드민 이메일로만 접근 가능 확인
- [ ] 업소 심사 탭 — 목록 표시 + 승인 버튼 작동
- [ ] 구독 입금 확인 탭 — 목록 표시 + 활성화 버튼 작동

**빌드**
- [ ] `npm run build` 성공 캡처 첨부 ← 필수

---

## 12. 보고서 작성 위치

```
D:\토탈프로젝트\My-site\p5.야사장\REPORT_AntiGravity_20260420_Week2.md
```

---
*코부장 서명: Claude Code (코코알바 전략 담당)*
*다음 지시서: Week 3 — 대시보드 + 밤길(P6) 시작*
