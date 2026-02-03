import { test, expect } from "@playwright/test";
import { getSessionToken } from "./helpers/auth";

test.beforeEach(async ({ context }) => {
	const token = await getSessionToken();
	await context.addCookies([
		{
			name: "session",
			value: token,
			domain: "localhost",
			path: "/",
			httpOnly: false,
			sameSite: "Lax",
		},
	]);
});

test("home page loads", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: "Dog Checker" }),
	).toBeVisible();
});
