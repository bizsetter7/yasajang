import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';

const notices = [
  {
    id: 1,
    category: '서비스 안내',
    title: '야사장 플랫폼 정식 서비스 오픈 안내',
    date: '2026-05-01',
    content: '안녕하세요. 야사장입니다.\n\n밤 업소 사장님들을 위한 통합 마케팅 플랫폼, 야사장이 정식 서비스를 시작합니다.\n\n야사장은 밤길(손님 유입), 코코알바(아가씨 구인), 웨이터존(웨이터 구인), 선수존(선수 구인) 4개 플랫폼을 하나의 구독으로 관리할 수 있는 B2B SaaS 플랫폼입니다.\n\n오픈 기념으로 밤길 3개월 무료 체험을 제공하오니, 지금 바로 등록해보세요.',
    pinned: true,
  },
  {
    id: 2,
    category: '이벤트',
    title: '오픈 기념 밤길 3개월 무료 체험 이벤트',
    date: '2026-05-01',
    content: '야사장 정식 오픈을 기념하여 신규 등록 업소에 밤길 3개월 무료 체험을 제공합니다.\n\n기간: 2026년 5월 1일 ~ 종료 시까지\n대상: 야사장 신규 등록 업소\n혜택: 밤길 지도 핀 노출 3개월 무료\n\n지금 바로 업소를 등록하고 혜택을 받으세요.',
    pinned: true,
  },
  {
    id: 3,
    category: '서비스 안내',
    title: '플랫폼 연동 안내 — 코코알바·웨이터존·선수존',
    date: '2026-05-01',
    content: '야사장 구독 시 코코알바, 웨이터존, 선수존 플랫폼 광고가 자동으로 연동됩니다.\n\n별도 로그인이나 추가 설정 없이 야사장 대시보드 하나로 모든 플랫폼 구인 정보를 관리하실 수 있습니다.\n\n연동 플랜: 스탠다드 이상',
    pinned: false,
  },
];

export default function NoticePage() {
  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-10">
          <Bell className="text-amber-500" size={24} />
          <h1 className="text-3xl font-black text-white">공지사항</h1>
        </div>

        <div className="space-y-3">
          {notices.map((notice) => (
            <details
              key={notice.id}
              className="group bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none hover:bg-zinc-800/50 transition-colors">
                {notice.pinned && (
                  <span className="shrink-0 text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full">고정</span>
                )}
                <span className="text-[11px] text-zinc-500 shrink-0">{notice.category}</span>
                <span className="text-sm font-semibold text-white flex-1 truncate">{notice.title}</span>
                <span className="text-xs text-zinc-600 shrink-0">{notice.date}</span>
                <ChevronRight size={14} className="text-zinc-600 group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <div className="px-5 pb-5 pt-2 border-t border-zinc-800">
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{notice.content}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/" className="text-xs text-zinc-600 hover:text-amber-400 transition-colors">← 홈으로 돌아가기</Link>
        </div>
      </div>
    </main>
  );
}
