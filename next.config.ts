import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
