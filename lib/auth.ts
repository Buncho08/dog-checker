import { SignJWT, jwtVerify, JWTPayload } from "jose";

const encoder = new TextEncoder();
const SESSION_COOKIE_NAME = "session";
const DEFAULT_TTL_HOURS = 24;

const getSecret = (): Uint8Array => {
	const secret = process.env.AUTH_SECRET;
	if (!secret) {
		throw new Error("AUTH_SECRET is not set");
	}
	return encoder.encode(secret);
};

const getTtlSeconds = (): number => {
	const raw = Number(process.env.AUTH_TOKEN_TTL_HOURS ?? DEFAULT_TTL_HOURS);
	if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_TTL_HOURS * 3600;
	return raw * 3600;
};

export interface SessionPayload extends JWTPayload {
	sub: string;
	type: "session";
}

export const createSessionToken = async (subject: string): Promise<string> => {
	const ttlSeconds = getTtlSeconds();
	return new SignJWT({ type: "session" })
		.setSubject(subject)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
		.sign(getSecret());
};

export const verifySessionToken = async (
	token: string,
): Promise<SessionPayload | null> => {
	try {
		const res = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
		const payload = res.payload as SessionPayload;
		if (payload.type !== "session") return null;
		return payload;
	} catch {
		return null;
	}
};

const isProd = () => process.env.NODE_ENV === "production";

export const sessionCookie = (token: string) => ({
	name: SESSION_COOKIE_NAME,
	value: token,
	httpOnly: true,
	sameSite: "lax" as const,
	secure: isProd(),
	path: "/",
	maxAge: getTtlSeconds(),
});

export const clearSessionCookie = () => ({
	name: SESSION_COOKIE_NAME,
	value: "",
	httpOnly: true,
	sameSite: "lax" as const,
	secure: isProd(),
	path: "/",
	maxAge: 0,
});

export const SESSION_COOKIE_NAME_CONST = SESSION_COOKIE_NAME;
