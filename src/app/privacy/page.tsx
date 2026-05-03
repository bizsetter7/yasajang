import Link from 'next/link';
import { Shield } from 'lucide-react';

const sections = [
  {
    title: '1. 개인정보 수집 항목 및 수집 방법',
    content: '서비스는 회원 가입 및 서비스 이용을 위해 아래와 같은 개인정보를 수집합니다.\n\n[필수 항목]\n· 이메일 주소, 비밀번호\n· 업소명, 대표자명\n· 사업자등록번호\n· 영업허가증 정보\n· 연락처 (전화번호, 카카오 ID 등)\n· 주소 (업소 위치 정보)\n\n[자동 수집 항목]\n· 접속 IP, 쿠키, 서비스 이용 기록',
  },
  {
    title: '2. 개인정보 수집 및 이용 목적',
    content: '수집된 개인정보는 아래 목적으로만 이용됩니다.\n\n· 서비스 회원 가입 및 관리\n· 구독 결제 처리 및 관리\n· 플랫폼 광고 게재 (밤길·코코알바·웨이터존·선수존)\n· 고객 문의 응대 및 서비스 안내\n· 서비스 운영 및 개선',
  },
  {
    title: '3. 개인정보 보유 및 이용 기간',
    content: '서비스는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.\n\n단, 관련 법령에 의하여 보존할 필요가 있는 경우에는 아래와 같이 보관합니다.\n\n· 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)\n· 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)\n· 소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)',
  },
  {
    title: '4. 개인정보의 제3자 제공',
    content: '서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.\n\n다만, 아래의 경우에는 예외로 합니다.\n· 이용자가 사전에 동의한 경우\n· 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우\n\n연동 플랫폼(코코알바·웨이터존·선수존)에는 광고 게재 목적으로 업소 정보가 공유됩니다.',
  },
  {
    title: '5. 개인정보의 안전성 확보 조치',
    content: '서비스는 개인정보보호법에 따라 아래와 같이 안전성 확보에 필요한 기술적/관리적 조치를 취하고 있습니다.\n\n· 비밀번호 암호화 저장\n· Supabase 보안 인증 적용\n· 관리자 접근 권한 최소화\n· 개인정보 취급 직원 교육',
  },
  {
    title: '6. 이용자의 권리',
    content: '이용자는 언제든지 아래 권리를 행사할 수 있습니다.\n\n· 개인정보 열람 요청\n· 개인정보 정정·삭제 요청\n· 개인정보 처리 정지 요청\n· 서비스 탈퇴 (개인정보 삭제)\n\n요청은 bizsetter7@gmail.com 으로 이메일 문의 주시기 바랍니다.',
  },
  {
    title: '7. 개인정보 보호책임자',
    content: '서비스는 개인정보 처리에 관한 업무를 총괄하기 위한 개인정보 보호책임자를 아래와 같이 지정합니다.\n\n개인정보 보호책임자\n이름: 비즈세터\n이메일: bizsetter7@gmail.com\n\n개인정보 관련 문의는 위 이메일로 연락해주시기 바랍니다.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-amber-500" size={24} />
          <h1 className="text-3xl font-black text-white">개인정보처리방침</h1>
        </div>
        <p className="text-xs text-zinc-600 mb-10">시행일: 2026년 5월 1일</p>

        <p className="text-sm text-zinc-400 mb-8 leading-relaxed p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl">
          야사장(이하 "서비스")은 이용자의 개인정보를 중요하게 여기며, 「개인정보보호법」 및 관련 법령을 준수합니다. 이 방침은 서비스가 어떤 개인정보를 수집하고 어떻게 이용하는지 안내합니다.
        </p>

        <div className="space-y-6">
          {sections.map((sec, i) => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5">
              <h2 className="text-sm font-black text-amber-400 mb-3">{sec.title}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{sec.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-xs text-zinc-600 hover:text-amber-400 transition-colors">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </main>
  );
}
