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

## ⚡ 점프(JUMP) 시스템 정책 (M-060, 2026-05-02 확정 — 절대 일반화 금지)

> P5 confirm-payment에서 무료 점프 즉시 지급. cron 실행은 P2 daily-jump-tasks가 담당.

| 플랜 | 즉시 무료 점프 | 매일 +1 자동 적립 | 자동 점프 (cron set/일) |
|------|------------|----------------|--------------------|
| 베이직 | - | - | - |
| 스탠다드 | - | - | - |
| 스페셜 | 10회 | - | 3회/일 |
| 디럭스 | 30회 | - | 6회/일 |
| **프리미엄** | **30회** | **+1회/일** | **8회/일** |

- **⚠️ 매일 +1 자동 적립은 프리미엄 한정** — Pricing.tsx·요금제 페이지·register 안내 등 다른 플랜 일반화 표기 금지 (M-060)
- 무료 점프 즉시 지급 코드: `src/app/api/admin/confirm-payment/route.ts` 라인 144-184
- `PLAN_INITIAL_JUMPS = { special: 10, deluxe: 30, premium: 30 }` 변경 시 P2 cron의 `PLAN_MANUAL_JUMP_RESET`도 동기 업데이트 필수
- AuthProvider(P2/P9/P10) 표시: `user_jumps.subscription_balance` 단독
- 상세: `memory/jump_system_policy.md` (전사 마스터)

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
| 13 | 04-28 | BusinessCard 상세지역 표시 (extractSubRegion: "경기"→"경기 평택시"), 플랫폼 구인폼 드롭다운 Chrome/Windows 텍스트 누락 버그 수정 (appearance-none + 커스텀▼), 금액 입력 커서점프 수정 (blur 포맷 패턴) |
| 14 | 04-29 | 어드민 대시보드 전면 재구현: service_role 통계(RLS 우회), AdminSidebar 클라이언트 분리(usePathname), register-audit 상태탭+삭제+검색, 회원관리(/admin/settings), platform-settings 리다이렉트, API(businesses+members) 신규. 서류조회 Object not found 수정(upload encodeURIComponent 버그), 어드민 상세지역+연락처하이픈 표시, approved status alias |
| 15 | 04-29 | **영업진 시스템 도입** — RegisterForm Step 1: 담당자명(`manager_name`) 별도 입력 + 직책 드롭다운(사장/실장/팀장/부장/매니저) 추가. Step 2: 영업허가증 필수 검증(`!files.permit` 차단), 두 문서 모두 `*필수` 라벨. Step 3: 최종확인에 두 문서·직책·사업자번호 노출. /api/register: `manager_name`+`manager_role` 수신 → businesses 저장(fallback: representative → '실장'). DB SQL: `ALTER TABLE businesses ADD COLUMN manager_role TEXT`. P6에서 `business_reg_number`(OCR 자동추출)로 같은 사업자 영업진 그룹핑(Phase B) — 같은 사업자에 여러 영업진 별도 계정 등록 가능, 화면에서 자동 합쳐 표시. |
| 16 | 04-30 | **5개 버그 수정 + 메신저 연락처 신설** (commit ba53256) — [A] M-051 region='gyeonggi' 근절: publish+update API에서 address(한국어)로 shops.region/regionGu 파싱 [B] 구인조건 P2 미반영: platform-ads/update에서 options.ageMin/ageMax + work_time 컬럼 동시 저장 [C] M-052 premium 사이드배너 자동게시: PLAN_TO_TIER premium='p2'→'p3' (publish/register 2곳) [D] 메신저 연락처 3종 신설: RegisterForm Step1+edit/page+register/update API에 kakao_id/line_id/telegram_id 추가 (⚠️ DB SQL 실행 필요: ALTER TABLE businesses ADD COLUMN IF NOT EXISTS kakao_id/line_id/telegram_id TEXT) |

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
- **`<select>` 스타일링 주의**: `rounded-xl`+`focus:ring`+`bg-white` 조합 시 Chrome/Windows에서 옵션 텍스트 미표시 버그 발생 → 반드시 `appearance-none` + 래퍼 div + 커스텀 `▼` 화살표 패턴 사용 (`selectCls` 변수 참조)
- **금액 input 포맷 패턴**: onChange에서 comma 포맷 금지(커서 점프) → `[field]Focused` state + onFocus(raw)/onBlur(format) 패턴 사용
- **사업자등록증 + 영업허가증 둘 다 필수** (2026-04-29 확정) — Step 2 nextStep 검증에서 둘 다 체크. 둘 다 OCR 자동 트리거(파일 선택 즉시 + 수동 재실행 버튼). `business_reg_number`는 OCR로 자동 추출되어 P6 그룹핑 키로 사용
- **manager_role 컬럼 + 직책 5종 고정** — 사장/실장/팀장/부장/매니저 (직원·기타 제외). 신규 등록 시 RegisterForm Step 1에서 선택. 누락 시 register API에서 '실장' 기본값. P6에서 `${maskName(name)} ${role}` 형식 표시
- **영업진 다중 등록 패턴** — 같은 사업자(business_reg_number 동일)에 여러 영업진이 각자 별도 auth 계정으로 입점 등록 가능. P6에서 자동 그룹핑되어 캡처5처럼 영업진 N명 카드로 표시. 영업진별 plan/구독 독립 (한 명은 premium, 다른 한 명은 basic 가능)
- **OCR Claude 모델**: `claude-haiku-4-5-20251001` (사업자등록증 → business_number/name/representative/open_date / 영업허가증 → license_number/floor_area). docType 파라미터로 분기
- **shops.region 저장 규칙** (M-051): `businesses.region_code`는 영문코드('gyeonggi') → **절대 shops.region에 사용 금지**. 반드시 `businesses.address.split(/\s+/)[0]`(한국어 '경기') 사용. P2 ShopDetailView는 `options.regionGu`도 읽음 — options 저장 시 포함 필수.
- **PLAN_TO_TIER 현행 (2026-05-01 수정)** — publish/register/confirm-payment 일치:
  ```
  basic='p7' / standard='p4' / special='p4' / deluxe='p3' / premium='p2'
  ```
  premium='p2'가 맞음. BannerSidebar는 banner_status='none' 필터로 사이드배너 자동노출 차단(M-052 근본 수정).
  p5 CLAUDE.md에 'premium=p3'라고 적혀있었던 것은 **잘못된 과거 기록 — 완전 무시**할 것.
- **P2 ShopDetailView 호환 필드**: shops.options에 `ageMin/ageMax`(나이), `workTime`(근무시간) 저장 필요. platform-ads/update에서 hiringInfo 저장 시 동시 저장 구현됨.
- **pay 컬럼 동기화 필수 (M-056)**: platform-ads/update에서 hiring_info 저장 시 반드시 top-level pay/pay_type/pay_amount도 업데이트. cocoalba=TC방식, waiterzone/sunsuzone=일급. options에만 있으면 P2/P9/P10 광고카드 급여 공백.
- **메신저 연락처 3종**: businesses 테이블에 `kakao_id/line_id/telegram_id TEXT` 컬럼 (2026-04-30 추가, DB SQL 실행 필요). RegisterForm Step1 + edit/page + register/update API 반영 완료.
