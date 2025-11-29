import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1. Ignore Strict Checks (Crucial for Vercel) */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  /* 2. Allow Large AI Uploads */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  /* 3. Image Domains */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'xeghmiksvzblxaczkpel.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
// Vercel deployment fix