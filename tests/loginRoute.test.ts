import { describe, it, expect, beforeEach } from "vitest";
import { POST as loginHandler } from "../app/api/auth/login/route";

const restoreEnv = { ...process.env };

const makeRequest = (password: string) =>
	new Request("http://localhost/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ password }),
	});

describe("/api/auth/login", () => {
	beforeEach(() => {
		process.env = {
			...restoreEnv,
			AUTH_SECRET: "test-secret",
			AUTH_PASSWORD: "p@ss",
		};
	});

	it("returns 200 and sets session cookie on success", async () => {
		const res = await loginHandler(makeRequest("p@ss"));
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.ok).toBe(true);
		const setCookie = res.headers.get("set-cookie");
		expect(setCookie).toBeTruthy();
		expect(setCookie).toContain("session=");
	});

	it("returns 401 on wrong password", async () => {
		const res = await loginHandler(makeRequest("wrong"));
		expect(res.status).toBe(401);
		const body = await res.json();
		expect(body.error).toBe("invalid credentials");
	});
});
