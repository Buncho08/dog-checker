import { NextRequest, NextResponse } from "next/server";
import { createDb } from "../../../lib/db";
import crypto from "crypto";

const corsHeaders = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ユーザー識別用のIDを生成（IP + User-Agent のハッシュ）
function getVoterId(req: NextRequest): string {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const combined = `${ip}:${userAgent}`;
    return crypto.createHash("sha256").update(combined).digest("hex");
}

// GET: サンプルごとの投票数を取得
export async function GET(req: NextRequest) {
    try {
        const db = createDb();
        const url = new URL(req.url);
        const sampleId = url.searchParams.get("sampleId");

        if (sampleId) {
            // 特定サンプルの投票情報
            const result = await db.query(
                "SELECT COALESCE(SUM(vote), 0) as score FROM sample_votes WHERE sample_id = $1",
                [sampleId],
            );
            const score = Number(result.rows[0]?.score ?? 0);

            const voterId = getVoterId(req);
            const userVoteResult = await db.query(
                "SELECT vote FROM sample_votes WHERE sample_id = $1 AND voter_id = $2",
                [sampleId, voterId],
            );
            const userVote = userVoteResult.rows[0]?.vote ?? null;

            return NextResponse.json(
                { sampleId, score, userVote },
                { headers: corsHeaders },
            );
        } else {
            // 全サンプルの投票数
            const result = await db.query(
                "SELECT sample_id, COALESCE(SUM(vote), 0) as score FROM sample_votes GROUP BY sample_id",
            );
            const votes: Record<string, number> = {};
            result.rows.forEach((row: { sample_id: string; score: number }) => {
                votes[row.sample_id] = Number(row.score);
            });

            return NextResponse.json(
                { votes },
                {
                    headers: {
                        ...corsHeaders,
                        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
                    },
                },
            );
        }
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "internal error" },
            { status: 500, headers: corsHeaders },
        );
    }
}

// POST: 投票を登録
export async function POST(req: NextRequest) {
    try {
        const db = createDb();
        const body = await req.json();
        const { sampleId, vote } = body;

        if (!sampleId || typeof sampleId !== "string") {
            return NextResponse.json(
                { error: "sampleId is required" },
                { status: 400, headers: corsHeaders },
            );
        }

        if (vote !== 1 && vote !== -1) {
            return NextResponse.json(
                { error: "vote must be 1 or -1" },
                { status: 400, headers: corsHeaders },
            );
        }

        const voterId = getVoterId(req);
        const createdAt = Date.now();

        // 既存の投票を確認
        const existingVote = await db.query(
            "SELECT vote FROM sample_votes WHERE sample_id = $1 AND voter_id = $2",
            [sampleId, voterId],
        );

        let newUserVote: number | null = vote;

        // 同じ投票をクリックした場合は削除
        if (existingVote.rows[0]?.vote === vote) {
            await db.query(
                "DELETE FROM sample_votes WHERE sample_id = $1 AND voter_id = $2",
                [sampleId, voterId],
            );
            newUserVote = null;
        } else {
            // 異なる投票またはまだ投票していない場合はUPSERT
            await db.query(
                `INSERT INTO sample_votes (sample_id, vote, voter_id, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (sample_id, voter_id)
         DO UPDATE SET vote = $2, created_at = $4`,
                [sampleId, vote, voterId, createdAt],
            );
        }

        // 現在のスコアを取得
        const result = await db.query(
            "SELECT COALESCE(SUM(vote), 0) as score FROM sample_votes WHERE sample_id = $1",
            [sampleId],
        );
        const score = Number(result.rows[0]?.score ?? 0);

        return NextResponse.json(
            { success: true, score, userVote: newUserVote },
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
