import { describe, expect, it } from "vitest";
import { createEmbedder, DummyEmbedder } from "../lib/embedding/embedder";

const restoreEnv = (key: string, value: string | undefined) => {
	if (typeof value === "undefined") {
		delete process.env[key];
	} else {
		process.env[key] = value;
	}
};

describe("embedding", () => {
	it("DummyEmbedder produces deterministic 128-dim embedding", async () => {
		const embedder = new DummyEmbedder();
		const input = Buffer.from([1, 2, 3]);
		const a = await embedder.embed(input);
		const b = await embedder.embed(input);

		expect(a.embedding.length).toBe(128);
		expect(a.version).toBe("dummy-v1");
		expect(Array.from(a.embedding)).toEqual(Array.from(b.embedding));
	});

	it("createEmbedder uses Dummy when USE_ONNX is false", () => {
		const prev = process.env.USE_ONNX;
		restoreEnv("USE_ONNX", "false");
		const embedder = createEmbedder();
		expect(embedder).toBeInstanceOf(DummyEmbedder);
		restoreEnv("USE_ONNX", prev);
	});
});
