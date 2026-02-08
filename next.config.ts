import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Next-on-Pages requires disabling standalone output, but standard next build is fine.
  // We specify output: 'export' or just let standard build happen.
  // Actually, next-on-pages handles standard build output (.next).
  // However, for Images optimization on Cloudflare (which is limited), it's often safer to disable optimization if not using a specific loader.
  images: {
    unoptimized: true, // Use this for simplicity on Cloudflare Pages freely
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
};

export default nextConfig;
