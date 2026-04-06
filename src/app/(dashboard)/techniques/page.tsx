// =============================================
// TECHNIQUES PAGE — Server Component
// =============================================

import { getTechniques } from '@/lib/dal';
import TechniquesClient from './TechniquesClient';

export const metadata = {
    title: 'Thư Viện Kỹ Thuật — Võ Đường Manager',
    description: 'Kho dữ liệu video/hình ảnh đòn thế dùng chung cho toàn bộ giáo án.',
};

export default async function TechniquesPage() {
    const techniques = await getTechniques();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">🥋 Thư Viện Kỹ Thuật</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Quản lý kho dữ liệu video và hình ảnh đòn thế
                    </p>
                </div>
            </div>

            <TechniquesClient initialTechniques={techniques} />
        </div>
    );
}
