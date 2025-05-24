/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript type checking
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true
  },
  // Disable ESLint during builds
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true
  }
  // Remove these two lines:
  // distDir: 'out',
  // output: 'export',
}

module.exports = nextConfig
