import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createEmbedder } from "../../../lib/embedding/embedder";
import { insertSample } from "../../../lib/db";
import { isLabel } from "../../../lib/utils/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const corsHeaders = {
	"Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
	"Access-Control-Allow-Methods": "POST,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const embedder = createEmbedder();

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const image = formData.get("image");
		const labelRaw = formData.get("label");

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
		if (typeof labelRaw !== "string" || !isLabel(labelRaw)) {
			return NextResponse.json(
				{ error: "label must be DOG or NOT_DOG" },
				{ status: 400, headers: corsHeaders },
			);
		}

		const buffer = Buffer.from(await image.arrayBuffer());
		const { embedding, version } = await embedder.embed(buffer);

		const id = randomUUID();
		await insertSample({
			id,
			label: labelRaw,
			embedding,
			embedderVersion: version,
		});

		return NextResponse.json(
			{
				id,
				label: labelRaw,
				embedderVersion: version,
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
