/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SWCコンパイラを使用（Babelより高速）
  swcMinify: true,
  // 本番ビルドで圧縮を有効化
  compress: true,
  // 画像最適化の設定
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // パフォーマンスヒント
  poweredByHeader: false,
  // 実験的機能
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // サーバーサイドでonnxruntime-webを使用可能にする
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // WASMファイルをasset/resourceとして扱う
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    // onnxruntime-webのWASMファイルをコピー
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-web": require.resolve("onnxruntime-web"),
    };

    return config;
  },
};

module.exports = nextConfig;
