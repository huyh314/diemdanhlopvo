export default function StudentsLoading() {
    return (
        <div role="status" aria-label="Đang tải danh sách học sinh" className="space-y-6">
            <h2 className="text-xl font-bold">👥 Danh Sách Học Sinh</h2>
            <div aria-hidden="true" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 motion-safe:animate-pulse">
                {Array.from({ length: 9 }, (_, index) => (
                    <div key={index} className="h-20 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]" />
                ))}
            </div>
        </div>
    );
}
