import { Label } from "../config";
import { Neighbor } from "../similarity";

export interface DecisionParams {
	pThreshold: number;
	minTopSim: number;
	temperature: number;
	minNeighbors: number;
	minMargin?: number; // 1位と2位の最小確率差（相対的優位性）
}

export interface DecisionResult {
	label: string;
	score: number;
	pDog: number; // 後方互換性のため維持（選択されたラベルの確率を返す）
	topSim: number;
	labelProbs?: Record<string, number>; // 各ラベルの確率分布（デバッグ用）
}

/**
 * 多クラス分類対応の判定アルゴリズム
 * 近傍データから重み付き投票を行い、最も確率の高いラベルを返す
 */
export const decideLabel = (
	neighbors: Neighbor[],
	params: DecisionParams,
): DecisionResult => {
	const topSim = neighbors[0]?.sim ?? 0;

	// 近傍データがない場合
	if (neighbors.length === 0) {
		return { label: "UNKNOWN", score: 0, pDog: 0.5, topSim };
	}

	// 最小近傍数チェック
	if (neighbors.length < params.minNeighbors) {
		return { label: "UNKNOWN", score: 0, pDog: 0.5, topSim };
	}

	// 最小類似度チェック
	if (topSim < params.minTopSim) {
		return { label: "UNKNOWN", score: 0, pDog: 0.5, topSim };
	}

	// 温度パラメータで重み付き投票
	const safeTemp = Math.max(params.temperature, 0.01);
	const logWeights = neighbors.map((n) => n.sim / safeTemp);
	const maxLogit = Math.max(...logWeights);

	// 各ラベルの重みを集計
	const labelWeights: Record<string, number> = {};
	let totalWeight = 0;

	neighbors.forEach((n, idx) => {
		const weight = Number.isFinite(logWeights[idx])
			? Math.exp(logWeights[idx] - maxLogit)
			: 0;
		totalWeight += weight;
		labelWeights[n.label] = (labelWeights[n.label] || 0) + weight;
	});

	// 各ラベルの確率を計算
	const labelProbs: Record<string, number> = {};
	const probsList: Array<{ label: string; prob: number }> = [];

	Object.entries(labelWeights).forEach(([label, weight]) => {
		const prob = totalWeight > 0 ? weight / totalWeight : 0;
		labelProbs[label] = prob;
		probsList.push({ label, prob });
	});

	// 確率順にソート
	probsList.sort((a, b) => b.prob - a.prob);

	const maxProb = probsList[0]?.prob ?? 0;
	const secondProb = probsList[1]?.prob ?? 0;
	const bestLabel = probsList[0]?.label ?? "UNKNOWN";
	const margin = maxProb - secondProb;

	// 判定条件：
	// 1. 最大確率がしきい値を超える
	// 2. minMarginが設定されている場合、1位と2位の差が十分にある
	const minMargin = params.minMargin ?? 0;
	const meetsThreshold = maxProb >= params.pThreshold;
	const meetsMargin = margin >= minMargin;

	const finalLabel = meetsThreshold && meetsMargin ? bestLabel : "UNKNOWN";

	// pDog: 後方互換性のため、DOGの確率を返す（存在しない場合は選択されたラベルの確率）
	const pDog = labelProbs["DOG"] ?? maxProb;

	// デバッグ用ログ（開発環境のみ）
	if (process.env.NODE_ENV !== "production") {
		console.log("🔍 Decision Debug:", {
			neighbors: neighbors.map((n) => ({ label: n.label, sim: n.sim.toFixed(3) })),
			labelProbs: Object.fromEntries(
				Object.entries(labelProbs).map(([k, v]) => [k, v.toFixed(3)])
			),
			topTwo: probsList.slice(0, 2).map(p => ({ label: p.label, prob: p.prob.toFixed(3) })),
			margin: margin.toFixed(3),
			bestLabel,
			maxProb: maxProb.toFixed(3),
			finalLabel,
			threshold: params.pThreshold,
			minMargin,
			meetsThreshold,
			meetsMargin,
		});
	}

	return {
		label: finalLabel,
		score: maxProb,
		pDog,
		topSim,
		labelProbs,
	};
};
