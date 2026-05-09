import * as Sentry from '@sentry/nextjs';

// 서버 사이드 Sentry 초기화 (API Routes, Server Components 에러 추적)
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production',
    debug: false,
    initialScope: {
        tags: { platform: process.env.NEXT_PUBLIC_SITE_NAME || '야사장' },
    },
});
