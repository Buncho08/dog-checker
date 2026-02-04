type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showEllipsis = totalPages > 7;

        if (!showEllipsis) {
            // 7ページ以下の場合は全て表示
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // 常に最初のページを表示
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // 現在のページ周辺を表示
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // 常に最後のページを表示
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-1 mt-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="前のページ"
            >
                &lt;
            </button>

            {getPageNumbers().map((page, index) => {
                if (page === '...') {
                    return (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-gray-500">
                            ...
                        </span>
                    );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                                ? 'bg-yellow-300 text-black border-2 border-black'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        aria-label={`ページ ${pageNum}`}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {pageNum}
                    </button>
                );
            })}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="次のページ"
            >
                &gt;
            </button>
        </div>
    );
}
