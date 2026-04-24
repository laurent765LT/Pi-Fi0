const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  transpilePackages: ['@strickin/shared'],
  env: {
    // Injected at build time so Sentry events / system-health page can show
    // which commit is deployed. Wired in CI: NEXT_PUBLIC_GIT_COMMIT=$GITHUB_SHA.
    NEXT_PUBLIC_GIT_COMMIT: process.env.NEXT_PUBLIC_GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || '',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

// ─── Sentry wrapper ──────────────────────────────────────────────────────────
// We only wrap when a DSN is configured AND the feature flag is not disabled.
// `withSentryConfig` injects the build-time webpack plugin that uploads source
// maps using SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT_WEB.
const sentryEnabled =
  !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
  process.env.FEATURE_SENTRY_ENABLED !== 'false';

module.exports = sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || 'strickin',
      project: process.env.SENTRY_PROJECT_WEB || 'strickin',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      hideSourceMaps: true,
      disableLogger: true,
      widenClientFileUpload: true,
    })
  : nextConfig;
