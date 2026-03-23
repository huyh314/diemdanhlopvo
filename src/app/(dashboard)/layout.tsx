// =============================================
// (dashboard) Layout — Authenticated App Shell
// =============================================

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ToastProvider } from '@/components/Toast';
import DashboardNav from '@/components/DashboardNav';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <ToastProvider>
            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
                {/* Aurora Background */}
                <div className="aurora-bg" />
                <div className="aurora-blob" />

                {/* Nav */}
                <DashboardNav />

                {/* Page Content */}
                <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
                    {children}
                </main>
            </div>
        </ToastProvider>
    );
}
