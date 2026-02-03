import { describe, it, expect } from "vitest";
import { POST as logoutHandler } from "../app/api/auth/logout/route";

describe("/api/auth/logout", () => {
	it("clears the session cookie", async () => {
		const res = await logoutHandler();
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.ok).toBe(true);
		const setCookie = res.headers.get("set-cookie");
		expect(setCookie).toBeTruthy();
		expect(setCookie).toContain("Max-Age=0");
	});
});
