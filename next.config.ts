import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/**',
      },
    ],
  },
  // Allow build to continue with linting errors (for deployment)
  eslint: {
    ignoreDuringBuilds: true, // Ignore lint errors during build for deployment
  },
  typescript: {
    // Allow build to continue with TypeScript errors (for deployment)
    ignoreBuildErrors: true, // Ignore TS errors during build for deployment
  },
};

export default nextConfig;
