import path from "path";

export type Label = "DOG" | "NOT_DOG";

export interface AppConfig {
	port: number;
	dbPath: string;
	topK: number;
	maxTopK: number;
	pThreshold: number;
	minTopSim: number;
	temperature: number;
	minNeighbors: number;
	maxEvalSamples: number;
}

const parseNumber = (value: string | undefined, fallback: number): number => {
	const parsed = Number(value);
	if (Number.isFinite(parsed)) {
		return parsed;
	}
	return fallback;
};

export const createConfig = (
	env: NodeJS.ProcessEnv = process.env,
): AppConfig => ({
	port: parseNumber(env.PORT, 3000),
	dbPath: path.resolve(process.cwd(), env.DB_PATH ?? "data/app.db"),
	topK: parseNumber(env.TOP_K ?? env.K, 5),
	maxTopK: Math.max(1, parseNumber(env.MAX_TOP_K ?? env.MAX_TOPK, 50)),
	pThreshold: parseNumber(env.P_THRESHOLD ?? env.THRESHOLD, 0.65),
	minTopSim: parseNumber(env.MIN_TOP_SIM, 0.25),
	temperature: parseNumber(env.TEMPERATURE, 0.1),
	minNeighbors: parseNumber(env.MIN_NEIGHBORS, 2),
	maxEvalSamples: Math.max(1, parseNumber(env.MAX_EVAL_SAMPLES, 800)),
});

export const config = createConfig();
