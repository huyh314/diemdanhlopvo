'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { LessonPlanRow, LessonPlanSection, GroupId } from '@/types/database.types';
import { GROUPS, getGroupName } from '@/lib/constants';
import { deleteLessonPlanAction } from '@/lib/lesson-plan.actions';
import LessonPlanModal from './LessonPlanModal';

// =============================================
// DATE UTILS
// =============================================

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sun
    const diff = day === 0 ? -6 : 1 - day; // start on Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date: Date, n: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

function toLocalISO(date: Date): string {
    return date.toLocaleDateString('en-CA');
}

function formatDayLabel(date: Date): string {
    return date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh',
    });
}

function formatWeekRange(weekStart: Date): string {
    const end = addDays(weekStart, 6);
    const startStr = weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const endStr = end.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
}

// =============================================
// SECTION CONFIG
// =============================================

const SECTION_CONFIG: Record<LessonPlanSection, { icon: string; label: string }> = {
    khoi_dong: { icon: '🔥', label: 'Khởi Động' },
    ky_thuat:  { icon: '⚔️', label: 'Kỹ Thuật' },
    the_luc:   { icon: '💪', label: 'Thể Lực' },
    tong_ket:  { icon: '📝', label: 'Tổng Kết' },
};

const GROUP_COLORS: Record<string, string> = {
    nhom_1: 'from-blue-500/30 to-blue-600/10 border-blue-500/40',
    nhom_2: 'from-emerald-500/30 to-emerald-600/10 border-emerald-500/40',
    nhom_3: 'from-violet-500/30 to-violet-600/10 border-violet-500/40',
};

// =============================================
// PLAN CARD
// =============================================

function PlanCard({
    plan,
    libraryTechniques,
    onEdit,
    onDelete,
}: {
    plan: LessonPlanRow;
    libraryTechniques: import('@/types/database.types').TechniqueRow[];
    onEdit: (plan: LessonPlanRow) => void;
    onDelete: (id: string) => void;
}) {
    const colorClass = GROUP_COLORS[plan.group_id] ?? 'from-white/10 to-white/5 border-white/20';
    const totalItems = plan.content.reduce((acc, s) => acc + s.items.length, 0);

    return (
        <div className={`rounded-xl border bg-gradient-to-br p-3.5 space-y-2.5 group relative ${colorClass}`}>
            {/* Group badge + actions */}
            <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10">
                    {getGroupName(plan.group_id)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(plan)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/15 text-xs"
                        title="Sửa giáo án"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onDelete(plan.id)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 text-xs"
                        title="Xóa giáo án"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Title */}
            <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                📖 {plan.title}
            </p>

            {/* Content preview */}
            {plan.content.filter(s => s.items.length > 0).length > 0 ? (
                <div className="space-y-1.5">
                    {plan.content
                        .filter((s) => s.items.length > 0)
                        .map((sec) => {
                            const cfg = SECTION_CONFIG[sec.type];
                            return (
                                <div key={sec.type}>
                                    <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                                        {cfg.icon} {cfg.label}
                                    </p>
                                    <ul className="pl-3 space-y-0.5">
                                        {sec.items.slice(0, 3).map((item, i) => (
                                            <li key={i} className="text-xs text-[var(--text-secondary)] truncate">
                                                • {item}
                                            </li>
                                        ))}
                                        {sec.items.length > 3 && (
                                            <li className="text-xs text-[var(--text-muted)] italic">
                                                +{sec.items.length - 3} mục khác...
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            );
                        })}
                </div>
            ) : (
                <p className="text-xs text-[var(--text-muted)] italic">{totalItems === 0 ? 'Chưa có nội dung' : ''}</p>
            )}

            {/* Attachments thumbnails */}
            {plan.attachments && plan.attachments.length > 0 && (
                <div className="border-t border-white/10 pt-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                        {plan.attachments.slice(0, 5).map((url, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                key={i}
                                src={url}
                                alt={`Tài liệu ${i + 1}`}
                                className="w-10 h-10 shrink-0 rounded-lg object-cover border border-white/10 hover:scale-110 transition-transform cursor-pointer"
                                title="Ảnh tài liệu"
                            />
                        ))}
                        {plan.attachments.length > 5 && (
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-[10px] text-[var(--text-muted)] font-bold">
                                +{plan.attachments.length - 5}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Technique Attachments */}
            {plan.technique_ids && plan.technique_ids.length > 0 && (
                <div className="border-t border-white/10 pt-2 flex flex-wrap gap-1.5">
                    {plan.technique_ids.map(tid => {
                        const t = libraryTechniques.find(tech => tech.id === tid);
                        if (!t) return null;
                        return (
                            <span key={tid} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-[var(--text-secondary)] font-medium">
                                <span className="opacity-70">🥋</span> {t.title}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Notes */}
            {plan.notes && (
                <p className="text-xs text-[var(--text-muted)] border-t border-white/10 pt-2 italic truncate">
                    📌 {plan.notes}
                </p>
            )}
        </div>
    );
}

// =============================================
// MAIN CLIENT COMPONENT
// =============================================

interface LessonPlanClientProps {
    initialPlans: LessonPlanRow[];
    today: string;
    libraryTechniques?: import('@/types/database.types').TechniqueRow[];
}

export default function LessonPlanClient({ initialPlans, today, libraryTechniques = [] }: LessonPlanClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // ── State ──────────────────────────────────────────────────────
    const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date(today)));
    const [plans, setPlans] = useState<LessonPlanRow[]>(initialPlans);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<LessonPlanRow | undefined>();
    const [defaultDate, setDefaultDate] = useState(today);
    const [filterGroup, setFilterGroup] = useState<GroupId | 'all'>('all');

    // ── Week Navigation ────────────────────────────────────────────
    function prevWeek() {
        setWeekStart((d) => addDays(d, -7));
        router.refresh();
    }

    function nextWeek() {
        setWeekStart((d) => addDays(d, 7));
        router.refresh();
    }

    function goToday() {
        setWeekStart(getWeekStart(new Date(today)));
        router.refresh();
    }

    // ── Handlers ───────────────────────────────────────────────────
    function handleAddOnDay(dateStr: string) {
        setEditingPlan(undefined);
        setDefaultDate(dateStr);
        setShowModal(true);
    }

    function handleEdit(plan: LessonPlanRow) {
        setEditingPlan(plan);
        setShowModal(true);
    }

    function handleDelete(id: string) {
        if (!confirm('Bạn có chắc muốn xóa giáo án này không?')) return;
        startTransition(async () => {
            const result = await deleteLessonPlanAction(id);
            if (result.success) {
                setPlans((prev) => prev.filter((p) => p.id !== id));
            } else {
                alert('Xóa thất bại: ' + result.error);
            }
        });
    }

    const handleModalSuccess = useCallback(() => {
        router.refresh();
    }, [router]);

    // ── Compute week days ──────────────────────────────────────────
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        return {
            date,
            dateStr: toLocalISO(date),
            label: formatDayLabel(date),
            isToday: toLocalISO(date) === today,
        };
    });

    // Filter out Sunday (day 0, last in our Mon-Sun range)
    const activeDays = weekDays.filter((d) => d.date.getDay() !== 0); // Remove Sunday if desired; keep all 7 otherwise

    // Plans per day
    function plansForDay(dateStr: string): LessonPlanRow[] {
        return plans.filter(
            (p) =>
                p.session_date === dateStr &&
                (filterGroup === 'all' || p.group_id === filterGroup)
        );
    }

    // ── Render ─────────────────────────────────────────────────────

    return (
        <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Week Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevWeek}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-primary)] hover:bg-white/5 transition text-[var(--text-muted)] text-lg"
                    >
                        ‹
                    </button>
                    <button
                        onClick={goToday}
                        className="px-3 py-1.5 rounded-lg border border-[var(--border-primary)] hover:bg-white/5 transition text-xs font-medium text-[var(--text-muted)]"
                    >
                        Hôm nay
                    </button>
                    <button
                        onClick={nextWeek}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-primary)] hover:bg-white/5 transition text-[var(--text-muted)] text-lg"
                    >
                        ›
                    </button>
                    <span className="text-sm text-[var(--text-muted)] ml-1 hidden sm:block">
                        {formatWeekRange(weekStart)}
                    </span>
                </div>

                {/* Group filter + Add button */}
                <div className="flex items-center gap-2">
                    {/* Group filter */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setFilterGroup('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterGroup === 'all' ? 'bg-[var(--accent-from)]/20 text-blue-300 border border-[var(--accent-from)]/40' : 'border border-transparent text-[var(--text-muted)] hover:bg-white/5'}`}
                        >
                            Tất cả
                        </button>
                        {GROUPS.map((g) => (
                            <button
                                key={g.id}
                                onClick={() => setFilterGroup(g.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterGroup === g.id ? 'bg-[var(--accent-from)]/20 text-blue-300 border border-[var(--accent-from)]/40' : 'border border-transparent text-[var(--text-muted)] hover:bg-white/5'}`}
                            >
                                {g.shortName}
                            </button>
                        ))}
                    </div>

                    {/* Add button */}
                    <button
                        onClick={() => handleAddOnDay(today)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white font-semibold text-sm shadow-lg hover:opacity-90 transition"
                    >
                        <span className="text-base leading-none">+</span>
                        <span>Thêm</span>
                    </button>
                </div>
            </div>

            {/* Mobile: week range */}
            <p className="text-xs text-[var(--text-muted)] sm:hidden">{formatWeekRange(weekStart)}</p>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {weekDays.map((day) => {
                    const dayPlans = plansForDay(day.dateStr);
                    return (
                        <div
                            key={day.dateStr}
                            className={`rounded-xl border flex flex-col min-h-[140px] transition ${
                                day.isToday
                                    ? 'border-[var(--accent-from)]/60 bg-[rgba(var(--accent-rgb-from),0.08)]'
                                    : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]/50'
                            }`}
                        >
                            {/* Day header */}
                            <div
                                className={`px-3 pt-3 pb-2 border-b border-[var(--border-primary)] flex items-center justify-between ${
                                    day.isToday ? 'border-[var(--accent-from)]/20' : ''
                                }`}
                            >
                                <span
                                    className={`text-xs font-bold ${
                                        day.isToday ? 'text-[var(--accent-from)]' : 'text-[var(--text-muted)]'
                                    }`}
                                >
                                    {day.label}
                                    {day.isToday && (
                                        <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-[var(--accent-from)]/20">
                                            Hôm nay
                                        </span>
                                    )}
                                </span>
                                <button
                                    onClick={() => handleAddOnDay(day.dateStr)}
                                    title="Thêm giáo án ngày này"
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition text-sm"
                                >
                                    +
                                </button>
                            </div>

                            {/* Plans */}
                            <div className="p-2.5 space-y-2 flex-1">
                                {dayPlans.length > 0 ? (
                                    dayPlans.map((plan) => (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            libraryTechniques={libraryTechniques}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                ) : (
                                    <button
                                        onClick={() => handleAddOnDay(day.dateStr)}
                                        className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--border-primary)] text-[var(--text-muted)] hover:border-[var(--accent-from)]/40 hover:text-[var(--text-secondary)] hover:bg-white/3 transition group"
                                    >
                                        <span className="text-lg group-hover:scale-110 transition-transform">📋</span>
                                        <span className="text-[10px]">Thêm giáo án</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && (
                <LessonPlanModal
                    plan={editingPlan}
                    defaultDate={defaultDate}
                    libraryTechniques={libraryTechniques}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleModalSuccess}
                />
            )}
        </>
    );
}
