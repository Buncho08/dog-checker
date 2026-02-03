import { NextResponse } from "next/server";
import { randomAnimal } from "../../../../lib/animalsApi";

const corsHeaders = {
	"Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
	"Access-Control-Allow-Methods": "GET,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export const dynamic = "force-dynamic";

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
	try {
		const result = await randomAnimal();
		return NextResponse.json(result, {
			headers: {
				...corsHeaders,
				'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
			},
		});
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "failed to fetch random animal" },
			{ status: 500, headers: corsHeaders },
		);
	}
}
``;
