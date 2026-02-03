"use client";

import { useCallback, useEffect, useState } from "react";
import Loading from "./components/modal/Loading";
import Notify from "./components/modal/Notify";

type RandomAnimal = { animal: string; url: string };

const fetchJson = async <T,>(url: string): Promise<T> => {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}`);
	return (await res.json()) as T;
};

const loadImageAsFile = async (url: string): Promise<File> => {
	const proxyUrl = `/api/animal/image?url=${encodeURIComponent(url)}`;
	const res = await fetch(proxyUrl);
	if (!res.ok) throw new Error(`画像取得に失敗しました (${res.status})`);
	const blob = await res.blob();
	const ext = blob.type.split("/")[1] ?? "jpg";
	return new File([blob], `random.${ext}`, { type: blob.type || "image/jpeg" });
};

export default function Home() {
	const [current, setCurrent] = useState<RandomAnimal | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loadingImage, setLoadingImage] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const loadRandom = useCallback(async () => {
		setError(null);
		setLoadingImage(true);
		try {
			const data = await fetchJson<RandomAnimal>("/api/animal/random");
			setCurrent(data);
		} catch (err) {
			setError((err as Error).message ?? "ランダム取得に失敗しました");
		} finally {
			setLoadingImage(false);
		}
	}, []);

	useEffect(() => {
		void loadRandom();
	}, [loadRandom]);

	useEffect(() => {
		if (message) {
			const timer = setTimeout(() => {
				setMessage(null);
			}, 2200);
			return () => clearTimeout(timer);
		}
	}, [message]);

	const handleLabel = async (label: "DOG" | "NOT_DOG") => {
		if (!current) return;
		setSubmitting(true);
		setMessage(null);
		setError(null);
		try {
			const file = await loadImageAsFile(current.url);
			const form = new FormData();
			form.set("label", label);
			form.set("image", file);
			const res = await fetch("/api/learn", { method: "POST", body: form });
			if (!res.ok) throw new Error(`学習API失敗: ${res.status}`);
			const data = await res.json();
			setMessage(`登録しました: ${data.id} (${label})`);
			await loadRandom();
		} catch (err) {
			setError((err as Error).message ?? "学習に失敗しました");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<main className="rounded-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl min-h-[85vh] bg-amber-50 p-3 md:p-6">
			{(loadingImage || submitting) && <Loading />}
			<div className="">
				<div className="">
					<div>
						<h1 className="text-4xl md:text-5xl lg:text-7xl text-center p-2 md:p-3">これはいぬ？</h1>
						<p className="text-sm md:text-base text-center">ばんさんに近づくための特訓をします</p>
					</div>
					<div className="flex flex-col sm:flex-row justify-around gap-3 sm:gap-0 py-4 md:h-20 items-center">
						<a className="link hover:text-amber-500 text-sm md:text-base" href="/check">
							判定ページへ
						</a>
						<a className="link hover:text-amber-500 text-sm md:text-base" href="/samples">
							サンプル一覧
						</a>
					</div>
				</div>

				<div className="flex justify-center items-center h-64 md:h-80 lg:h-96 w-full p-2 md:p-4">
					{loadingImage ? <p className="muted"></p> : current ? (<figure>
						<img src={current.url} alt={current.animal} className="h-64 md:h-80 lg:h-96 w-full object-cover rounded-2xl" />
						{/* <figcaption className="muted text-center text-gray-500">{current.animal}</figcaption> */}
					</figure>) : (<p className="text-red-500">画像を取得できませんでした</p>)}
				</div>

				<div className="w-full">
					<div className="grid grid-cols-1 sm:grid-cols-2 grid-rows-3 sm:grid-rows-2 gap-3 m-2 md:m-3 p-2 md:p-3">
						<div className="rounded-2xl">
							<button type="button" className="group relative inline-block w-full" onClick={() => handleLabel("NOT_DOG")} disabled={!current || submitting || loadingImage}>
								<span className="absolute inset-0 translate-x-0 translate-y-0 w-full bg-yellow-300 transition-transform group-hover:translate-x-1.5 group-hover:translate-y-1.5"></span>

								<span className="relative inline-block border-2 border-current w-full px-4 md:px-8 py-3 text-xs md:text-sm font-bold tracking-widest uppercase">
									いぬ
								</span>
							</button>
						</div>
						<div className="rounded-2xl">
							<button type="button" className="group relative inline-block w-full" onClick={() => handleLabel("NOT_DOG")} disabled={!current || submitting || loadingImage}>
								<span className="absolute inset-0 translate-x-0 translate-y-0 w-full bg-sky-300 transition-transform group-hover:translate-x-1.5 group-hover:translate-y-1.5"></span>

								<span className="relative inline-block border-2 border-current w-full px-4 md:px-8 py-3 text-xs md:text-sm font-bold tracking-widest uppercase">
									いぬじゃない
								</span>
							</button>
						</div>
						<div className="sm:col-start-1 sm:col-end-3 flex justify-center">
							<button onClick={loadRandom} disabled={loadingImage || submitting} type="button" className="relative border-black px-4 md:px-5 py-2 md:py-3 font-semibold text-xs md:text-sm text-black after:absolute after:inset-x-0 after:bottom-0 z-0 after:h-1 after:bg-yellow-300 hover:text-black hover:after:h-full focus:ring-2 focus:ring-yellow-300 focus:outline-0">
								<span className="relative z-10"> 別の画像をみる </span>
							</button>
						</div>
					</div>
				</div>

				{message && <Notify message={message} />}
				{error && <Notify message={error} />}
			</div>
		</main>
	);
}
