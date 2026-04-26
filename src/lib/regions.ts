export const SEO_REGIONS = [
  { slug: 'gangnam',  name: '강남', display: '강남' },
  { slug: 'seoul',    name: '서울', display: '서울' },
  { slug: 'busan',    name: '부산', display: '부산' },
  { slug: 'daegu',    name: '대구', display: '대구' },
  { slug: 'incheon',  name: '인천', display: '인천' },
  { slug: 'suwon',    name: '수원', display: '수원' },
  { slug: 'daejeon',  name: '대전', display: '대전' },
  { slug: 'gwangju',  name: '광주', display: '광주' },
  { slug: 'ulsan',    name: '울산', display: '울산' },
  { slug: 'jeonju',   name: '전주', display: '전주' },
  { slug: 'cheongju', name: '청주', display: '청주' },
  { slug: 'changwon', name: '창원', display: '창원' },
  { slug: 'pohang',   name: '포항', display: '포항' },
  { slug: 'jeju',     name: '제주', display: '제주' },
  { slug: 'anyang',   name: '안양', display: '안양' },
  { slug: 'goyang',   name: '고양', display: '고양' },
  { slug: 'yongin',   name: '용인', display: '용인' },
] as const;

export type RegionSlug = typeof SEO_REGIONS[number]['slug'];
