export default function Loading() {
    return (<div className="bg-white/80 border rounded-2xl top-0 bottom-0 left-0 right-0 m-auto absolute z-10">
        <div className="flex justify-center items-center h-full" aria-label="読み込み中">
            <div className="animate-spin h-10 w-10 border-4  border-l-cyan-500 border-b-yellow-300 rounded-full border-t-transparent"></div>
        </div>
    </div>)
}