/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jwsmntmsrmaybicpglmc.supabase.co',
      },
    ],
  },
};

export default nextConfig;
