import { NextResponse } from "next/server";
import { fetchAllSamples } from "../../../lib/db";

const corsHeaders = {
	"Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
	"Access-Control-Allow-Methods": "GET,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const samples = await fetchAllSamples();
		return NextResponse.json(
			samples.map((s) => ({
				id: s.id,
				label: s.label,
				embedderVersion: s.embedderVersion,
				createdAt: new Date(s.createdAt).toISOString(),
			})),
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
