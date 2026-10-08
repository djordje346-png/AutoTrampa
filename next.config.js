/** @type {import('next').NextConfig} */
const nextConfig = {
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
