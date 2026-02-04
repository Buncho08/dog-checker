"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

export default function SampleDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [sample, setSample] = useState<Sample | null>(null);
    const [voteData, setVoteData] = useState<VoteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [voting, setVoting] = useState(false);

    useEffect(() => {
        const fetchSampleAndVote = async () => {
            try {
                // サンプル情報を取得
                const sampleRes = await fetch("/api/samples");
                if (!sampleRes.ok) throw new Error("Failed to fetch samples");
                const allSamples = (await sampleRes.json()) as Sample[];
                const foundSample = allSamples.find((s) => s.id === id);

                if (!foundSample) {
                    setError("サンプルが見つかりませんでした");
                    return;
                }

                setSample(foundSample);

                // 投票情報を取得
                const voteRes = await fetch(`/api/votes?sampleId=${id}`);
                if (voteRes.ok) {
                    const voteInfo = await voteRes.json();
                    setVoteData({
                        score: voteInfo.score || 0,
                        userVote: voteInfo.userVote,
                    });
                }
            } catch (err) {
                setError((err as Error).message || "エラーが発生しました");
            } finally {
                setLoading(false);
            }
        };

        void fetchSampleAndVote();
    }, [id]);

    const handleVote = async (vote: 1 | -1) => {
        if (!sample) return;
        setVoting(true);
        try {
            const res = await fetch("/api/votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sampleId: sample.id, vote }),
            });
            if (res.ok) {
                const data = await res.json();
                setVoteData({ score: data.score, userVote: data.userVote });
            }
        } catch (err) {
            console.error("Failed to vote:", err);
        } finally {
            setVoting(false);
        }
    };

    const getLabelDisplay = (label: string) => {
        if (label === "DOG") return "いぬ";
        if (label === "NOT_DOG") return "いぬじゃない";
        return label;
    };

    const getLabelColor = (label: string) => {
        if (label === "DOG") return "bg-yellow-300 text-black";
        if (label === "NOT_DOG") return "bg-sky-300 text-black";
        return "bg-purple-300 text-black";
    };

    if (loading) {
        return (
            <main className="rounded-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-scroll bg-amber-50 p-3 md:p-6">
                <div className="text-center py-20">
                    <p className="text-gray-500">読み込み中...</p>
                </div>
            </main>
        );
    }

    if (error || !sample) {
        return (
            <main className="rounded-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-scroll bg-amber-50 p-3 md:p-6">
                <div className="text-center py-20">
                    <p className="text-red-500 mb-4">{error || "サンプルが見つかりませんでした"}</p>
                    <Link href="/samples" className="text-amber-600 hover:text-amber-700 underline">
                        サンプル一覧に戻る
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="rounded-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-scroll bg-amber-50 p-3 md:p-6">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Link
                        href="/samples"
                        className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-sm"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        一覧に戻る
                    </Link>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-2">
                    サンプル詳細
                </h1>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <span className={`px-4 py-2 rounded-full text-base font-bold ${getLabelColor(sample.label)}`}>
                        {getLabelDisplay(sample.label)}
                    </span>
                    <p className="text-sm text-gray-500">
                        {new Date(sample.createdAt).toLocaleString("ja-JP")}
                    </p>
                </div>

                {sample.imageUrl && (
                    <div className="mb-6">
                        <a href={sample.imageUrl} target="_blank" rel="noopener noreferrer">
                            <img
                                src={sample.imageUrl}
                                alt={sample.label}
                                className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                            />
                        </a>
                    </div>
                )}

                <div className="space-y-3 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">サンプル情報</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">ID:</span>
                                <span className="font-mono text-gray-800">{sample.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Embedder Version:</span>
                                <span className="font-mono text-gray-800">{sample.embedderVersion}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">登録日時:</span>
                                <span className="text-gray-800">
                                    {new Date(sample.createdAt).toLocaleString("ja-JP")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">データ評価</h3>
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => handleVote(1)}
                                disabled={voting}
                                className={`px-6 py-3 text-lg rounded-lg transition-colors ${voteData?.userVote === 1
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-100 hover:bg-green-100 text-gray-700"
                                    } disabled:opacity-50`}
                                title="良いデータ"
                            >
                                👍
                            </button>
                            {voteData && (
                                <span className="text-2xl font-bold text-gray-700 min-w-[60px] text-center">
                                    {voteData.score > 0 ? "+" : ""}
                                    {voteData.score}
                                </span>
                            )}
                            <button
                                onClick={() => handleVote(-1)}
                                disabled={voting}
                                className={`px-6 py-3 text-lg rounded-lg transition-colors ${voteData?.userVote === -1
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-100 hover:bg-red-100 text-gray-700"
                                    } disabled:opacity-50`}
                                title="悪いデータ"
                            >
                                👎
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-3">
                    <Link
                        href="/samples"
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                    >
                        一覧に戻る
                    </Link>
                    <Link
                        href="/"
                        className="px-6 py-2 bg-yellow-300 hover:bg-yellow-400 border-2 border-black rounded-lg text-sm font-bold transition-colors"
                    >
                        トップに戻る
                    </Link>
                </div>
            </div>
        </main>
    );
}
