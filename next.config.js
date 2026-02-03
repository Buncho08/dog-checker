/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
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
