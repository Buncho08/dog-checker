"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { PredictResponse } from "../type/PredictResponse";

const Loading = dynamic(() => import("../components/modal/Loading"), { ssr: false });
const ResultModal = dynamic(() => import("../components/modal/ResultModal"), { ssr: false });
const LearnModal = dynamic(() => import("../components/modal/LearnModal"), { ssr: false });



export default function CheckPage() {
	const [file, setFile] = useState<File | null>(null);
	const [result, setResult] = useState<PredictResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [modal, setModal] = useState<boolean>(false);
	const [showLearnModal, setShowLearnModal] = useState<boolean>(false);
	const [learnSuccess, setLearnSuccess] = useState<boolean>(false);

	const postImage = useCallback(async <T,>(url: string, file: File): Promise<T> => {
		const form = new FormData();
		form.set("image", file);
		const res = await fetch(url, { method: "POST", body: form });
		if (!res.ok) {
			throw new Error(`Request failed: ${res.status}`);
		}
		return (await res.json()) as T;
	}, []);

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

	const onSubmit = useCallback(async (e: FormEvent) => {
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
	}, [file, postImage]);

	const handleLearnSubmit = useCallback(async (label: string) => {
		if (!file) return;
		setLoading(true);
		setError(null);
		try {
			const form = new FormData();
			form.set("image", file);
			form.set("label", label);
			const res = await fetch("/api/learn", { method: "POST", body: form });
			if (!res.ok) {
				throw new Error(`登録失敗: ${res.status}`);
			}
			setLearnSuccess(true);
			setShowLearnModal(false);
		} catch (err) {
			setError((err as Error).message ?? "学習データ登録エラー");
			throw err;
		} finally {
			setLoading(false);
		}
	}, [file]);

	const topNeighbor = useMemo(() => result?.neighbors?.[0], [result]);
	const labelMap: Record<string, string> = { DOG: "いぬ", NOT_DOG: "いぬじゃない", UNKNOWN: "わからない" };
	const getDisplayLabel = (label: string) => labelMap[label] || label;
	return (
		<main className="rounded-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl min-h-[85vh] bg-amber-50 p-3 md:p-6">
			{loading && <Loading />}
			<h1 className="text-4xl md:text-5xl lg:text-7xl text-center p-2 md:p-3">これはいぬ？</h1>
			<p className="text-sm md:text-base text-center">ばんさんのかわりに判断します</p>
			<div className="flex flex-col sm:flex-row justify-around gap-3 sm:gap-0 py-4 md:h-20 items-center">
				<a className="link hover:text-amber-500 text-sm md:text-base" href="/">
					学習ページへ
				</a>
				<a className="link hover:text-amber-500 text-sm md:text-base" href="/samples">
					サンプル一覧
				</a>
			</div>
			<label className="h-64 md:h-80 lg:h-96 flex flex-col items-center justify-center rounded border border-gray-300 bg-white p-3 md:p-6 text-gray-900 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt="アップロード画像プレビュー"
						className="max-h-full max-w-full object-contain"
					/>
				) : (
					<>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-8 md:size-10">
								<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75"></path>
						</svg>
							<span className="mt-2 md:mt-4 font-medium text-sm md:text-base dark:text-white"> ばんAIに聞いてみよう！ </span>
					</>
				)}
				<span className="mt-2 inline-block rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-center text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
					画像を選択してね
				</span>
				<input
					type="file"
					accept="image/*"
					className="sr-only"
					onChange={async (e) => {
						const selectedFile = e.target.files?.[0] ?? null;
						setFile(selectedFile);
						if (!selectedFile) {
							setError("画像ファイルを選択してください");
							return;
						}
						setError(null);
						setResult(null);
						setLoading(true);
						try {
							const resp = await postImage<PredictResponse>("/api/predict", selectedFile);
							setResult(resp);
						} catch (err) {
							setError((err as Error).message ?? "エラーが発生しました");
						} finally {
							setLoading(false);
						}
					}}
				/>
				{error && <p className="error">{error}</p>}
			</label>

			{result !== null && (
				<section className="card flex-col justify-center mt-4 p-3 md:p-4">
					<h2 className="text-4xl md:text-5xl lg:text-7xl text-center font-extrabold">{getDisplayLabel(result.label)}</h2>
					<div className="flex justify-center items-center gap-3 my-2">
						<a onClick={() => setModal(true)} className="relative text-xs md:text-sm border-black px-4 md:px-5 py-2 font-semibold text-black after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-black hover:text-white hover:after:h-full focus:ring-2 focus:ring-yellow-300 focus:outline-0" href="#">
							<span className="relative z-10"> くわしくみる </span>
						</a>
						<button onClick={() => setShowLearnModal(true)} className="relative text-xs md:text-sm border-green-600 bg-green-50 px-4 md:px-5 py-2 font-semibold text-green-700 after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-green-600 hover:text-white hover:after:h-full focus:ring-2 focus:ring-green-300 focus:outline-0">
							<span className="relative z-10"> 学習データに登録 </span>
						</button>
					</div>
					{learnSuccess && <p className="text-center text-green-600 mt-2 text-sm">✓ 学習データに登録しました</p>}
					{modal && <ResultModal result={result} topNeighbor={topNeighbor!} open={modal} onClose={() => setModal(false)} />}
					<LearnModal
						open={showLearnModal}
						onClose={() => setShowLearnModal(false)}
						onSubmit={handleLearnSubmit}
					/>
				</section>
			)}
		</main>
	);
}
