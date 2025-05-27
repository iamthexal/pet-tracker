import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/__/auth/handler',
        destination: 'https://petcare-33a74.firebaseapp.com/__/auth/handler'
      },
      {
        source: '/__/auth/:path*',
        destination: 'https://petcare-33a74.firebaseapp.com/__/auth/:path*'
      }
    ]
  }
};

export default nextConfig;