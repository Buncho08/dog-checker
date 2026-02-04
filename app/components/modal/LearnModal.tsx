"use client";

import { useState, useEffect } from "react";

interface LearnModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (label: string) => Promise<void>;
}

export default function LearnModal({ open, onClose, onSubmit }: LearnModalProps) {
    const [learnLabel, setLearnLabel] = useState<"DOG" | "NOT_DOG" | "CUSTOM">("DOG");
    const [customLabel, setCustomLabel] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    // モーダルが開かれるたびに状態をリセット
    useEffect(() => {
        if (open) {
            setLearnLabel("DOG");
            setCustomLabel("");
            setSubmitting(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const labelToSend = learnLabel === "CUSTOM" ? customLabel : learnLabel;
            await onSubmit(labelToSend);
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

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
                <div className="space-y-3 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="learnLabel"
                            value="DOG"
                            checked={learnLabel === "DOG"}
                            onChange={(e) => setLearnLabel(e.target.value as "DOG")}
                            className="w-4 h-4"
                        />
                        <span className="text-lg">いぬ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="learnLabel"
                            value="NOT_DOG"
                            checked={learnLabel === "NOT_DOG"}
                            onChange={(e) => setLearnLabel(e.target.value as "NOT_DOG")}
                            className="w-4 h-4"
                        />
                        <span className="text-lg">いぬじゃない</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="learnLabel"
                            value="CUSTOM"
                            checked={learnLabel === "CUSTOM"}
                            onChange={(e) => setLearnLabel(e.target.value as "CUSTOM")}
                            className="w-4 h-4"
                        />
                        <span className="text-lg">
                            <input
                                type="text"
                                value={customLabel}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if ([...value].length <= 5) {
                                        setCustomLabel(value);
                                    }
                                }}
                                onFocus={() => setLearnLabel("CUSTOM")}
                                disabled={learnLabel !== "CUSTOM"}
                                placeholder="例: ねこ、CATなど"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </span>
                    </label>

                </div>
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
                        disabled={submitting || (learnLabel === "CUSTOM" && customLabel.trim().length === 0)}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {submitting ? "登録中..." : "登録"}
                    </button>
                </div>
            </div>
        </div>
    );
}
