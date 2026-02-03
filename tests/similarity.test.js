"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const similarity_1 = require("../lib/similarity");
describe("similarity utils", () => {
	test("cosineSimilarity and knn basic case", () => {
		const a = new Float32Array([1, 0]);
		const b = new Float32Array([0, 1]);
		const c = new Float32Array([1, 1]);
		expect((0, similarity_1.cosineSimilarity)(a, a)).toBeCloseTo(1);
		expect((0, similarity_1.cosineSimilarity)(a, b)).toBeCloseTo(0);
		const samples = [
			{ id: "1", label: "DOG", embedding: a },
			{ id: "2", label: "NOT_DOG", embedding: b },
			{ id: "3", label: "DOG", embedding: c },
		];
		const neighbors = (0, similarity_1.knn)(c, samples, 2);
		expect(neighbors).toHaveLength(2);
		expect(neighbors[0].id).toBe("3");
		expect(neighbors[1].id).toBe("1");
	});
});
