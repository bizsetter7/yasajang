// 공통 SEO 유틸 — NFC 정규화 + 캐노니컬 인코딩 (4개 플랫폼 공유 표준)
// 적용 위치: src/app/<dynamic>/[region]/page.tsx 등 동적 라우트
// 목적:
//   1) 한글 자모(NFD) ↔ 한글 음절(NFC) 차이로 인한 매칭 실패 박멸
//   2) canonical/openGraph URL을 URL-safe 인코딩으로 일관 출력
//   3) Next.js 동적 세그먼트 raw 입력을 단일 함수로 정규화
// 표준 패턴 (P-12):
//   const decoded = decodeRegionSlug(params.region);   // 매칭/조회용
//   const canonical = buildCanonicalUrl(BASE, ['coco', decoded]);

/**
 * URL 동적 세그먼트(raw) → NFC 정규화된 디코드 문자열
 * decodeURIComponent + normalize('NFC')
 */
export function decodeRegionSlug(raw: string | undefined | null): string {
    if (!raw) return '';
    try {
        return decodeURIComponent(raw).normalize('NFC');
    } catch {
        return raw.normalize('NFC');
    }
}

/**
 * NFC 디코드된 문자열 → URL-safe 인코드 (canonical/openGraph url 등)
 */
export function encodeRegionSlug(slug: string | undefined | null): string {
    if (!slug) return '';
    return encodeURIComponent(String(slug).normalize('NFC'));
}

/**
 * 캐노니컬 URL 빌더
 * baseUrl 끝 슬래시 자동 제거. 각 세그먼트 NFC + encodeURIComponent + '/' 결합.
 * 빈/null 세그먼트 자동 스킵.
 */
export function buildCanonicalUrl(
    baseUrl: string,
    segments: Array<string | number | null | undefined>
): string {
    const path = segments
        .filter((s): s is string | number => s !== null && s !== undefined && s !== '')
        .map(s => encodeRegionSlug(String(s)))
        .join('/');
    return `${baseUrl.replace(/\/+$/, '')}/${path}`;
}

// ─── P-03 호환 export (기존 코드/문서 명칭) ─────────────────
/** P-03 호환: NFC 정규화 + trim + 공백→하이픈 (DB 저장용 slugify) */
export function normalizeKoreanSlug(input: string): string {
    if (!input) return '';
    return input.normalize('NFC').trim().replace(/\s+/g, '-');
}

/** P-03 호환: path 문자열 전체 인코드 ('/'는 보존) */
export function canonicalUrl(path: string): string {
    if (!path) return '';
    return path.split('/').map(seg => seg ? encodeURIComponent(seg.normalize('NFC')) : seg).join('/');
}

/** P-03 표준: 봇 화이트리스트 (검색엔진 8종) — middleware.ts에서 import */
export const BOT_USER_AGENTS = [
    'googlebot',
    'bingbot',
    'slurp',         // Yahoo
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'naverbot',
    'yeti',          // Naver Yeti (실제 UA)
    'daumoa',
] as const;

/** UA 문자열이 화이트리스트 봇인지 검사 */
export function isWhitelistedBot(userAgent: string | null | undefined): boolean {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    return BOT_USER_AGENTS.some(b => ua.includes(b));
}
