import type { Label } from "../config";

type BufferLike = { buffer?: Buffer } | undefined | null;
type UrlLike = string | undefined | null;

export const isLabel = (value: unknown): value is Label => {
	if (value === "DOG" || value === "NOT_DOG") return true;
	if (typeof value !== "string") return false;
	// 自由入力: 1-5文字（日本語、英字、数字、記号など）
	const length = [...value].length; // Unicodeコードポイント単位でカウント
	return length >= 1 && length <= 5;
};

export const hasFileBuffer = (file: BufferLike): file is { buffer: Buffer } => {
	return Boolean(file && file.buffer && file.buffer.length > 0);
};

export const isHttpUrl = (value: UrlLike): value is string => {
	return typeof value === "string" && /^https?:\/\//i.test(value);
};
