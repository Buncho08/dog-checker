import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Home from "../app/page";
import { describe, expect, it, vi, beforeEach } from "vitest";

describe("Home", () => {
	beforeEach(() => {
		(global as any).fetch = vi.fn(async () => ({
			ok: true,
			json: async () => ({ animal: "cat", url: "http://example.com/cat" }),
		}));
	});

	it("renders heading", async () => {
		render(<Home />);
		await waitFor(() => {
			expect(
				screen.getByRole("heading", { name: /これはいぬ？/ }),
			).toBeInTheDocument();
		});
	});
});
