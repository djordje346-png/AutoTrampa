/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none';" },
      ],
    }];
  },
  // Lint failures must fail the build: a green deploy with broken lint is how
  // unused imports and stale `dark:` overrides survived this long.
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Listing photos come from arbitrary Supabase projects and the demo seed uses
  // remote Pexels URLs, so the optimizer has nothing to normalize here.
  images: { unoptimized: true },
};

module.exports = nextConfig;
