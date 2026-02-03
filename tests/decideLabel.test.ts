import { describe, expect, it } from "vitest";
import { decideLabel, DecisionParams } from "../lib/utils/decideLabel";
import { Neighbor } from "../lib/similarity";

const baseParams: DecisionParams = {
	pThreshold: 0.6,
	minTopSim: 0.2,
	temperature: 0.1,
	minNeighbors: 2,
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
		expect(decision.pDog).toBeGreaterThan(0.6);
		expect(decision.score).toBeCloseTo(decision.pDog);
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
		expect(decision.score).toBeGreaterThanOrEqual(0.6);
	});
});
