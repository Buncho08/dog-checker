import { describe, expect, it } from "vitest";
import { hasFileBuffer, isHttpUrl, isLabel } from "../lib/utils/validators";

describe("validators", () => {
	it("isLabel works for DOG/NOT_DOG", () => {
		expect(isLabel("DOG")).toBe(true);
		expect(isLabel("NOT_DOG")).toBe(true);
		expect(isLabel("CAT")).toBe(false);
		expect(isLabel("dog")).toBe(false);
		expect(isLabel(undefined)).toBe(false);
	});

	it("hasFileBuffer checks buffer existence", () => {
		expect(hasFileBuffer(undefined)).toBe(false);
		expect(hasFileBuffer(null)).toBe(false);
		expect(hasFileBuffer({})).toBe(false);
		expect(hasFileBuffer({ buffer: Buffer.alloc(0) })).toBe(false);
		expect(hasFileBuffer({ buffer: Buffer.from([1, 2, 3]) })).toBe(true);
	});

	it("isHttpUrl validates http/https", () => {
		expect(isHttpUrl("http://example.com")).toBe(true);
		expect(isHttpUrl("https://example.com/path")).toBe(true);
		expect(isHttpUrl("ftp://example.com")).toBe(false);
		expect(isHttpUrl("example.com")).toBe(false);
		expect(isHttpUrl(undefined)).toBe(false);
	});
});
