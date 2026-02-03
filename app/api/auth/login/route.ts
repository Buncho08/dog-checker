import { NextResponse } from "next/server";
import { createSessionToken, sessionCookie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const errorResponse = (status: number, message: string) =>
	NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
	try {
		const body = (await req.json().catch(() => ({}))) as {
			password?: string;
		};
		const password = body?.password ?? "";

		const expected = process.env.AUTH_PASSWORD;
		if (!expected) {
			return errorResponse(500, "AUTH_PASSWORD is not set");
		}

		if (password !== expected) {
			return errorResponse(401, "invalid credentials");
		}

		const token = await createSessionToken("user");
		const res = NextResponse.json({ ok: true });
		const cookie = sessionCookie(token);
		res.cookies.set(cookie.name, cookie.value, cookie);
		return res;
	} catch (err) {
		console.error("login_error", err);
		return errorResponse(500, "internal error");
	}
}
