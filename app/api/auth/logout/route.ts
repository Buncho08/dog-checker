import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
	const res = NextResponse.json({ ok: true });
	const cookie = clearSessionCookie();
	res.cookies.set(cookie.name, cookie.value, cookie);
	return res;
}
