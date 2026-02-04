import Link from "next/link";

type VoteData = {
    score: number;
    userVote: number | null;
};

type Sample = {
    id: string;
    label: string;
    embedderVersion: string;
    imageUrl: string | null;
    createdAt: string;
};

type SampleCardProps = {
    sample: Sample;
    voteData?: VoteData;
    isVoting: boolean;
    onVote: (sampleId: string, vote: 1 | -1) => void;
};

export default function SampleCard({ sample, voteData, isVoting, onVote }: SampleCardProps) {
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

    return (
        <div className="bg-white rounded-lg p-4 shadow-md border-2 border-gray-200 hover:border-yellow-400 transition-colors">
            <Link href={`/samples/${sample.id}`} className="block">
                <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getLabelColor(sample.label)}`}>
                        {getLabelDisplay(sample.label)}
                    </span>
                    <p className="text-xs text-gray-500">{new Date(sample.createdAt).toLocaleString("ja-JP")}</p>
                </div>
                {sample.imageUrl && (
                    <div className="mt-3">
                        <img src={sample.imageUrl} alt={sample.label} className="w-full h-48 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                    </div>
                )}
                <div className="mt-2">
                    <p className="text-sm text-gray-700 font-mono">ID: {sample.id}</p>
                    <p className="text-xs text-gray-500 font-mono">Version: {sample.embedderVersion}</p>
                </div>
            </Link>
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => onVote(sample.id, 1)}
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
                    onClick={() => onVote(sample.id, -1)}
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
    );
}
