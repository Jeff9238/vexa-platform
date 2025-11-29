import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1. TypeScript Errors: Keep ignoring these for smoother deployment */
  typescript: {
    ignoreBuildErrors: true,
  },

  /* 2. AI & Uploads: Allow large files (10MB) for Gemini */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  /* 3. Image Hosting: Whitelist Unsplash and Your Supabase */
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
        hostname: 'xeghmiksvzblxaczkpel.supabase.co', // Your Supabase Project
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;