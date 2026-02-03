import { Label } from "../config";
import { Neighbor } from "../similarity";

export interface DecisionParams {
	pThreshold: number;
	minTopSim: number;
	temperature: number;
	minNeighbors: number;
}

export interface DecisionResult {
	label: Label | "UNKNOWN";
	score: number;
	pDog: number;
	topSim: number;
}

export const decideLabel = (
	neighbors: Neighbor[],
	params: DecisionParams,
): DecisionResult => {
	const topSim = neighbors[0]?.sim ?? 0;
	if (neighbors.length === 0) {
		return { label: "UNKNOWN", score: 0, pDog: 0.5, topSim };
	}

	if (neighbors.length < params.minNeighbors) {
		return { label: "UNKNOWN", score: 0, pDog: 0.5, topSim };
	}

	if (topSim < params.minTopSim) {
		return { label: "UNKNOWN", score: 0, pDog: 0.5, topSim };
	}

	const safeTemp = Math.max(params.temperature, 0.01);
	const logWeights = neighbors.map((n) => n.sim / safeTemp);
	const maxLogit = Math.max(...logWeights);

	let dogWeight = 0;
	let notDogWeight = 0;
	let totalWeight = 0;

	neighbors.forEach((n, idx) => {
		const weight = Number.isFinite(logWeights[idx])
			? Math.exp(logWeights[idx] - maxLogit)
			: 0;
		totalWeight += weight;
		if (n.label === "DOG") {
			dogWeight += weight;
		} else {
			notDogWeight += weight;
		}
	});

	const pDog = totalWeight > 0 ? dogWeight / totalWeight : 0.5;
	const pNotDog = totalWeight > 0 ? notDogWeight / totalWeight : 0.5;

	let label: Label | "UNKNOWN" = "UNKNOWN";
	if (pDog >= params.pThreshold) {
		label = "DOG";
	} else if (pNotDog >= params.pThreshold) {
		label = "NOT_DOG";
	}

	const score = Math.max(pDog, pNotDog);
	return { label, score, pDog, topSim };
};
