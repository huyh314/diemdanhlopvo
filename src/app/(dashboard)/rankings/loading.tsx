// Loading skeleton for rankings page
export default function RankingsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-64 bg-gray-700 rounded-lg" />
            <div className="rounded-xl bg-gray-800/50 border border-gray-700 overflow-hidden">
                <div className="h-12 bg-gray-800 border-b border-gray-700" />
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-14 border-b border-gray-800" />
                ))}
            </div>
        </div>
    );
}
