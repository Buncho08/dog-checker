"use client";

import { useEffect, useState } from "react";

interface VoteButtonsProps {
    sampleId: string;
    className?: string;
}

export default function VoteButtons({ sampleId, className = "" }: VoteButtonsProps) {
    const [voteScore, setVoteScore] = useState<number>(0);
    const [userVote, setUserVote] = useState<number | null>(null);
    const [voting, setVoting] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchVote = async () => {
            try {
                const voteRes = await fetch(`/api/votes?sampleId=${sampleId}`);
                if (voteRes.ok) {
                    const voteData = await voteRes.json();
                    setVoteScore(voteData.score || 0);
                    setUserVote(voteData.userVote);
                }
            } catch (err) {
                console.error("Failed to fetch vote:", err);
            } finally {
                setLoading(false);
            }
        };
        void fetchVote();
    }, [sampleId]);

    const handleVote = async (vote: 1 | -1) => {
        setVoting(true);
        try {
            const res = await fetch("/api/votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sampleId, vote }),
            });
            if (res.ok) {
                const data = await res.json();
                setVoteScore(data.score);
                setUserVote(data.userVote);
            }
        } catch (err) {
            console.error("Failed to vote:", err);
        } finally {
            setVoting(false);
        }
    };

    if (loading) {
        return (
            <div className={`flex justify-center items-center gap-3 ${className}`}>
                <span className="text-sm text-gray-500">読み込み中...</span>
            </div>
        );
    }

    return (
        <div className={`flex justify-center items-center gap-3 ${className}`}>
            <span className="text-sm text-gray-600">あってた？</span>
            <button
                onClick={() => handleVote(1)}
                disabled={voting}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${userVote === 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 hover:bg-green-100 text-gray-700"
                    } disabled:opacity-50`}
                title="良い判定"
            >
                👍 あってるね
            </button>
            {voteScore !== 0 && (
                <span className="text-sm font-bold text-gray-700 min-w-[32px] text-center">
                    {voteScore > 0 ? "+" : ""}
                    {voteScore}
                </span>
            )}
            <button
                onClick={() => handleVote(-1)}
                disabled={voting}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${userVote === -1
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 hover:bg-red-100 text-gray-700"
                    } disabled:opacity-50`}
                title="悪い判定"
            >
                👎 あってないね
            </button>
        </div>
    );
}
