import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable TypeScript errors during build (warnings only)
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  // Optimize file watching to reduce rebuilds (for webpack mode)
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
  // Turbopack configuration (required in Next.js 16)
  turbopack: {
    // Set root directory to silence workspace warning
    root: process.cwd(),
  },
  // Reduce rebuild frequency
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js']
  }
};

export default nextConfig;
