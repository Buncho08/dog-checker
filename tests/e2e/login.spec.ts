import { test, expect } from "@playwright/test";
import { getSessionToken } from "./helpers/auth";

test("login shows error on invalid password", async ({ page }) => {
	await page.route("**/api/auth/login", async (route) => {
		await route.fulfill({
			status: 401,
			body: JSON.stringify({ error: "invalid credentials" }),
		});
	});

	await page.goto("/login");
	await page.getByLabel("パスワード").fill("wrong");
	await page.getByRole("button", { name: "ログイン" }).click();
	await expect(page.getByText("invalid credentials")).toBeVisible();
});

test("login redirects on success", async ({ page }) => {
	await page.route("**/api/auth/login", async (route) => {
		const token = await getSessionToken();
		await route.fulfill({
			status: 200,
			body: JSON.stringify({ ok: true }),
			headers: {
				"set-cookie": `session=${token}; Path=/; SameSite=Lax`,
			},
		});
	});
	await page.route("/", async (route) => {
		await route.fulfill({
			status: 200,
			body: "<html><body><h1>Home</h1></body></html>",
			headers: { "content-type": "text/html" },
		});
	});

	await page.goto("/login");
	await page.getByLabel("パスワード").fill("p@ss");
	await page.getByRole("button", { name: "ログイン" }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
});
