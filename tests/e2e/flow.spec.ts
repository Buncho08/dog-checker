import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { getSessionToken } from "./helpers/auth";

const dogImage = path.resolve("image/learnData/dog.png");

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

test("home page learns from random image", async ({ page }) => {
	await page.route("**/api/animal/random", async (route) => {
		await route.fulfill({
			status: 200,
			body: JSON.stringify({
				animal: "fox",
				url: "http://example.com/fox.png",
			}),
		});
	});
	await page.route("http://example.com/fox.png", async (route) => {
		const body = fs.readFileSync(dogImage);
		await route.fulfill({
			status: 200,
			body,
			headers: { "content-type": "image/png" },
		});
	});
	await page.route(/\/api\/animal\/image\?url=.*/, async (route) => {
		const body = fs.readFileSync(dogImage);
		await route.fulfill({
			status: 200,
			body,
			headers: { "content-type": "image/png" },
		});
	});
	await page.route("**/api/learn", async (route) => {
		const body = JSON.stringify({
			id: "learn-1",
			label: "DOG",
			embedderVersion: "dummy",
		});
		await route.fulfill({ status: 200, body });
	});

	await page.goto("/");
	await expect(page.getByText("fox")).toBeVisible();
	await page.getByRole("button", { name: "犬だと思う" }).click();
	await expect(page.getByText(/learn-1/)).toBeVisible();
});

test("samples page lists data", async ({ page }) => {
	await page.route("**/api/samples", async (route) => {
		const body = JSON.stringify([
			{
				id: "s-1",
				label: "DOG",
				embedderVersion: "dummy-test",
				createdAt: new Date().toISOString(),
			},
		]);
		await route.fulfill({ status: 200, body });
	});

	await page.goto("/samples");
	await expect(page.getByText("s-1")).toBeVisible();
});
