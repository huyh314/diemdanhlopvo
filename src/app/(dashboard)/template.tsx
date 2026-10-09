export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-full w-full">
            {children}
        </div>
    );
}
