'use client';

import { useEffect, useState } from 'react';

const ANNOUNCEMENT_KEY = 'yasajang_announcement_v2026_04_30';

/**
 * 야사장 대시보드 진입 시 1회 공지 모달.
 * "다시 보지 않기" 클릭 시 localStorage 저장 → 영구 미표시.
 *
 * 공지 버전 변경 시 ANNOUNCEMENT_KEY를 새 키로 변경하면 모든 사용자에게 재표시.
 */
export default function AnnouncementModal() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const dismissed = localStorage.getItem(ANNOUNCEMENT_KEY);
        if (!dismissed) setShow(true);
    }, []);

    const dismiss = (forever: boolean) => {
        if (forever && typeof window !== 'undefined') {
            localStorage.setItem(ANNOUNCEMENT_KEY, '1');
        }
        setShow(false);
    };

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => dismiss(false)}
        >
            <div
                className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-center">
                    <span className="inline-block text-4xl mb-2">📢</span>
                    <h2 className="text-xl font-black text-white">광고 게시 흐름이 변경되었습니다</h2>
                    <p className="text-xs font-bold text-amber-50 mt-1">2026-04-30 업데이트</p>
                </div>

                {/* 본문 */}
                <div className="p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="font-black text-amber-700 mb-2">🆕 변경 사항</p>
                        <p className="text-gray-700">
                            야사장에서 입점 신청·결제 승인 후 <strong>광고가 자동 게시되지 않습니다</strong>.
                            사장님이 직접 검토하고 게시할 수 있도록 변경됐습니다.
                        </p>
                    </div>

                    <div>
                        <p className="font-black text-gray-900 mb-2">📋 새 광고 게시 절차</p>
                        <ol className="space-y-2 text-xs">
                            <li className="flex gap-2">
                                <span className="font-black text-amber-500 shrink-0">1.</span>
                                <span><strong>야사장 입점 신청</strong> → 어드민 결제 승인 (구독 활성)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-black text-amber-500 shrink-0">2.</span>
                                <span>야사장 대시보드 → <strong>플랫폼 구인 조건</strong> 섹션 → 각 플랫폼 옆 <strong>[📢 광고 게시하기]</strong> 버튼 클릭</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-black text-amber-500 shrink-0">3.</span>
                                <span>코코알바·웨이터존·선수존에 광고 즉시 게시</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-black text-amber-500 shrink-0">4.</span>
                                <span>해당 플랫폼 마이샵 진입 → 진행중인 채용공고에서 <strong>채용 메시지·이미지·세부 콘텐츠 작성</strong></span>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs">
                        <p className="font-black text-blue-700 mb-1">💡 플랜별 게시 가능 플랫폼</p>
                        <ul className="space-y-1 text-blue-900">
                            <li><strong>무료 (3개월 체험):</strong> 밤길만 노출 (인증 업체 표시)</li>
                            <li><strong>베이직:</strong> 밤길 + 웨이터존</li>
                            <li><strong>스탠다드:</strong> 밤길 + (코코알바 OR 선수존)</li>
                            <li><strong>스페셜+:</strong> 밤길 + 웨이터존 + (코코알바 OR 선수존)</li>
                        </ul>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs">
                        <p className="font-black text-emerald-700 mb-1">🚀 점프 시스템 안내</p>
                        <p className="text-emerald-900">
                            스페셜·디럭스·프리미엄 회원은 매월 무료 점프(10/30/30회) + 자동 점프(일 3/6/8회)가 지급됩니다.
                            점프 잔액은 야사장 대시보드와 각 플랫폼 마이샵에서 확인 가능합니다.
                        </p>
                    </div>
                </div>

                {/* 액션 */}
                <div className="border-t border-gray-100 p-4 flex gap-2">
                    <button
                        onClick={() => dismiss(true)}
                        className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs transition-colors"
                    >
                        다시 보지 않기
                    </button>
                    <button
                        onClick={() => dismiss(false)}
                        className="flex-[2] py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-colors"
                    >
                        확인했습니다
                    </button>
                </div>
            </div>
        </div>
    );
}
