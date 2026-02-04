import { PredictResponse, Neighbor } from "../../type/PredictResponse";
import { useState, useEffect } from "react";

export type ModalProps = {
    result: PredictResponse;
    topNeighbor: Neighbor;
    open: boolean;
    onClose: () => void;
};

type VoteState = {
    [sampleId: string]: { score: number; userVote: number | null };
};

export default function ResultModal(props: ModalProps) {
    const [votes, setVotes] = useState<VoteState>({});
    const [voting, setVoting] = useState<string | null>(null);

    useEffect(() => {
        if (props.open && props.result.neighbors) {
            // 各近傍サンプルの投票情報を取得
            props.result.neighbors.forEach(async (neighbor) => {
                try {
                    const res = await fetch(`/api/votes?sampleId=${neighbor.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setVotes(prev => ({
                            ...prev,
                            [neighbor.id]: { score: data.score, userVote: data.userVote }
                        }));
                    }
                } catch (err) {
                    console.error("Failed to fetch vote:", err);
                }
            });
        }
    }, [props.open, props.result.neighbors]);

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

    const toPercent = (v: number) => `${Math.round(v * 100)}%`;
    const labelMap: Record<string, string> = { DOG: "いぬ", NOT_DOG: "いぬじゃない", UNKNOWN: "わからない" };
    const getDisplayLabel = (label: string) => labelMap[label] || label;

    if (!props.open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
            onClick={props.onClose}
        >
            <div
                className="w-full max-w-xs sm:max-w-md rounded-lg bg-white p-4 md:p-6 shadow-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-3 md:mb-4">
                    <h2 id="modalTitle" className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 pr-2">これは…{getDisplayLabel(props.result.label)}</h2>

                    <button
                        type="button"
                        onClick={props.onClose}
                        className="flex-shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="mt-3 md:mt-4 space-y-3">
                    <p className="text-sm text-gray-700">
                        判定モデル: {props.result.embedderVersion}
                    </p>
                    <p className="text-sm text-gray-700">
                        スコア: {toPercent(props.result.score)}
                    </p>
                    <p className="text-sm text-gray-700">
                        いぬである確率: {toPercent(props.result.pDog)}
                    </p>
                    <p className="text-sm text-gray-700">
                        総学習データ件数: {props.result.sampleCount}
                    </p>
                    {props.result.neighbors && props.result.neighbors.length > 0 && (
                        <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2">近傍データ（上位{props.result.neighbors.length}件）</p>
                            <div className="space-y-2">
                                {props.result.neighbors.map((neighbor, idx) => {
                                    const voteData = votes[neighbor.id];
                                    const isVoting = voting === neighbor.id;
                                    return (
                                        <div key={neighbor.id} className="text-xs bg-white rounded border border-gray-200 p-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800">
                                                        {idx + 1}. {getDisplayLabel(neighbor.label)} (類似度: {toPercent(neighbor.sim)})
                                                    </p>
                                                    <p className="text-gray-500 mt-1 font-mono text-[10px] truncate">ID: {neighbor.id}</p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleVote(neighbor.id, 1)}
                                                        disabled={isVoting}
                                                        className={`px-1.5 py-1 text-xs rounded transition-colors ${voteData?.userVote === 1
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-gray-100 hover:bg-green-100 text-gray-700'
                                                            } disabled:opacity-50`}
                                                        title="良いデータ"
                                                    >
                                                        👍
                                                    </button>
                                                    {voteData && (
                                                        <span className="text-[10px] font-semibold text-gray-600 min-w-[18px] text-center">
                                                            {voteData.score > 0 ? '+' : ''}{voteData.score}
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => handleVote(neighbor.id, -1)}
                                                        disabled={isVoting}
                                                        className={`px-1.5 py-1 text-xs rounded transition-colors ${voteData?.userVote === -1
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
                        </div>
                    )}
                    {props.result.params && (
                        <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
                            <p className="text-sm font-semibold text-gray-700 mb-2">判定パラメータ</p>
                            <div className="space-y-1 text-xs text-gray-600">
                                {typeof props.result.params.topK === 'number' && (
                                    <p>• 参照する近傍データ数: {props.result.params.topK}件</p>
                                )}
                                {props.result.params.pThreshold !== undefined && (
                                    <p>• 判定しきい値: {Math.round(Number(props.result.params.pThreshold) * 100)}%</p>
                                )}
                                {props.result.params.minTopSim !== undefined && (
                                    <p>• 最小類似度: {Math.round(Number(props.result.params.minTopSim) * 100)}%</p>
                                )}
                                {typeof props.result.params.temperature === 'number' && (
                                    <p>• 判定の確信度調整: {props.result.params.temperature}</p>
                                )}
                                {typeof props.result.params.minNeighbors === 'number' && (
                                    <p>• 最小必要データ数: {props.result.params.minNeighbors}件</p>
                                )}
                            </div>
                            <details className="group border border-gray-500 shadow-[4px_4px_0_0] shadow-gray-500 [&_summary::-webkit-details-marker]:hidden my-2">
                                <summary className="flex cursor-pointer items-center justify-between gap-4 bg-white px-4 py-1 font-medium text-gray-400 focus:outline-0">
                                    <span className="text-xs">データ</span>

                                    <svg className="size-3 shrink-0 transition-transform group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </summary>

                                <div className="border-t-2 border-gray-500 p-4">
                                    {props.result.params && (
                                        <p className="font-mono text-xs break-words whitespace-pre-wrap text-gray-600">
                                            {JSON.stringify(props.result.params, null, 2)}
                                        </p>
                                    )}
                                </div>
                            </details>
                        </div>
                    )}
                </div>

                <footer className="mt-6 flex justify-end gap-2">
                    <button type="button" className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200" onClick={props.onClose}>
                        わかった
                    </button>
                </footer>
            </div>
        </div>
    );
}