'use client';

import { useState, useRef, useEffect } from 'react';

declare global { interface Window { daum: any; } }

const JOB_CATEGORY_MAP: Record<string, string[]> = {
  '룸알바': ['퍼블릭', '가라오케', '클럽', '룸싸롱'],
  '노래주점': ['아가씨', '미씨', 'TC'],
  '텐프로/쩜오': ['텐프로', '쩜오', '텐카페'],
  '요정': ['요정'],
  '바(Bar)': ['정바', '룸바', '토킹바', '섹시바', '라이브바'],
  '엔터': ['인터넷BJ'],
  '다방': ['다방'],
  '카페': ['카페'],
  '마사지': ['휴게마사지', '아로마마사지', '피부마사지', '에스테틱', '스포츠마사지', '기타마사지'],
  '기타': ['기타업종', '직업소개소', '회원제업소', '해외'],
};

const REGIONS: Record<string, string[]> = {
  '서울': ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
  '경기': ['수원시','성남시','고양시','용인시','부천시','안산시','안양시','남양주시','화성시','평택시','의정부시','시흥시','파주시','광명시','김포시','군포시','광주시','이천시','양주시','오산시','구리시','안성시','포천시','의왕시','하남시','여주시','동두천시','과천시','가평군','양평군','연천군'],
  '인천': ['중구','동구','미추홀구','연수구','남동구','부평구','계양구','서구','강화군','옹진군'],
  '부산': ['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'],
  '대구': ['중구','동구','서구','남구','북구','수성구','달서구','달성군'],
  '대전': ['동구','중구','서구','유성구','대덕구'],
  '광주': ['동구','서구','남구','북구','광산구'],
  '울산': ['중구','남구','동구','북구','울주군'],
  '세종': ['세종시'],
  '강원': ['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시','홍천군','횡성군','영월군','평창군','정선군','철원군','화천군','양구군','인제군','고성군','양양군'],
  '충북': ['청주시','충주시','제천시','보은군','옥천군','영동군','증평군','진천군','괴산군','음성군','단양군'],
  '충남': ['천안시','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','금산군','부여군','서천군','청양군','홍성군','예산군','태안군'],
  '전북': ['전주시','군산시','익산시','정읍시','남원시','김제시','완주군','진안군','무주군','장수군','임실군','순창군','고창군','부안군'],
  '전남': ['목포시','여수시','순천시','나주시','광양시','담양군','곡성군','구례군','고흥군','보성군','화순군','장흥군','강진군','해남군','영암군','무안군','함평군','영광군','장성군','완도군','진도군','신안군'],
  '경북': ['포항시','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','군위군','의성군','청송군','영양군','영덕군','청도군','고령군','성주군','칠곡군','예천군','봉화군','울진군','울릉군'],
  '경남': ['창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','의령군','함안군','창녕군','고성군','남해군','하동군','산청군','함양군','거창군','합천군'],
  '제주': ['제주시','서귀포시'],
};
import { createBrowserClient } from '@supabase/ssr';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Hash, 
  FileCheck, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  Shield
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

const steps = [
  { id: 1, title: '기본 정보', description: '업소 성격 및 연락처' },
  { id: 2, title: '문서 인증', description: '사업자등록증 및 서류' },
  { id: 3, title: '최종 확인', description: '내용 검토 및 신청' },
];

export default function RegisterForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrPermitLoading, setOcrPermitLoading] = useState(false);
  const [ocrFilledSet, setOcrFilledSet] = useState<Set<string>>(new Set());
  const [hasAnthropicKey, setHasAnthropicKey] = useState(true); // SSR에서는 true로 가정하고 클라이언트에서 확인, 다만 클라이언트 환경변수가 아니면 API 호출 시 알 수 있음. (API에서 에러로 반환되면 숨김)

  const searchParams = useSearchParams();
  const urlPlan = searchParams.get('plan') || 'basic';
  const [localSelectedPlan, setLocalSelectedPlan] = useState(urlPlan);

  const [regionSido, setRegionSido] = useState('서울');
  const [regionSigungu, setRegionSigungu] = useState('강남구');
  const [addressMain, setAddressMain] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  const [mainCategory, setMainCategory] = useState('룸알바');
  const [subCategory, setSubCategory] = useState('퍼블릭');

  const [formData, setFormData] = useState({
    name: '',
    category: '룸알바 > 퍼블릭',
    region: '서울 강남구',
    representative: '',
    business_number: '',
    phone: '',
    address: '',
    description: '',
    platform_choice: 'cocoalba' as 'cocoalba' | 'sunsujone',
    menu_main: '',
    menu_liquor: '',
    menu_snack: '',
    license_number: '',
    floor_area: '',
  });

  // 업종 연동: 대분류 변경 시 subCategory 초기화 + formData.category 업데이트
  useEffect(() => {
    const list = JOB_CATEGORY_MAP[mainCategory] ?? [];
    const firstSub = list[0] ?? '';
    setSubCategory(firstSub);
    setFormData(prev => ({ ...prev, category: `${mainCategory} > ${firstSub}` }));
  }, [mainCategory]);

  // 업종 연동: subCategory 변경 시 formData.category 업데이트
  useEffect(() => {
    if (subCategory) {
      setFormData(prev => ({ ...prev, category: `${mainCategory} > ${subCategory}` }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subCategory]);

  // 지역 연동: sido/sigungu 변경 시 formData.region 자동 업데이트
  useEffect(() => {
    setFormData(prev => ({ ...prev, region: `${regionSido} ${regionSigungu}` }));
  }, [regionSido, regionSigungu]);

  // sigungu 목록이 바뀌면 첫 번째 항목으로 초기화
  useEffect(() => {
    const list = REGIONS[regionSido] ?? [];
    setRegionSigungu(list[0] ?? '');
  }, [regionSido]);

  // 주소 연동: 도로명주소+상세주소 → formData.address
  useEffect(() => {
    setFormData(prev => ({ ...prev, address: [addressMain, addressDetail].filter(Boolean).join(' ') }));
  }, [addressMain, addressDetail]);

  const openAddressSearch = () => {
    if (typeof window === 'undefined') return;
    const load = () => {
      new window.daum.Postcode({
        oncomplete: (data: any) => {
          setAddressMain(data.roadAddress || data.address);
        },
      }).open();
    };
    if (window.daum?.Postcode) {
      load();
    } else {
      const s = document.createElement('script');
      s.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = load;
      document.head.appendChild(s);
    }
  };

  const [files, setFiles] = useState<{
    license: File | null;
    permit: File | null;
    shop_images: File[];
  }>({
    license: null,
    permit: null,
    shop_images: [],
  });

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const permitInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'images') => {
    if (e.target.files) {
      if (type === 'license') {
        setFiles(prev => ({ ...prev, license: e.target.files![0] }));
      } else {
        setFiles(prev => ({ ...prev, shop_images: [...prev.shop_images, ...Array.from(e.target.files!)] }));
      }
    }
  };

  const nextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.name.trim()) { setError('업소명을 입력해주세요.'); return; }
      if (!formData.phone.trim()) { setError('담당자 연락처를 입력해주세요.'); return; }
      if (!formData.address.trim()) { setError('업소 상세 주소를 검색해주세요.'); return; }
    }
    if (currentStep === 2) {
      if (!files.license) { setError('사업자등록증을 업로드해주세요.'); return; }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  const prevStep = () => { setError(null); setCurrentStep(prev => Math.max(prev - 1, 0)); };

  const handleOcr = async () => {
    if (!files.license) return;
    setOcrLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(files.license);
      reader.onload = async () => {
        try {
          const res = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: reader.result })
          });
          const data = await res.json();
          if (!res.ok) {
             if (res.status === 500 && data.error === 'OCR service is not configured') {
                 setHasAnthropicKey(false);
                 throw new Error('AI 자동입력 기능이 비활성화되었습니다.');
             }
             throw new Error(data.error || 'OCR 처리 실패');
          }
          
          if (data.success && data.data) {
             const updates: Partial<typeof formData> = {};
             const filled = new Set(ocrFilledSet);

             if (data.data.name) { updates.name = data.data.name; filled.add('name'); }
             if (data.data.representative) { updates.representative = data.data.representative; filled.add('representative'); }
             if (data.data.business_number) { updates.business_number = data.data.business_number; filled.add('business_number'); }

             if (Object.keys(updates).length > 0) {
                 setFormData(prev => ({ ...prev, ...updates }));
                 setOcrFilledSet(filled);
                 alert('AI가 사업자등록증 정보를 성공적으로 읽어왔습니다.');
             } else {
                 alert('인식된 정보가 없습니다. 수동으로 입력해주세요.');
             }
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setOcrLoading(false);
        }
      };
      reader.onerror = () => {
         throw new Error('파일 읽기 실패');
      };
    } catch (err: any) {
      setError(err.message);
      setOcrLoading(false);
    }
  };

  const handlePermitOcr = async () => {
    if (!files.permit) return;
    setOcrPermitLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(files.permit);
      reader.onload = async () => {
        try {
          const res = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: reader.result, docType: 'permit' }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'OCR 처리 실패');

          if (data.success && data.data) {
            const updates: Partial<typeof formData> = {};
            const filled = new Set(ocrFilledSet);

            if (data.data.license_number) { updates.license_number = data.data.license_number; filled.add('license_number'); }
            if (data.data.floor_area) { updates.floor_area = data.data.floor_area; filled.add('floor_area'); }

            if (Object.keys(updates).length > 0) {
              setFormData(prev => ({ ...prev, ...updates }));
              setOcrFilledSet(filled);
              alert('AI가 영업허가증에서 규모(면적)와 영업허가번호를 읽어왔습니다.');
            } else {
              alert('인식된 정보가 없습니다. 수동으로 입력해주세요.');
            }
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setOcrPermitLoading(false);
        }
      };
      reader.onerror = () => { throw new Error('파일 읽기 실패'); };
    } catch (err: any) {
      setError(err.message);
      setOcrPermitLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 1. Upload files via server API (service_role bypasses Storage RLS)
      const uploadFile = async (file: File, suffix: string): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}_${suffix}.${fileExt}`;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('path', path);
        const r = await fetch('/api/storage/upload', { method: 'POST', body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || '파일 업로드 실패');
        return j.path as string;
      };

      let licenseUrl = '';
      if (files.license) licenseUrl = await uploadFile(files.license, 'license');

      let permitUrl = '';
      if (files.permit) permitUrl = await uploadFile(files.permit, 'permit');

      // 2. Insert via API route (service_role bypasses RLS)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          region: formData.region,
          representative: formData.representative,
          business_number: formData.business_number,
          phone: formData.phone,
          address: formData.address,
          description: formData.description,
          menu_main: formData.menu_main,
          menu_liquor: formData.menu_liquor,
          menu_snack: formData.menu_snack,
          platform_choice: formData.platform_choice,
          owner_id: user.id,
          license_path: licenseUrl,
          permit_path: permitUrl,
          plan: localSelectedPlan,
          license_number: formData.license_number || null,
          floor_area: formData.floor_area || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '등록 중 오류가 발생했습니다.');

      // 4. Notify Admin via Telegram
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `<b>[신규 업소 입점 신청]</b>\n` +
                   `🏪 업소명: ${formData.name}\n` +
                   `📦 신청플랜: ${localSelectedPlan}\n` +
                   `📍 지역: ${formData.region}\n` +
                   `📞 연락처: ${formData.phone}\n` +
                   `${localSelectedPlan !== 'basic' && localSelectedPlan !== 'free' ? `🔗 선택플랫폼: ${formData.platform_choice}\n` : ''}` +
                   `${localSelectedPlan === 'free' ? `🆓 플랜: 밤길 3개월 무료\n` : ''}` +
                   `\n심사 대기 상태로 등록되었습니다.`
        })
      });

      setSuccess(true);

    } catch (err) {
      console.error('Registration Error:', err);
      const message = err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="py-16 animate-fade-in max-w-lg mx-auto">
        {/* 완료 헤더 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">입점 신청 완료!</h2>
          <p className="text-zinc-400 leading-relaxed text-sm">
            신청이 접수되었습니다. 영업일 기준 1~2일 내 심사 후<br />
            결과를 이메일로 안내드립니다.
          </p>
        </div>

        {/* ★ 상세 정보 입력 안내 (중요) */}
        <div className="mb-4 p-5 bg-amber-500/10 border border-amber-500/40 rounded-2xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">✏️</span>
            <div>
              <p className="text-amber-400 font-black text-sm mb-1">지금 바로 업소 상세 정보를 입력하세요!</p>
              <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                영업시간, 메뉴, 소개글, 사진 등을 입력하면<br />
                밤길 노출 시 훨씬 더 많은 고객이 유입됩니다.
              </p>
              <button
                onClick={() => window.location.href = '/dashboard/edit'}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all text-sm"
              >
                업소 상세 정보 입력하기 →
              </button>
            </div>
          </div>
        </div>

        {/* 대시보드 이동 */}
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold rounded-xl transition-all text-sm mb-4"
        >
          나중에 입력하기 (대시보드로 이동)
        </button>

        {/* 코코알바 광고 */}
        <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
          <p className="text-zinc-500 text-xs mb-2">💼 구인도 함께 등록하세요</p>
          <a
            href="https://cocoalba.kr/my-shop"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-xl hover:bg-rose-500/20 transition-all text-xs text-center"
          >
            코코알바 구인 광고 등록하기 →
          </a>
        </div>
      </div>
    );
  }

  // ── Step 0: 플랜 선택 ──
  if (currentStep === 0) {
    const PLANS = [
      {
        id: 'free',
        name: '무료 체험',
        price: '₩0',
        period: '3개월',
        badge: null,
        color: 'border-zinc-700',
        highlight: 'text-zinc-300',
        platforms: ['밤길 기본 노출'],
        desc: '3개월 무료로 밤길에 업소를 등록해보세요.',
      },
      {
        id: 'basic',
        name: '베이직',
        price: '₩22,000',
        period: '/월',
        badge: null,
        color: 'border-zinc-700',
        highlight: 'text-zinc-100',
        platforms: ['밤길', '웨이터존'],
        desc: '기본 지도 핀 + 웨이터존 구인 광고.',
      },
      {
        id: 'standard',
        name: '스탠다드',
        price: '₩66,000',
        period: '/월',
        badge: '인기',
        color: 'border-blue-500',
        highlight: 'text-blue-300',
        platforms: ['밤길', '코코알바 or 선수존'],
        desc: '밤길 노출 + 코코알바 또는 선수존 구인 광고.',
      },
      {
        id: 'special',
        name: '스페셜',
        price: '₩88,000',
        period: '/월',
        badge: null,
        color: 'border-zinc-600',
        highlight: 'text-zinc-100',
        platforms: ['밤길', '웨이터존', '코코알바 or 선수존'],
        desc: '3개 플랫폼 동시 노출.',
      },
      {
        id: 'deluxe',
        name: '디럭스',
        price: '₩199,000',
        period: '/월',
        badge: '추천',
        color: 'border-amber-500',
        highlight: 'text-amber-400',
        platforms: ['밤길 강조 핀', '웨이터존', '코코알바 or 선수존', 'PC 사이드바'],
        desc: '강조 효과 + PC 노출 추가. 경쟁사 대비 압도적.',
      },
      {
        id: 'premium',
        name: '프리미엄',
        price: '₩399,000',
        period: '/월',
        badge: '최상위',
        color: 'border-rose-500',
        highlight: 'text-rose-400',
        platforms: ['밤길 최상단 고정', '웨이터존', '코코알바 or 선수존', 'PC/모바일 최상단'],
        desc: '모든 플랫폼 최상단 고정 노출.',
      },
    ];

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center mb-10">
          <p className="text-zinc-400 text-sm">원하시는 플랜을 선택하고 입점신청을 시작하세요.<br/>언제든지 플랜을 업그레이드할 수 있습니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {PLANS.map((plan) => {
            const isSelected = localSelectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setLocalSelectedPlan(plan.id)}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? `${plan.color} bg-zinc-900 shadow-lg`
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                {plan.badge && (
                  <span className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full ${
                    plan.id === 'standard' ? 'bg-blue-500/20 text-blue-400' :
                    plan.id === 'deluxe' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>{plan.badge}</span>
                )}
                {isSelected && (
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${plan.badge ? 'hidden' : 'flex'} bg-amber-500`}>
                    <CheckCircle2 size={14} className="text-black" />
                  </div>
                )}
                <p className={`font-black text-lg mb-1 ${isSelected ? plan.highlight : 'text-zinc-300'}`}>{plan.name}</p>
                <p className="mb-3">
                  <span className={`font-black text-2xl ${isSelected ? plan.highlight : 'text-zinc-400'}`}>{plan.price}</span>
                  <span className="text-zinc-600 text-xs">{plan.period}</span>
                </p>
                <p className="text-zinc-500 text-xs mb-3 leading-relaxed">{plan.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {plan.platforms.map((p) => (
                    <span key={p} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-bold">{p}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <div className="text-center text-xs text-zinc-600 mb-6">
          * 모든 플랜은 VAT 별도 / 3·6·12개월 장기 결제 시 최대 17% 할인 적용
        </div>
        <button
          onClick={() => setCurrentStep(1)}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          {PLANS.find(p => p.id === localSelectedPlan)?.name ?? '베이직'} 플랜으로 입점신청 시작하기
          <ChevronRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="flex justify-between items-center mb-12">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center flex-1 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
              currentStep >= step.id 
                ? 'bg-amber-500 border-amber-500 text-black font-bold' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-600'
            }`}>
              {currentStep > step.id ? <CheckCircle2 size={24} /> : step.id}
            </div>
            <div className="mt-4 text-center">
              <div className={`text-xs font-bold uppercase tracking-tight mb-1 ${
                currentStep >= step.id ? 'text-zinc-100' : 'text-zinc-700'
              }`}>
                {step.title}
              </div>
              <div className="text-[10px] text-zinc-600 whitespace-nowrap hidden sm:block">
                {step.description}
              </div>
            </div>
            {/* Connector Line */}
            {step.id < 3 && (
              <div className={`absolute top-5 left-[50%] right-[-50%] h-[2px] z-0 transition-colors ${
                currentStep > step.id ? 'bg-amber-500' : 'bg-zinc-900'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="p-8 md:p-12 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm shadow-2xl">
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center animate-shake">
            <AlertCircle size={18} className="mr-3" /> {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center">
                  <Building2 size={14} className="mr-2" /> 상호명 (업소명)
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => { handleInputChange(e); setOcrFilledSet(prev => { const n = new Set(prev); n.delete('name'); return n; }); }}
                  placeholder="사업자 상호명을 입력하세요"
                  className={`w-full border rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all ${
                    ocrFilledSet.has('name') ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-950 border-zinc-800'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center">
                  <Shield size={14} className="mr-2" /> 대표자명
                </label>
                <input
                  type="text"
                  name="representative"
                  value={formData.representative}
                  onChange={(e) => { handleInputChange(e); setOcrFilledSet(prev => { const n = new Set(prev); n.delete('representative'); return n; }); }}
                  placeholder="사업자 대표자명"
                  className={`w-full border rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all ${
                    ocrFilledSet.has('representative') ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-950 border-zinc-800'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center">
                  <Hash size={14} className="mr-2" /> 사업자등록번호
                </label>
                <input
                  type="text"
                  name="business_number"
                  value={formData.business_number}
                  onChange={(e) => { handleInputChange(e); setOcrFilledSet(prev => { const n = new Set(prev); n.delete('business_number'); return n; }); }}
                  placeholder="000-00-00000"
                  className={`w-full border rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all ${
                    ocrFilledSet.has('business_number') ? 'bg-amber-500/10 border-amber-500/50' : 'bg-zinc-950 border-zinc-800'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center">
                  <Hash size={14} className="mr-2" /> 업종 선택
                </label>
                <div className="flex gap-2">
                  <select
                    value={mainCategory}
                    onChange={e => setMainCategory(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all appearance-none"
                  >
                    {Object.keys(JOB_CATEGORY_MAP).map(cat => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={subCategory}
                    onChange={e => setSubCategory(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all appearance-none"
                  >
                    {(JOB_CATEGORY_MAP[mainCategory] ?? []).map(sub => (
                      <option key={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center">
                  <MapPin size={14} className="mr-2" /> 주요 지역
                </label>
                <div className="flex gap-2">
                  <select
                    value={regionSido}
                    onChange={e => setRegionSido(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all appearance-none"
                  >
                    {Object.keys(REGIONS).map(sido => (
                      <option key={sido}>{sido}</option>
                    ))}
                  </select>
                  <select
                    value={regionSigungu}
                    onChange={e => setRegionSigungu(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all appearance-none"
                  >
                    {(REGIONS[regionSido] ?? []).slice().sort((a, b) => a.localeCompare(b, 'ko')).map(sg => (
                      <option key={sg}>{sg}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center">
                  <Phone size={14} className="mr-2" /> 담당자 연락처
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="010-0000-0000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* 무료 플랜 안내 배너 */}
            {localSelectedPlan === 'free' && (
              <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                <span className="text-amber-400 text-xl shrink-0">📍</span>
                <div>
                  <p className="text-amber-400 font-black text-sm mb-1">밤길 3개월 무료 등록</p>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    무료 플랜은 <strong className="text-white">밤길 지도에만</strong> 3개월간 업소 핀이 노출됩니다.<br />
                    코코알바·웨이터존·선수존 구인 플랫폼 노출은 유료 플랜(스탠다드 이상)에서 이용 가능합니다.
                  </p>
                </div>
              </div>
            )}

            {/* 플랫폼 선택 (스탠다드 이상일 경우) */}
            {localSelectedPlan !== 'basic' && localSelectedPlan !== 'free' && (
              <div className="space-y-4 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                <label className="text-sm font-bold text-amber-500 flex items-center">
                  <Shield size={16} className="mr-2" /> 연동 플랫폼 선택 (코코알바 또는 선수존)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, platform_choice: 'cocoalba' }))}
                    className={`p-4 rounded-xl border-2 font-bold transition-all text-sm ${
                      formData.platform_choice === 'cocoalba'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    코코알바 (여성 구인)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, platform_choice: 'sunsujone' }))}
                    className={`p-4 rounded-xl border-2 font-bold transition-all text-sm ${
                      formData.platform_choice === 'sunsujone'
                        ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    선수존 (남성 구인)
                  </button>
                </div>
                <p className="text-xs text-zinc-600 font-medium italic">
                  * 스탠다드 이상 플랜은 밤길 외에 구인 플랫폼 1곳을 추가로 선택하여 동시 노출할 수 있습니다.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 flex items-center">
                <MapPin size={14} className="mr-2" /> 업소 상세 주소
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={addressMain}
                  placeholder="주소 검색 버튼을 눌러주세요"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none transition-all cursor-pointer"
                  onClick={openAddressSearch}
                />
                <button
                  type="button"
                  onClick={openAddressSearch}
                  className="px-4 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all text-sm whitespace-nowrap"
                >
                  주소 검색
                </button>
              </div>
              {addressMain && (
                <input
                  type="text"
                  value={addressDetail}
                  onChange={e => setAddressDetail(e.target.value)}
                  placeholder="상세 주소 (건물명, 호수 등)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all"
                />
              )}
            </div>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-2 gap-4">
              {/* 사업자등록증 */}
              <div className="p-5 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 text-center group hover:border-amber-500/50 transition-all cursor-pointer"
                   onClick={() => licenseInputRef.current?.click()}>
                <input
                  type="file"
                  hidden
                  ref={licenseInputRef}
                  onChange={(e) => handleFileChange(e, 'license')}
                  accept="image/*,.pdf"
                />
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-500 group-hover:text-black transition-all">
                  <FileCheck size={22} />
                </div>
                <h4 className="text-base font-bold text-white mb-1">사업자등록증</h4>
                <p className="text-zinc-500 text-xs mb-3">JPG, PNG, PDF (최대 10MB)</p>
                {files.license ? (
                  <div className="mt-1">
                    <div className="text-amber-500 font-bold text-xs bg-amber-500/10 py-1.5 px-3 rounded-lg inline-block truncate max-w-full">
                      {files.license.name}
                    </div>
                    {hasAnthropicKey && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleOcr(); }}
                        disabled={ocrLoading}
                        className="mt-3 w-full py-2 bg-amber-500 text-black font-bold text-xs rounded-xl flex items-center justify-center hover:bg-amber-400 transition-colors disabled:opacity-50"
                      >
                        {ocrLoading ? <><Loader2 size={14} className="mr-1 animate-spin" /> 자동입력 중...</> : '🤖 AI 자동입력'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-600 font-medium text-xs">클릭하여 업로드</div>
                )}
              </div>

              {/* 영업허가증 */}
              <div className="p-5 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/50 text-center group hover:border-amber-500/50 transition-all cursor-pointer"
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
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-500 group-hover:text-black transition-all">
                  <Shield size={22} />
                </div>
                <h4 className="text-base font-bold text-white mb-1">영업허가증</h4>
                <p className="text-zinc-500 text-xs mb-3">JPG, PNG, PDF (최대 10MB)</p>
                {files.permit ? (
                  <div className="mt-1">
                    <div className="text-amber-500 font-bold text-xs bg-amber-500/10 py-1.5 px-3 rounded-lg inline-block truncate max-w-full">
                      {files.permit.name}
                    </div>
                    {hasAnthropicKey && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handlePermitOcr(); }}
                        disabled={ocrPermitLoading}
                        className="mt-3 w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center hover:bg-emerald-500 transition-colors disabled:opacity-50"
                      >
                        {ocrPermitLoading ? <><Loader2 size={14} className="mr-1 animate-spin" /> 자동입력 중...</> : '🤖 AI 자동입력 (허가번호·면적)'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-600 font-medium text-xs">클릭하여 업로드</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-zinc-100 font-bold">
                <ImageIcon size={18} className="mr-2 text-amber-500" /> 업소 내부/외부 사진 (최대 5장)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.shop_images.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-zinc-900 rounded-xl relative overflow-hidden group">
                    <Image 
                      src={URL.createObjectURL(img)} 
                      className="w-full h-full object-cover" 
                      alt="Shop" 
                      fill
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <AlertCircle size={20} className="text-white" />
                    </div>
                  </div>
                ))}
                {files.shop_images.length < 5 && (
                  <button 
                    onClick={() => imagesInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-600 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
                  >
                    <Upload size={24} className="mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Add Photo</span>
                    <input 
                      type="file" 
                      hidden 
                      ref={imagesInputRef}
                      onChange={(e) => handleFileChange(e, 'images')}
                      accept="image/*"
                      multiple
                    />
                  </button>
                )}
              </div>
            </div>

            {/* 메뉴 및 가격 정보 (2단계) */}
            <div className="space-y-6 pt-8 border-t border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-amber-500 mr-2">📋</span> 메뉴 및 가격 정보
                </h3>
                <p className="text-sm text-zinc-400 mt-1">메뉴 정보를 입력하면 손님 신뢰도가 높아집니다</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400">대표 메뉴</label>
                <input
                  type="text"
                  name="menu_main"
                  value={formData.menu_main}
                  onChange={handleInputChange}
                  placeholder="예: 양주 1병 80,000원"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">주류 메뉴 (줄바꿈으로 구분)</label>
                  <textarea
                    name="menu_liquor"
                    value={formData.menu_liquor}
                    onChange={handleInputChange}
                    placeholder="예: 맥주 5,000원&#10;소주 4,000원"
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-400">안주 메뉴 (줄바꿈으로 구분)</label>
                  <textarea
                    name="menu_snack"
                    value={formData.menu_snack}
                    onChange={handleInputChange}
                    placeholder="예: 안주모듬 20,000원&#10;과일 30,000원"
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Final Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">상호명</dt>
                <dd className="text-white font-bold">{formData.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">업종</dt>
                <dd className="text-white font-bold">{formData.category}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">지역</dt>
                <dd className="text-white font-bold">{formData.region}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">연락처</dt>
                <dd className="text-white font-bold">{formData.phone}</dd>
              </div>
              <div className="col-span-1 md:col-span-2">
                <dt className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">주소</dt>
                <dd className="text-white font-bold">{formData.address}</dd>
              </div>
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-zinc-900">
                <dt className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">업로드 문서 및 사진</dt>
                <dd className="text-zinc-400 text-sm italic">
                  - 사업자등록증: {files.license?.name || '없음'}<br />
                  - 업소 사진: {files.shop_images.length}장
                </dd>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start">
                <Shield className="text-amber-500 mr-4 mt-1 shrink-0" size={20} />
                <p className="text-zinc-400 text-xs leading-relaxed">
                  위 입력 정보 및 문서가 허위로 판명될 경우, 입점 거절 및 이용 제한을 받을 수 있음에 동의합니다.<br />
                  야사장은 운영 정책에 따라 등록된 개인정보를 보호하며, 심사 목적 외에 사용하지 않습니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-12 flex justify-between items-center pt-8 border-t border-zinc-800">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className="flex items-center text-zinc-500 hover:text-white font-bold disabled:opacity-0 transition-all"
          >
            <ChevronLeft size={20} className="mr-1" /> 이전 단계
          </button>
          
          <button
            onClick={currentStep === 3 ? handleSubmit : nextStep}
            disabled={loading}
            className={`px-8 py-4 rounded-xl font-bold flex items-center transition-all ${
              currentStep === 3 
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {loading ? (
              <><Loader2 size={20} className="mr-2 animate-spin" /> 처리 중...</>
            ) : currentStep === 3 ? (
              '최종 입점 신청'
            ) : (
              <>다음 <ChevronRight size={20} className="ml-2" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
