import { useState } from "react";

type LabelFilterProps = {
    allLabels: string[];
    selectedLabels: string[];
    onFilterChange: (labels: string[]) => void;
};

export default function LabelFilter({ allLabels, selectedLabels, onFilterChange }: LabelFilterProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getLabelDisplay = (label: string) => {
        if (label === "DOG") return "いぬ";
        if (label === "NOT_DOG") return "いぬじゃない";
        return label;
    };

    const toggleLabel = (label: string) => {
        if (selectedLabels.includes(label)) {
            onFilterChange(selectedLabels.filter(l => l !== label));
        } else {
            onFilterChange([...selectedLabels, label]);
        }
    };

    const clearFilters = () => {
        onFilterChange([]);
    };

    const selectAll = () => {
        onFilterChange([...allLabels]);
    };

    return (
        <div className="bg-white rounded-lg shadow-md border-2 border-gray-200">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-3 py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
            >
                <span>ラベルでフィルタ {selectedLabels.length > 0 && `(${selectedLabels.length}件選択中)`}</span>
                <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-200">
                    <div className="flex gap-2 mb-3 text-xs">
                        <button
                            onClick={selectAll}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                        >
                            すべて選択
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                        >
                            クリア
                        </button>
                    </div>
                    <div className="space-y-2">
                        {allLabels.map(label => (
                            <label key={label} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedLabels.includes(label)}
                                    onChange={() => toggleLabel(label)}
                                    className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-300"
                                />
                                <span className="text-sm text-gray-700">{getLabelDisplay(label)}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
