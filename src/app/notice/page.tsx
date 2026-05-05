import { createClient } from '@supabase/supabase-js';
import { Bell, Pin } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60;

const PLATFORM_LABELS: Record<string, string> = {
  yasajang: '야사장', bamgil: '밤길', cocoalba: '코코알바',
  waiterzone: '웨이터존', sunsuzone: '선수존',
};

export default async function NoticePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const now = new Date().toISOString();
  const { data: notices } = await supabase
    .from('notices')
    .select('id, badge, title, content, is_pinned, published_at, platforms')
    .eq('is_published', true)
    .contains('platforms', ['yasajang'])
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">공지사항</h1>
            <p className="text-gray-500 text-sm">야사장 서비스 공지 및 업데이트</p>
          </div>
          <Link href="/dashboard" className="ml-auto text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← 대시보드로
          </Link>
        </header>

        {!notices?.length ? (
          <div className="text-center py-16 text-gray-400">등록된 공지사항이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {notices.map(n => (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm ${n.is_pinned ? 'border-amber-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {n.is_pinned && <Pin size={12} className="text-amber-500 shrink-0" />}
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {n.badge || '공지'}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto shrink-0">
                    {new Date(n.published_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <h2 className="font-black text-gray-900 mb-2">{n.title}</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                {n.platforms && n.platforms.length > 1 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {n.platforms.map((p: string) => (
                      <span key={p} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {PLATFORM_LABELS[p] || p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
