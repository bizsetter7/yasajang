@AGENTS.md

# P5 야사장 (yasajang.kr) — 에이전트 핸드오버 가이드
> 최종 업데이트: 2026-04-28 | BRIEFING Week1~10 + DashboardFix 내용 통합
> **작업 시작 전 이 파일만 읽으면 됨 — BRIEFING 파일 별도 읽기 불필요**

---

## 1. 프로젝트 개요

| 항목 | 값 |
|------|-----|
| 도메인 | https://www.yasajang.kr |
| 로컬 경로 | D:\토탈프로젝트\My-site\p5.야사장 |
| GitHub | bizsetter7/yasajang |
| Vercel | yasajang |
| Supabase | chocoidea-coco (P2/P5/P6/P9/P10 공유) |
| 타겟 | 유흥업소 사장님 (B2B SaaS) |
| 기술스택 | Next.js 15 + TypeScript + Tailwind CSS v4 |

---

## 2. 절대 원칙 (MUST NOT)

1. **파일 전체 덮어쓰기 금지** — Edit 핀셋 수정만
2. **`ignoreBuildErrors: true` 절대 금지** — 빌드 에러는 반드시 수정
3. **`cookies()` await 필수** — Next.js 15 필수 규칙
4. **완료는 `npm run build` 성공 후에만 선언**
5. **service_role 클라이언트는 로컬 선언만** (공용 import 금지)

---

## 3. DB 스키마 (핵심 테이블)

### businesses (업소 정보)
```
id: uuid PK
owner_id: uuid (profiles.id FK)
name, category, region_code, address
lat, lng (카카오맵 좌표)
phone, kakao_channel, open_chat_url
business_reg_url, license_url (Storage signed URL)
business_reg_number, license_number, floor_area (OCR 자동입력)
permit_path (영업허가증)
is_verified, verified_at, is_active, status
audit_note, audited_at
menu_main, menu_liquor, menu_snack (JSON)
business_hours (JSON — 요일별 영업시간)
cocoalba_tier TEXT (P2 코코알바 연동 등급)
```

### subscriptions (구독)
```
id: uuid PK
business_id: uuid UNIQUE FK → businesses.id
plan: basic | standard | special | deluxe | premium
status: trial | active | paused | cancelled
trial_starts_at, trial_ends_at
billing_starts_at, next_billing_at
amount: integer (월 실결제금액 — 할인 적용 후)
payment_reference TEXT (payerName_date 형식)
payment_method: bank_transfer
payer_name TEXT
pay_date DATE
platform_choice: cocoalba | waiterzone | sunsuzone (basic=null)
note TEXT
confirmed_at, confirmed_by
```

### managers (담당자)
```
id: uuid PK
business_id: uuid FK
name, role, phone, open_chat_url, photo_url
is_active: boolean
```

### bamgil_contacts (밤길 유입 통계)
```
id: uuid PK
business_id: uuid FK
contact_type: call | chat | visit
contacted_at: timestamptz
```

### platform_ads (플랫폼별 광고)
```
id: uuid PK
business_id: uuid FK
platform: cocoalba | bamgil | waiterzone | sunsuzone
ad_tier: t1 ~ t7
```

---

## 4. 구독 플랜 체계 (확정)

| 플랜 | 월 기본가 | 포함 플랫폼 | P2 코코알바 노출 |
|------|---------|-----------|--------------|
| basic | ₩22,000 | 밤길 기본 포함 | 미노출 |
| standard | ₩66,000 | 밤길 + (코코알바 OR 선수존) | T4 |
| special | ₩88,000 | 밤길 + (코코알바 OR 선수존) | T3 |
| deluxe | ₩199,000 | special + 강조효과 + PC사이드바 | T3 |
| premium | ₩399,000 | special + PC/모바일 최상단 | T2 |

**기간 할인**: 1개월 0% / 3개월 5% / 6개월 10% / 12개월 17%

**platform_choice**: basic=null, 나머지는 cocoalba/waiterzone/sunsuzone 중 1개 선택

---

## 5. 파일 구조

```
src/
├── app/
│   ├── layout.tsx              글로벌 레이아웃 (Navbar/Footer)
│   ├── page.tsx                메인 랜딩 (히어로+서비스+Pricing)
│   ├── seo/[region]/page.tsx   SEO 지역 랜딩 17개
│   ├── register/               업소 등록 폼 (Step 1~3)
│   ├── dashboard/              사장님 대시보드
│   │   ├── page.tsx
│   │   └── edit/page.tsx       업소 정보 수정
│   ├── admin/
│   │   ├── page.tsx            어드민 패널
│   │   └── payments/page.tsx   입금 확인
│   ├── auth/callback/route.ts  OAuth 콜백
│   └── api/
│       ├── notify/new-business/      텔레그램 알림 (신규 업소)
│       ├── notify/new-subscription/  텔레그램 알림 (신규 구독)
│       ├── subscriptions/payment-request/  무통장 입금 신청
│       ├── businesses/update/        업소 정보 수정
│       ├── admin/confirm-payment/    입금 확인 승인
│       ├── ocr/route.ts              사업자등록증 OCR (Claude Haiku)
│       ├── storage/signed-url/       private 파일 URL
│       └── register/route.ts         입점 신청
├── components/
│   ├── layout/                 Navbar, Footer
│   ├── register/RegisterForm.tsx  Step 1~3 등록폼
│   ├── dashboard/
│   │   ├── BusinessCard.tsx
│   │   ├── SubscriptionCard.tsx
│   │   ├── BamgilStatsCard.tsx
│   │   └── PaymentModal.tsx     무통장 입금 모달
│   ├── auth/AuthModal.tsx
│   └── landing/                Hero, Features, Pricing
└── lib/
    ├── supabase/client.ts, server.ts, middleware.ts
    ├── utils/telegram.ts       sendTelegramAlert() 함수
    ├── regions.ts              SEO 지역 상수
    └── constants/              categories, tiers, regions
```

---

## 6. 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://www.yasajang.kr
ADMIN_EMAIL=bizsetter7@gmail.com
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
KAKAO_MAP_KEY=
NEXT_PUBLIC_KAKAO_MAP_KEY=
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
ANTHROPIC_API_KEY=        (OCR용 Claude Haiku)
```

---

## 7. API 표준 패턴

```typescript
// service_role (반드시 로컬 선언)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 어드민 인증
const { data: { user } } = await supabase.auth.getUser();
if (!user || user.email !== process.env.ADMIN_EMAIL) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 8. 완료된 기능 (Week별)

| Week | 날짜 | 완료 내용 |
|------|------|---------|
| 1 | 04-20 | DB 스키마 12개 테이블, Next.js 초기 셋업, 환경변수 |
| 2 | 04-20 | 텔레그램 알림, 로그인(카카오+구글+이메일), 메인페이지, RegisterForm, 어드민 기본 |
| Hotfix | 04-20 | Storage 버킷명 수정(businesses-docs), telegram alias 추가 |
| 3 | 04-24 | 사장님 대시보드, PaymentModal, 어드민 입금확인 |
| 4 | 04-24 | 업소심사 테이블 통합, 업소정보수정, 플랜배지 |
| 5 | 04-25 | Pricing 기간토글(할인율), 플랜명 업데이트, platform_choice UI |
| 6 | 04-25 | ignoreBuildErrors 제거, TS/ESLint 수정, Vercel 배포 |
| 7 | 04-25 | P2 ShopDetailView 진입점 교체, cocoalba_tier 배지 |
| 8 | 04-25 | 영업허가증 업로드, 입점완료 CTA, 영업시간, 메뉴분류, 미리보기 |
| 9 | 04-26 | OCR API (Claude Haiku), AI 자동입력 버튼 |
| 10 | 04-26 | 지역 SEO 랜딩 17개, sitemap/robots, 코코알바 위젯, 메뉴 필수필드 |
| Dashboard | 04-27 | 대시보드 전면개편 — 코코알바 기존회원 진입, 조건부 CTA |
| 11 | 04-28 | RegisterForm OCR 개업일 자동반영, 파일업로드 OCR 자동트리거, platform_choice 플랜별 자동선택, register API 타이틀 수정, edit UX (룸수/연령대 단위, 금액 콤마, 업소 소개 자동생성, 상세지역 select, 영업시간 드롭다운), 대시보드 플랫폼 빠른 등록 4개 버튼 |
| 12 | 04-28 | P2 Step 4(추가 옵션) 야사장 회원 숨김, 대시보드 '플랫폼 구인 조건' 내부 폼 3종 (코코알바/웨이터존/선수존), POST /api/platform-ads/update (shops.options 병합 저장) |

---

## 9. 미완료 항목

- ❌ 커뮤니티 (야사장 전용 게시판) — Phase 2
- ❌ 업소 임대·매매 — Phase 2
- ❌ 랭킹 페이지
- ❌ 구독 플랜 업그레이드/다운그레이드 UI
- ❌ 광고 통계 대시보드 (노출수, 클릭수)
- ❌ P9 웨이터존 / P10 선수존 완성

---

## 10. 알려진 주의사항

- Supabase `bigint` (shops.id) vs `uuid` (businesses.id) 혼동 주의
- Storage 버킷명: `businesses-docs` (하이픈 아님, 언더스코어 아님)
- OCR API: Anthropic Claude Haiku 사용 → ANTHROPIC_API_KEY 필요
- `cookies()` 반드시 `await` (Next.js 15)
- SSG 페이지에서 `createClient()` 대신 직접 Supabase URL fetch 사용
