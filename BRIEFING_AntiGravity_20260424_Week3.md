# 지시서 v3.0 — 2026-04-24 (Week 3)
**작성: 코부장 (Claude Code)**
**대상: 안티그래비티**
**프로젝트: P5 야사장 (yasajang.kr) + P6 밤길 (bamgil.kr) 동시 진행**

---

## ⚠️ 작업 전 필독 (절대 규칙)

1. **이 지시서에 명시된 것만 만든다.** 임의 추가·변경·삭제 금지.
2. **파일 전체 덮어쓰기 금지 — 핀셋(Edit) 수정만.**
3. **완료 후 `npm run build` 성공 확인 필수.** 빌드 에러 상태 완료 보고 = 허위 보고.
4. **보고서 파일 저장 필수**: `REPORT_AntiGravity_20260424_Week3.md`
5. 막히는 부분은 임의 해결 말고 보고서 "미완료 사항"에 명시.

---

## 1. 이번 지시 범위 — Week 3

### P5 야사장
- [ ] 사장님 대시보드 (`/dashboard`) — 업소 현황 + 구독 상태 + 밤길 유입 카운터 + 입금 신청
- [ ] 어드민 입금 확인 탭 (`/admin/payments`) — 이번 Week 2에서 이월된 항목

### P6 밤길 (Week 1 착수)
- [ ] 기본 레이아웃 + 헤더/푸터
- [ ] 메인 페이지 — 지역 필터 + 업소 카드 목록
- [ ] 카카오맵 연동
- [ ] 업소 상세 페이지
- [ ] 밤길 유입 카운터 API

---

## 2. 참조 스키마 (Week 1 SQL 기준 — 절대 변경 금지)

Week 3에서 사용할 테이블:

### businesses
```
id uuid PK
owner_id uuid (auth.users FK)
name text
category text
region_code text
address text
address_detail text
lat float8
lng float8
phone text
kakao_channel text
open_chat_url text
business_reg_url text
license_url text
is_verified boolean
verified_at timestamptz
is_active boolean
created_at timestamptz
updated_at timestamptz
```

### subscriptions
```
id uuid PK
business_id uuid (businesses FK, UNIQUE)
plan text ('basic','standard','premium')
status text ('trial','active','paused','cancelled')
trial_starts_at timestamptz
trial_ends_at timestamptz
billing_starts_at timestamptz
next_billing_at timestamptz
amount int4
payment_reference text   ← 무통장 입금 참조번호 (입금자명_날짜 등)
payment_method text
confirmed_at timestamptz
confirmed_by text        ← 확인한 어드민 이메일
created_at timestamptz
updated_at timestamptz
```

### bamgil_contacts
```
id uuid PK
business_id uuid (businesses FK)
manager_id uuid nullable
contact_type text ('call','chat','visit')
contacted_at timestamptz
```

---

## 3. P5 야사장 — 사장님 대시보드 (`/dashboard`)

### 3-1. 파일 위치
```
src/app/dashboard/page.tsx       ← 서버 컴포넌트 (데이터 fetch)
src/components/dashboard/
  ├── BusinessCard.tsx            ← 업소 현황 카드
  ├── SubscriptionCard.tsx        ← 구독 상태 카드
  ├── BamgilStatsCard.tsx         ← 밤길 유입 카운터 카드
  └── PaymentModal.tsx            ← 무통장 입금 신청 모달
```

### 3-2. 데이터 fetch 로직 (`/dashboard/page.tsx`)

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  // 로그인 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // 내 업소 조회
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!business) redirect('/register'); // 업소 없으면 등록으로

  // 구독 조회
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('business_id', business.id)
    .single();

  // 이번 달 밤길 유입 수
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const { count: bamgilCount } = await supabase
    .from('bamgil_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .gte('contacted_at', thisMonthStart.toISOString());

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-black text-white">내 업소 관리</h1>
      <BusinessCard business={business} />
      <SubscriptionCard subscription={subscription} businessId={business.id} />
      <BamgilStatsCard count={bamgilCount ?? 0} />
    </main>
  );
}
```

### 3-3. BusinessCard 컴포넌트

표시 내용:
```
업소명 (bold)
업종 | 지역
연락처
─────────────────
심사 상태:
  is_verified=false → 🟡 서류 심사 중 (영업일 1~2일 소요)
  is_verified=true  → ✅ 승인 완료
```

### 3-4. SubscriptionCard 컴포넌트

표시 내용:
```
[플랜명] 구독 현황
─────────────────
상태별 표시:
  status='trial'  → "무료 체험 중 | 만료: {trial_ends_at | YYYY.MM.DD}"
                    payment_reference가 NULL이면:
                      → [유료 전환 신청하기] 버튼 (→ PaymentModal 열기)
                    payment_reference가 있으면:
                      → 🕐 "입금 확인 대기 중 ({payment_reference})"
  status='active' → ✅ "정기 구독 중 | 다음 결제: {next_billing_at}"
  status='paused' → ⚠️ "구독 일시정지"
```

### 3-5. PaymentModal 컴포넌트 (무통장 입금 신청)

```
제목: "유료 전환 신청"

안내:
  토스뱅크 1002-4683-1712 (예금주: 고남우/초코아이디어)
  플랜별 금액:
    베이직: 99,000원
    스탠다드: 199,000원
    프리미엄: 499,000원

입력 필드:
  입금자명 (text, 필수)
  입금 날짜 (date, 기본값: 오늘)
  비고 (text, 선택)

[신청 완료] 버튼 클릭 시:
  1. payment_reference = `${입금자명}_${날짜}` 형식으로 subscriptions UPDATE
  2. POST /api/notify/new-subscription 호출 (기존 API 재사용)
  3. 모달 닫기 + 화면 새로고침
```

PaymentModal API 호출 코드:
```typescript
// subscriptions 업데이트 (anon key로는 RLS 막힘 → API route 경유)
// POST /api/subscriptions/payment-request
const res = await fetch('/api/subscriptions/payment-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessId,
    payerName,
    payDate,
    note,
  }),
});
```

### 3-6. 입금 신청 API (`/api/subscriptions/payment-request/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendTelegramAlert } from '@/lib/utils/telegram';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { businessId, payerName, payDate, note } = await request.json();
  if (!payerName || !payDate) {
    return NextResponse.json({ error: '입금자명과 날짜는 필수입니다' }, { status: 400 });
  }

  // 본인 업소 확인
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, owner_id')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single();

  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const reference = `${payerName}_${payDate}${note ? `_${note}` : ''}`;

  // subscriptions 업데이트
  const { error } = await supabase
    .from('subscriptions')
    .update({
      payment_reference: reference,
      payment_method: 'bank_transfer',
      updated_at: new Date().toISOString(),
    })
    .eq('business_id', businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 어드민 텔레그램 알림
  await sendTelegramAlert(
    `💳 <b>무통장 입금 신청</b>\n\n` +
    `🏪 업소명: <b>${business.name}</b>\n` +
    `👤 입금자명: ${payerName}\n` +
    `📅 입금일: ${payDate}\n\n` +
    `👉 야사장 어드민 → 입금 확인 탭에서 처리해주세요.`
  );

  return NextResponse.json({ ok: true });
}
```

### 3-7. BamgilStatsCard 컴포넌트

```
밤길 이번 달 유입
─────────────────
[숫자] 명
"밤길에서 이번 달 연락한 손님 수입니다."
(숫자 0이면: "아직 밤길 유입이 없습니다. 밤길에 무료 등록하시면 손님이 연결됩니다.")
```

---

## 4. P5 야사장 — 어드민 입금 확인 (`/admin/payments/page.tsx`)

### 4-1. 파일 위치
```
src/app/admin/payments/page.tsx
```

### 4-2. 어드민 접근 제한

```typescript
// 기존 /admin/register-audit 패턴 동일하게 적용
// ADMIN_EMAIL 환경변수로 이메일 체크
```

### 4-3. 화면 구성

**목록 표시**: payment_reference IS NOT NULL AND status = 'trial'인 subscriptions

각 행 표시:
```
업소명 | 플랜 | 입금 참조번호 | 신청일 | 버튼
```

**[입금 확인 완료] 버튼** 클릭 시:
- `PATCH /api/admin/confirm-payment` 호출

**[반려] 버튼** 클릭 시:
- payment_reference = NULL 으로 초기화 (사장님이 재신청 가능하도록)

### 4-4. 입금 확인 API (`/api/admin/confirm-payment/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { sendTelegramAlert } from '@/lib/utils/telegram';

// service_role 클라이언트 — 로컬 선언 (공용 모듈 import 금지)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PATCH(request: Request) {
  // 어드민 인증 체크
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscriptionId, action } = await request.json();
  // action: 'confirm' | 'reject'

  if (action === 'confirm') {
    const now = new Date().toISOString();
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    const { data: sub, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        billing_starts_at: now,
        next_billing_at: nextBilling.toISOString(),
        confirmed_at: now,
        confirmed_by: user.email,
        updated_at: now,
      })
      .eq('id', subscriptionId)
      .select('*, businesses(name, owner_id)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 사장님에게 알림 (텔레그램 — 현재는 어드민 채팅으로 발송)
    await sendTelegramAlert(
      `✅ <b>구독 활성화 완료</b>\n\n` +
      `🏪 업소명: <b>${(sub as any).businesses?.name}</b>\n` +
      `📦 플랜: ${sub.plan}\n` +
      `💳 확인자: ${user.email}`
    );
  } else if (action === 'reject') {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        payment_reference: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);
  }

  return NextResponse.json({ ok: true });
}
```

---

## 5. P6 밤길 — Week 1

**폴더 위치**: `D:\토탈프로젝트\My-site\p6.밤길\`

> ⚠️ P6 밤길도 **동일한 Supabase 프로젝트** 사용 (환경변수 동일)
> `businesses` 테이블에서 `is_active=true AND is_verified=true` 인 업소만 표시

### 5-1. 환경변수 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=야사장과_동일_값
NEXT_PUBLIC_SUPABASE_ANON_KEY=야사장과_동일_값
SUPABASE_SERVICE_ROLE_KEY=야사장과_동일_값
NEXT_PUBLIC_KAKAO_MAP_KEY=카카오_JavaScript_앱키
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

> 카카오 앱키: https://developers.kakao.com → 내 애플리케이션 → 앱 키 → JavaScript 키

### 5-2. 파일 구조

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                     ← 메인: 지역 필터 + 카드 목록 + 지도
│   ├── places/
│   │   └── [businessId]/
│   │       └── page.tsx             ← 업소 상세
│   └── api/
│       └── contacts/
│           └── route.ts             ← 밤길 유입 카운터
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── map/
│   │   ├── KakaoMap.tsx             ← 'use client'
│   │   └── BusinessPin.tsx
│   └── business/
│       ├── BusinessCard.tsx
│       └── BusinessDetail.tsx
└── lib/
    └── supabase/
        ├── client.ts
        └── server.ts
```

### 5-3. 카카오맵 설정

**`src/app/layout.tsx`** — Script 태그로 카카오맵 SDK 로드:

```typescript
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
```

**`src/components/map/KakaoMap.tsx`** — 클라이언트 컴포넌트:

```typescript
'use client';

import { useEffect, useRef } from 'react';

interface Business {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  category: string;
}

interface KakaoMapProps {
  businesses: Business[];
  onPinClick: (id: string) => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMap({ businesses, onPinClick }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    window.kakao.maps.load(() => {
      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 기본
        level: 5,
      });

      businesses.forEach((biz) => {
        if (!biz.lat || !biz.lng) return;
        const marker = new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(biz.lat, biz.lng),
          title: biz.name,
        });
        window.kakao.maps.event.addListener(marker, 'click', () => {
          onPinClick(biz.id);
        });
      });
    });
  }, [businesses]);

  return <div ref={mapRef} className="w-full h-[400px] rounded-xl" />;
}
```

### 5-4. 메인 페이지 (`/page.tsx`)

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import BusinessCard from '@/components/business/BusinessCard';
import KakaoMap from '@/components/map/KakaoMap';

// 업종 한글 매핑
const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱',
  karaoke_bar: '노래방',
  bar: '바',
  night_club: '나이트',
  hostbar: '호스트바',
  general: '일반',
  other: '기타',
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; category?: string }>;
}) {
  const { region, category } = await searchParams;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  let query = supabase
    .from('businesses')
    .select('id, name, category, region_code, address, lat, lng, phone, open_chat_url')
    .eq('is_active', true)
    .eq('is_verified', true);

  if (region) query = query.eq('region_code', region);
  if (category) query = query.eq('category', category);

  const { data: businesses } = await query.limit(50);

  return (
    <main className="max-w-screen-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-black mb-4">업소 탐색</h1>

      {/* 필터 영역 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <a
            key={key}
            href={`/?category=${key}`}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all
              ${category === key
                ? 'bg-amber-500 text-black border-amber-500 font-bold'
                : 'border-gray-600 text-gray-400 hover:border-amber-500'
              }`}
          >
            {label}
          </a>
        ))}
      </div>

      {/* 지도 */}
      <KakaoMap
        businesses={(businesses ?? []).filter(b => b.lat && b.lng)}
        onPinClick={(id) => {
          window.location.href = `/places/${id}`;
        }}
      />

      {/* 카드 목록 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {(businesses ?? []).map((biz) => (
          <BusinessCard key={biz.id} business={biz} />
        ))}
        {(!businesses || businesses.length === 0) && (
          <p className="col-span-3 text-center text-gray-400 py-12">
            해당 지역에 등록된 업소가 없습니다.
          </p>
        )}
      </div>
    </main>
  );
}
```

### 5-5. BusinessCard 컴포넌트

```typescript
// src/components/business/BusinessCard.tsx
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  room_salon: '룸살롱', karaoke_bar: '노래방', bar: '바',
  night_club: '나이트', hostbar: '호스트바', general: '일반', other: '기타',
};

export default function BusinessCard({ business }: { business: any }) {
  return (
    <Link href={`/places/${business.id}`}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-amber-500 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-white text-lg">{business.name}</h3>
          <span className="text-xs text-amber-500 border border-amber-500 rounded px-2 py-0.5">
            {CATEGORY_LABELS[business.category] ?? business.category}
          </span>
        </div>
        <p className="text-sm text-gray-400">{business.address ?? business.region_code}</p>
        <div className="mt-3 flex gap-2">
          {business.phone && (
            <span className="text-xs text-gray-500">📞 연락 가능</span>
          )}
          {business.open_chat_url && (
            <span className="text-xs text-gray-500">💬 카톡 가능</span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

### 5-6. 업소 상세 페이지 (`/places/[businessId]/page.tsx`)

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ContactButton from './ContactButton'; // 클라이언트 컴포넌트

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: business } = await supabase
    .from('businesses')
    .select('*, managers(*)')
    .eq('id', businessId)
    .eq('is_active', true)
    .single();

  if (!business) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* 업소 기본 정보 */}
      <div className="bg-gray-900 rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-black text-white mb-1">{business.name}</h1>
        <p className="text-amber-500 text-sm mb-4">{business.category}</p>
        <p className="text-gray-400 text-sm">{business.address}</p>
      </div>

      {/* 연락하기 버튼들 */}
      <div className="space-y-3 mb-6">
        {business.phone && (
          <ContactButton
            businessId={businessId}
            type="call"
            href={`tel:${business.phone}`}
            label="전화 연락하기"
          />
        )}
        {business.open_chat_url && (
          <ContactButton
            businessId={businessId}
            type="chat"
            href={business.open_chat_url}
            label="카카오 오픈채팅"
          />
        )}
      </div>

      {/* 담당자 목록 */}
      {business.managers && business.managers.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-3">담당자</h2>
          <div className="space-y-2">
            {business.managers.filter((m: any) => m.is_active).map((manager: any) => (
              <div key={manager.id} className="bg-gray-900 rounded-lg p-4 flex items-center gap-3">
                {manager.photo_url && (
                  <img src={manager.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-white font-medium">{manager.name}</p>
                  <p className="text-gray-400 text-sm">{manager.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
```

### 5-7. ContactButton (클라이언트 컴포넌트)

```typescript
// src/app/places/[businessId]/ContactButton.tsx
'use client';

export default function ContactButton({
  businessId, type, href, label,
}: {
  businessId: string;
  type: 'call' | 'chat' | 'visit';
  href: string;
  label: string;
}) {
  const handleClick = async () => {
    // 유입 카운터 기록 (fire-and-forget)
    fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, contactType: type }),
    }).catch(() => {}); // 실패해도 UX에 영향 없음
  };

  return (
    <a
      href={href}
      target={type !== 'call' ? '_blank' : undefined}
      rel="noopener noreferrer"
      onClick={handleClick}
      className="block w-full text-center bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-400 transition-all"
    >
      {label}
    </a>
  );
}
```

### 5-8. 밤길 유입 카운터 API (`/api/contacts/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// service_role 사용 — anon은 RLS로 막힘
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { businessId, contactType } = await request.json();
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    await supabaseAdmin.from('bamgil_contacts').insert({
      business_id: businessId,
      contact_type: contactType ?? 'call',
      contacted_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }); // 유입 카운터 실패는 무음 처리
  }
}
```

---

## 6. 도메인 연결 안내 (대표님이 Vercel에서 진행)

> 안티는 코드만 작성. 도메인 설정은 대표님이 직접 진행.

### Vercel에서 설정할 것

**P5 야사장**:
- Vercel 대시보드 → P5 야사장 프로젝트 → Settings → Domains
- `yasajang.kr` 추가
- `www.yasajang.kr` 추가

**P6 밤길**:
- Vercel 대시보드 → P6 밤길 프로젝트 → Settings → Domains
- `bamgil.kr` 추가
- `www.bamgil.kr` 추가

> Vercel이 DNS 레코드 값을 보여주면 가비아 등 도메인 관리 페이지에서 A레코드 또는 CNAME 설정.

---

## 7. 이번 Week 3에서 만들지 않는 것

Week 4 이후:
- ❌ 구독 플랜 업그레이드/변경 UI
- ❌ 커뮤니티 (야사장 + 밤길)
- ❌ 랭킹 페이지
- ❌ 업소 임대·매매 listing
- ❌ 리뷰 시스템
- ❌ P9 웨이터존 / P10 선수존

---

## 8. 완료 기준 체크리스트

### P5 야사장

**대시보드 (`/dashboard`)**
- [ ] 로그인 안 된 상태 → `/` 리다이렉트
- [ ] 업소 미등록 상태 → `/register` 리다이렉트
- [ ] BusinessCard: 업소 정보 + 심사 상태 표시됨
- [ ] SubscriptionCard: trial/active 상태별 다른 UI 표시
- [ ] PaymentModal: 열기/닫기 작동, 입금 신청 후 Supabase subscriptions.payment_reference 업데이트 확인
- [ ] BamgilStatsCard: 이번 달 밤길 유입 수 표시 (0이어도 정상 표시)

**어드민 입금 확인 (`/admin/payments`)**
- [ ] ADMIN_EMAIL 아닌 계정으로 접근 시 차단됨
- [ ] payment_reference 있는 subscriptions 목록 표시
- [ ] [입금 확인 완료]: status='active' + confirmed_at 업데이트 확인 (Supabase에서 직접 확인)
- [ ] [반려]: payment_reference=NULL 초기화 확인

### P6 밤길

- [ ] 메인 페이지: 업소 카드 목록 표시 (데이터 없으면 빈 상태 메시지)
- [ ] 카테고리 필터: 클릭 시 URL 파라미터 변경 + 목록 필터링
- [ ] 카카오맵: 지도 렌더링됨 (핀은 lat/lng 있는 업소만)
- [ ] 업소 상세 페이지: 업소 정보 + 연락하기 버튼 표시
- [ ] ContactButton 클릭: `/api/contacts` 호출됨 + bamgil_contacts 테이블에 레코드 INSERT 확인
- [ ] 모바일(360px) 레이아웃 깨지지 않음

### 공통
- [ ] P5 `npm run build` 성공
- [ ] P6 `npm run build` 성공

---

## 9. 보고서 작성 위치

```
D:\토탈프로젝트\My-site\p5.야사장\REPORT_AntiGravity_20260424_Week3.md
```

---
*코부장 서명: Claude Code (코코알바 전략 담당)*
*다음 지시서: Week 4 — 커뮤니티 + 랭킹 + Vercel 배포 확인*
