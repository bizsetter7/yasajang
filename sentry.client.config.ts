import * as Sentry from '@sentry/nextjs';

// 클라이언트 사이드 Sentry 초기화 (브라우저 JS 에러 추적)
// DSN: Vercel 환경변수 NEXT_PUBLIC_SENTRY_DSN 설정 필요
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    enabled: process.env.NODE_ENV === 'production',
    debug: false,
    // 플랫폼 태그 — Sentry 대시보드에서 사이트별 필터링
    initialScope: {
        tags: { platform: process.env.NEXT_PUBLIC_SITE_NAME || '야사장' },
    },
});
