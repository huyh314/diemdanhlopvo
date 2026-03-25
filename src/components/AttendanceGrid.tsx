'use client';

import { useState, useTransition, useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useToast } from './Toast';
import { saveAttendanceAction } from '@/lib/actions';
import type { StudentRow, AttendanceStatus, GroupId } from '@/types/database.types';
import { Button, Badge } from './ui';

// =============================================
// ATTENDANCE GRID — Interactive Client Component
// =============================================

interface AttendanceGridProps {
    initialStudents: StudentRow[];
    /** Trạng thái điểm danh đã lưu từ DB (nguồn chính xác khi load trang) */
    initialStatuses?: Record<string, AttendanceStatus>;
    groupId: GroupId;
    sessionDate: string; // YYYY-MM-DD
}

const STATUS_CYCLE: AttendanceStatus[] = ['absent', 'present', 'excused'];

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: string; cardClass: string; badgeVariant: 'danger' | 'success' | 'warning' }> = {
    absent: {
        label: 'Vắng',
        icon: '',
        cardClass: 'bg-[var(--status-absent-bg)] border-[var(--border-secondary)] opacity-60 hover:opacity-100',
        badgeVariant: 'danger',
    },
    present: {
        label: 'Có mặt',
        icon: '✓',
        cardClass: 'bg-gradient-to-br from-[var(--status-present-from)] to-[var(--status-present-to)] border-[var(--status-present-border)] shadow-[var(--status-present-shadow)]',
        badgeVariant: 'success',
    },
    excused: {
        label: 'Có phép',
        icon: 'P',
        cardClass: 'bg-gradient-to-br from-[var(--status-excused-from)] to-[var(--status-excused-to)] border-[var(--status-excused-border)] shadow-[var(--status-excused-shadow)]',
        badgeVariant: 'warning',
    },
};

export default function AttendanceGrid({ initialStudents, initialStatuses, groupId, sessionDate }: AttendanceGridProps) {
    // Key unique cho mỗi nhóm + ngày để không trộn lẫn dữ liệu
    const DRAFT_KEY = `attendance_draft_${groupId}_${sessionDate}`;

    const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => {
        // 1. Xây dựng defaults từ initialStatuses (DB) — nguồn chính xác nhất
        const defaults: Record<string, AttendanceStatus> = {};
        initialStudents.forEach((s) => {
            defaults[s.id] = (initialStatuses?.[s.id]) || 'absent';
        });

        // 2. Thử merge với localStorage (ưu tiên localStorage nếu mới hơn DB)
        //    Chỉ áp dụng nếu localStorage có data — dùng làm fallback khi offline
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(DRAFT_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved) as Record<string, AttendanceStatus>;
                    // Merge: localStorage ghi đè DB (vì có thể user đã thay đổi chưa lưu)
                    const merged: Record<string, AttendanceStatus> = { ...defaults };
                    initialStudents.forEach((s) => {
                        if (parsed[s.id]) merged[s.id] = parsed[s.id];
                    });
                    return merged;
                }
            } catch { /* bỏ qua lỗi parse */ }
        }
        return defaults;
    });
    const [search, setSearch] = useState('');
    const [isPending, startTransition] = useTransition();
    const [hasChanges, setHasChanges] = useState(false);
    const { toast } = useToast();
    const gridRef = useRef<HTMLDivElement>(null);

    // Tự động lưu vào localStorage mỗi lần statuses thay đổi
    useEffect(() => {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(statuses));
        } catch { /* bỏ qua nếu localStorage đầy */ }
    }, [statuses, DRAFT_KEY]);

    // Filter students
    const filtered = useMemo(() => {
        if (!search.trim()) return initialStudents;
        const q = search.toLowerCase();
        return initialStudents.filter((s) => s.name.toLowerCase().includes(q));
    }, [initialStudents, search]);

    // GSAP Stagger Animation
    useGSAP(() => {
        if (!gridRef.current) return;

        // Reset opacity before animating
        gsap.set('.student-card', { opacity: 0, y: 40, rotationX: 15 });

        gsap.to('.student-card', {
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: 0.6,
            stagger: 0.05,
            ease: 'power3.out',
            clearProps: 'transform' // clean up after animation to allow hover effects
        });
    }, [filtered]);

    // Stats
    const stats = useMemo(() => {
        const all = Object.values(statuses);
        return {
            total: all.length,
            present: all.filter((s) => s === 'present').length,
            absent: all.filter((s) => s === 'absent').length,
            excused: all.filter((s) => s === 'excused').length,
        };
    }, [statuses]);

    const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    // Toggle status
    function toggleStatus(studentId: string) {
        // Add a micro-animation click effect to the specific card
        gsap.fromTo(`#card-${studentId}`,
            { scale: 0.92 },
            { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' }
        );

        setStatuses((prev) => {
            const current = prev[studentId] || 'absent';
            const idx = STATUS_CYCLE.indexOf(current);
            const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
            return { ...prev, [studentId]: next };
        });
        setHasChanges(true);
    }

    // Save all
    function handleSave() {
        startTransition(async () => {
            const records = Object.entries(statuses).map(([studentId, status]) => ({
                studentId,
                status,
            }));

            const result = await saveAttendanceAction({
                sessionDate,
                groupId,
                records,
            });

            if (!result.success) {
                toast(result.error || 'Lỗi khi lưu điểm danh', 'error');
            } else {
                // GIỮ NGUYÊN localStorage — không xóa draft sau khi lưu
                // Trạng thái sẽ được load từ DB khi reload trang
                // localStorage chỉ tự hết hiệu lực khi qua ngày mới (DRAFT_KEY mới)
                toast(`Đã lưu điểm danh: ${stats.present} có mặt / ${stats.total} học sinh`, 'success');
                setHasChanges(false);
            }
        });
    }

    // Initials
    function getInitials(name: string) {
        return name
            .split(' ')
            .map((w) => w[0])
            .slice(-2)
            .join('')
            .toUpperCase();
    }

    // Avatar gradient
    function getGradient(name: string) {
        const gradients = [
            'from-sky-400 to-blue-600',
            'from-purple-400 to-pink-600',
            'from-emerald-400 to-teal-600',
            'from-orange-400 to-red-600',
            'from-indigo-400 to-violet-600',
            'from-rose-400 to-pink-600',
            'from-cyan-400 to-blue-600',
            'from-amber-400 to-orange-600',
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return gradients[Math.abs(hash) % gradients.length];
    }

    return (
        <div className="space-y-4">
            {/* Stats Bar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl px-4 py-2 backdrop-blur-xl shadow-sm">
                    <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Có mặt</span>
                    <span className="text-lg font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">{stats.present}</span>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl px-4 py-2 backdrop-blur-xl shadow-sm">
                    <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Vắng</span>
                    <span className="text-lg font-bold text-red-400">{stats.absent}</span>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl px-4 py-2 backdrop-blur-xl shadow-sm">
                    <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Phép</span>
                    <span className="text-lg font-bold text-yellow-400">{stats.excused}</span>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl px-4 py-2 backdrop-blur-xl shadow-sm">
                    <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Tỉ lệ</span>
                    <span className={`text-lg font-bold ${attendanceRate >= 80 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]' : attendanceRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {attendanceRate}%
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Tìm tên học sinh..."
                    aria-label="Tìm kiếm học sinh"
                    className="w-full p-3.5 bg-[var(--bg-card)] backdrop-blur-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] rounded-2xl border border-[var(--border-secondary)] focus:outline-none focus:border-[var(--accent-from)] focus:ring-4 focus:ring-[rgba(var(--accent-rgb-from),0.1)] transition-all duration-[var(--transition-normal)] text-sm shadow-sm hover:shadow-md"
                />
            </div>

            {/* Grid with 3D Perspective */}
            <div
                ref={gridRef}
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 perspective-[1000px]"
            >
                {filtered.map((student) => {
                    const status = statuses[student.id] || 'absent';
                    const config = STATUS_CONFIG[status];

                    return (
                        <button
                            key={student.id}
                            id={`card-${student.id}`}
                            onClick={() => toggleStatus(student.id)}
                            aria-pressed={status !== 'absent'}
                            className={`student-card glass-card relative rounded-[20px] border p-4 text-center cursor-pointer group transform-gpu transition-shadow duration-[var(--transition-normal)]
                                ${config.cardClass}
                                hover:border-[var(--border-primary)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]
                            `}
                        >
                            {/* Status badge */}
                            {status !== 'absent' && (
                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${status === 'present'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-yellow-500 text-white'
                                    }`}>
                                    {config.icon}
                                </div>
                            )}

                            {/* Avatar with Animated Ring */}
                            <div className="relative w-14 h-14 mx-auto mb-3">
                                {status === 'present' && (
                                    <div className="absolute inset-[-4px] rounded-full border-2 border-emerald-400 opacity-50 animate-[spin_4s_linear_infinite]" />
                                )}
                                <div className={`w-full h-full rounded-full bg-gradient-to-br ${getGradient(student.name)} flex items-center justify-center text-lg font-bold text-white shadow-xl ring-2 ${status === 'present' ? 'ring-emerald-400/30' : 'ring-white/5'}`}>
                                    {student.avatar_url ? (
                                        <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        getInitials(student.name)
                                    )}
                                </div>
                            </div>

                            {/* Name */}
                            <h3 className="text-sm font-semibold truncate text-[var(--text-primary)] group-hover:text-white transition-colors">{student.name}</h3>
                            {student.birth_year && (
                                <p className="text-[10px] text-[var(--text-tertiary)]">({student.birth_year})</p>
                            )}

                            {/* Status label badge */}
                            <div className="mt-2">
                                <Badge variant={config.badgeVariant} className="text-[10px] !px-2 !py-0.5 shadow-sm">
                                    {config.label}
                                </Badge>
                            </div>
                        </button>
                    );
                })}
            </div>


            {filtered.length === 0 && (
                <div className="text-center py-12 text-[var(--text-tertiary)]">
                    <p className="text-4xl mb-2">📭</p>
                    <p>Không tìm thấy học sinh</p>
                </div>
            )}

            {/* Floating Save Button */}
            {hasChanges && (
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSave}
                    disabled={isPending}
                    loading={isPending}
                    className="!fixed bottom-6 right-6 !rounded-full z-40 shadow-2xl shadow-[rgba(var(--accent-rgb-from),0.4)] !text-lg"
                >
                    {isPending ? 'Đang lưu...' : '💾 LƯU'}
                </Button>
            )}
        </div>
    );
}
