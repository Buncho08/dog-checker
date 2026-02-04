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
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4">学習データとして登録</h3>

                {loading ? (
                    <div className="text-center py-4 text-gray-500">読み込み中...</div>
                ) : (
                    <div className="space-y-4 mb-6">
                        {existingLabels.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    既存のラベルから選択
                                </label>
                                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
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
                                            <span className="text-sm">{getDisplayLabel(label)}</span>
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

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || loading || (isNewLabel && newLabel.trim().length === 0) || (!isNewLabel && !selectedLabel)}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {submitting ? "登録中..." : "登録"}
                    </button>
                </div>
            </div>
        </div>
    );
}
