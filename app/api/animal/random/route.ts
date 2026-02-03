import { NextResponse } from "next/server";
import { randomAnimal } from "../../../../lib/animalsApi";

const corsHeaders = {
	"Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
	"Access-Control-Allow-Methods": "GET,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
	try {
		const result = await randomAnimal();
		return NextResponse.json(result, {
			headers: {
				...corsHeaders,
				'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
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
