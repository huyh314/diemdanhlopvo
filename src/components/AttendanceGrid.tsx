'use client';

import { useState, useTransition, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useToast } from './Toast';
import { saveAttendanceAction } from '@/lib/actions';
import type { StudentRow, AttendanceStatus, GroupId } from '@/types/database.types';
import { Button, Badge } from './ui';

import { useSoundEffects } from '@/hooks/useSoundEffects';

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
        cardClass: 'bg-[var(--bg-card)] border-2 border-[var(--border-secondary)] shadow-[0_8px_16px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.05)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:-translate-y-1 hover:border-[var(--border-primary)]',
        badgeVariant: 'danger',
    },
    present: {
        label: 'Có mặt',
        icon: '✓',
        cardClass: 'bg-emerald-900/60 border-2 border-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_12px_28px_rgba(16,185,129,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:-translate-y-1',
        badgeVariant: 'success',
    },
    excused: {
        label: 'Có phép',
        icon: 'P',
        cardClass: 'bg-yellow-900/60 border-2 border-yellow-500 shadow-[0_8px_20px_rgba(234,179,8,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_12px_28px_rgba(234,179,8,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:-translate-y-1',
        badgeVariant: 'warning',
    },
};

export default function AttendanceGrid({ initialStudents, initialStatuses, groupId, sessionDate }: AttendanceGridProps) {
    // Key unique cho mỗi nhóm + ngày để không trộn lẫn dữ liệu
    const DRAFT_KEY = `attendance_draft_${groupId}_${sessionDate}`;

    const { playClick } = useSoundEffects();
    
    // Khởi tạo state mounted để xử lý hydration an toàn cho UI portal
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => {
        // ... (existing logic)
        // 1. Xây dựng defaults từ initialStudents
        const defaults: Record<string, AttendanceStatus> = {};
        initialStudents.forEach((s) => {
            defaults[s.id] = (initialStatuses?.[s.id]) || 'absent';
        });

        // 2. Logic ưu tiên: DB > localStorage > 'absent'
        if (typeof window !== 'undefined') {
            const hasDataInDB = initialStatuses && Object.keys(initialStatuses).length > 0;

            if (hasDataInDB) {
                // Nếu DB đã có data, ta tin tưởng DB. 
                // Xóa draft cũ trong localStorage vì nó có thể là từ lúc chưa save hoặc của phiên cũ.
                try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
                return defaults;
            }

            try {
                const saved = localStorage.getItem(DRAFT_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved) as Record<string, AttendanceStatus>;
                    // Chỉ merge nếu thực sự có data trong draft
                    if (Object.keys(parsed).length > 0) {
                        const merged: Record<string, AttendanceStatus> = { ...defaults };
                        initialStudents.forEach((s) => {
                            if (parsed[s.id]) merged[s.id] = parsed[s.id];
                        });
                        return merged;
                    }
                }
            } catch { /* ignore */ }
        }
        return defaults;
    });

    // ... (rest of the state and computations)
    const [search, setSearch] = useState('');
    const [isPending, startTransition] = useTransition();
    const gridRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Tính toán hasChanges tự động dựa trên so sánh statuses và initialStatuses
    const hasChanges = useMemo(() => {
        for (const s of initialStudents) {
            const defaultStatus = initialStatuses?.[s.id] || 'absent';
            if (statuses[s.id] !== defaultStatus) return true;
        }
        return false;
    }, [statuses, initialStudents, initialStatuses]);

    // Tự động lưu vào localStorage mỗi lần statuses thay đổi
    useEffect(() => {
        try {
            if (hasChanges) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(statuses));
            }
        } catch { /* bỏ qua nếu localStorage đầy */ }
    }, [statuses, DRAFT_KEY, hasChanges]);


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
        // Play click sound
        playClick();

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
                // XÓA localStorage sau khi lưu thành công
                // Điều này đảm bảo khi reload trang, hệ thống sẽ lấy data mới nhất từ DB
                try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }

                toast(`Đã lưu điểm danh: ${stats.present} có mặt / ${stats.total} học sinh`, 'success');
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
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-xl shadow-sm">
                    <span className="text-[10px] sm:text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Có mặt</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">{stats.present}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-xl shadow-sm">
                    <span className="text-[10px] sm:text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Vắng</span>
                    <span className="text-base sm:text-lg font-bold text-red-400">{stats.absent}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-xl shadow-sm">
                    <span className="text-[10px] sm:text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Phép</span>
                    <span className="text-base sm:text-lg font-bold text-yellow-400">{stats.excused}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-xl shadow-sm">
                    <span className="text-[10px] sm:text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Tỉ lệ</span>
                    <span className={`text-base sm:text-lg font-bold ${attendanceRate >= 80 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]' : attendanceRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {attendanceRate}%
                    </span>
                </div>

                {/* Nút Lưu - Inline Desktop */}
                <Button
                    variant="primary"
                    size="md"
                    onClick={handleSave}
                    disabled={isPending || !hasChanges}
                    loading={isPending}
                    className={`hidden md:flex ml-auto shadow-lg transition-all duration-500 rounded-lg px-6 py-2.5 items-center gap-2 group ${hasChanges 
                        ? 'scale-100 opacity-100 ring-2 ring-[var(--accent-from)]/50 bg-[var(--accent-from)] text-white' 
                        : 'scale-95 opacity-50 grayscale pointer-events-auto'
                    }`}
                >
                    <span className="text-base leading-none">💾</span>
                    <span className="font-extrabold uppercase tracking-wider text-xs">{isPending ? 'Đang lưu' : 'Lưu Lại'}</span>
                </Button>

                {/* Nút Lưu - Floating Mobile (Dùng Portal để thoát khỏi motion.div CSS Context Transform) */}
                {mounted && typeof document !== 'undefined' && createPortal(
                    <div className="md:hidden">
                        <Button
                            variant="primary"
                            size="md"
                            onClick={handleSave}
                            disabled={isPending || !hasChanges}
                            loading={isPending}
                            className={`fixed bottom-[150px] right-4 z-[9999] shadow-[0_15px_40px_rgba(0,0,0,0.8)] transition-all duration-500 rounded-[1.25rem] px-5 py-3.5 flex flex-col items-center gap-1.5 group border border-white/20 ${hasChanges 
                                ? 'translate-y-0 scale-100 opacity-100 ring-4 ring-emerald-500/40 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white hover:scale-105 active:scale-95' 
                                : 'translate-y-10 scale-50 opacity-0 pointer-events-none'
                            }`}
                        >
                            <span className="text-2xl leading-none drop-shadow-md">💾</span>
                            <span className="font-extrabold uppercase tracking-widest text-[10px] drop-shadow-md">{isPending ? 'Đang lưu' : 'Lưu Khóa'}</span>
                        </Button>
                    </div>,
                    document.body
                )}
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
                            className={`student-card relative rounded-[20px] p-4 text-center cursor-pointer group transform-gpu transition-all duration-300
                                ${config.cardClass}
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

        </div>
    );
}
