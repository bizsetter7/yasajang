# BRIEFING — AntiGravity 작업지시서
**날짜**: 2026-04-27  
**프로젝트**: P5 야사장 + P2 코코알바  
**담당**: AntiGravity  
**검토**: 코부장(Claude Code)

---

## 선행 필독 (작업 시작 전 반드시 확인)
1. `D:\토탈프로젝트\My-site\p1.choco-idea\MISTAKES_LOG.md` (M-001~M-030)
2. `D:\토탈프로젝트\My-site\p2.브랜드_통합_시스템\CLAUDE.md` (스키마 기준)
3. `D:\토탈프로젝트\My-site\p5.야사장\AGENTS.md`

---

## 시스템 구조 이해 (필수 숙지)

```
야사장(P5)  = 사장님 통합관리 허브 (업소 구독/밤길 관리)
코코알바(P2) = 업체회원이 공고등록·관리하는 플랫폼
웨이터존(P9) = waiterzone.kr — 코코알바 clone (웨이터 직종)
선수존(P10)  = sunsujone.kr — (선수 직종)
밤길(P6)    = bamgil.kr — 손님용 업소 탐색
```

**동일 Supabase 프로젝트 공유**: ronqwailyistjuyolmyh.supabase.co  
**profiles.id(uuid)** = 모든 플랫폼에서 동일 유저 식별자  
**shops.user_id(text)** = profiles.id를 text로 저장  

**계정 구분 (절대 혼동 금지)**:
- `role='admin'` → 관리자 (bizsetter7@gmail.com)
- `role='corporate'` → **업체회원 (사장님)** — 야사장 대상
- `role='individual'`/`'employee'` → 개인회원 — 야사장 무관

**기존 업체회원 상황**:
- 코코알바에 이미 가입된 corporate 계정 (예: bizsetter@naver.com)
- 야사장에서 같은 이메일로 로그인 가능 (동일 Supabase)
- `businesses` 테이블엔 레코드가 없을 수 있음 (입점신청 미완료)
- `shops` 테이블엔 기존 공고들이 있음 (user_id로 연결)

---

## Task 1 — [P5 야사장] 대시보드 전면 개선 ⭐ 최우선

**파일**: `src/app/dashboard/page.tsx`  
**관련**: `src/components/dashboard/` 하위 컴포넌트

### 현재 문제
```ts
if (!business) redirect('/register');
```
→ `businesses` 레코드 없는 기존 코코알바 업체회원이 대시보드 진입 불가  
→ bizsetter 등 기존 사장님이 로그인해도 계속 등록폼으로 튕겨남

### 변경 설계

**로직 흐름 변경**:
1. `user.id`로 `businesses` 조회 — 없어도 **redirect 하지 않음**
2. `user.id`로 `shops` 조회 (코코알바/웨이터존 공고 전체)
3. businesses 있으면 → 업소정보 + 구독 + 밤길통계 표시
4. businesses 없으면 → 입점신청 안내 CTA 섹션 표시
5. shops는 businesses 유무 무관하게 **항상 표시**

**대시보드 레이아웃 (businesses 없는 경우)**:
```
┌─────────────────────────────────────────────┐
│ ⚠️  아직 입점신청을 하지 않으셨어요           │
│ 밤길·코코알바에 업소를 등록하려면             │
│ 입점신청이 필요합니다.                        │
│ [밤길 3개월 무료 등록하기 →]  (href=/register?plan=free)  │
└─────────────────────────────────────────────┘
```

**항상 표시 (businesses 유무 무관)**:
```
┌─────────────────────────────────────────────────────┐
│ 플랫폼 현황                                          │
│ 코코알바 공고: N개  [코코알바 마이샵 바로가기 →]      │
│ 웨이터존 공고: N개  [웨이터존 마이샵 바로가기 →]      │
└─────────────────────────────────────────────────────┘
```

**링크 URL**:
- 코코알바 마이샵: `https://cocoalba.kr/my-shop`
- 웨이터존 마이샵: `https://waiterzone.kr/my-shop` (도메인 준비중이면 "준비중" 표시)

### shops 조회 코드
```ts
// businesses 없어도 항상 실행
const { data: allShops } = await supabase
  .from('shops')
  .select('id, title, status, category, created_at')
  .eq('user_id', user.id)  // text = uuid → Supabase 자동 coercion
  .order('created_at', { ascending: false });

// 플랫폼 구분 (category 기준)
const WAITER_CATEGORIES = ['웨이터', '서빙', '바텐더'];  // P9 실제 값 확인 후 조정
const cocoShops = allShops?.filter(s => !WAITER_CATEGORIES.some(c => s.category?.includes(c))) ?? [];
const waiterShops = allShops?.filter(s => WAITER_CATEGORIES.some(c => s.category?.includes(c))) ?? [];
```

### 주의사항
- `bamgil_contacts` 조회는 `business`가 있을 때만 실행 (없으면 skip)
- `subscription` 조회도 `business`가 있을 때만 실행
- `shops.user_id`는 text 타입 — `.eq('user_id', user.id)` 사용 (String() 변환 불필요)

---

## Task 2 — [P2 코코알바] 야사장 입점신청 탭 분리

**파일**: `src/app/admin/page.tsx`  
**신규 API**: `src/app/api/admin/yasajang-review/route.ts`

### 현재 문제
야사장 입점신청이 `shops` 테이블 `title='[야사장]...'`으로 들어가서  
광고심사 탭에 섞여 노출됨

### 할 일

**① 광고심사 탭에서 야사장 건 필터링**:
광고 목록 조회 시 야사장 입점신청 제외:
```ts
// shops 조회에 추가
.not('title', 'like', '[야사장]%')
```

**② '야사장 입점신청' 전용 탭 추가** (탭 목록 마지막에):
- 탭 이름: `야사장 입점`
- `businesses` 테이블에서 `status='pending'` 조회
- service_role 사용 (RLS 우회)
- API: `/api/admin/yasajang-review/route.ts` 신규 생성

**API 스펙** (`requireAdmin` 필수):
```ts
// GET → businesses status='pending' 목록 반환
// PATCH → { id, action: 'approve'|'reject' }
//   approve: businesses.status='active', is_active=true
//            subscriptions.status='active' (business_id 기준)
//   reject:  businesses.status='rejected'
```

**③ 탭 UI 표시 컬럼**:
업소명 / 대표자 / 연락처 / 플랜(cocoalba_tier) / 신청일 / 승인·반려 버튼

### businesses 테이블 주요 컬럼
```
id(uuid), name, status(pending/active/rejected),
owner_id(uuid), phone, address, cocoalba_tier(text),
is_active(bool), is_verified(bool), created_at
```

### 표준 패턴 참고
`src/app/api/admin/banner-approve/route.ts` (requireAdmin + service_role 로컬 선언)

---

## Task 3 — [P5 야사장] 사업자등록증 AI OCR 자동입력

**신규 API**: `src/app/api/ocr/route.ts`  
**UI 수정**: `src/components/register/RegisterForm.tsx` (Step 2)

### API 스펙
```ts
// POST /api/ocr
// Body: { imageUrl: string }  // Supabase Storage URL
// 환경변수: ANTHROPIC_API_KEY (이미 .env.local + Vercel 설정 완료)
// 모델: claude-haiku-4-5-20251001
// 응답: { business_number, name, representative, open_date, business_type }
```

### Prompt (route.ts 내부)
```
이 이미지는 한국 사업자등록증 또는 영업허가증입니다.
다음 항목을 JSON으로만 응답하세요 (설명 없이):
{
  "business_number": "사업자등록번호 (000-00-00000 형식)",
  "name": "상호명",
  "representative": "대표자명",
  "open_date": "개업일 (YYYY-MM-DD)",
  "business_type": "업태"
}
항목을 찾을 수 없으면 해당 필드를 null로 반환.
```

### RegisterForm.tsx UI 변경 (Step 2)
- 사업자등록증 업로드 직후 `AI 자동입력` 버튼 표시
- 클릭 → Loader2 스피너 → POST /api/ocr
- 응답값 → formData 해당 필드 자동 채움
- 자동입력된 필드 배경: `bg-amber-500/10` (수동 수정 가능)
- ANTHROPIC_API_KEY 없으면 버튼 숨김

### 주의
- `requireAdmin` 불필요 (업체 공개 API)
- Anthropic SDK 설치 확인: `npm list @anthropic-ai/sdk` — 없으면 `npm install @anthropic-ai/sdk`

---

## 완료 기준
- **Task 1 최우선** — businesses 없는 기존 업체회원이 대시보드 정상 접근 가능
- 3개 작업 모두 `npm run build` Exit code: 0
- 빌드 결과 캡처본 포함 REPORT 파일 작성
