/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // 跳過型別檢查
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;