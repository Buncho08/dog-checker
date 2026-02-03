"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Loading from "../components/modal/Loading";
import { PredictResponse } from "../type/PredictResponse";
import ResultModal from "../components/modal/ResultModal";



const postImage = async <T,>(url: string, file: File): Promise<T> => {
	const form = new FormData();
	form.set("image", file);
	const res = await fetch(url, { method: "POST", body: form });
	if (!res.ok) {
		throw new Error(`Request failed: ${res.status}`);
	}
	return (await res.json()) as T;
};



export default function CheckPage() {
	const [file, setFile] = useState<File | null>(null);
	const dummyResult: PredictResponse = { label: "DOG", score: 0.95, pDog: 0.9, neighbors: [{ id: "sample1", label: "DOG", sim: 0.98 }], sampleCount: 1000, embedderVersion: "1.0.0" };
	const [result, setResult] = useState<PredictResponse | null>(dummyResult);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [modal, setModal] = useState<boolean>(false);

	useEffect(() => {
		if (file) {
			const url = URL.createObjectURL(file);
			setImageUrl(url);
			return () => {
				URL.revokeObjectURL(url);
			};
		} else {
			setImageUrl(null);
		}
	}, [file]);

	const onSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);
		setResult(null);
		if (!file) {
			setError("画像ファイルを選択してください");
			return;
		}
		setLoading(true);
		try {
			const resp = await postImage<PredictResponse>("/api/predict", file);
			setResult(resp);
		} catch (err) {
			setError((err as Error).message ?? "エラーが発生しました");
		} finally {
			setLoading(false);
		}
	};

	const topNeighbor = useMemo(() => result?.neighbors?.[0], [result]);
	const label = { DOG: "いぬ", NOT_DOG: "いぬじゃない", UNKNOWN: "わからない" };
	return (
		<main className="rounded-2xl min-w-1/4 max-w-1/4 min-h-5/6 bg-amber-50 p-2">
			{loading ?? <Loading />}
			<h1 className="text-7xl text-center p-3">これはいぬ？</h1>
			<p className="text-center">ばんさんのかわりに判断します</p>
			<div className="flex justify-around h-20 items-center">
				<a className="link hover:text-amber-500" href="/">
					学習ページへ
				</a>
				<a className="link hover:text-amber-500" href="/samples">
					サンプル一覧
				</a>
			</div>
			<label className="h-95 flex flex-col items-center justify-center rounded border border-gray-300 bg-white p-4 text-gray-900 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt="アップロード画像プレビュー"
						className="max-h-75 max-w-full object-contain"
					/>
				) : (
					<>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6">
							<path stroke-linecap="round" stroke-linejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"></path>
						</svg>
						<span className="mt-4 font-medium dark:text-white"> ばんAIに聞いてみよう！ </span>
					</>
				)}
				<span className="mt-2 inline-block rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
					画像を選択してね
				</span>
				<input
					type="file"
					accept="image/*"
					className="sr-only"
					onChange={(e) => { setFile(e.target.files?.[0] ?? null); onSubmit(e); }}
				/>
				{error && <p className="error">{error}</p>}
			</label>

			{result && (
				<section className="card flex-col justify-center mt-4 p-4">
					<h2 className="text-7xl text-center font-extrabold">{label[result.label]}</h2>
					<div className="flex justify-center items-center my-2"><a onClick={() => setModal(true)} className="relative text-sm border-black px-5 py-2 font-semibold text-black after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-black hover:text-white hover:after:h-full focus:ring-2 focus:ring-yellow-300 focus:outline-0" href="#">
						<span className="relative z-10"> くわしくみる </span>
					</a></div>
					{modal && <ResultModal result={result} topNeighbor={topNeighbor!} open={modal} onClose={() => setModal(false)} />}
				</section>
			)}
		</main>
	);
}
