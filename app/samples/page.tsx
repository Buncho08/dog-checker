"use client";

import { useEffect, useState } from "react";

type Sample = {
	id: string;
	label: string;
	embedderVersion: string;
	imageUrl: string | null;
	createdAt: string;
};

type VoteData = {
	score: number;
	userVote: number | null;
};

export default function SamplesPage() {
	const [samples, setSamples] = useState<Sample[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [votes, setVotes] = useState<Record<string, VoteData>>({});
	const [voting, setVoting] = useState<string | null>(null);

	useEffect(() => {
		const fetchSamples = async () => {
			try {
				const res = await fetch("/api/samples");
				if (!res.ok) throw new Error(`Failed: ${res.status}`);
				const data = (await res.json()) as Sample[];
				setSamples(data);

				// 各サンプルの投票データを個別に取得
				const voteMap: Record<string, VoteData> = {};
				await Promise.all(
					data.map(async (sample) => {
						try {
							const voteRes = await fetch(`/api/votes?sampleId=${sample.id}`);
							if (voteRes.ok) {
								const voteData = await voteRes.json();
								voteMap[sample.id] = {
									score: voteData.score || 0,
									userVote: voteData.userVote,
								};
							}
						} catch (err) {
							console.error(`Failed to fetch vote for ${sample.id}:`, err);
						}
					})
				);
				setVotes(voteMap);
			} catch (err) {
				setError((err as Error).message ?? "エラー");
			} finally {
				setLoading(false);
			}
		};
		void fetchSamples();
	}, []);

	const handleVote = async (sampleId: string, vote: 1 | -1) => {
		setVoting(sampleId);
		try {
			const res = await fetch("/api/votes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sampleId, vote }),
			});
			if (res.ok) {
				const data = await res.json();
				setVotes(prev => ({
					...prev,
					[sampleId]: { score: data.score, userVote: data.userVote }
				}));
			}
		} catch (err) {
			console.error("Failed to vote:", err);
		} finally {
			setVoting(null);
		}
	};

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
						{samples.map((s) => {
							const voteData = votes[s.id];
							const isVoting = voting === s.id;
							return (
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
									<div className="flex items-center justify-between mt-2">
										<div>
											<p className="text-sm text-gray-700 font-mono">ID: {s.id}</p>
											<p className="text-xs text-gray-500 font-mono">Version: {s.embedderVersion}</p>
										</div>
										<div className="flex items-center gap-2">
											<button
												onClick={() => handleVote(s.id, 1)}
												disabled={isVoting}
												className={`px-3 py-1 text-sm rounded transition-colors ${voteData?.userVote === 1
													? 'bg-green-500 text-white'
													: 'bg-gray-100 hover:bg-green-100 text-gray-700'
													} disabled:opacity-50`}
												title="良いデータ"
											>
												👍
											</button>
											{voteData && (
												<span className="text-sm font-bold text-gray-700 min-w-[32px] text-center">
													{voteData.score > 0 ? '+' : ''}{voteData.score}
												</span>
											)}
											<button
												onClick={() => handleVote(s.id, -1)}
												disabled={isVoting}
												className={`px-3 py-1 text-sm rounded transition-colors ${voteData?.userVote === -1
													? 'bg-red-500 text-white'
													: 'bg-gray-100 hover:bg-red-100 text-gray-700'
													} disabled:opacity-50`}
												title="悪いデータ"
											>
												👎
											</button>
										</div>
									</div>
								</div>
							);
						})}
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
