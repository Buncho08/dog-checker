import { cosineSimilarity, knn } from "../lib/similarity";
import { Label } from "../lib/config";

describe("similarity utils", () => {
	test("cosineSimilarity and knn basic case", () => {
		const a = new Float32Array([1, 0]);
		const b = new Float32Array([0, 1]);
		const c = new Float32Array([1, 1]);

		expect(cosineSimilarity(a, a)).toBeCloseTo(1);
		expect(cosineSimilarity(a, b)).toBeCloseTo(0);

		const samples = [
			{ id: "1", label: "DOG" as Label, embedding: a },
			{ id: "2", label: "NOT_DOG" as Label, embedding: b },
			{ id: "3", label: "DOG" as Label, embedding: c },
		];

		const neighbors = knn(c, samples, 2);
		expect(neighbors).toHaveLength(2);
		expect(neighbors[0].id).toBe("3");
		expect(neighbors[1].id).toBe("1");
	});
});
