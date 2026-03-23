export function RankingsSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-8 bg-white/10 rounded w-1/3"></div>
                <div className="h-6 bg-white/10 rounded w-24"></div>
            </div>
            <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)]">
                <div className="h-12 bg-white/[0.02] border-b border-[var(--border-primary)]"></div>
                <div className="space-y-2 p-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-12 bg-white/5 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
