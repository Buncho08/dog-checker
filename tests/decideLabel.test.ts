import { describe, expect, it } from "vitest";
import { decideLabel, DecisionParams } from "../lib/utils/decideLabel";
import { Neighbor } from "../lib/similarity";

const baseParams: DecisionParams = {
	pThreshold: 0.5,
	minTopSim: 0.2,
	temperature: 0.1,
	minNeighbors: 2,
	minMargin: 0.15,
};

describe("decideLabel", () => {
	it("returns DOG when softmax vote is strong", () => {
		const neighbors: Neighbor[] = [
			{ id: "a", label: "DOG", sim: 0.9 },
			{ id: "b", label: "NOT_DOG", sim: 0.2 },
			{ id: "c", label: "DOG", sim: 0.85 },
		];

		const decision = decideLabel(neighbors, baseParams);
		expect(decision.label).toBe("DOG");
		expect(decision.pDog).toBeGreaterThan(0.5);
		expect(decision.score).toBeCloseTo(decision.pDog, 1);
	});

	it("returns UNKNOWN when similarity is too low", () => {
		const neighbors: Neighbor[] = [
			{ id: "a", label: "DOG", sim: 0.05 },
			{ id: "b", label: "NOT_DOG", sim: 0.02 },
		];
		const decision = decideLabel(neighbors, baseParams);
		expect(decision.label).toBe("UNKNOWN");
		expect(decision.score).toBe(0);
		expect(decision.pDog).toBeCloseTo(0.5);
	});

	it("requires minimum neighbors", () => {
		const neighbors: Neighbor[] = [{ id: "a", label: "DOG", sim: 0.9 }];
		const decision = decideLabel(neighbors, baseParams);
		expect(decision.label).toBe("UNKNOWN");
	});

	it("returns NOT_DOG when negative vote dominates", () => {
		const neighbors: Neighbor[] = [
			{ id: "a", label: "NOT_DOG", sim: 0.92 },
			{ id: "b", label: "NOT_DOG", sim: 0.75 },
			{ id: "c", label: "DOG", sim: 0.3 },
		];
		const decision = decideLabel(neighbors, baseParams);
		expect(decision.label).toBe("NOT_DOG");
		expect(decision.score).toBeGreaterThanOrEqual(0.5);
	});

	it("returns UNKNOWN when scores are close (margin too small)", () => {
		const neighbors: Neighbor[] = [
			{ id: "a", label: "DOG", sim: 0.6 },
			{ id: "b", label: "NOT_DOG", sim: 0.59 },
			{ id: "c", label: "DOG", sim: 0.58 },
			{ id: "d", label: "NOT_DOG", sim: 0.57 },
		];
		const decision = decideLabel(neighbors, baseParams);
		// スコアは50%超えるが、差が小さいのでUNKNOWN
		expect(decision.label).toBe("UNKNOWN");
		expect(decision.score).toBeGreaterThan(0.5);
	});

	it("returns UNKNOWN when max score is below threshold", () => {
		const neighbors: Neighbor[] = [
			{ id: "a", label: "DOG", sim: 0.4 },
			{ id: "b", label: "NOT_DOG", sim: 0.38 },
			{ id: "c", label: "CAT", sim: 0.35 },
		];
		const decision = decideLabel(neighbors, baseParams);
		// どれも50%未満なのでUNKNOWN
		expect(decision.label).toBe("UNKNOWN");
	});

	it("supports custom labels - returns CAT when it has highest probability", () => {
		const neighbors: Neighbor[] = [
			{ id: "a", label: "CAT", sim: 0.95 },
			{ id: "b", label: "CAT", sim: 0.88 },
			{ id: "c", label: "DOG", sim: 0.3 },
			{ id: "d", label: "NOT_DOG", sim: 0.25 },
		];
		const decision = decideLabel(neighbors, baseParams);
		expect(decision.label).toBe("CAT");
		expect(decision.score).toBeGreaterThan(0.5);
	});

	it("supports multi-class classification with various custom labels", () => {
		const neighbors: Neighbor[] = [
			{ id: "a", label: "BIRD", sim: 0.8 },
			{ id: "b", label: "BIRD", sim: 0.75 },
			{ id: "c", label: "CAT", sim: 0.4 },
			{ id: "d", label: "DOG", sim: 0.3 },
		];
		const decision = decideLabel(neighbors, baseParams);
		expect(decision.label).toBe("BIRD");
		expect(decision.labelProbs).toBeDefined();
		expect(decision.labelProbs?.BIRD).toBeGreaterThan(decision.labelProbs?.CAT || 0);
	});

	it("returns UNKNOWN when no label reaches threshold with custom labels", () => {
		const neighbors: Neighbor[] = [
			{ id: "a", label: "CAT", sim: 0.5 },
			{ id: "b", label: "DOG", sim: 0.48 },
			{ id: "c", label: "BIRD", sim: 0.46 },
		];
		const decision = decideLabel(neighbors, baseParams);
		expect(decision.label).toBe("UNKNOWN");
	});
});
