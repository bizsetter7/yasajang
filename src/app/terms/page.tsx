import Link from 'next/link';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: '제1조 (목적)',
    content: '이 약관은 야사장(이하 "서비스")이 제공하는 밤 업소 사장님 전용 마케팅 플랫폼 서비스의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (정의)',
    content: '① "서비스"란 야사장이 운영하는 www.yasajang.kr 및 연동 플랫폼(밤길·코코알바·웨이터존·선수존)을 통해 제공하는 일체의 B2B 마케팅 서비스를 말합니다.\n② "이용자"란 서비스에 접속하여 이 약관에 동의하고 서비스를 이용하는 사업자를 말합니다.\n③ "구독"이란 이용자가 서비스의 유료 기능을 사용하기 위해 결제하는 정기 이용권을 말합니다.',
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    content: '① 이 약관은 서비스 화면에 공시함으로써 효력이 발생합니다.\n② 서비스는 합리적인 사유가 있을 때 약관을 변경할 수 있으며, 변경된 약관은 공지사항을 통해 사전 공지합니다.',
  },
  {
    title: '제4조 (서비스 이용 계약)',
    content: '① 이용 계약은 이용자가 약관에 동의하고 서비스에 등록 신청 후 서비스가 승인함으로써 성립합니다.\n② 서비스는 아래 각 호에 해당하는 경우 가입을 거부하거나 사후에 계약을 해지할 수 있습니다.\n  - 실제 영업 중인 사업장이 아닌 경우\n  - 사업자등록증 또는 영업허가증이 유효하지 않은 경우\n  - 기타 서비스 운영을 저해하는 경우',
  },
  {
    title: '제5조 (구독 및 결제)',
    content: '① 구독 요금은 서비스 요금제 페이지에 게시된 금액을 기준으로 합니다.\n② 현재 결제 방식은 무통장 입금이며, 입금 확인 후 서비스가 활성화됩니다.\n③ 구독 기간 만료 전 별도로 해지 요청하지 않으면 자동으로 갱신 청구됩니다.',
  },
  {
    title: '제6조 (서비스 이용 제한)',
    content: '서비스는 이용자가 아래 각 호에 해당하는 경우 사전 통보 없이 서비스 이용을 제한할 수 있습니다.\n  - 허위 정보로 가입한 경우\n  - 서비스의 안정적 운영을 방해하는 행위를 한 경우\n  - 타인의 권리나 명예를 침해하는 경우\n  - 관련 법령을 위반한 경우',
  },
  {
    title: '제7조 (면책조항)',
    content: '① 서비스는 천재지변, 비상사태 등 불가항력으로 인하여 서비스를 제공하지 못하는 경우에는 책임이 면제됩니다.\n② 서비스는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임지지 않습니다.\n③ 서비스가 제공하는 정보의 신뢰성·정확성에 대해서 보증하지 않습니다.',
  },
  {
    title: '제8조 (준거법 및 관할법원)',
    content: '이 약관은 대한민국 법률에 의해 해석되며, 서비스 이용과 관련하여 분쟁이 발생할 경우 대한민국 법원을 관할법원으로 합니다.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="text-amber-500" size={24} />
          <h1 className="text-3xl font-black text-white">이용약관</h1>
        </div>
        <p className="text-xs text-zinc-600 mb-10">시행일: 2026년 5월 1일</p>

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
