'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface PlatformGridProps {
    plan: string;                    // 'free'|'basic'|'standard'|'special'|'deluxe'|'premium'
    platformChoice: string | null;   // 'cocoalba'|'waiterzone'|'sunsuzone'|null
    businessId: string | null;
    publishedShops: { platform: string; id: string | number }[];
}

// 플랜별 게시 가능 플랫폼 매트릭스 (2026-04-30 확정)
function canPublish(plan: string, platformChoice: string | null) {
    return {
        bamgil:     plan !== 'free' || true,   // 모든 플랜이 밤길 노출 (무료도 밤길은 인증 + 노출)
        waiterzone: ['basic', 'special', 'deluxe', 'premium'].includes(plan),
        cocoalba:   ['standard', 'special', 'deluxe', 'premium'].includes(plan)
                    && platformChoice === 'cocoalba',
        sunsuzone:  ['standard', 'special', 'deluxe', 'premium'].includes(plan)
                    && platformChoice === 'sunsuzone',
    };
}

export default function PlatformGrid({ plan, platformChoice, publishedShops }: PlatformGridProps) {
    const router = useRouter();
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [showUpgrade, setShowUpgrade] = useState<string | null>(null);
    const [publishing, setPublishing] = useState<string | null>(null);

    const can = canPublish(plan, platformChoice);
    const has = (p: string) => publishedShops.some(s => s.platform === p);

    const platformLabel = (p: string) =>
        p === 'cocoalba' ? '코코알바' : p === 'waiterzone' ? '웨이터존' : p === 'sunsuzone' ? '선수존' : p;

    const handleDisabledClick = (label: string) => {
        setShowUpgrade(label);
    };

    const handlePublish = async (platform: string) => {
        const label = platformLabel(platform);
        if (!confirm(
            `${label}에 야사장 입력 정보로 광고를 게시합니다.\n\n` +
            `게시 후 ${label} 마이샵에서 '채용 메시지' 등 세부 콘텐츠를 작성/수정해주세요.\n\n계속하시겠습니까?`
        )) return;

        setPublishing(platform);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            const res = await fetch('/api/platform-ads/publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ platform }),
            });
            const result = await res.json();

            if (!res.ok) {
                alert(result.message || result.error || '게시 실패');
                return;
            }

            const goMyShop = confirm(
                `✅ ${label} 광고가 게시되었습니다!\n\n` +
                `${label} 마이샵에서 채용 메시지를 작성하시겠습니까?\n(새 탭에서 열림)`
            );
            if (goMyShop && result.redirect) {
                window.open(result.redirect, '_blank');
            }
            router.refresh();
        } catch (err: any) {
            alert(`오류: ${err.message}`);
        } finally {
            setPublishing(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-2 gap-3">
                {/* ─── 밤길 (모든 플랜 활성, 단 무료도 밤길은 노출 가능) ─── */}
                <Link
                    href="/dashboard/edit"
                    className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">🌙</span>
                        <div>
                            <p className="text-xs font-black text-gray-900">밤길</p>
                            <p className="text-[11px] text-gray-400">업소 홍보정보 관리</p>
                        </div>
                        <span className="ml-auto text-gray-300 group-hover:text-purple-400 text-lg">→</span>
                    </div>
                </Link>

                {/* ─── 코코알바 ─── */}
                <PlatformCard
                    icon="🍫"
                    name="코코알바"
                    desc="아가씨 구인 조건"
                    active={can.cocoalba}
                    published={has('cocoalba')}
                    href="/dashboard/platform/cocoalba"
                    color="rose"
                    onDisabledClick={() => handleDisabledClick('코코알바')}
                    onPublishClick={() => handlePublish('cocoalba')}
                    publishing={publishing === 'cocoalba'}
                />

                {/* ─── 웨이터존 ─── */}
                <PlatformCard
                    icon="🤵"
                    name="웨이터존"
                    desc="웨이터 구인 조건"
                    active={can.waiterzone}
                    published={has('waiterzone')}
                    href="/dashboard/platform/waiterzone"
                    color="blue"
                    onDisabledClick={() => handleDisabledClick('웨이터존')}
                    onPublishClick={() => handlePublish('waiterzone')}
                    publishing={publishing === 'waiterzone'}
                />

                {/* ─── 선수존 ─── */}
                <PlatformCard
                    icon="👑"
                    name="선수존"
                    desc="선수 구인 조건"
                    active={can.sunsuzone}
                    published={has('sunsuzone')}
                    href="/dashboard/platform/sunsuzone"
                    color="yellow"
                    onDisabledClick={() => handleDisabledClick('선수존')}
                    onPublishClick={() => handlePublish('sunsuzone')}
                    publishing={publishing === 'sunsuzone'}
                />
            </div>

            {/* 업그레이드 안내 모달 */}
            {showUpgrade && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowUpgrade(null)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <span className="inline-block text-4xl mb-3">🔒</span>
                            <h3 className="text-lg font-black text-gray-900 mb-2">
                                {showUpgrade}는 현재 플랜으로 게시할 수 없습니다
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                <strong className="text-amber-600">{showUpgrade}</strong>에 광고를 게시하려면
                                구독 플랜을 업그레이드 해주세요.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-gray-500">현재 플랜</span><span className="font-black text-gray-900">{plan}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">필요 플랜</span><span className="font-black text-amber-600">{showUpgrade === '웨이터존' ? '베이직 이상' : '스탠다드 이상'}</span></div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowUpgrade(null)}
                                className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm transition-colors"
                            >
                                닫기
                            </button>
                            <Link
                                href="/#pricing"
                                className="flex-[2] py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm flex items-center justify-center transition-colors"
                            >
                                플랜 업그레이드 →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// 플랫폼 카드 단일 컴포넌트
function PlatformCard({
    icon, name, desc, active, published, href, color, onDisabledClick, onPublishClick, publishing,
}: {
    icon: string;
    name: string;
    desc: string;
    active: boolean;
    published: boolean;
    href: string;
    color: 'rose' | 'blue' | 'yellow';
    onDisabledClick: () => void;
    onPublishClick: () => void;
    publishing?: boolean;
}) {
    const colorClass = {
        rose:   'hover:border-rose-300 group-hover:text-rose-400',
        blue:   'hover:border-blue-300 group-hover:text-blue-400',
        yellow: 'hover:border-yellow-300 group-hover:text-yellow-500',
    }[color];

    if (!active) {
        // 비활성화 카드 — 클릭 시 업그레이드 안내
        return (
            <button
                onClick={onDisabledClick}
                className="flex flex-col gap-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl opacity-60 hover:opacity-80 transition-all text-left cursor-not-allowed"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0 grayscale">{icon}</span>
                    <div>
                        <p className="text-xs font-black text-gray-500 flex items-center gap-1.5">
                            {name}
                            <span className="text-[8px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">🔒 LOCKED</span>
                        </p>
                        <p className="text-[11px] text-gray-400">{desc}</p>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <div className={`flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-2xl ${colorClass} hover:shadow-md transition-all group`}>
            <Link href={href} className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                    <p className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                        {name}
                        {published && (
                            <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">✓ 게시 중</span>
                        )}
                    </p>
                    <p className="text-[11px] text-gray-400">{desc}</p>
                </div>
                <span className={`ml-auto text-gray-300 ${colorClass} text-lg`}>→</span>
            </Link>

            {/* 광고 게시 버튼 (미게시 상태일 때만 표시) */}
            {!published && (
                <button
                    onClick={onPublishClick}
                    disabled={publishing}
                    className={`mt-1 px-3 py-2 rounded-xl text-[11px] font-black transition-all disabled:opacity-50 ${
                        color === 'rose'   ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200' :
                        color === 'blue'   ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200' :
                                             'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}
                >
                    {publishing ? '⏳ 게시 중...' : '📢 광고 게시하기'}
                </button>
            )}
        </div>
    );
}
