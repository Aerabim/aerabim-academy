/** @type {import('next').NextConfig} */
const nextConfig = {
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
