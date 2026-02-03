import { Label } from "../config";

export interface EvaluationRow {
	truth: Label;
	prediction: Label | "UNKNOWN";
}

export interface ConfusionMatrix {
	tp: number;
	tn: number;
	fp: number;
	fn: number;
	unknownDog: number;
	unknownNotDog: number;
}

export interface ClassificationMetrics {
	accuracy: number;
	precision: number;
	recall: number;
	f1: number;
	unknownRate: number;
	support: number;
	confusion: ConfusionMatrix;
}

const safeDivide = (numerator: number, denominator: number): number => {
	if (denominator === 0) return 0;
	return numerator / denominator;
};

export const computeMetrics = (
	rows: EvaluationRow[],
): ClassificationMetrics => {
	let tp = 0;
	let tn = 0;
	let fp = 0;
	let fn = 0;
	let unknownDog = 0;
	let unknownNotDog = 0;

	rows.forEach((row) => {
		if (row.prediction === "UNKNOWN") {
			if (row.truth === "DOG") {
				unknownDog += 1;
			} else {
				unknownNotDog += 1;
			}
			return;
		}

		if (row.truth === "DOG" && row.prediction === "DOG") tp += 1;
		else if (row.truth === "NOT_DOG" && row.prediction === "NOT_DOG") tn += 1;
		else if (row.truth === "DOG" && row.prediction === "NOT_DOG") fn += 1;
		else if (row.truth === "NOT_DOG" && row.prediction === "DOG") fp += 1;
	});

	const support = rows.length;
	const precision = safeDivide(tp, tp + fp);
	const recall = safeDivide(tp, tp + fn);
	const f1 = safeDivide(2 * precision * recall, precision + recall);
	const accuracy = safeDivide(tp + tn, support);
	const unknown = unknownDog + unknownNotDog;
	const unknownRate = safeDivide(unknown, support);

	return {
		accuracy,
		precision,
		recall,
		f1,
		unknownRate,
		support,
		confusion: { tp, tn, fp, fn, unknownDog, unknownNotDog },
	};
};
