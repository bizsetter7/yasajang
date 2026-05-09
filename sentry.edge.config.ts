import * as Sentry from '@sentry/nextjs';

// Edge Runtime Sentry 초기화 (middleware 에러 추적)
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === 'production',
    debug: false,
});
