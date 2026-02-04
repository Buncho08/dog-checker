"use client";

import { useEffect, useState, useMemo } from "react";
import SampleCard from "./components/SampleCard";
import SortControls from "./components/SortControls";
import LabelFilter from "./components/LabelFilter";
import Pagination from "./components/Pagination";

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

type SortOption = "date-desc" | "date-asc" | "label-asc" | "label-desc";

export default function SamplesPage() {
	const [samples, setSamples] = useState<Sample[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [votes, setVotes] = useState<Record<string, VoteData>>({});
	const [voting, setVoting] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState<SortOption>("date-desc");
	const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 20;

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

	// 全ラベルのリストを取得
	const allLabels = useMemo(() => {
		const labels = new Set(samples.map(s => s.label));
		return Array.from(labels).sort();
	}, [samples]);

	// フィルタとソートを適用
	const filteredAndSortedSamples = useMemo(() => {
		let result = [...samples];

		// フィルタ適用
		if (selectedLabels.length > 0) {
			result = result.filter(s => selectedLabels.includes(s.label));
		}

		// ソート適用
		result.sort((a, b) => {
			switch (sortBy) {
				case "date-desc":
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				case "date-asc":
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				case "label-asc":
					return a.label.localeCompare(b.label);
				case "label-desc":
					return b.label.localeCompare(a.label);
				default:
					return 0;
			}
		});

		return result;
	}, [samples, selectedLabels, sortBy]);

	// ページネーション適用
	const totalPages = Math.ceil(filteredAndSortedSamples.length / itemsPerPage);
	const paginatedSamples = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredAndSortedSamples.slice(startIndex, endIndex);
	}, [filteredAndSortedSamples, currentPage, itemsPerPage]);

	// 現在のページのサンプルの投票データを取得
	useEffect(() => {
		if (paginatedSamples.length === 0) return;

		const fetchVotesForCurrentPage = async () => {
			const voteMap: Record<string, VoteData> = {};
			await Promise.all(
				paginatedSamples.map(async (sample) => {
					// 既に取得済みの場合はスキップ
					if (votes[sample.id]) {
						voteMap[sample.id] = votes[sample.id];
						return;
					}

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
			setVotes(prev => ({ ...prev, ...voteMap }));
		};

		void fetchVotesForCurrentPage();
	}, [paginatedSamples]);

	// フィルタやソートが変更されたら1ページ目に戻る
	useEffect(() => {
		setCurrentPage(1);
	}, [selectedLabels, sortBy]);

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
					<>
						<div className="space-y-3 mb-4">
							<SortControls sortBy={sortBy} onSortChange={setSortBy} />
							{allLabels.length > 0 && (
								<LabelFilter
									allLabels={allLabels}
									selectedLabels={selectedLabels}
									onFilterChange={setSelectedLabels}
								/>
							)}
						</div>

						<div className="mb-3">
							{samples.length > 0 && (
								<p className="text-sm text-gray-600 text-center">
									全{filteredAndSortedSamples.length}件中 {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedSamples.length)} - {Math.min(currentPage * itemsPerPage, filteredAndSortedSamples.length)}件を表示
								</p>
							)}
						</div>

						<div className="space-y-3">
							{samples.length === 0 && <p className="text-center text-gray-500">データがありません</p>}
							{samples.length > 0 && filteredAndSortedSamples.length === 0 && (
								<p className="text-center text-gray-500">条件に一致するデータがありません</p>
							)}
							{paginatedSamples.map((s) => (
								<SampleCard
									key={s.id}
									sample={s}
									voteData={votes[s.id]}
									isVoting={voting === s.id}
									onVote={handleVote}
								/>
							))}
						</div>

						{filteredAndSortedSamples.length > 0 && (
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
							/>
						)}
					</>
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
