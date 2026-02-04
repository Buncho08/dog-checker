import { NextResponse } from "next/server";
import { createDb } from "../../../lib/db";

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
        const db = createDb();
        const result = await db.query(
            "SELECT DISTINCT label FROM training_samples ORDER BY label",
        );
        const labels = result.rows.map((row: { label: string }) => row.label);
        return NextResponse.json(
            { labels },
            {
                headers: {
                    ...corsHeaders,
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
                },
            },
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "internal error" },
            { status: 500, headers: corsHeaders },
        );
    }
}
