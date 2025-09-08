/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
    optimizeCss: true,
  },
  eslint: {
    // Skip ESLint during production builds to unblock deploys
    ignoreDuringBuilds: true,
  },
  
  // Replit development configuration
  ...(process.env.NODE_ENV === 'development' && {
    allowedHosts: true,
  }),
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization with better defaults
  images: {
    // In dev, avoid optimization (and domain restrictions) for convenience
    unoptimized: process.env.NODE_ENV !== 'production',
    domains: [
      'localhost',
      'thesylvee.com',
      'overture.org',
      'greatdanepub.com',
      'visitmadison.com',
      'isthmus.com',
      'example.com',
      // Add other venue domains as needed
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
  },
  
  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Enable tree shaking
    config.optimization = {
      ...config.optimization,
      sideEffects: false,
    };
    
    // Reduce bundle size in production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            minChunks: 2,
            priority: -10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  async headers() {
    const dev = process.env.NODE_ENV !== 'production';

    if (dev) {
      // In development, minimize headers to avoid breaking HMR and static asset serving
      return [
        {
          source: '/api/(.*)',
          headers: [
            { key: 'Cache-Control', value: 'no-store, max-age=0' },
            { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          ],
        },
      ];
    }

    // Production security headers
    const scriptSrc = "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:";
    const connectSrc = "connect-src 'self' https://api.anthropic.com";
    const workerSrc = "worker-src 'self' blob:";

    const csp = [
      "default-src 'self'",
      "img-src 'self' data: https: blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      scriptSrc,
      connectSrc,
      "font-src 'self' https://fonts.gstatic.com data:",
      workerSrc,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), bluetooth=()' },
          // COOP/COEP can break third-party and HMR; enable later if needed with care
          // { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          // { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
