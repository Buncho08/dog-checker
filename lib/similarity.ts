import { Label } from "./config";

export interface Neighbor {
	id: string;
	label: Label;
	sim: number;
}

export interface SampleLike {
	id: string;
	label: Label;
	embedding: Float32Array;
}

export const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
	if (a.length !== b.length) {
		throw new Error("Vector dimensions must match");
	}
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i++) {
		const va = a[i];
		const vb = b[i];
		dot += va * vb;
		normA += va * va;
		normB += vb * vb;
	}
	if (normA === 0 || normB === 0) {
		return 0;
	}
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const knn = (
	query: Float32Array,
	samples: SampleLike[],
	k: number,
	voteScores?: Map<string, number>,
	voteWeight: number = 0.08, // 投票の影響度（小さく設定）
): Neighbor[] => {
	const neighbors = samples.map((s) => {
		const baseSim = cosineSimilarity(query, s.embedding);
		// 投票スコアによる補正を追加（-10～+10の範囲を想定し、0.01刻みで影響）
		const voteBoost = voteScores
			? (voteScores.get(s.id) || 0) * voteWeight
			: 0;
		// 類似度は0～1の範囲なので、補正も小さく保つ
		const adjustedSim = Math.max(0, Math.min(1, baseSim + voteBoost));

		return {
			id: s.id,
			label: s.label,
			sim: adjustedSim,
		};
	});

	neighbors.sort((a, b) => b.sim - a.sim);
	return neighbors.slice(0, Math.max(0, k));
};
