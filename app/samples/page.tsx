"use client";

import { useEffect, useState } from "react";

type Sample = {
	id: string;
	label: string;
	embedderVersion: string;
	imageUrl: string | null;
	createdAt: string;
};

export default function SamplesPage() {
	const [samples, setSamples] = useState<Sample[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchSamples = async () => {
			try {
				const res = await fetch("/api/samples");
				if (!res.ok) throw new Error(`Failed: ${res.status}`);
				const data = (await res.json()) as Sample[];
				setSamples(data);
			} catch (err) {
				setError((err as Error).message ?? "エラー");
			} finally {
				setLoading(false);
			}
		};
		void fetchSamples();
	}, []);

	return (
		<main className="rounded-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-scroll bg-amber-50 p-3 md:p-6">
			<div>
				<h1 className="text-4xl md:text-5xl lg:text-7xl text-center p-2 md:p-3">サンプル一覧</h1>
				<p className="text-sm md:text-base text-center">保存済みの学習データを確認できます</p>
				<div className="flex flex-col sm:flex-row justify-around gap-3 sm:gap-0 py-4 md:h-20 items-center">
					<a className="link hover:text-amber-500 text-sm md:text-base" href="/">
						学習ページへ
					</a>
					<a className="link hover:text-amber-500 text-sm md:text-base" href="/check">
						判定ページへ
					</a>
				</div>
			</div>

			<div className="p-4">
				{loading && <p className="text-center text-gray-500">読み込み中...</p>}
				{error && <p className="text-center text-red-500">{error}</p>}
				{!loading && !error && (
					<div className="space-y-3">
						{samples.length === 0 && <p className="text-center text-gray-500">データがありません</p>}
						{samples.map((s) => (
							<div key={s.id} className="bg-white rounded-lg p-4 shadow-md border-2 border-gray-200">
								<div className="flex items-center justify-between">
									<span className={`px-3 py-1 rounded-full text-sm font-semibold ${s.label === "DOG" ? "bg-yellow-300 text-black" : s.label === "NOT_DOG" ? "bg-sky-300 text-black" : "bg-purple-300 text-black"}`}>
										{s.label === "DOG" ? "いぬ" : s.label === "NOT_DOG" ? "いぬじゃない" : s.label}
									</span>
									<p className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleString("ja-JP")}</p>
								</div>
								{s.imageUrl && (
									<div className="mt-3">
										<a href={s.imageUrl} target="_blank" rel="noopener noreferrer">
											<img src={s.imageUrl} alt={s.label} className="w-full h-48 object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer" />
										</a>
									</div>
								)}
								<p className="text-sm text-gray-700 mt-2 font-mono">ID: {s.id}</p>
								<p className="text-xs text-gray-500 font-mono">Version: {s.embedderVersion}</p>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="flex justify-center p-3 md:p-4">
				<a href="/">
					<button type="button" className="relative border-black px-4 md:px-5 py-2 md:py-3 font-semibold text-xs md:text-sm text-black after:absolute after:inset-x-0 after:bottom-0 z-0 after:h-1 after:bg-yellow-300 hover:text-black hover:after:h-full focus:ring-2 focus:ring-yellow-300 focus:outline-0">
						<span className="relative z-10">トップに戻る</span>
					</button>
				</a>
			</div>
		</main>
	);
}
