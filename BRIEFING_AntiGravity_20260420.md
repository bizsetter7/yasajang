# 지시서 v1.0 — 2026-04-20
**작성: 코부장 (Claude Code)**
**대상: 안티그래비티**
**프로젝트: P5 야사장 (yasajang.kr) + P6 밤길 (bamgil.kr) — 동시 진행**

---

## ⚠️ 작업 전 필독 (절대 규칙)

1. **이 지시서에 명시된 것만 만든다.** 임의로 기능 추가·변경·삭제 금지.
2. **코드 작성 전 반드시 스키마와 컬럼명을 이 문서에서 확인한다.**
3. **완료 후 반드시 REPORT_AntiGravity_20260420.md에 보고서 작성.**
4. 보고서 없이 완료 보고 금지.
5. 막히는 부분은 임의로 해결하지 말고 보고서에 "미완료 사항"으로 명시.

---

## 1. 이번 지시 범위 — Week 1

이번 지시서에서 만들 것:
- [ ] 공통 Supabase 스키마 마이그레이션 실행
- [ ] P5 야사장 Next.js 15 프로젝트 셋업
- [ ] P6 밤길 Next.js 15 프로젝트 셋업
- [ ] 두 프로젝트 공통 환경변수 구성

---

## 2. 프로젝트 개요

### P5 야사장 (yasajang.kr)
- **타겟**: 유흥업소 사장님 (B2B)
- **핵심 기능**: 업소 등록 → 구독 결제 → 5개 플랫폼 동시 광고 관리
- **참조 경쟁사**: bamsajang.com (벤치마킹, 복사 아님)

### P6 밤길 (bamgil.kr)
- **타겟**: 유흥업소 손님 (B2C)
- **핵심 기능**: 카카오맵 기반 업소 탐색, 무료 등록 + 유료 상위노출
- **참조 경쟁사**: bammap.com (벤치마킹, 복사 아님)

---

## 3. Supabase 스키마 — 반드시 이 그대로 실행

### 3-1. 기존 코코알바 Supabase 프로젝트 공유
- 기존 코코알바 Supabase 프로젝트에 아래 테이블들을 **추가**한다.
- 기존 테이블(profiles, jobs, regions 등) **절대 수정하지 않는다.**

### 3-2. 마이그레이션 SQL

```sql
-- ============================================================
-- 코코 생태계 공통 스키마 v1.0
-- 실행일: 2026-04-20
-- 주의: 기존 코코알바 테이블 수정 절대 금지
-- ============================================================

-- 1. 업소 (사장님이 야사장에 등록하는 업소)
CREATE TABLE IF NOT EXISTS businesses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  category      text NOT NULL CHECK (category IN (
    'room_salon','karaoke_bar','bar','night_club','hostbar','general','other'
  )),
  region_code   text NOT NULL,         -- 기존 코코알바 region_code 체계 그대로 사용
  address       text,
  address_detail text,
  lat           float8,                -- 밤길 지도 핀용
  lng           float8,
  phone         text,
  kakao_channel text,
  open_chat_url text,
  business_reg_url  text,             -- 사업자등록증 파일 URL (Supabase Storage)
  license_url       text,             -- 영업허가증 파일 URL
  is_verified   boolean DEFAULT false,
  verified_at   timestamptz,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 2. 담당자 (업소당 여러 명, 밤길 URL 분리용)
-- URL 패턴: /places/{business_id}/{manager_id}
CREATE TABLE IF NOT EXISTS managers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid REFERENCES businesses(id) ON DELETE CASCADE,
  name          text NOT NULL,           -- 표시명 (가운데 마스킹은 프론트에서)
  role          text DEFAULT 'manager' CHECK (role IN ('owner','manager','staff')),
  phone         text,
  open_chat_url text,
  photo_url     text,
  is_active     boolean DEFAULT true,
  sort_order    int2 DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- 3. 구독 (야사장 핵심 BM)
CREATE TABLE IF NOT EXISTS subscriptions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  plan             text NOT NULL CHECK (plan IN ('basic','standard','premium')),
  status           text NOT NULL DEFAULT 'trial' CHECK (status IN (
    'trial','active','paused','cancelled'
  )),
  trial_starts_at  timestamptz DEFAULT now(),
  trial_ends_at    timestamptz DEFAULT (now() + interval '90 days'), -- 3개월 무료
  billing_starts_at timestamptz,
  next_billing_at  timestamptz,
  amount           int4,                -- 실 결제금액 (원)
  toss_payment_key text,               -- 토스페이먼츠 빌링키
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 4. 플랫폼별 광고 노출 상태
-- 야사장 구독 → 각 플랫폼에 어떤 티어로 노출되는지
CREATE TABLE IF NOT EXISTS platform_ads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  platform    text NOT NULL CHECK (platform IN (
    'cocoalba','bamgil','waiterzone','sunsujone'
  )),
  ad_tier     text NOT NULL DEFAULT 't7' CHECK (ad_tier IN (
    't1','t2','t3','t4','t5','t6','t7'
  )),
  -- t7=basic(베이직구독), t4=special(스탠다드구독), t2=premium(프리미엄구독)
  -- t1=grand(추가결제), t6=affiliate(제휴광고-별도계약)
  is_active   boolean DEFAULT true,
  view_count  int4 DEFAULT 0,          -- 랭킹 계산용 (daily 집계)
  starts_at   timestamptz DEFAULT now(),
  ends_at     timestamptz,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(business_id, platform)
);

-- 5. 밤길 상위 노출 별도 결제
-- 야사장 구독과 별개로 밤길에서 상위 노출 구매
CREATE TABLE IF NOT EXISTS bamgil_boosts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  boost_level int2 DEFAULT 1 CHECK (boost_level BETWEEN 1 AND 5),
  amount      int4 NOT NULL,
  starts_at   timestamptz DEFAULT now(),
  ends_at     timestamptz NOT NULL,
  toss_order_id text,
  created_at  timestamptz DEFAULT now()
);

-- 6. 밤길 유입 추적 (손님이 밤길에서 연락했을 때)
-- 업체 대시보드: "밤길에서 N명 연락옴" 표시용
CREATE TABLE IF NOT EXISTS bamgil_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  manager_id  uuid REFERENCES managers(id) ON DELETE SET NULL,
  contact_type text DEFAULT 'call' CHECK (contact_type IN ('call','chat','visit')),
  contacted_at timestamptz DEFAULT now()
  -- 개인정보 없음: 손님 식별정보 저장 안 함
);

-- 7. 업소 임대·매매 (야사장 전용 카테고리)
CREATE TABLE IF NOT EXISTS business_listings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type  text NOT NULL CHECK (listing_type IN ('rent','sale','transfer')),
  -- rent=임대, sale=매매, transfer=양도
  title         text NOT NULL,
  region_code   text NOT NULL,
  address       text,
  area_sqm      float4,                -- 면적 (㎡)
  monthly_rent  int4,                  -- 월세 (만원)
  deposit       int4,                  -- 보증금 (만원)
  sale_price    int4,                  -- 매매가 (만원)
  description   text,
  photos        text[],                -- 사진 URL 배열
  contact_phone text,
  is_active     boolean DEFAULT true,
  view_count    int4 DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 8. 채용공고 (웨이터존·선수존·코코알바 공통)
CREATE TABLE IF NOT EXISTS job_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid REFERENCES businesses(id) ON DELETE CASCADE,
  platform      text NOT NULL CHECK (platform IN (
    'cocoalba','waiterzone','sunsujone'
  )),
  title         text NOT NULL,
  job_type      text NOT NULL CHECK (job_type IN (
    'hostess','waiter','sunsu','bartender','staff','other'
  )),
  pay_type      text NOT NULL CHECK (pay_type IN (
    'hourly','daily','weekly','monthly','per_case','tc','negotiable'
  )),
  pay_amount    int4,
  pay_suffix    text[],                -- 추가급여 키워드 배열
  description   text,
  requirements  text,
  benefits      text,
  is_urgent     boolean DEFAULT false,
  is_active     boolean DEFAULT true,
  ad_tier       text DEFAULT 't7',     -- 광고 티어
  view_count    int4 DEFAULT 0,
  ad_start_date date DEFAULT CURRENT_DATE,
  ad_end_date   date,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 9. 커뮤니티 게시글 (전 플랫폼 공통)
CREATE TABLE IF NOT EXISTS community_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform    text NOT NULL CHECK (platform IN (
    'yasajang','cocoalba','waiterzone','sunsujone'
  )),
  board       text NOT NULL CHECK (board IN (
    'talk','local','guide',
    'waiter_story','waiter_tip',        -- 웨이터존 전용
    'sunsu_talk'                        -- 선수존 전용
  )),
  title       text NOT NULL,
  content     text NOT NULL,
  region_code text,                     -- 지역방용
  view_count  int4 DEFAULT 0,
  comment_count int4 DEFAULT 0,         -- 캐시 카운트 (성능용)
  is_pinned   boolean DEFAULT false,
  is_deleted  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_comments (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content   text NOT NULL,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 10. 리뷰 (밤길 핵심 차별화 — 경쟁사 전무)
CREATE TABLE IF NOT EXISTS reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id         uuid REFERENCES businesses(id) ON DELETE CASCADE,
  rating              int2 NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content             text,
  visit_date          date,
  is_verified_visit   boolean DEFAULT false, -- 향후 인증 방문 기능용
  is_deleted          boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(reviewer_id, business_id)           -- 1인 1리뷰
);

-- 11. 찜하기 (전 플랫폼 공통)
CREATE TABLE IF NOT EXISTS favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('business','job_post','listing')),
  target_id   uuid NOT NULL,
  platform    text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- 12. 랭킹 스냅샷 (야사장·밤길 랭킹 페이지용)
CREATE TABLE IF NOT EXISTS ranking_snapshots (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid REFERENCES businesses(id) ON DELETE CASCADE,
  period       text NOT NULL CHECK (period IN ('daily','weekly','monthly')),
  rank_position int4 NOT NULL,
  view_count   int4 DEFAULT 0,
  region_code  text,
  category     text,
  snapshot_date date DEFAULT CURRENT_DATE,
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_region ON businesses(region_code);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_managers_business ON managers(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_platform_ads_business ON platform_ads(business_id);
CREATE INDEX IF NOT EXISTS idx_platform_ads_platform ON platform_ads(platform);
CREATE INDEX IF NOT EXISTS idx_bamgil_contacts_business ON bamgil_contacts(business_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_business ON job_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_platform ON job_posts(platform);
CREATE INDEX IF NOT EXISTS idx_community_posts_platform_board ON community_posts(platform, board);
CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_date ON ranking_snapshots(snapshot_date, period);

-- ============================================================
-- RLS 정책 (기본)
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bamgil_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bamgil_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_snapshots ENABLE ROW LEVEL SECURITY;

-- businesses: 누구나 읽기 가능, 본인만 수정
CREATE POLICY "businesses_public_read" ON businesses FOR SELECT USING (is_active = true);
CREATE POLICY "businesses_owner_all"   ON businesses FOR ALL USING (auth.uid() = owner_id);

-- managers: 누구나 읽기, 업소 오너만 수정
CREATE POLICY "managers_public_read" ON managers FOR SELECT USING (is_active = true);
CREATE POLICY "managers_owner_all"   ON managers FOR ALL
  USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

-- subscriptions: 본인 업소만
CREATE POLICY "subscriptions_owner" ON subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

-- platform_ads: 누구나 읽기 (랭킹 계산), 본인 업소만 수정
CREATE POLICY "platform_ads_public_read" ON platform_ads FOR SELECT USING (is_active = true);
CREATE POLICY "platform_ads_owner_all"   ON platform_ads FOR ALL
  USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

-- reviews: 누구나 읽기, 본인만 작성/수정
CREATE POLICY "reviews_public_read"  ON reviews FOR SELECT USING (is_deleted = false);
CREATE POLICY "reviews_owner_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "reviews_owner_update" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- community_posts: 누구나 읽기, 로그인한 사용자만 작성
CREATE POLICY "community_posts_public_read" ON community_posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "community_posts_auth_insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "community_posts_owner_update" ON community_posts FOR UPDATE USING (auth.uid() = author_id);

-- favorites: 본인만
CREATE POLICY "favorites_owner" ON favorites FOR ALL USING (auth.uid() = user_id);

-- business_listings: 누구나 읽기, 본인만 수정
CREATE POLICY "listings_public_read" ON business_listings FOR SELECT USING (is_active = true);
CREATE POLICY "listings_owner_all"   ON business_listings FOR ALL USING (auth.uid() = owner_id);

-- ranking_snapshots: 누구나 읽기
CREATE POLICY "ranking_public_read" ON ranking_snapshots FOR SELECT USING (true);

-- bamgil_contacts: 업소 오너만 읽기
CREATE POLICY "bamgil_contacts_owner_read" ON bamgil_contacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));
CREATE POLICY "bamgil_contacts_public_insert" ON bamgil_contacts FOR INSERT WITH CHECK (true);
```

---

## 4. 프로젝트 셋업

### 4-1. P5 야사장

**폴더 위치**: `D:\토탈프로젝트\My-site\p5.야사장\`

**실행 명령어**:
```bash
cd D:\토탈프로젝트\My-site
npx create-next-app@latest p5.야사장 --typescript --tailwind --app --src-dir --use-npm
```

**설치 후 추가 패키지**:
```bash
cd p5.야사장
npm install @supabase/supabase-js @supabase/ssr
npm install @toss/payments  # 토스페이먼츠
npm install zustand         # 상태관리
npm install react-hook-form zod @hookform/resolvers  # 폼
```

### 4-2. P6 밤길

**폴더 위치**: `D:\토탈프로젝트\My-site\p6.밤길\`

**실행 명령어**:
```bash
cd D:\토탈프로젝트\My-site
npx create-next-app@latest p6.밤길 --typescript --tailwind --app --src-dir --use-npm
```

**추가 패키지**:
```bash
cd p6.밤길
npm install @supabase/supabase-js @supabase/ssr
npm install zustand
npm install react-hook-form zod @hookform/resolvers
# 카카오맵은 CDN으로 로드 (별도 npm 패키지 없음)
```

---

## 5. 환경변수 (.env.local)

**양쪽 프로젝트 동일하게 적용**:
```env
# Supabase (기존 코코알바와 동일한 프로젝트)
NEXT_PUBLIC_SUPABASE_URL=기존_코코알바_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=기존_코코알바_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=기존_코코알바_SERVICE_ROLE_KEY

# 카카오 (밤길 지도용)
NEXT_PUBLIC_KAKAO_MAP_KEY=카카오_앱키

# 토스페이먼츠 (야사장 결제용)
TOSS_CLIENT_KEY=토스_클라이언트키
TOSS_SECRET_KEY=토스_시크릿키

# 사이트 URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001  # 야사장
# NEXT_PUBLIC_SITE_URL=http://localhost:3002  # 밤길
```

---

## 6. 초기 파일 구조 설계

### P5 야사장 src/ 구조
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # 메인 (서비스 소개 + CTA)
│   ├── register/             # 업소 등록
│   │   └── page.tsx
│   ├── subscribe/            # 구독 결제
│   │   └── page.tsx
│   ├── dashboard/            # 내 광고 관리 (로그인 필요)
│   │   └── page.tsx
│   ├── ranking/              # 랭킹
│   │   └── page.tsx
│   ├── community/            # 커뮤니티
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── listing/              # 업소 임대·매매
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── api/
│       ├── businesses/
│       ├── subscriptions/
│       └── upload/           # 서류 파일 업로드
├── components/
│   ├── layout/               # Header, Footer, Nav
│   ├── auth/                 # 로그인 (카카오+구글+이메일)
│   ├── business/             # 업소 등록 폼, 카드
│   ├── subscription/         # 구독 플랜 선택 UI
│   ├── dashboard/            # 광고관리 대시보드
│   ├── ranking/              # 랭킹 리스트
│   └── community/            # 게시판
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── constants/
│       ├── regions.ts        # 코코알바 지역코드 그대로 복사
│       ├── categories.ts     # 업종 상수
│       └── tiers.ts          # T1~T7 상수
└── types/
    └── database.ts           # Supabase 타입 정의
```

### P6 밤길 src/ 구조
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # 메인 (지도뷰 기본)
│   ├── places/
│   │   ├── page.tsx          # 목록뷰
│   │   ├── [businessId]/
│   │   │   └── page.tsx      # 업소 상세
│   │   └── [businessId]/[managerId]/
│   │       └── page.tsx      # 담당자별 상세 (SEO 핵심)
│   ├── rankings/
│   │   └── [period]/page.tsx # daily, weekly, monthly
│   ├── register/             # 업소 무료 등록
│   │   └── page.tsx
│   └── api/
│       ├── businesses/
│       └── contacts/         # 밤길 유입 추적
├── components/
│   ├── layout/
│   ├── map/                  # 카카오맵 컴포넌트
│   │   ├── KakaoMap.tsx
│   │   ├── BusinessPin.tsx
│   │   └── MapSidebar.tsx
│   ├── business/             # 업소 카드, 상세
│   ├── review/               # 리뷰 시스템
│   └── ranking/
└── lib/
    ├── supabase/
    ├── kakao/                # 카카오맵 유틸
    └── constants/
        └── regions.ts        # 코코알바 지역코드 그대로 복사
```

---

## 7. 이번 지시에서 만들지 않는 것

아래는 Week 2 이후 별도 지시서에서 처리:
- ❌ 결제 연동 (토스페이먼츠 빌링키)
- ❌ 카카오맵 실제 구현
- ❌ 로그인 UI 화면
- ❌ 업소 등록 폼
- ❌ 리뷰 UI
- ❌ Vercel 배포 설정

---

## 8. 완료 기준 체크리스트

보고서에서 아래 항목 모두 ✅ 확인 후 제출:

**Supabase 스키마**
- [ ] 12개 테이블 모두 생성됨 (Supabase 대시보드 Table Editor에서 확인)
- [ ] 인덱스 생성됨
- [ ] RLS 정책 적용됨 (모든 테이블 RLS enabled)
- [ ] 기존 코코알바 테이블 변경 없음 확인

**P5 야사장 프로젝트**
- [ ] `npm run dev` 실행되어 localhost:3000 열림
- [ ] src/ 폴더 구조 위 설계대로 생성됨
- [ ] .env.local 생성됨 (값은 실제 코코알바 값 복사)
- [ ] Supabase 연결 확인 (기본 쿼리 1개 실행되는지)

**P6 밤길 프로젝트**
- [ ] `npm run dev` 실행되어 localhost:3001 열림
- [ ] src/ 폴더 구조 위 설계대로 생성됨
- [ ] .env.local 생성됨
- [ ] Supabase 연결 확인

---

## 9. 보고서 작성 위치

완료 후 아래 파일에 보고서 작성:
- `D:\토탈프로젝트\My-site\p5.야사장\REPORT_AntiGravity_20260420.md`

---
*코부장 서명: Claude Code (코코알바 전략 담당)*
*다음 지시서: Week 2 — 로그인 + 업소 등록 폼*
