/** @type {import('next').NextConfig} */
const nextConfig = {
  // Change the build output directory to ../build/academy
  // This aligns with the build directory mentioned in the context
  distDir: '../build/academy',

  // Configure output for optimized deployment
  output: 'standalone',

  // Optimize production builds
  reactStrictMode: true,

  // Configure image domains for external images (if needed)
  images: {
    domains: ['aixtiv-academy-assets.cdn.domain'],
  },

  // Configure environment variables based on deployment environment
  publicRuntimeConfig: {
    // Public environment variables (accessible in browser)
    apiUrl: process.env.API_URL || 'https://api.aixtiv-academy.com',
  },

  // Configure server-side environment variables
  serverRuntimeConfig: {
    // Server-only environment variables (not exposed to browser)
    apiSecret: process.env.API_SECRET,
  },

  // Additional configuration for handling deployment through the deploy directory
  async rewrites() {
    return [
      // Handle API proxy requests if needed
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL || 'https://api.aixtiv-academy.com'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
