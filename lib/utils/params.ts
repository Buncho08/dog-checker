import { AppConfig } from "../config";
import { DecisionParams } from "./decideLabel";

export interface RuntimeDecisionParams extends DecisionParams {
	topK: number;
}

const parseNumberParam = (value: string | null): number | undefined => {
	if (value === null) return undefined;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return undefined;
	return parsed;
};

const positiveOrFallback = (
	value: number | undefined,
	fallback: number,
): number => {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) {
		return value;
	}
	return fallback;
};

const clamp01 = (value: number, fallback: number): number => {
	if (!Number.isFinite(value)) return fallback;
	return Math.min(1, Math.max(0, value));
};

const clampWithin = (value: number, min: number, max: number): number => {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, value));
};

export const deriveRuntimeParams = (
	config: AppConfig,
	searchParams?: URLSearchParams,
): RuntimeDecisionParams => {
	const params = searchParams ?? new URLSearchParams();
	const rawTopK = positiveOrFallback(
		parseNumberParam(params.get("topK")) ?? parseNumberParam(params.get("k")),
		config.topK,
	);
	const topK = clampWithin(rawTopK, 1, config.maxTopK);

	return {
		topK,
		pThreshold: clamp01(
			parseNumberParam(params.get("pThreshold")) ?? config.pThreshold,
			config.pThreshold,
		),
		minTopSim: clamp01(
			parseNumberParam(params.get("minTopSim")) ?? config.minTopSim,
			config.minTopSim,
		),
		temperature: positiveOrFallback(
			parseNumberParam(params.get("temperature")),
			config.temperature,
		),
		minNeighbors: positiveOrFallback(
			parseNumberParam(params.get("minNeighbors")),
			config.minNeighbors,
		),
	};
};
