export const BUSINESS_CATEGORIES = [
  { id: 'room_salon', label: '룸살롱' },
  { id: 'karaoke_bar', label: '가라오케/노래빠' },
  { id: 'bar', label: '바/토킹바' },
  { id: 'night_club', label: '나이트클럽' },
  { id: 'hostbar', label: '호스트바' },
  { id: 'general', label: '일반주점' },
  { id: 'other', label: '기타' },
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]['id'];
