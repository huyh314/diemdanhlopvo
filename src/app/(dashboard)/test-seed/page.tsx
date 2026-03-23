'use client';

import { useTransition, useState } from 'react';
import { run10DaySeedAction } from '@/lib/seed.actions';
import { Button } from '@/components/ui';

export default function TestSeedPage() {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState('');

    function handleSeed() {
        if (!confirm('Bạn có chắc muốn tự động tạo dữ liệu điểm danh và chấm điểm cho 10 ngày qua không? Việc này có thể mất vài giây.')) return;

        startTransition(async () => {
            setMessage('Đang xử lý...');
            const res = await run10DaySeedAction();
            if (res.success) {
                setMessage(res.message || 'Hoàn thành!');
            } else {
                setMessage('Lỗi: ' + res.error);
            }
        });
    }

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-yellow-400">Giả Lập Dữ Liệu 10 Ngày</h1>

            <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-secondary)]">
                <p className="text-[var(--text-secondary)] mb-6">
                    Nhấn nút bên dưới để tự động tạo dữ liệu điểm danh (Có mặt, Vắng, Phép ngẫu nhiên) cho 10 ngày qua,
                    và dữ liệu chấm điểm thi đua cho 2 tuần gần nhất. Dữ liệu này sẽ được lưu thẳng vào Supabase.
                    <br /><br />
                    Dữ liệu cũ của bạn KHÔNG bị xóa. Nó sẽ tự động dùng Upsert (Update phần mới, giữ nguyên phần cũ nếu trùng).
                </p>

                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSeed}
                    disabled={isPending}
                    loading={isPending}
                    className="w-full text-lg shadow-[0_0_20px_rgba(var(--accent-rgb-from),0.3)]"
                >
                    {isPending ? 'Đang tạo dữ liệu...' : '🚀 CHẠY GIẢ LẬP 10 NGÀY NGAY'}
                </Button>

                {message && (
                    <div className="mt-6 p-4 rounded-lg bg-black/20 border border-[var(--border-primary)] text-center text-sm font-mono text-[var(--accent-from)]">
                        {message}
                    </div>
                )}
            </div>

            <div className="text-sm text-[var(--text-tertiary)] border-l-2 border-yellow-500/50 pl-4 py-2">
                <h3 className="font-bold text-white mb-2">Sau khi chạy xong, hãy kiểm tra:</h3>
                <ul className="list-disc pl-4 space-y-1">
                    <li>Vào trang Điểm Danh xem các ngày trước. Tốc độ chuyển ngày vẫn nhanh.</li>
                    <li>Vào trang Dashboard để xem Biểu đồ Thống kê 10 ngày qua.</li>
                    <li>Vào trang Xếp Hạng để xem thứ hạng tuần trước và tuần này. Dữ liệu không bị đè lên nhau.</li>
                </ul>
            </div>
        </div>
    );
}
