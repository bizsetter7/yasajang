import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
};

// Sentry 래핑 — NEXT_PUBLIC_SENTRY_DSN 환경변수 설정 시 에러 추적 활성화
export default withSentryConfig(nextConfig, {
    org: 'a5f1f5ea21a7',
    project: 'javascript-nextjs',
    silent: true,
    disableLogger: true,
});
