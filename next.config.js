/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'localhost',
      'thesylvee.com',
      'overture.org',
      'greatdanepub.com',
      'visitmadison.com',
      'isthmus.com',
      // Add other venue domains as needed
    ],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
  },
};

module.exports = nextConfig;