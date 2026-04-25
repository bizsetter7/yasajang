# BRIEFING — Week 9 지시서 (데이터 파이프라인 긴급 수정)
> 작성: 코부장 (Claude Code) | 날짜: 2026-04-26 (전체 감사 완료 후 정밀 업데이트)
> 필독 선행문서 (순서 중요):
> 1. `D:\토탈프로젝트\My-site\p1.choco-idea\MISTAKES_LOG.md`
> 2. `D:\토탈프로젝트\My-site\p2.브랜드_통합_시스템\DATA_SCHEMA_SPEC.md` ← 이번 주 신규 필독

---

## 배경

P2 코코알바 전체 데이터 파이프라인 감사(코부장 직접 수행) 결과:

| 점검 항목 | 상태 |
|-----------|------|
| 회원가입 → profiles INSERT | ✅ 정상 |
| 공고 등록 → shops INSERT | ✅ 정상 |
| 이력서 등록 → resumes INSERT | ✅ 정상 |
| 1:1 문의 → inquiries INSERT | ✅ 정상 |
| 커뮤니티 → community_posts INSERT | ✅ 정상 |
| SOS 발송 → sos_alerts/payments/point_logs | ✅ 정상 |
| **지원서 등록 → applications INSERT** | ❌ shop_id 타입불일치 + owner_user_id 미저장 |
| **지원서 조회 → ApplicantsView** | ❌ bigint→uuid 타입불일치 → 항상 0건 |
| **쪽지 수신 조회 → MessageModal** | ❌ 이름 기반 → 닉네임 변경 시 소실 |
| **쪽지 발송 → MessageModal** | ❌ senderId 미저장 |

이번 주 임무: UI 수정 없이 **데이터 파이프라인만 수정**.

---

## 🔴 Task 1: 지원서(ApplicantsView) 조회 버그 수정

**문제:**
`applications.shop_id` 컬럼 타입 = **uuid**
`shops.id` 컬럼 타입 = **bigint**
→ 현재 코드가 bigint 배열을 uuid 컬럼에서 검색 → **결과 항상 0건**

**파일:** `src/app/my-shop/components/ApplicantsView.tsx`

### 1-A. 대표님 SQL 실행 완료 확인 후 진행

```sql
ALTER TABLE applications ADD COLUMN IF NOT EXISTS owner_user_id TEXT;
```

### 1-B. ApplicantsView.tsx 쿼리 변경

```tsx
// 변경 전 (line 37~45) — bigint→uuid 타입 불일치로 0건
const { data: shops } = await supabase.from('shops').select('id, name').eq('user_id', userId);
if (!shops || shops.length === 0) { setLoading(false); return; }
const shopIds = shops.map(s => s.id);
const { data } = await supabase
  .from('applications')
  .select('*')
  .in('shop_id', shopIds)   // ← 여기가 버그: uuid 컬럼에 bigint 배열
  .order('created_at', { ascending: false });

// 변경 후 — owner_user_id(TEXT)로 직접 조회
const { data: shops } = await supabase.from('shops').select('id, name').eq('user_id', userId);
const shopNameMap = Object.fromEntries((shops || []).map(s => [String(s.id), s.name]));

const { data } = await supabase
  .from('applications')
  .select('*')
  .eq('owner_user_id', userId)   // ← owner_user_id(TEXT) = 공고 소유자 userId
  .order('created_at', { ascending: false });
```

shop 이름 매핑:
```tsx
// 변경 전
const enriched = data.map(app => ({
  ...app,
  shopName: shops.find(s => s.id === app.shop_id)?.name || '공고 없음',
}));

// 변경 후 (shop_id 타입 불일치 우회)
const enriched = data.map(app => ({
  ...app,
  shopName: shopNameMap[String(app.shop_id)] || app.shop_name || '공고 없음',
}));
```

### 1-C. 지원서 등록(apply)에 owner_user_id 추가

**파일:** `src/components/jobs/JobDetailModal.tsx` **line 644**

`supabase.from('applications').insert({...})` 블록에 `owner_user_id` 1줄 추가:

```tsx
// 변경 전 (line 644~652)
await supabase.from('applications').insert({
    shop_id: shop.id,
    user_id: user?.id || null,
    applicant_name: applyName.trim(),
    applicant_phone: applyPhone.trim(),
    message: applyMsg.trim() || null,
    status: 'pending',
    created_at: new Date().toISOString(),
});

// 변경 후 — owner_user_id 추가 (shop 객체에 user_id 이미 포함됨, 추가 쿼리 불필요)
await supabase.from('applications').insert({
    shop_id: shop.id,
    user_id: user?.id || null,
    applicant_name: applyName.trim(),
    applicant_phone: applyPhone.trim(),
    message: applyMsg.trim() || null,
    status: 'pending',
    created_at: new Date().toISOString(),
    owner_user_id: shop.user_id || null,  // ← 추가: 공고 소유자 ID (shops.user_id = TEXT)
});
```

> `shop.user_id`는 현재 스코프에 이미 있는 값 — 별도 DB 조회 불필요.

---

## 🟠 Task 2: 쪽지 수신 조회 ID 기반으로 전환

**문제:**
현재 `getInbox(userName)` → `receiver_name`으로 조회 (이름 기반)
닉네임 변경 시 해당 사용자에게 온 쪽지 전부 소실됨.

**파일들:**
- `src/lib/noteService.ts` — getInbox/getUnread 함수 수정
- `src/components/message/MessageModal.tsx` — 수신 조회 + 발송 호출 수정

> 감사 완료 결과: `NoteService.sendNote()` 호출처는 **2곳만** 존재함.
> - `MessageModal.tsx:75` → senderId/receiverId 모두 미전달 ❌
> - `AdminInquiryManagement.tsx:600` → receiverId 전달 중, senderId만 undefined (어드민이라 OK)

### 2-A. noteService.ts 수신함 조회 교체

`getInbox(userName)` 함수 내부를 id 기반으로 교체:

```ts
// 변경 전 (line 32~65)
getInbox: async (userName: string): Promise<Note[]> => {
  // ...
  query = query.eq('receiver_name', userName);  // ← 이름 기반
  // ...
}

// 변경 후 — userId를 받을 수 있도록 시그니처 확장 (하위 호환 유지)
getInbox: async (userName: string, userId?: string): Promise<Note[]> => {
  let query = supabase.from('messages').select('*');
  const ADMIN_ALIASES = ['시스템 관리자', '운영자', '관리자', 'admin', '마스터관리자', 'admin_user'];

  if (ADMIN_ALIASES.includes(userName)) {
    query = query.or(`receiver_name.eq.관리자,receiver_name.eq.시스템 관리자,receiver_name.eq.운영자,receiver_name.eq.admin,receiver_name.eq.마스터관리자,receiver_name.eq.admin_user`);
  } else if (userId) {
    // ID 기반 조회 (닉네임 변경에 안전)
    query = query.or(`receiver_id.eq.${userId},receiver_name.eq.${userName}`);
  } else {
    query = query.eq('receiver_name', userName);
  }
  // 이하 동일
}
```

`getUnread(userName, userId?)` 동일하게 확장.

### 2-B. MessageModal.tsx sendNote에 senderId 추가

**파일:** `src/components/message/MessageModal.tsx`

① `useAuth()` 반환에서 `user` 이미 사용 중 (`user?.nickname` 참조) → `user?.id` 추가 가능.

② inbox/unread 조회도 이름 기반이므로 함께 수정:

```tsx
// 변경 전 (line 58~67) — 이름 기반 조회
const refreshData = async () => {
    const [inboxRes, unreadRes, sentRes] = await Promise.all([
        NoteService.getInbox(userName),
        NoteService.getUnread(userName),
        NoteService.getSent(userName)
    ]);
    ...
};

// 변경 후 — userId 전달 (2-A의 확장 시그니처 활용)
const refreshData = async () => {
    const [inboxRes, unreadRes, sentRes] = await Promise.all([
        NoteService.getInbox(userName, user?.id),   // ← userId 추가
        NoteService.getUnread(userName, user?.id),  // ← userId 추가
        NoteService.getSent(userName)
    ]);
    ...
};
```

③ 쪽지 발송에 senderId 추가:

```tsx
// 변경 전 (line 75) — senderId 없음
await NoteService.sendNote(writeContent, userName, target);

// 변경 후 — senderId 추가 (receiverId는 이름 기반 수신자라 생략 허용)
await NoteService.sendNote(writeContent, userName, target, user?.id || undefined);
```

> `AdminInquiryManagement.tsx:600` 은 이미 receiverId를 전달하고 있어 수정 불필요.

---

## 🟡 Task 3: SOS shopId 주석 명확화

**문제:** `sos_alerts.shop_id`에 `profiles.id(uuid)`가 저장되는데
변수명이 `shopId`라 `shops.id(bigint)`와 혼동될 위험이 높음.

**파일:** `src/app/api/sos/send/route.ts`
**파일:** `src/app/my-shop/components/SosAlertView.tsx`

코드 수정 없이 주석만 추가:

```ts
// route.ts line 63~65 위에 추가:
// ⚠️ 여기서 shopId = 발송자의 profiles.id (uuid)
//    shops.id(bigint)가 아님. sos_alerts.shop_id에 user uuid가 저장됨.
const { shopId, shopName, message, regions } = await request.json();
```

SosAlertView.tsx에서 shopId로 user.id를 넘기는 부분에도 주석 추가:
```ts
// shopId = user.id (profiles.id, uuid) — shops 테이블의 id가 아님
```

---

## 📋 검증 절차

### Task 1 검증
1. 업체회원 계정으로 코코알바 my-shop 로그인
2. "지원서 관리" 탭 클릭
3. 지원서가 있는 경우 목록에 표시되는지 확인
4. (지원서 없으면) 개인회원으로 공고 지원 후 업체 계정에서 확인

### Task 2 검증
1. 쪽지가 있는 계정으로 로그인
2. 쪽지함에서 수신 목록 확인
3. 닉네임 변경 후 쪽지 목록 여전히 표시되는지 확인

### Task 3
주석 추가 확인으로 완료.

---

## 완료 기준

- [ ] ApplicantsView 지원서 목록 정상 표시 (데이터 있는 경우)
- [ ] 대표님 SQL 실행 (`owner_user_id TEXT` 컬럼 추가)
- [ ] apply API에 owner_user_id 저장 추가됨
- [ ] NoteService getInbox/getUnread에 userId 파라미터 추가됨
- [ ] sendNote 호출처에서 receiverId 전달됨
- [ ] `npm run build` 에러 0개

---

## 절대 금지

1. DATA_SCHEMA_SPEC.md에 명시된 존재하지 않는 컬럼 사용 금지
   (`type`, `updated_at` in payments / `note` in point_logs / `from`/`to` in messages)
2. shops.id(bigint)와 profiles.id(uuid) 혼용 금지
3. 파일 전체 덮어쓰기 금지 — Edit 도구 핀셋 수정만
4. 기존 SOS/점프 로직 건드리지 말 것 — Task 3은 주석만
5. 빌드 에러 있는 상태에서 "완료" 보고 금지
