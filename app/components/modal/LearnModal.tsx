"use client";

import { useState, useEffect } from "react";

interface LearnModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (label: string) => Promise<void>;
}

export default function LearnModal({ open, onClose, onSubmit }: LearnModalProps) {
    const [existingLabels, setExistingLabels] = useState<string[]>([]);
    const [selectedLabel, setSelectedLabel] = useState<string>("");
    const [isNewLabel, setIsNewLabel] = useState(false);
    const [newLabel, setNewLabel] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    // 既存ラベルを取得
    useEffect(() => {
        if (open) {
            setLoading(true);
            fetch("/api/labels")
                .then((res) => res.json())
                .then((data: { labels: string[] }) => {
                    setExistingLabels(data.labels);
                    if (data.labels.length > 0) {
                        setSelectedLabel(data.labels[0]);
                    }
                })
                .catch((err) => {
                    console.error("Failed to fetch labels:", err);
                    setExistingLabels([]);
                })
                .finally(() => setLoading(false));
        }
    }, [open]);

    // モーダルが開かれるたびに状態をリセット
    useEffect(() => {
        if (open) {
            setIsNewLabel(false);
            setNewLabel("");
            setSubmitting(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const labelToSend = isNewLabel ? newLabel.trim() : selectedLabel;
            if (!labelToSend) {
                return;
            }
            await onSubmit(labelToSend);
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    const labelMap: Record<string, string> = {
        DOG: "いぬ",
        NOT_DOG: "いぬじゃない"
    };
    const getDisplayLabel = (label: string) => labelMap[label] || label;

    return (
        <div className="bg-white/80 top-0 bottom-0 left-0 right-0 m-auto absolute z-10 flex justify-center items-center">
            <div className="fixed inset-0 z-50 grid place-content-center bg-black/50 p-2 md:p-4" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
                <div className="w-full max-w-xs sm:max-w-md rounded-lg bg-white p-4 md:p-6 shadow-lg max-h-[90vh] overflow-y-auto">
                    <div className="flex items-start justify-between">
                        <h2 id="modalTitle" className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">学習データとして登録</h2>

                        <button type="button" onClick={onClose} className="-me-2 md:-me-4 -mt-2 md:-mt-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 focus:outline-none" aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <div className="mt-3 md:mt-4">
                        {loading ? (
                            <div className="text-center py-4 text-sm text-gray-500">読み込み中...</div>
                        ) : (
                                <div className="space-y-4">
                                    {existingLabels.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                既存のラベルから選択
                                            </label>
                                            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3 bg-gray-50">
                                                {existingLabels.map((label) => (
                                                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="labelChoice"
                                                            value={label}
                                                            checked={!isNewLabel && selectedLabel === label}
                                                            onChange={() => {
                                                                setIsNewLabel(false);
                                                                setSelectedLabel(label);
                                                            }}
                                                            className="w-4 h-4"
                                                        />
                                                    <span className="text-sm text-gray-700">{getDisplayLabel(label)}</span>
                                                </label>
                                            ))}
                                            </div>
                                        </div>
                                    )}

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                        <input
                                            type="radio"
                                            name="labelChoice"
                                            checked={isNewLabel}
                                            onChange={() => setIsNewLabel(true)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium text-gray-700">新しいラベルを追加</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newLabel}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if ([...value].length <= 5) {
                                                setNewLabel(value);
                                            }
                                        }}
                                        onFocus={() => setIsNewLabel(true)}
                                        disabled={!isNewLabel}
                                        placeholder="例: ねこ、CAT、🐱など（最大5文字）"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <footer className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
                        >
                            キャンセル
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || loading || (isNewLabel && newLabel.trim().length === 0) || (!isNewLabel && !selectedLabel)}
                            className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {submitting ? "登録中..." : "登録"}
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    );
}
