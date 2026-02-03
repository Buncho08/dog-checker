const DEFAULT_TIMEOUT_MS = 8000;

const getRequest = async <T = unknown>(
	endpoint: string,
	timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	const response = await fetch(endpoint, { signal: controller.signal });
	clearTimeout(timer);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${endpoint}`);
	}
	return (await response.json()) as T;
};

/**
 * Get a random image of a cat!
 *
 */
export const cat = async () => {
	return "https://cataas.com/cat";
};

/**
 * Get a random image of a dog!
 *
 */
export const dog = async () => {
	return getRequest<{ message: string }>(
		"https://dog.ceo/api/breeds/image/random",
	).then((res) => res.message);
};

/**
 * Get a random image of a bunny!
 *
 */
export const bunny = async () => {
	return getRequest<{ media: { poster: string } }>(
		"https://api.bunnies.io/v2/loop/random/?media=gif,png",
	).then((res) => res.media.poster);
};

/**
 * Get a random image of a duck!
 *
 */
export const duck = async () => {
	return getRequest<{ url: string }>(
		"https://random-d.uk/api/v1/random?type=png",
	).then((res) => res.url.replace(/^http:/, "https:"));
};

/**
 * Get a random image of a fox!
 *
 */
export const fox = async () => {
	return getRequest<{ image: string }>("https://randomfox.ca/floof/").then(
		(res) => res.image,
	);
};

/**
 * Get a random image of a lizard!
 *
 */
export const lizard = async () => {
	return getRequest<{ url: string }>(
		"https://nekos.life/api/v2/img/lizard",
	).then((res) => res.url);
};

/**
 * get a random placeholder image
 */
export const randomPlaceholder = async () => {
	const clientId = process.env.UNSPLASH_ACCESS_KEY;
	if (!clientId) {
		throw new Error("UNSPLASH_ACCESS_KEY is not set");
	}
	return getRequest<{ urls: { small: string } }>(
		`https://api.unsplash.com/photos/random?query=animal&client_id=${clientId}`,
	).then((res) => res.urls.small);
};

export type AnimalApiName = "cat" | "dog" | "bunny" | "duck" | "fox" | "lizard" | "randomPlaceholder";

type AnimalApiEntry = {
	name: AnimalApiName;
	fetcher: () => Promise<string>;
};

const animalApis: AnimalApiEntry[] = [
	{ name: "cat", fetcher: cat },
	{ name: "dog", fetcher: dog },
	{ name: "bunny", fetcher: bunny },
	{ name: "duck", fetcher: duck },
	{ name: "fox", fetcher: fox },
	{ name: "lizard", fetcher: lizard },
	{ name: "randomPlaceholder", fetcher: randomPlaceholder },
];

/**
 * Pick a random animal API and return its image URL.
 */
export const randomAnimal = async () => {
	const candidates = [...animalApis];

	for (let i = candidates.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[candidates[i], candidates[j]] = [candidates[j], candidates[i]];
	}

	const errors: string[] = [];
	for (const entry of candidates) {
		try {
			const url = await entry.fetcher();
			if (url) {
				return { animal: entry.name, url };
			}
			errors.push(`${entry.name}: empty url`);
		} catch (err) {
			errors.push(
				`${entry.name}: ${(err as Error)?.message ?? "unknown error"}`,
			);
		}
	}

	throw new Error(`Failed to fetch random animal: ${errors.join(" | ")}`);
};
