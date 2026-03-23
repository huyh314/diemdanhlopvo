export function GroupSummarySkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
        </div>
    );
}

export function AttendanceGridSkeleton() {
    return (
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)]">
            <div className="p-4 border-b border-[var(--border-primary)] bg-white/[0.02] flex gap-4 animate-pulse">
                <div className="h-10 bg-white/10 rounded-lg w-1/3"></div>
                <div className="h-10 bg-white/10 rounded-lg w-2/3"></div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-40 rounded-xl bg-white/5 border border-white/10" />
                ))}
            </div>
        </div>
    );
}
