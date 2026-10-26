export const ATTENDANCE_DAY_CHECK_EVENT = 'attendance:check-day';

export function getVietnamDate(now = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const part = (type: string) => parts.find(value => value.type === type)!.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isCalendarDate(value: string | undefined): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function resolveAttendanceDate(params: { date?: string; mode?: string }, today: string) {
    // Old group links pinned ?date= to a day. Only an explicit history selection now pins a date.
    const isHistory = params.mode === 'history' && isCalendarDate(params.date);
    return { selectedDate: isHistory ? params.date! : today, isHistory };
}

export function millisecondsUntilVietnamMidnight(now = new Date()): number {
    const midnight = new Date(`${getVietnamDate(now)}T00:00:00+07:00`).getTime();
    return Math.max(100, midnight + 86_400_000 - now.getTime() + 100);
}
