import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AttendanceDayBoundary from '@/app/(dashboard)/attendance/_components/AttendanceDayBoundary';
import { getVietnamDate, isCalendarDate, millisecondsUntilVietnamMidnight, resolveAttendanceDate } from '@/lib/attendance-date';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => {
    const router = { refresh };
    return { useRouter: () => router };
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('attendance date selection', () => {
    it('uses Vietnam midnight, independent of the device timezone', () => {
        expect(getVietnamDate(new Date('2026-10-26T16:59:59Z'))).toBe('2026-10-26');
        expect(getVietnamDate(new Date('2026-10-26T17:00:00Z'))).toBe('2026-10-27');
        expect(millisecondsUntilVietnamMidnight(new Date('2026-10-26T16:59:59Z'))).toBe(1100);
    });

    it('opens today from legacy group links that pinned yesterday', () => {
        expect(resolveAttendanceDate({ date: '2026-10-25' }, '2026-10-26'))
            .toEqual({ selectedDate: '2026-10-26', isHistory: false });
    });

    it('keeps an explicitly selected history date', () => {
        expect(resolveAttendanceDate({ date: '2026-10-25', mode: 'history' }, '2026-10-26'))
            .toEqual({ selectedDate: '2026-10-25', isHistory: true });
    });

    it('falls back to today for malformed or impossible history dates', () => {
        for (const date of ['2026-02-30', '2026-13-01', 'not-a-date', undefined]) {
            expect(resolveAttendanceDate({ date, mode: 'history' }, '2026-10-26'))
                .toEqual({ selectedDate: '2026-10-26', isHistory: false });
        }
        expect(isCalendarDate('2024-02-29')).toBe(true);
        expect(isCalendarDate('2025-02-29')).toBe(false);
    });
});

describe('daily attendance rollover', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-26T16:59:59Z'));
        refresh.mockClear();
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    });

    it('unmounts yesterday controls at midnight and loads a newly keyed day', () => {
        const { rerender } = render(
            <AttendanceDayBoundary renderedDate="2026-10-26" isHistory={false}>
                <button>Lưu ngày cũ</button>
            </AttendanceDayBoundary>,
        );
        expect(refresh).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(1100); });
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('button', { name: 'Lưu ngày cũ' })).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Đã sang ngày mới');

        rerender(
            <AttendanceDayBoundary key="2026-10-27" renderedDate="2026-10-27" isHistory={false}>
                <button>Lưu ngày mới</button>
            </AttendanceDayBoundary>,
        );
        expect(screen.getByRole('button', { name: 'Lưu ngày mới' })).toBeInTheDocument();
    });

    it('detects an old page restored after mobile background suspension', () => {
        render(<AttendanceDayBoundary renderedDate="2026-10-26" isHistory={false}><button>Thẻ cũ</button></AttendanceDayBoundary>);
        vi.setSystemTime(new Date('2026-10-28T03:00:00Z'));
        fireEvent.focus(window);
        expect(refresh).toHaveBeenCalledOnce();
        expect(screen.queryByRole('button', { name: 'Thẻ cũ' })).not.toBeInTheDocument();
    });

    it('leaves history available across midnight without refreshing it to today', () => {
        render(<AttendanceDayBoundary renderedDate="2026-10-25" isHistory><button>Lịch sử đã lưu</button></AttendanceDayBoundary>);
        act(() => { vi.advanceTimersByTime(60_000); });
        fireEvent.focus(window);
        expect(refresh).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Lịch sử đã lưu' })).toBeInTheDocument();
    });

    it('blocks stale controls while offline and resumes when the network returns', () => {
        const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
        render(<AttendanceDayBoundary renderedDate="2026-10-26" isHistory={false}><button>Lưu cũ</button></AttendanceDayBoundary>);
        act(() => { vi.advanceTimersByTime(1100); });
        expect(refresh).not.toHaveBeenCalled();
        expect(screen.queryByRole('button', { name: 'Lưu cũ' })).not.toBeInTheDocument();
        online.mockReturnValue(true);
        fireEvent.online(window);
        expect(refresh).toHaveBeenCalledOnce();
    });
});
