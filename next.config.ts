import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bucket.zeelu.me',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Enable aggressive caching for images
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Optimize image formats (WebP is ~30% smaller, AVIF is ~50% smaller than JPEG)
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for srcset (these match our menu card sizes)
    imageSizes: [16, 32, 48, 64, 96, 128, 144, 256, 384],
    // Image quality values (required for Next.js 16+)
    qualities: [75, 80, 85, 90, 95, 100],
    // Disable static image imports optimization (we use remote images)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Add cache headers for static assets
  async headers() {
    return [
      {
        source: '/unsplash/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/assets/menu.pdf',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/pdf',
          },
        ],
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Enable static export if needed for deployment
  // output: 'export',
};

export default nextConfig;

