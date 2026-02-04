import { Label } from "./config";

export interface DbSample {
	id: string;
	label: Label;
	embedding: Float32Array;
	embedderVersion: string;
	imageUrl?: string | null;
	createdAt: number;
}

export interface DbStats {
	dogCount: number;
	notDogCount: number;
	total: number;
}

export interface SqlExecutor {
	query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
}

let pool: any = null;

const getPool = () => {
	if (!pool) {
		const connectionString = process.env.DATABASE_URL;
		if (!connectionString) {
			throw new Error("DATABASE_URL is not set");
		}
		// 接続文字列の基本的な検証
		if (
			!connectionString.startsWith("postgres://") &&
			!connectionString.startsWith("postgresql://")
		) {
			throw new Error(
				"DATABASE_URL must be a valid PostgreSQL connection string",
			);
		}
		// Use pg for local development, @neondatabase/serverless for production
		if (connectionString.startsWith("postgres://")) {
			const { Pool } = require("pg");
			pool = new Pool({ connectionString });
		} else {
			const { Pool } = require("@neondatabase/serverless");
			pool = new Pool({ connectionString });
		}
	}
	return pool;
};

const defaultExecutor: SqlExecutor = {
	query: (text, params = []) => getPool().query(text, params),
};

const initialized = new WeakSet<object>();

const ensureInitialized = async (executor: SqlExecutor): Promise<void> => {
	const key = executor as unknown as object;
	if (initialized.has(key)) {
		return;
	}
	await initDb(executor);
	initialized.add(key);
};

export const initDb = async (
	executor: SqlExecutor = defaultExecutor,
): Promise<void> => {
	await executor.query(`
    CREATE TABLE IF NOT EXISTS training_samples (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      embedding JSONB NOT NULL,
      embedder_version TEXT NOT NULL,
	  image_url TEXT,
      created_at BIGINT NOT NULL
    );
  `);
	await executor.query(
		"ALTER TABLE training_samples ADD COLUMN IF NOT EXISTS image_url TEXT;",
	);
	await executor.query(
		"CREATE INDEX IF NOT EXISTS idx_training_samples_label ON training_samples(label);",
	);
	await executor.query(
		"CREATE INDEX IF NOT EXISTS idx_training_samples_version ON training_samples(embedder_version);",
	);
};

export const insertSample = async (
	sample: Omit<DbSample, "createdAt">,
	executor: SqlExecutor = defaultExecutor,
): Promise<void> => {
	await ensureInitialized(executor);
	const createdAt = Date.now();
	const embedding = Array.from(sample.embedding);
	await executor.query(
		`INSERT INTO training_samples (id, label, embedding, embedder_version, image_url, created_at)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6)`,
		[
			sample.id,
			sample.label,
			JSON.stringify(embedding),
			sample.embedderVersion,
			sample.imageUrl ?? null,
			createdAt,
		],
	);
};

export const fetchAllSamples = async (
	executor: SqlExecutor = defaultExecutor,
): Promise<DbSample[]> => {
	await ensureInitialized(executor);
	const result = await executor.query(
		' SELECT id, label, embedding, embedder_version as "embedderVersion", image_url as "imageUrl", created_at as "createdAt" FROM training_samples',
	);

	return result.rows.map((row) => ({
		id: row.id as string,
		label: row.label as Label,
		embedding: deserializeEmbedding(row.embedding),
		embedderVersion: row.embedderVersion as string,
		imageUrl: row.imageUrl as string | null,
		createdAt: Number(row.createdAt),
	}));
};

export const fetchSamplesByVersion = async (
	version: string,
	executor: SqlExecutor = defaultExecutor,
): Promise<DbSample[]> => {
	await ensureInitialized(executor);
	const result = await executor.query(
		' SELECT id, label, embedding, embedder_version as "embedderVersion", image_url as "imageUrl", created_at as "createdAt" FROM training_samples WHERE embedder_version = $1',
		[version],
	);

	return result.rows.map((row) => ({
		id: row.id as string,
		label: row.label as Label,
		embedding: deserializeEmbedding(row.embedding),
		embedderVersion: row.embedderVersion as string,
		imageUrl: row.imageUrl as string | null,
		createdAt: Number(row.createdAt),
	}));
};

export const getStats = async (
	executor: SqlExecutor = defaultExecutor,
): Promise<DbStats> => {
	await ensureInitialized(executor);
	const result = await executor.query(
		`SELECT
       SUM(CASE WHEN label = 'DOG' THEN 1 ELSE 0 END) AS "dogCount",
       SUM(CASE WHEN label = 'NOT_DOG' THEN 1 ELSE 0 END) AS "notDogCount",
       COUNT(*) AS total
     FROM training_samples`,
	);
	const row = result.rows[0] as
		| {
				dogCount: number | null;
				notDogCount: number | null;
				total: number | null;
		  }
		| undefined;

	return {
		dogCount: Number(row?.dogCount ?? 0),
		notDogCount: Number(row?.notDogCount ?? 0),
		total: Number(row?.total ?? 0),
	};
};

export const getVoteScores = async (
	executor: SqlExecutor = defaultExecutor,
): Promise<Map<string, number>> => {
	await ensureInitialized(executor);
	const result = await executor.query(
		"SELECT sample_id, COALESCE(SUM(vote), 0) as score FROM sample_votes GROUP BY sample_id",
	);
	const scores = new Map<string, number>();
	result.rows.forEach((row: { sample_id: string; score: number }) => {
		scores.set(row.sample_id, Number(row.score));
	});
	return scores;
};

export const createDb = (executor?: SqlExecutor) => ({
	initDb: () => initDb(executor),
	insertSample: (sample: Omit<DbSample, "createdAt">) =>
		insertSample(sample, executor),
	fetchAllSamples: () => fetchAllSamples(executor),
	fetchSamplesByVersion: (version: string) =>
		fetchSamplesByVersion(version, executor),
	getStats: () => getStats(executor),
	getVoteScores: () => getVoteScores(executor),
	query: (text: string, params?: unknown[]) =>
		(executor ?? defaultExecutor).query(text, params ?? []),
});

const deserializeEmbedding = (value: unknown): Float32Array => {
	if (Array.isArray(value)) {
		return new Float32Array(value.map((v) => Number(v)));
	}
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value) as number[];
			if (!Array.isArray(parsed)) {
				throw new Error("Embedding JSON is not an array");
			}
			return new Float32Array(parsed.map((v) => Number(v)));
		} catch {
			throw new Error("Failed to parse embedding JSON");
		}
	}
	throw new Error("Unsupported embedding format");
};
