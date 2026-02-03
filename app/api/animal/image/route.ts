import { NextResponse } from "next/server";

const corsHeaders = {
	"Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
	"Access-Control-Allow-Methods": "GET,OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const DEFAULT_TIMEOUT_MS = 8000;

const isValidImageUrl = (url: string): boolean => {
	try {
		const parsed = new URL(url);
		// HTTPSのみ許可
		if (parsed.protocol !== "https:") return false;
		// プライベートIPとlocalhostを拒否
		const hostname = parsed.hostname.toLowerCase();
		if (hostname === "localhost" || hostname === "127.0.0.1") return false;
		if (/^(10|172\.(1[6-9]|2[0-9]|3[01])|192\.168)\./.test(hostname))
			return false;
		if (/^169\.254\./.test(hostname)) return false; // AWS metadata
		if (/^\[::1\]$/.test(hostname)) return false; // IPv6 localhost
		return true;
	} catch {
		return false;
	}
};

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const target = searchParams.get("url");
	if (!target) {
		return NextResponse.json(
			{ error: "url is required" },
			{ status: 400, headers: corsHeaders },
		);
	}

	if (!isValidImageUrl(target)) {
		return NextResponse.json(
			{ error: "invalid or unsafe URL" },
			{ status: 400, headers: corsHeaders },
		);
	}

	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
		const res = await fetch(target, { signal: controller.signal });
		clearTimeout(timer);

		if (!res.ok || !res.body) {
			return NextResponse.json(
				{ error: `failed to fetch image: ${res.status}` },
				{ status: 502, headers: corsHeaders },
			);
		}

		const contentType =
			res.headers.get("content-type") ?? "application/octet-stream";
		const bytes = Buffer.from(await res.arrayBuffer());

		return new NextResponse(bytes, {
			status: 200,
			headers: {
				...corsHeaders,
				"Content-Type": contentType,
				"Cache-Control":
					"public, max-age=3600, stale-while-revalidate=86400",
				"CDN-Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "unknown error";
		return NextResponse.json(
			{ error: `failed to proxy image: ${message}` },
			{ status: 502, headers: corsHeaders },
		);
	}
}
