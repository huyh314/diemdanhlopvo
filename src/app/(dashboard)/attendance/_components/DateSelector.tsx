'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { InputField } from '@/components/ui';
import { getVietnamDate, isCalendarDate } from '@/lib/attendance-date';

interface DateSelectorProps {
    selectedDate: string;
    isHistory: boolean;
}

export default function DateSelector({ selectedDate, isHistory }: DateSelectorProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Khi người dùng chọn ngày mới
    const handleDateChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newDate = e.target.value;
            if (!isCalendarDate(newDate)) return;

            // Cập nhật search params
            const params = new URLSearchParams(searchParams);
            params.delete('date');
            params.delete('mode');
            if (newDate !== getVietnamDate()) {
                params.set('date', newDate);
                params.set('mode', 'history');
            }

            // Navigate với transition để có UI mượt
            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`);
            });
        },
        [pathname, router, searchParams]
    );

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--text-muted)] font-medium">Ngày:</span>
            <div className={`relative transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                <InputField
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-auto py-1.5 px-3 text-sm rounded-lg"
                    disabled={isPending}
                    aria-label="Chọn ngày điểm danh"
                />
            </div>
            <button type="button" disabled={isPending} onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('date');
                params.delete('mode');
                startTransition(() => {
                    if (searchParams.has('date') || searchParams.has('mode')) {
                        router.push(`${pathname}?${params.toString()}`, { scroll: false });
                    } else {
                        router.refresh();
                    }
                });
            }} className="min-h-10 rounded-lg border border-[var(--border-primary)] px-3 text-sm font-semibold disabled:opacity-50">
                Hôm nay
            </button>
            <span className="basis-full text-xs text-[var(--text-secondary)]">
                {isHistory ? 'Đang xem lịch sử của ngày đã chọn.' : 'Tự chuyển ngày lúc 00:00, giờ Việt Nam.'}
            </span>
        </div>
    );
}
