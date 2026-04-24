'use client';

import { useState, useRef } from 'react';
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

const steps = [
  { id: 1, title: '기본 정보', description: '업소 성격 및 연락처' },
  { id: 2, title: '문서 인증', description: '사업자등록증 및 서류' },
  { id: 3, title: '최종 확인', description: '내용 검토 및 신청' },
];

export default function RegisterForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState({
    name: '',
    category: '룸싸롱',
    region: '강남',
    representative: '',
    business_number: '',
    phone: '',
    address: '',
    description: '',
  });

  const [files, setFiles] = useState<{
    license: File | null;
    shop_images: File[];
  }>({
    license: null,
    shop_images: [],
  });

  const licenseInputRef = useRef<HTMLInputElement>(null);
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

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 1. Upload files to Storage
      let licenseUrl = '';
      if (files.license) {
        const fileExt = files.license.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_license.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('businesses-docs')
          .upload(fileName, files.license);
        
        if (uploadError) throw uploadError;
        licenseUrl = uploadData.path;
      }

      // 2. Insert into shops table
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .insert({
          ...formData,
          user_id: user.id,
          license_path: licenseUrl,
          status: 'PENDING_REVIEW', // Using the M-025 normalization
        })
        .select()
        .single();

      if (shopError) throw shopError;

      // 3. Notify Admin via Telegram
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `<b>[신규 업소 입점 신청]</b>\n업소명: ${formData.name}\n지역: ${formData.region}\n카테고리: ${formData.category}\n대표자: ${formData.representative || '미입력'}\n연락처: ${formData.phone}\n\n심사 대기 상태로 등록되었습니다.`
        })
      });

      setSuccess(true);

    } catch (err: any) {
      console.error('Registration Error:', err);
      setError(err.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">입점 신청 완료</h2>
        <p className="text-zinc-500 mb-10 max-w-md mx-auto leading-relaxed">
          성공적으로 입점 신청이 접수되었습니다.<br />
          문서 심사는 영업일 기준 1~2일이 소요되며,<br />
          결과는 등록된 이메일로 안내해 드립니다.
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="px-8 py-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all"
        >
          대시보드로 이동
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
                  <Building2 size={14} className="mr-2" /> 업소명
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="사업자 상호명을 입력하세요"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center">
                  <Hash size={14} className="mr-2" /> 업종 선택
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all appearance-none"
                >
                  <option>룸싸롱</option>
                  <option>노래빠</option>
                  <option>가라오케</option>
                  <option>셔츠룸</option>
                  <option>텐카페/텐프로</option>
                  <option>풀싸롱</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-400 flex items-center">
                  <MapPin size={14} className="mr-2" /> 주요 지역
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  placeholder="예: 강남구, 서초구"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all"
                />
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 flex items-center">
                <MapPin size={14} className="mr-2" /> 업소 상세 주소
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleInputChange}
                placeholder="지번/도로명 주소와 상세 위치를 입력하세요"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-fade-in-up">
            <div className="p-8 border-2 border-dashed border-zinc-800 rounded-[2rem] bg-zinc-950/50 text-center group hover:border-amber-500/50 transition-all cursor-pointer"
                 onClick={() => licenseInputRef.current?.click()}>
              <input 
                type="file" 
                hidden 
                ref={licenseInputRef} 
                onChange={(e) => handleFileChange(e, 'license')}
                accept="image/*,.pdf"
              />
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500 group-hover:text-black transition-all">
                <FileCheck size={28} />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">사업자등록증 업로드</h4>
              <p className="text-zinc-500 text-sm mb-4">파일 형식: JPG, PNG, PDF (최대 10MB)</p>
              {files.license ? (
                <div className="text-amber-500 font-bold text-sm bg-amber-500/10 py-2 px-4 rounded-lg inline-block">
                  {files.license.name} 선택됨
                </div>
              ) : (
                <div className="text-zinc-600 font-medium text-sm">클릭하여 스캔본 또는 사진 업로드</div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-zinc-100 font-bold">
                <ImageIcon size={18} className="mr-2 text-amber-500" /> 업소 내부/외부 사진 (최대 5장)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.shop_images.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-zinc-900 rounded-xl relative overflow-hidden group">
                    <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="Shop" />
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
                      multiple
                      ref={imagesInputRef} 
                      onChange={(e) => handleFileChange(e, 'images')}
                      accept="image/*"
                    />
                  </button>
                )}
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
                  위 입력 정보 및 문서가 허위로 판명될 경우, 입점 거절 및 이용 제한을 받을 수 있음에 동의합니다. 
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
              <>{steps[currentStep].title}로 이동 <ChevronRight size={20} className="ml-2" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
