export default function LessonPlansLoading() {
    return (
        <div role="status" aria-label="Đang tải giáo án" className="space-y-6">
            <h2 className="text-xl font-bold">📖 Giáo Án</h2>
            <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
                <div className="h-12 rounded-xl bg-[var(--bg-secondary)]" />
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    {Array.from({ length: 7 }, (_, index) => (
                        <div key={index} className="h-40 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]" />
                    ))}
                </div>
            </div>
        </div>
    );
}
