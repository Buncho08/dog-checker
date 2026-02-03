import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createDb } from "../lib/db";

const createTestDb = () => {
	return createDb();
};

describe("db", () => {
	beforeAll(async () => {
		// Clean up test data
		const db = createTestDb();
		await db.initDb();
		try {
			await db.query(
				"DELETE FROM training_samples WHERE embedder_version = 'test-v1'",
			);
		} catch (e) {
			// Table might not exist yet
		}
	});

	it("insert/fetch/stats works", async () => {
		const db = createTestDb();
		await db.initDb();

		await db.insertSample({
			id: "test-1",
			label: "DOG",
			embedding: new Float32Array([0.1, 0.2]),
			embedderVersion: "test-v1",
		});

		await db.insertSample({
			id: "test-2",
			label: "NOT_DOG",
			embedding: new Float32Array([0.3, 0.4]),
			embedderVersion: "test-v1",
		});

		const all = await db.fetchAllSamples();
		const testSamples = all.filter((s) => s.embedderVersion === "test-v1");
		expect(testSamples).toHaveLength(2);
		expect(testSamples[0].imageUrl).toBeNull();

		const byVersion = await db.fetchSamplesByVersion("test-v1");
		expect(byVersion).toHaveLength(2);

		const stats = await db.getStats();
		expect(stats.dogCount).toBeGreaterThanOrEqual(1);
		expect(stats.notDogCount).toBeGreaterThanOrEqual(1);
		expect(stats.total).toBeGreaterThanOrEqual(2);
	});
});
