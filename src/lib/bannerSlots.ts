/**
 * 배너 슬롯 레지스트리 — 새 슬롯 추가 시 여기만 수정
 *
 * status: 'live' = 현재 운영, 'coming_soon' = 구현 예정
 * bannerPosition: shops.banner_position 값 ('left'|'right'|'both'|null)
 * plans: 해당 슬롯을 사용할 수 있는 최소 플랜
 */
export const BANNER_SLOT_REGISTRY = [
  // ── Live ──────────────────────────────────────────────────────────────────
  {
    id: 'side_left',
    label: '좌측 사이드 배너',
    desc: 'PC 좌측 사이드바 고정 노출 (4슬롯 중 1개)',
    size: '160 × 140px',
    recommend: '320 × 280px 권장 (2배 해상도)',
    bannerPosition: 'left' as string | null,
    plans: ['standard', 'special', 'deluxe', 'premium'],
    status: 'live' as const,
    icon: '◀',
  },
  {
    id: 'side_right',
    label: '우측 사이드 배너',
    desc: 'PC 우측 사이드바 고정 노출 (4슬롯 중 1개)',
    size: '160 × 140px',
    recommend: '320 × 280px 권장 (2배 해상도)',
    bannerPosition: 'right' as string | null,
    plans: ['standard', 'special', 'deluxe', 'premium'],
    status: 'live' as const,
    icon: '▶',
  },
  {
    id: 'side_both',
    label: '좌우 사이드 배너 (양쪽)',
    desc: '좌우 양쪽 사이드바 동시 노출 — 최대 노출',
    size: '160 × 140px × 2',
    recommend: '320 × 280px 권장 (2배 해상도)',
    bannerPosition: 'both' as string | null,
    plans: ['deluxe', 'premium'],
    status: 'live' as const,
    icon: '◀▶',
  },
  // ── Coming Soon ───────────────────────────────────────────────────────────
  {
    id: 'hero_sub',
    label: '히어로 배너 슬롯',
    desc: '메인 히어로 섹션 이미지 배너 (다수 분할 예정)',
    size: '미정',
    recommend: '추후 공지',
    bannerPosition: null as string | null,
    plans: ['premium'],
    status: 'coming_soon' as const,
    icon: '🎯',
  },
  {
    id: 'inner_sidebar',
    label: '내부 사이드바 캐러셀',
    desc: '업종/지역별 채용 페이지 좌측 사이드바 캐러셀',
    size: '미정',
    recommend: '추후 공지',
    bannerPosition: null as string | null,
    plans: ['deluxe', 'premium'],
    status: 'coming_soon' as const,
    icon: '📌',
  },
  {
    id: 'list_native',
    label: '목록 네이티브 광고',
    desc: '검색 결과 목록 사이 삽입 네이티브 광고',
    size: '미정',
    recommend: '추후 공지',
    bannerPosition: null as string | null,
    plans: ['special', 'deluxe', 'premium'],
    status: 'coming_soon' as const,
    icon: '📋',
  },
  {
    id: 'community_native',
    label: '커뮤니티 네이티브',
    desc: '커뮤니티 페이지 내 네이티브 형식 광고',
    size: '미정',
    recommend: '추후 공지',
    bannerPosition: null as string | null,
    plans: ['premium'],
    status: 'coming_soon' as const,
    icon: '💬',
  },
  {
    id: 'joblist_native',
    label: '최신 구인정보 네이티브',
    desc: '메인/홈 최신 구인정보 섹션 네이티브 광고',
    size: '미정',
    recommend: '추후 공지',
    bannerPosition: null as string | null,
    plans: ['premium'],
    status: 'coming_soon' as const,
    icon: '🔔',
  },
];

export type BannerSlot = typeof BANNER_SLOT_REGISTRY[number];

// 플랜별 허용 슬롯 (live 슬롯만)
export const PLAN_ALLOWED_SLOTS: Record<string, string[]> = {
  free:     [],
  basic:    [],
  standard: ['side_left', 'side_right'],
  special:  ['side_left', 'side_right'],
  deluxe:   ['side_left', 'side_right', 'side_both'],
  premium:  ['side_left', 'side_right', 'side_both'],
};
