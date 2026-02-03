import { NextResponse } from "next/server";
import { fetchAllSamples } from "../../../lib/db";
import { config } from "../../../lib/config";
import { knn } from "../../../lib/similarity";
import { decideLabel } from "../../../lib/utils/decideLabel";
import { deriveRuntimeParams } from "../../../lib/utils/params";
import { computeMetrics } from "../../../lib/utils/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
	"Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
	"Access-Control-Allow-Methods": "GET,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const params = deriveRuntimeParams(config, url.searchParams);
		const { topK, ...decisionParams } = params;
		const versionOverride = url.searchParams.get("version");

		const allSamples = await fetchAllSamples();
		if (allSamples.length === 0) {
			return NextResponse.json(
				{ error: "no samples available" },
				{ status: 400, headers: corsHeaders },
			);
		}

		const targetVersion =
			versionOverride ?? allSamples[0]?.embedderVersion ?? "unknown";
		const samples = allSamples.filter(
			(s) => s.embedderVersion === targetVersion,
		);
		if (samples.length === 0) {
			return NextResponse.json(
				{ error: `no samples for version ${targetVersion}` },
				{ status: 400, headers: corsHeaders },
			);
		}

		if (samples.length > config.maxEvalSamples) {
			return NextResponse.json(
				{
					error: `sample count ${samples.length} exceeds evaluation limit ${config.maxEvalSamples}`,
					note: "reduce dataset size or raise MAX_EVAL_SAMPLES cautiously",
				},
				{ status: 413, headers: corsHeaders },
			);
		}

		const evaluations = samples.map((sample) => {
			const neighbors = knn(
				sample.embedding,
				samples.filter((s) => s.id !== sample.id),
				topK,
			);
			const decision = decideLabel(neighbors, decisionParams);
			return {
				id: sample.id,
				truth: sample.label,
				prediction: decision.label,
				pDog: decision.pDog,
				topSim: decision.topSim,
				neighbors: neighbors.slice(0, 3).map((n) => ({
					id: n.id,
					label: n.label,
					sim: n.sim,
				})),
			};
		});

		const metrics = computeMetrics(
			evaluations.map((e) => ({ truth: e.truth, prediction: e.prediction })),
		);

		console.info("evaluate_summary", {
			version: targetVersion,
			sampleCount: samples.length,
			params,
			metrics,
		});

		return NextResponse.json(
			{
				version: targetVersion,
				sampleCount: samples.length,
				params,
				metrics,
				examples: evaluations.slice(0, 50),
			},
			{ headers: corsHeaders },
		);
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "internal error" },
			{ status: 500, headers: corsHeaders },
		);
	}
}
