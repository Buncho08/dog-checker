import { NextResponse } from "next/server";
import { createEmbedder } from "../../../lib/embedding/embedder";
import { fetchSamplesByVersion } from "../../../lib/db";
import { knn } from "../../../lib/similarity";
import { config } from "../../../lib/config";
import { decideLabel } from "../../../lib/utils/decideLabel";
import { deriveRuntimeParams } from "../../../lib/utils/params";
import { isLabel } from "../../../lib/utils/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
	"Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
	"Access-Control-Allow-Methods": "POST,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_SAMPLES_FOR_KNN = 100000; // kNN計算の最大サンプル数

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const embedder = createEmbedder();

export async function POST(req: Request) {
	try {
		const url = new URL(req.url);
		const runtimeParams = deriveRuntimeParams(config, url.searchParams);
		const { topK, ...decisionParams } = runtimeParams;

		const formData = await req.formData();
		const image = formData.get("image");
		const trueLabelRaw = formData.get("trueLabel");
		const trueLabel =
			typeof trueLabelRaw === "string" && isLabel(trueLabelRaw)
				? trueLabelRaw
				: undefined;
		if (!(image instanceof File)) {
			return NextResponse.json(
				{ error: "image is required" },
				{ status: 400, headers: corsHeaders },
			);
		}
		if (image.size > MAX_IMAGE_SIZE) {
			return NextResponse.json(
				{ error: "image too large (max 10MB)" },
				{ status: 413, headers: corsHeaders },
			);
		}

		const buffer = Buffer.from(await image.arrayBuffer());
		const { embedding, version } = await embedder.embed(buffer);
		const samples = await fetchSamplesByVersion(version);

		if (samples.length > MAX_SAMPLES_FOR_KNN) {
			console.warn(
				`Sample count (${samples.length}) exceeds recommended limit (${MAX_SAMPLES_FOR_KNN})`,
			);
		}

		const neighbors = knn(embedding, samples, topK);
		const decision = decideLabel(neighbors, decisionParams);

		console.info("predict_decision", {
			predicted: decision.label,
			pDog: Number(decision.pDog.toFixed(4)),
			score: Number(decision.score.toFixed(4)),
			topSim: Number(decision.topSim.toFixed(4)),
			params: runtimeParams,
			trueLabel,
			neighbors: neighbors.slice(0, 3).map((n) => ({
				id: n.id,
				label: n.label,
				sim: Number(n.sim.toFixed(4)),
			})),
		});

		return NextResponse.json(
			{
				label: decision.label,
				score: decision.score,
				pDog: decision.pDog,
				neighbors,
				embedderVersion: version,
				sampleCount: samples.length,
				params: runtimeParams,
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
