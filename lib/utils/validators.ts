import type { Label } from "../config";

type BufferLike = { buffer?: Buffer } | undefined | null;
type UrlLike = string | undefined | null;

export const isLabel = (value: unknown): value is Label =>
	value === "DOG" || value === "NOT_DOG";

export const hasFileBuffer = (file: BufferLike): file is { buffer: Buffer } => {
	return Boolean(file && file.buffer && file.buffer.length > 0);
};

export const isHttpUrl = (value: UrlLike): value is string => {
	return typeof value === "string" && /^https?:\/\//i.test(value);
};
