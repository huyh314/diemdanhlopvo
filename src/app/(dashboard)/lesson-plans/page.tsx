// =============================================
// LESSON PLANS PAGE — Server Component
// =============================================

import Link from 'next/link';
import { getLessonPlans, getTechniques } from '@/lib/dal';
import LessonPlanClient from './LessonPlanClient';

export const metadata = {
    title: 'Giáo Án — Võ Đường Manager',
    description: 'Quản lý giáo án buổi học võ thuật theo tuần',
};

// Compute ISO week range for current week
function getCurrentWeekRange(): { fromDate: string; toDate: string } {
    const now = new Date();
    const day = now.getDay() || 7; // Mon=1, Sun=7
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
        fromDate: monday.toLocaleDateString('en-CA'),
        toDate: sunday.toLocaleDateString('en-CA'),
    };
}

export default async function LessonPlansPage() {
    const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
    });

    const { fromDate, toDate } = getCurrentWeekRange();

    // Load plans for a wider range (±4 weeks) so client can navigate freely
    const extendedFrom = new Date(fromDate);
    extendedFrom.setDate(extendedFrom.getDate() - 28);
    const extendedTo = new Date(toDate);
    extendedTo.setDate(extendedTo.getDate() + 28);

    const plans = await getLessonPlans({
        fromDate: extendedFrom.toLocaleDateString('en-CA'),
        toDate: extendedTo.toLocaleDateString('en-CA'),
    });

    const techniques = await getTechniques();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">📖 Giáo Án</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Lên kế hoạch và tham chiếu đòn thế từ Thư viện
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link 
                        href="/techniques" 
                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                    >
                        📚 Thư Viện Đòn Thế
                    </Link>
                </div>
            </div>

            {/* Client-side interactive calendar */}
            <LessonPlanClient initialPlans={plans} today={today} libraryTechniques={techniques} />
        </div>
    );
}
