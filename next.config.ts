import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during build to prevent warnings from failing deployment
  eslint: {
    // Only run ESLint on these directories during production builds
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build (warnings only)
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  // Optimize file watching to reduce rebuilds
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce file watching overhead
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',
          '**/build/**',
          '**/*.log',
          '**/*.sql',
          '**/*.js',
          '**/*.md'
        ]
      }
    }
    return config
  },
  // Reduce rebuild frequency
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  }
};

export default nextConfig;
