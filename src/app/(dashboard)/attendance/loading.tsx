// Loading skeleton for attendance page
export default function AttendanceLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="h-8 w-48 bg-gray-700 rounded-lg" />
            <div className="h-4 w-32 bg-gray-800 rounded" />

            {/* Summary cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl bg-gray-800/50 border border-gray-700 p-4 h-24" />
                ))}
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-20 bg-gray-800 rounded-lg" />
                ))}
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-gray-800/50 border border-gray-700 p-4 h-32" />
                ))}
            </div>
        </div>
    );
}
