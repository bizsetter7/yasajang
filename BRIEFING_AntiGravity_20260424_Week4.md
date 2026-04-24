# BRIEFING_AntiGravity_20260424_Week4

> 작성자: 코부장 | 수신: AntiGravity | 날짜: 2026-04-24
> 이전 작업: Week3 완료 (P5 대시보드+어드민입금확인 / P6 메인+상세+유입카운터)

---

## 0. 우선 수정 (버그)

### [P5] register-audit 테이블명 오류
`src/app/admin/register-audit/page.tsx` 전체에서 `shops` → `businesses` 로 교체.
- status 값도 `PENDING_REVIEW` → `pending` 으로 통일 (businesses 테이블 기준)
- 승인 시 `status: 'active'` → `is_verified: true, is_active: true, status: 'active'` 로 변경

---

## 1. P5 야사장 — Week 4

### 1-1. businesses 테이블 컬럼 보강 (DB 마이그레이션 필요)
아래 SQL을 Supabase SQL Editor에서 실행해야 한다 (코드 작업 전):
```sql
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS audit_note TEXT,
  ADD COLUMN IF NOT EXISTS audited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lat FLOAT,
  ADD COLUMN IF NOT EXISTS lng FLOAT,
  ADD COLUMN IF NOT EXISTS open_chat_url TEXT,
  ADD COLUMN IF NOT EXISTS region_code TEXT;
```

### 1-2. 사장님 대시보드 — 업소 정보 수정 기능
- **파일**: `src/app/dashboard/edit/page.tsx` (신규)
- **내용**: 업소명, 전화번호, 주소, 카카오오픈채팅 URL, 업종 수정 폼
- **API**: `src/app/api/businesses/update/route.ts` (PATCH)
  - 본인 업소만 수정 가능 (owner_id 검증)
  - 수정 후 `status: 'pending'` 으로 재심사 대기

```typescript
// PATCH /api/businesses/update
// Body: { businessId, name?, phone?, address?, openChatUrl? }
// 응답: { ok: true }
```

### 1-3. 플랜별 밤길 노출 배지
- **파일**: `src/components/dashboard/BusinessCard.tsx` 수정
- 구독 plan에 따라 밤길 노출 상태 배지 표시:
  - `trial` → "밤길 노출: 미노출" (회색)
  - `active + basic` → "밤길 노출: 기본" (초록)
  - `active + standard` → "밤길 노출: 우선 노출" (파랑)
  - `active + premium` → "밤길 노출: 최상단 고정" (앰버)

### 1-4. 어드민 — 업소 심사 페이지 완성
- `src/app/admin/register-audit/page.tsx` 수정:
  - `shops` → `businesses` 테이블로 교체
  - 심사 승인 시: `is_verified: true, is_active: true, status: 'active'`
  - 심사 거절 시: `status: 'rejected', audit_note: message`
  - 텔레그램 알림: `sendTelegramAlert()` 함수 직접 호출 (현재 `/api/notify` 호출 방식 제거)

---

## 2. P6 밤길 — Week 4

### 2-1. 지역별 필터 추가
- **파일**: `src/app/page.tsx` 수정
- 카테고리 필터 아래에 지역 필터 추가:
```typescript
const REGION_LABELS: Record<string, string> = {
  seoul: '서울',
  gyeonggi: '경기',
  incheon: '인천',
  busan: '부산',
  daegu: '대구',
  other: '기타',
};
```
- URL 파라미터: `?region=seoul&category=room_salon`

### 2-2. 업소 카드 — 조회수 배지
- **파일**: `src/components/business/BusinessCard.tsx` 수정
- businesses 조회 시 bamgil_contacts count 포함:
```typescript
// Supabase query 수정
.select('id, name, category, region_code, address, lat, lng, phone, open_chat_url, bamgil_contacts(count)')
```
- 카드 하단에 "👁 이번달 NN명 조회" 배지 표시

### 2-3. SEO 메타태그
- **파일**: `src/app/layout.tsx` 수정
```typescript
export const metadata = {
  title: '밤길 — 검증된 업소 탐색 플랫폼',
  description: '지도 기반으로 내 주변 안전한 업소를 찾아보세요.',
  openGraph: {
    title: '밤길',
    description: '검증된 업소 탐색',
    url: 'https://bamgil.kr',
    siteName: '밤길',
  },
};
```

### 2-4. 업소 상세 — 구독 플랜 배지
- **파일**: `src/app/places/[businessId]/page.tsx` 수정
- businesses 조회 시 subscriptions join 추가
- 플랜에 따라 배지 표시:
  - `premium` → "⭐ 프리미엄 파트너" (앰버)
  - `standard` → "✓ 공식 파트너" (파랑)
  - `basic` → 배지 없음

### 2-5. 로딩 스켈레톤
- **파일**: `src/app/loading.tsx` (P6 신규)
```typescript
// 카드 스켈레톤 3개 + 지도 영역 스켈레톤
export default function Loading() { ... }
```

---

## 3. DB 마이그레이션 (코드 작업 전 실행 필요)

```sql
-- businesses 테이블 보강
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS audit_note TEXT,
  ADD COLUMN IF NOT EXISTS audited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lat FLOAT,
  ADD COLUMN IF NOT EXISTS lng FLOAT,
  ADD COLUMN IF NOT EXISTS open_chat_url TEXT,
  ADD COLUMN IF NOT EXISTS region_code TEXT;

-- subscriptions → businesses RLS: 사장님이 본인 업소 수정 가능
CREATE POLICY "owner_update_business" ON public.businesses
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
```

---

## 4. 파일 수정 목록 요약

### P5 야사장
| 파일 | 작업 |
|------|------|
| `src/app/admin/register-audit/page.tsx` | shops→businesses 버그 수정 |
| `src/app/dashboard/edit/page.tsx` | 신규: 업소 정보 수정 |
| `src/app/api/businesses/update/route.ts` | 신규: 수정 API |
| `src/components/dashboard/BusinessCard.tsx` | 플랜 배지 추가 |

### P6 밤길
| 파일 | 작업 |
|------|------|
| `src/app/page.tsx` | 지역 필터 추가 |
| `src/app/layout.tsx` | SEO 메타태그 |
| `src/app/loading.tsx` | 신규: 로딩 스켈레톤 |
| `src/components/business/BusinessCard.tsx` | 조회수 배지 |
| `src/app/places/[businessId]/page.tsx` | 구독 플랜 배지 |

---

## 5. 완료 기준
- [ ] `npm run build --webpack` P5·P6 모두 빌드 통과
- [ ] `tsc --noEmit` 타입 오류 없음
- [ ] register-audit: businesses 테이블 정상 조회
- [ ] 업소 정보 수정 API 동작 확인
- [ ] P6 지역 필터 URL 파라미터 동작

## 6. 주의사항 (MISTAKES_LOG)
- `cookies()` await 필수
- 파일 전체 덮어쓰기 금지 — 핀셋(Edit) 수정
- `shops` 테이블 참조 코드 전부 제거
- P5·P6 각각 별도 빌드 확인
