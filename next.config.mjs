/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // 讓 Webpack 在遇到 canvas 模組時忽略伺服器端的引用
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;