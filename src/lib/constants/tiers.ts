export const AD_TIERS = [
  { id: 't1', label: 'Grand (최상위)', description: '별도 추가결제 전용' },
  { id: 't2', label: 'Premium (프리미엄)', description: '프리미엄 구독 포함' },
  { id: 't3', label: 'Special+', description: '심화 노출' },
  { id: 't4', label: 'Special (스탠다드)', description: '스탠다드 구독 포함' },
  { id: 't5', label: 'Recommended', description: '추천 노출' },
  { id: 't6', label: 'Affiliate', description: '제휴 광고 전용' },
  { id: 't7', label: 'Basic (베이직)', description: '베이직 구독 포함' },
] as const;

export type AdTier = (typeof AD_TIERS)[number]['id'];
