import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger images to be sent to Gemini AI
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
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
        hostname: 'xeghmiksvzblxaczkpel.supabase.co', // Your Supabase
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;