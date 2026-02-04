type SortOption = "date-desc" | "date-asc" | "label-asc" | "label-desc";

type SortControlsProps = {
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
};

export default function SortControls({ sortBy, onSortChange }: SortControlsProps) {
    return (
        <div className="bg-white rounded-lg p-3 shadow-md border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">並び替え</label>
            <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
            >
                <option value="date-desc">日付が新しい順</option>
                <option value="date-asc">日付が古い順</option>
                <option value="label-asc">ラベル順（A-Z）</option>
                <option value="label-desc">ラベル順（Z-A）</option>
            </select>
        </div>
    );
}
