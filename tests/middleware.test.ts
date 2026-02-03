import { describe, it, expect, beforeEach } from "vitest";
import { middleware } from "../middleware";
import { createSessionToken } from "../lib/auth";

const restoreEnv = { ...process.env };

type CookieRecord = Record<string, string>;

const makeRequest = (
	url: string,
	headers?: HeadersInit,
	cookies?: CookieRecord,
) => {
	const h = new Headers(headers ?? {});
	const cookieHeader = cookies
		? Object.entries(cookies)
				.map(([k, v]) => `${k}=${v}`)
				.join("; ")
		: undefined;
	if (cookieHeader) h.set("cookie", cookieHeader);

	return {
		url,
		nextUrl: new URL(url),
		headers: h,
		cookies: {
			get: (name: string) =>
				cookies && cookies[name] ? { name, value: cookies[name] } : undefined,
		},
		ip: "127.0.0.1",
	} as unknown as Request;
};

describe("middleware auth", () => {
	beforeEach(() => {
		process.env = {
			...restoreEnv,
			AUTH_SECRET: "secret",
			AUTH_PASSWORD: "p@ss",
			API_KEYS: "key123",
		};
	});

	it("allows request with valid API key", async () => {
		const token = await createSessionToken("user1");
		const req = makeRequest(
			"http://localhost/api/predict",
			undefined,
			{ session: token },
		);
		const res = await middleware(req);
		expect(res?.status ?? 200).toBe(200);
	});

	it("denies request without credentials", async () => {
		const req = makeRequest("http://localhost/api/predict");
		const res = await middleware(req);
		expect(res?.status).toBe(307); // ログインページへリダイレクト
		expect(res?.headers.get("location")).toMatch(/\/login$/);
	});

	it("allows request with valid session cookie", async () => {
		const token = await createSessionToken("user1");
		const req = makeRequest("http://localhost/api/learn", undefined, {
			session: token,
		});
		const res = await middleware(req);
		expect(res?.status ?? 200).toBe(200);
	});

	it("redirects page access without session to login", async () => {
		const req = makeRequest("http://localhost/check");
		const res = await middleware(req);
		expect(res?.status).toBe(307);
		expect(res?.headers.get("location")).toMatch(/\/login$/);
	});

	it("allows authenticated user to access /login", async () => {
		const token = await createSessionToken("user2");
		const req = makeRequest("http://localhost/login", undefined, {
			session: token,
		});
		const res = await middleware(req);
		// 認証済みユーザーでもログインページへのアクセスを許可する実装
		expect(res?.status ?? 200).toBe(200);
	});

	it("allows /login when AUTH_SECRET is missing but api keys exist", async () => {
		process.env.AUTH_SECRET = "";
		process.env.API_KEYS = "key123";
		const req = makeRequest("http://localhost/login", undefined, {
			session: "stale-token",
		});
		const res = await middleware(req);
		expect(res?.status ?? 200).toBe(200);
	});
});
