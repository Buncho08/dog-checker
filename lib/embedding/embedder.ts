import crypto from "crypto";
import * as ort from "onnxruntime-web";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface EmbedderResult {
	embedding: Float32Array;
	version: string;
}

export interface Embedder {
	embed(image: Buffer): Promise<EmbedderResult>;
}

const DUMMY_DIM = 128;
const DUMMY_VERSION = "dummy-v1";

export class DummyEmbedder implements Embedder {
	async embed(image: Buffer): Promise<EmbedderResult> {
		if (image.length === 0) {
			throw new Error("Image buffer is empty");
		}
		const hash = crypto.createHash("sha256").update(image).digest();
		const vector = new Float32Array(DUMMY_DIM);
		for (let i = 0; i < DUMMY_DIM; i += 1) {
			const byte = hash[i % hash.length];
			vector[i] = byte / 255;
		}
		return { embedding: vector, version: DUMMY_VERSION };
	}
}

const DEFAULT_MODEL_PATH = path.resolve(
	process.cwd(),
	"data/models/mobilenetv2-10.onnx",
);
const INPUT_SIZE = 224;
const RESIZE_SIZE = 256;
const ONNX_VERSION = "mobilenetv2-10";
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

type OutputMetadata = { dimensions?: readonly number[] };

const selectOutputName = (
	outputNames: readonly string[],
	outputMetadata: Record<string, OutputMetadata | undefined>,
	logSelection: boolean,
): string => {
	const describeName = (name: string) => {
		const dims = outputMetadata[name]?.dimensions;
		return dims ? `${name}[${dims.join("x")}]` : name;
	};

	const preferred = process.env.EMBEDDING_OUTPUT_NAME;
	if (preferred) {
		if (!outputNames.includes(preferred)) {
			throw new Error(
				`EMBEDDING_OUTPUT_NAME not found. candidates=${outputNames
					.map(describeName)
					.join(", ")}`,
			);
		}
		return preferred;
	}

	const prioritized = outputNames.find((name) =>
		/embedding|feature|pool|avg/i.test(name),
	);

	const chosen = prioritized ?? outputNames[0];
	if (logSelection) {
		console.info("embedder_output_selection", {
			chosen,
			outputs: outputNames.map(describeName),
			note: "Set EMBEDDING_OUTPUT_NAME to override",
		});
	}
	return chosen;
};

const toFloat32Array = (data: ort.Tensor["data"]): Float32Array => {
	if (data instanceof Float32Array) {
		return data;
	}
	return new Float32Array(data as Iterable<number>);
};

const l2Normalize = (vector: Float32Array): Float32Array => {
	let sum = 0;
	for (let i = 0; i < vector.length; i += 1) {
		sum += vector[i] * vector[i];
	}
	const norm = Math.sqrt(sum) || 1;
	const normalized = new Float32Array(vector.length);
	for (let i = 0; i < vector.length; i += 1) {
		normalized[i] = vector[i] / norm;
	}
	return normalized;
};

export class OnnxEmbedder implements Embedder {
	private session: ort.InferenceSession | null = null;
	private hasLoggedModelInfo = false;
	private initialized = false;
	private modelBuffer: Uint8Array | null = null;
	private modelSource = DEFAULT_MODEL_PATH;
	private initPromise: Promise<void> | null = null;

	private resolveThreadCount(): number {
		const parsed = Number(process.env.EMBEDDER_THREADS ?? "4");
		if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
		return 4;
	}

	private resolveWasmBase(): string {
		const custom =
			process.env.EMBEDDER_WASM_BASE_URL ?? process.env.EMBEDDER_WASM_PATH;
		if (custom) {
			return custom.endsWith("/") ? custom : `${custom}/`;
		}
		return path.join(process.cwd(), "public", "wasm") + "/";
	}

	private async loadModelBuffer(): Promise<Uint8Array> {
		if (this.modelBuffer) return this.modelBuffer;

		const remoteUrl = process.env.EMBEDDER_MODEL_URL;
		if (remoteUrl) {
			const res = await fetch(remoteUrl);
			if (!res.ok) {
				throw new Error(
					`Failed to fetch model from ${remoteUrl}: ${res.status}`,
				);
			}
			const arr = await res.arrayBuffer();
			this.modelBuffer = Buffer.from(arr);
			this.modelSource = remoteUrl;
			return this.modelBuffer;
		}

		const modelPath = process.env.EMBEDDER_MODEL_PATH
			? path.resolve(process.cwd(), process.env.EMBEDDER_MODEL_PATH)
			: DEFAULT_MODEL_PATH;
		this.modelSource = modelPath;
		this.modelBuffer = fs.readFileSync(modelPath);
		return this.modelBuffer;
	}

	private async initializeWasm() {
		if (this.initialized) return;

		// Node.js環境でonnxruntime-webを使用するためのWASMパス設定
		ort.env.wasm.wasmPaths = this.resolveWasmBase();
		// SIMD/マルチスレッドを有効化し推論を高速化
		ort.env.wasm.numThreads = this.resolveThreadCount();
		ort.env.wasm.simd = process.env.EMBEDDER_SIMD === "false" ? false : true;
		ort.env.wasm.proxy = false;

		this.initialized = true;
	}

	private async initializeSession(): Promise<void> {
		if (this.session) return;

		// 初期化プロミスを再利用して並列リクエストでの重複初期化を防ぐ
		if (this.initPromise) {
			return this.initPromise;
		}

		this.initPromise = (async () => {
			await this.initializeWasm();
			const modelBuffer = await this.loadModelBuffer();
			this.session = await ort.InferenceSession.create(modelBuffer, {
				executionProviders: ["wasm"],
			});
		})();

		return this.initPromise;
	}

	async embed(image: Buffer): Promise<EmbedderResult> {
		try {
			await this.initializeSession();

			if (!this.session) {
				throw new Error("Session initialization failed");
			}

			// ImageNet標準の前処理: 短辺を256pxにリサイズ（アスペクト比維持）→ 中心から224x224を切り出し
			const { data, info } = await sharp(image)
				.resize(RESIZE_SIZE, RESIZE_SIZE, {
					fit: "cover",
					position: "centre",
					withoutEnlargement: false,
				})
				.removeAlpha()
				.resize(INPUT_SIZE, INPUT_SIZE, {
					fit: "cover",
					position: "centre",
				})
				.raw()
				.toBuffer({ resolveWithObject: true });

			if (info.channels !== 3) {
				throw new Error("Image must have 3 channels (RGB)");
			}

			const tensor = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);
			for (let c = 0; c < 3; c += 1) {
				for (let h = 0; h < INPUT_SIZE; h += 1) {
					for (let w = 0; w < INPUT_SIZE; w += 1) {
						const pixelIndex = (h * INPUT_SIZE + w) * 3 + c;
						const tensorIndex =
							c * INPUT_SIZE * INPUT_SIZE + h * INPUT_SIZE + w;
						const value = data[pixelIndex] / 255.0;
						tensor[tensorIndex] = (value - IMAGENET_MEAN[c]) / IMAGENET_STD[c];
					}
				}
			}

			const inputTensor = new ort.Tensor("float32", tensor, [
				1,
				3,
				INPUT_SIZE,
				INPUT_SIZE,
			]);
			const inputName = this.session.inputNames[0];
			const feeds = { [inputName]: inputTensor };
			const results = await this.session.run(feeds);

			const metadata =
				(this.session.outputMetadata as unknown as Record<
					string,
					OutputMetadata | undefined
				>) ?? {};
			const outputName = selectOutputName(
				this.session.outputNames,
				metadata,
				!this.hasLoggedModelInfo,
			);
			const output = results[outputName];
			if (!output) {
				throw new Error("Unexpected model output format");
			}

			const embedding = l2Normalize(toFloat32Array(output.data));

			if (!this.hasLoggedModelInfo) {
				const dims = output.dims ?? metadata[outputName]?.dimensions;
				const dimText = dims ? dims.join("x") : "unknown";
				console.info("embedder_model_info", {
					model: this.modelSource,
					outputName,
					dimensions: dimText,
					length: embedding.length,
					outputs: this.session.outputNames,
				});
				if (embedding.length >= 900 && embedding.length <= 1100) {
					console.warn(
						`Embedding length ${embedding.length} looks like classification logits. Consider choosing a feature layer via EMBEDDING_OUTPUT_NAME.`,
					);
				}
				this.hasLoggedModelInfo = true;
			}
			return { embedding, version: ONNX_VERSION };
		} catch (err) {
			console.error("OnnxEmbedder error:", err);
			throw err;
		}
	}
}

export const createEmbedder = (): Embedder => {
	const useOnnx = process.env.USE_ONNX === "true";
	return useOnnx ? new OnnxEmbedder() : new DummyEmbedder();
};
