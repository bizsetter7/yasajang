# BRIEFING — 야사장 Week 8 지시서 (밤사장 벤치마킹)
> 작성: 코부장 (Claude Code) | 날짜: 2026-04-25
> 필독 선행문서: `D:\토탈프로젝트\My-site\p1.choco-idea\MISTAKES_LOG.md`

---

## 배경

밤사장(경쟁사) 업체 등록 플로우 전수 분석 결과, P5 야사장에 즉시 적용 가능한
4개 기능이 확인됨. 전부 구현.

**대상 파일 2개:**
- `src/components/register/RegisterForm.tsx` — 최초 입점 신청 폼
- `src/app/dashboard/edit/page.tsx` — 업소 정보 수정 페이지

---

## 📋 Task 1: RegisterForm — 영업허가증 추가 + 완료 후 CTA

**파일:** `src/components/register/RegisterForm.tsx`

### 1-A. files state에 permit 추가

```tsx
// 변경 전
const [files, setFiles] = useState<{
  license: File | null;
  shop_images: File[];
}>({
  license: null,
  shop_images: [],
});

// 변경 후
const [files, setFiles] = useState<{
  license: File | null;
  permit: File | null;
  shop_images: File[];
}>({
  license: null,
  permit: null,
  shop_images: [],
});
```

ref 추가:
```tsx
const permitInputRef = useRef<HTMLInputElement>(null);
```

### 1-B. Step 2에 영업허가증 업로드 UI 추가

사업자등록증 업로드 div 바로 아래에 추가:

```tsx
{/* 영업허가증 */}
<div className="p-8 border-2 border-dashed border-zinc-800 rounded-[2rem] bg-zinc-950/50 text-center group hover:border-amber-500/50 transition-all cursor-pointer"
     onClick={() => permitInputRef.current?.click()}>
  <input
    type="file"
    hidden
    ref={permitInputRef}
    onChange={(e) => {
      if (e.target.files) setFiles(prev => ({ ...prev, permit: e.target.files![0] }));
    }}
    accept="image/*,.pdf"
  />
  <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500 group-hover:text-black transition-all">
    <Shield size={28} />
  </div>
  <h4 className="text-xl font-bold text-white mb-2">영업허가증 업로드</h4>
  <p className="text-zinc-500 text-sm mb-4">파일 형식: JPG, PNG, PDF (최대 10MB)</p>
  {files.permit ? (
    <div className="text-amber-500 font-bold text-sm bg-amber-500/10 py-2 px-4 rounded-lg inline-block">
      {files.permit.name} 선택됨
    </div>
  ) : (
    <div className="text-zinc-600 font-medium text-sm">클릭하여 업로드</div>
  )}
</div>
```

> ⚠️ Shield 아이콘은 이미 import 되어 있음. 확인 후 없으면 추가.

### 1-C. handleSubmit에 영업허가증 업로드 추가

사업자등록증 업로드 블록 바로 아래에:

```tsx
let permitUrl = '';
if (files.permit) {
  const fileExt = files.permit.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}_permit.${fileExt}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('businesses-docs')
    .upload(fileName, files.permit);
  if (uploadError) throw uploadError;
  permitUrl = uploadData.path;
}
```

businesses INSERT에 `permit_path: permitUrl` 추가:
```tsx
// 기존
license_path: licenseUrl,
// 변경 후
license_path: licenseUrl,
permit_path: permitUrl,
```

### 1-D. 완료 화면에 코코알바 CTA 버튼 추가

success 화면의 "대시보드로 이동" 버튼 아래에 추가:

```tsx
<div className="mt-4 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
  <p className="text-zinc-400 text-sm mb-3">
    🎉 입점 신청 완료! 이제 코코알바에 구인 광고도 등록하세요.
  </p>
  <a
    href="https://coco-universe.vercel.app/my-shop"
    target="_blank"
    rel="noopener noreferrer"
    className="block w-full px-6 py-3 bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold rounded-xl hover:bg-rose-500/30 transition-all text-sm text-center"
  >
    코코알바 구인 광고 등록하기 →
  </a>
</div>
```

> P2 코코알바 프로덕션 URL 확인 후 href 교체. 현재 임시값 `coco-universe.vercel.app` 사용.

---

## 📋 Task 2: 영업시간 요일별 세분화

**파일:** `src/app/dashboard/edit/page.tsx`

### 2-A. 타입 및 기본값 추가

파일 최상단 (interface MenuItem 위에):

```tsx
interface DayHours {
  open: string;
  close: string;
  is24h: boolean;
  isClosed: boolean;
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

const DEFAULT_DAY_HOURS: DayHours = { open: '18:00', close: '04:00', is24h: false, isClosed: false };
```

### 2-B. state 변경

```tsx
// 변경 전
const [promo, setPromo] = useState({
  businessHours: '',
  // ...
});

// 변경 후 — businessHours 제거, dayHours 별도 state로 분리
const [dayHours, setDayHours] = useState<Record<string, DayHours>>(
  Object.fromEntries(DAYS.map(d => [d, { ...DEFAULT_DAY_HOURS }]))
);
```

promo state에서 `businessHours: ''` 제거.

### 2-C. useEffect에서 dayHours 로드

기존 promo 세팅 블록 아래에:

```tsx
// business_hours가 JSON이면 파싱, 텍스트면 무시 (기존 데이터 하위호환)
if (data.business_hours) {
  try {
    const parsed = JSON.parse(data.business_hours);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      setDayHours(prev => ({ ...prev, ...parsed }));
    }
  } catch {
    // 구형 텍스트 데이터 — 무시하고 기본값 유지
  }
}
```

### 2-D. handleSave에 dayHours 포함

```tsx
// body JSON에 추가
businessHours: JSON.stringify(dayHours),
```

### 2-E. 영업시간 UI 교체

기존 `<Clock>` 레이블 + 텍스트 input 블록 전체를 아래로 교체:

```tsx
<div>
  <label className={labelCls}><Clock size={13} /> 영업시간 (요일별)</label>
  <div className="space-y-2">
    {DAYS.map(day => (
      <div key={day} className="flex items-center gap-2">
        <span className="w-6 text-xs font-black text-zinc-400 shrink-0">{day}</span>
        <button
          type="button"
          onClick={() => setDayHours(h => ({
            ...h, [day]: { ...h[day], isClosed: !h[day].isClosed }
          }))}
          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
            dayHours[day].isClosed
              ? 'bg-zinc-800 border-zinc-700 text-zinc-500'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          {dayHours[day].isClosed ? '휴무' : '영업'}
        </button>
        {!dayHours[day].isClosed && (
          <>
            <input
              type="time"
              value={dayHours[day].open}
              onChange={e => setDayHours(h => ({ ...h, [day]: { ...h[day], open: e.target.value } }))}
              disabled={dayHours[day].is24h}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 outline-none disabled:opacity-40"
            />
            <span className="text-zinc-600 text-xs shrink-0">~</span>
            <input
              type="time"
              value={dayHours[day].close}
              onChange={e => setDayHours(h => ({ ...h, [day]: { ...h[day], close: e.target.value } }))}
              disabled={dayHours[day].is24h}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:border-amber-500 outline-none disabled:opacity-40"
            />
            <button
              type="button"
              onClick={() => setDayHours(h => ({ ...h, [day]: { ...h[day], is24h: !h[day].is24h } }))}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all shrink-0 ${
                dayHours[day].is24h
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}
            >
              24h
            </button>
          </>
        )}
      </div>
    ))}
  </div>
</div>
```

---

## 📋 Task 3: 메뉴 카테고리 구분 (대표메뉴 / 주류 / 안주)

**파일:** `src/app/dashboard/edit/page.tsx`

### 3-A. 타입 변경

```tsx
// 변경 전
const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

// 변경 후
interface MenuCategories {
  featured: MenuItem[];
  drinks: MenuItem[];
  snacks: MenuItem[];
}

const [menuCategories, setMenuCategories] = useState<MenuCategories>({
  featured: [], drinks: [], snacks: [],
});
```

### 3-B. useEffect 데이터 로드 변경

```tsx
// 변경 전
if (data.menu_items?.length) {
  setMenuItems((data.menu_items as MenuItem[]).map(...));
}

// 변경 후
if (data.menu_items) {
  const raw = data.menu_items;
  // 신형: { featured, drinks, snacks }
  if (raw.featured !== undefined) {
    setMenuCategories({
      featured: (raw.featured || []).map((m: MenuItem) => ({ name: m.name, price: m.price?.toString() || '', note: m.note || '' })),
      drinks: (raw.drinks || []).map((m: MenuItem) => ({ name: m.name, price: m.price?.toString() || '', note: m.note || '' })),
      snacks: (raw.snacks || []).map((m: MenuItem) => ({ name: m.name, price: m.price?.toString() || '', note: m.note || '' })),
    });
  } else if (Array.isArray(raw)) {
    // 구형 배열 데이터 → featured로 마이그레이션
    setMenuCategories(prev => ({
      ...prev,
      featured: (raw as MenuItem[]).map((m: MenuItem) => ({ name: m.name, price: m.price?.toString() || '', note: m.note || '' })),
    }));
  }
}
```

### 3-C. handleSave body 변경

```tsx
// 변경 전
menuItems: menuItems.map(m => ({ name: m.name, price: Number(m.price) || 0, note: m.note })),

// 변경 후
menuItems: {
  featured: menuCategories.featured.map(m => ({ name: m.name, price: Number(m.price) || 0, note: m.note })),
  drinks: menuCategories.drinks.map(m => ({ name: m.name, price: Number(m.price) || 0, note: m.note })),
  snacks: menuCategories.snacks.map(m => ({ name: m.name, price: Number(m.price) || 0, note: m.note })),
},
```

### 3-D. 메뉴 섹션 UI 교체

기존 "대표 메뉴" 섹션 전체를 3탭 구조로 교체:

```tsx
{/* ─ 메뉴 정보 ─ */}
<div className={sectionCls}>
  {(['featured', 'drinks', 'snacks'] as const).map(cat => {
    const labels = { featured: '대표메뉴', drinks: '주류', snacks: '안주' };
    const items = menuCategories[cat];
    return (
      <div key={cat} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">{labels[cat]}</h2>
          <button
            type="button"
            onClick={() => setMenuCategories(mc => ({ ...mc, [cat]: [...mc[cat], { name: '', price: '', note: '' }] }))}
            className="flex items-center gap-1.5 text-xs text-amber-500 font-bold hover:opacity-80"
          >
            <Plus size={14} /> 추가
          </button>
        </div>
        {items.length === 0 && (
          <p className="text-zinc-600 text-sm text-center py-2">항목을 추가해주세요</p>
        )}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-end">
                <button type="button"
                  onClick={() => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].filter((_, j) => j !== i) }))}
                  className="text-zinc-600 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-600 font-bold block mb-1">메뉴명</label>
                  <input placeholder="예: 양주 1병" className={inputCls} value={item.name}
                    onChange={e => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-600 font-bold block mb-1">가격 (원)</label>
                  <input type="number" placeholder="150000" className={inputCls} value={item.price}
                    onChange={e => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].map((x, j) => j === i ? { ...x, price: e.target.value } : x) }))} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-600 font-bold block mb-1">설명 (선택)</label>
                <input placeholder="예: 기본 세팅 포함" className={inputCls} value={item.note}
                  onChange={e => setMenuCategories(mc => ({ ...mc, [cat]: mc[cat].map((x, j) => j === i ? { ...x, note: e.target.value } : x) }))} />
              </div>
            </div>
          ))}
        </div>
        {cat !== 'snacks' && <hr className="border-zinc-800 mt-4" />}
      </div>
    );
  })}
</div>
```

> ⚠️ 기존 "별도 요금" (`extraFees`) 섹션은 그대로 유지.

---

## 📋 Task 4: 미리보기 기능

**파일:** `src/app/dashboard/edit/page.tsx`

저장 버튼 위에 미리보기 버튼 + 인라인 모달 추가.

### 4-A. state 추가

```tsx
const [showPreview, setShowPreview] = useState(false);
```

### 4-B. 미리보기 버튼 (저장 버튼 위)

```tsx
<button
  type="button"
  onClick={() => setShowPreview(true)}
  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold py-4 rounded-[2rem] transition-all flex items-center justify-center gap-2 text-sm mb-3"
>
  출력 예시 보기
</button>
```

### 4-C. 미리보기 모달

저장 버튼 아래 (form 닫기 태그 밖):

```tsx
{showPreview && (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-sm w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-black text-amber-500 uppercase tracking-widest">출력 예시</span>
        <button onClick={() => setShowPreview(false)} className="text-zinc-500 hover:text-white text-lg font-bold">✕</button>
      </div>

      {/* 대표 이미지 */}
      {promo.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden mb-4 aspect-video relative bg-zinc-900">
          <img src={promo.coverImageUrl} alt="cover" className="w-full h-full object-cover" />
        </div>
      )}

      {/* 업소명 + 지역 */}
      <h3 className="text-xl font-black text-white">{basic.name || '업소명'}</h3>
      <p className="text-zinc-500 text-sm mt-1">{REGIONS.find(r => r.value === basic.regionCode)?.label || '지역'} · {CATEGORIES.find(c => c.value === basic.category)?.label || '업종'}</p>

      {/* 연락처 버튼 */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="p-3 bg-zinc-900 rounded-xl text-center text-xs font-bold text-zinc-300">📞 전화</div>
        <div className="p-3 bg-zinc-900 rounded-xl text-center text-xs font-bold text-zinc-300">💬 오픈톡</div>
      </div>

      {/* 영업시간 */}
      <div className="mt-4 p-4 bg-zinc-900 rounded-2xl">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">영업시간</p>
        {DAYS.map(day => {
          const h = dayHours[day];
          return (
            <div key={day} className="flex justify-between text-xs py-1 border-b border-zinc-800 last:border-0">
              <span className="text-zinc-400 font-bold">{day}</span>
              <span className="text-white font-medium">
                {h.isClosed ? '휴무' : h.is24h ? '24시간' : `${h.open} ~ ${h.close}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* 메뉴 */}
      {(menuCategories.featured.length > 0 || menuCategories.drinks.length > 0 || menuCategories.snacks.length > 0) && (
        <div className="mt-4 p-4 bg-zinc-900 rounded-2xl space-y-3">
          {(['featured', 'drinks', 'snacks'] as const).map(cat => {
            const labels = { featured: '대표메뉴', drinks: '주류', snacks: '안주' };
            if (!menuCategories[cat].length) return null;
            return (
              <div key={cat}>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{labels[cat]}</p>
                {menuCategories[cat].map((m, i) => (
                  <div key={i} className="flex justify-between text-xs py-1">
                    <span className="text-zinc-300">{m.name}</span>
                    <span className="text-amber-400 font-bold">{Number(m.price).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* 별도요금 */}
      {extraFees.some(f => f.label && Number(f.amount) > 0) && (
        <div className="mt-4 p-4 bg-zinc-900 rounded-2xl">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">별도 요금</p>
          {extraFees.filter(f => f.label && Number(f.amount) > 0).map((fee, i) => (
            <div key={i} className="flex justify-between text-xs py-1">
              <span className="text-zinc-400">{fee.label} {fee.value && `(${fee.value})`}</span>
              <span className="text-white font-bold">{Number(fee.amount).toLocaleString()}원</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-zinc-600 text-center mt-4">* 저장 후 실제 광고에 반영됩니다</p>
    </div>
  </div>
)}
```

---

## 📋 DB SQL (대표님 Supabase SQL Editor 실행)

```sql
-- 영업허가증 경로 컬럼 추가
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS permit_path TEXT;
```

> `business_hours` 컬럼은 기존 TEXT → JSON.stringify 저장으로 전환 (컬럼 타입 변경 불필요).
> `menu_items` 컬럼은 기존 JSONB → 구조 변경 (컬럼 타입 변경 불필요, 코드에서 처리).

---

## 완료 기준

- [ ] RegisterForm Step 2에 영업허가증 업로드 UI + 서버 업로드 연동
- [ ] 입점 신청 완료 화면에 코코알바 CTA 버튼 표시
- [ ] 대시보드 edit에서 요일별 영업시간 설정 (영업/휴무/24시간/시간입력) 작동
- [ ] 메뉴 섹션 대표메뉴/주류/안주 탭 분리, 기존 데이터 마이그레이션 정상 로드
- [ ] "출력 예시 보기" 버튼 → 모달 미리보기 작동
- [ ] `npm run build` 에러 0개
- [ ] 대표님 SQL 실행 (`permit_path` 컬럼 추가) 후 영업허가증 업로드 확인

---

## 절대 금지

1. 파일 전체 덮어쓰기 금지 — Edit 도구 핀셋 수정만
2. `extraFees` 섹션 건드리지 말 것 — Task 3는 메뉴만
3. `anyAdToShop()` 절대 수정 금지 (P2 관련)
4. 빌드 에러 있는 상태에서 "완료" 보고 금지
5. `businesses-docs` Storage 버킷은 기존 것 그대로 사용 (새 버킷 생성 금지)
