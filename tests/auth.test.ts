import { describe, it, expect, beforeEach } from "vitest";
import {
	createSessionToken,
	verifySessionToken,
	sessionCookie,
	clearSessionCookie,
} from "../lib/auth";

const restoreEnv = { ...process.env };

describe("lib/auth", () => {
	beforeEach(() => {
		process.env = { ...restoreEnv, AUTH_SECRET: "test-secret" };
	});

	it("creates and verifies session token", async () => {
		const token = await createSessionToken("user-1");
		const payload = await verifySessionToken(token);
		expect(payload?.sub).toBe("user-1");
		expect(payload?.type).toBe("session");
	});

	it("returns null on invalid token", async () => {
		const payload = await verifySessionToken("invalid.token.here");
		expect(payload).toBeNull();
	});

	it("builds session and clear cookies", async () => {
		const token = await createSessionToken("user-2");
		const cookie = sessionCookie(token);
		expect(cookie.name).toBe("session");
		expect(cookie.httpOnly).toBe(true);
		expect(cookie.secure).toBe(false);
		expect(cookie.value).toBe(token);

		const cleared = clearSessionCookie();
		expect(cleared.value).toBe("");
		expect(cleared.maxAge).toBe(0);
	});
});
