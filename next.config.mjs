/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // 解決 pdfjs-dist 與 canvas 在 Webpack 打包時的相容性議題
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    return config;
  },
  // 關閉嚴格模式避免 Canvas 在開發模式下重複初始化渲染
  reactStrictMode: false,
};

export default nextConfig;