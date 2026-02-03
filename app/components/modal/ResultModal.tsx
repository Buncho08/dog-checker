import { PredictResponse, Neighbor } from "../../type/PredictResponse";
export type ModalProps = {
    result: PredictResponse;
    topNeighbor: Neighbor;
    open: boolean;
    onClose: () => void;
};
export default function ResultModal(props: ModalProps) {
    const toPercent = (v: number) => `${Math.round(v * 100)}%`;
    const label = { DOG: "いぬ", NOT_DOG: "いぬじゃない", UNKNOWN: "わからない" };

    return (<div className="bg-white/80 top-0 bottom-0 left-0 right-0 m-auto absolute z-10 flex justify-center items-center">
        <div className="fixed inset-0 z-50 grid place-content-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                <div className="flex items-start justify-between">
                    <h2 id="modalTitle" className="text-xl font-bold text-gray-900 sm:text-2xl">これは…{label[props.result.label]}</h2>

                    <button type="button" onClick={props.onClose} className="-me-4 -mt-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 focus:outline-none" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <div className="mt-4">
                    <p className="text-pretty text-gray-700">
                        判定モデル: {props.result.embedderVersion}
                    </p>
                    <p className="text-pretty text-gray-700">
                        スコア: {toPercent(props.result.score)}
                    </p>
                    <p className="text-pretty text-gray-700">
                        いぬである確率: {toPercent(props.result.pDog)}
                    </p>
                    <p className="text-pretty text-gray-700">
                        総学習データ件数: {props.result.sampleCount}
                    </p>
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
                            <details className="group border border-gray-500 shadow-[4px_4px_0_0] shadow-gray-500 [&amp;_summary::-webkit-details-marker]:hidden my-2">
                                <summary className="flex cursor-pointer items-center justify-between gap-4 bg-white px-4 py-1 font-medium text-gray-400 focus:outline-0">
                                    <span className="text-xs">データ</span>

                                    <svg className="size-3 shrink-0 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </summary>

                                <div className="border-t-2 border-gray-500 p-4">
                                    {props.result.params && (
                                        <p className="mono text-xs wrap-break-word overflow-wrap whitespace-pre-wrap text-gray-600">
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
    </div>)
}