'use client';

import { useState, useTransition, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useToast } from './Toast';
import { saveScoreAction } from '@/lib/actions';
import { Modal, Button, TextAreaField, ProgressBar } from './ui';

// =============================================
// SCORE MODAL — 3-category grading system
// =============================================

interface ScoreModalProps {
    studentId: string;
    studentName: string;
    weekKey: string;
    onClose: () => void;
    autoChuyenCan?: number;
}

interface CriterionState {
    category: string;
    criterionKey: string;
    label: string;
    value: number;
    maxValue: number;
    deductions: { reason: string; amount: number; date?: string }[];
}

const INITIAL_CRITERIA: CriterionState[] = [
    // Chuyên Cần (30đ) — tự động tính từ điểm danh
    { category: 'chuyen_can', criterionKey: '1-1', label: 'Nghỉ có phép', value: 30, maxValue: 30, deductions: [] },
    { category: 'chuyen_can', criterionKey: '1-2', label: 'Nghỉ không phép', value: 30, maxValue: 30, deductions: [] },
    // Ý Thức (30đ) — mặc định đầy điểm
    { category: 'y_thuc', criterionKey: '2-1', label: 'Lễ phép, chào hỏi đầy đủ', value: 10, maxValue: 10, deductions: [] },
    { category: 'y_thuc', criterionKey: '2-2', label: 'Giữ trật tự trong giờ học', value: 10, maxValue: 10, deductions: [] },
    { category: 'y_thuc', criterionKey: '2-3', label: 'Mặc võ phục đúng quy định', value: 10, maxValue: 10, deductions: [] },
    // Chuyên Môn (40đ, mỗi mục 10đ)
    { category: 'chuyen_mon', criterionKey: '3-1', label: 'Kỹ thuật cơ bản', value: 10, maxValue: 10, deductions: [] },
    { category: 'chuyen_mon', criterionKey: '3-2', label: 'Quyền thuật', value: 10, maxValue: 10, deductions: [] },
    { category: 'chuyen_mon', criterionKey: '3-3', label: 'Đối kháng', value: 10, maxValue: 10, deductions: [] },
    { category: 'chuyen_mon', criterionKey: '3-4', label: 'Thể lực', value: 10, maxValue: 10, deductions: [] },
];

const CATEGORIES = [
    { key: 'chuyen_can', label: 'I. Chuyên Cần', icon: '🚀', gradient: 'from-orange-500 to-orange-700', max: 30, desc: 'Tập đều, không vắng mặt' },
    { key: 'y_thuc', label: 'II. Ý Thức – Kỷ Luật', icon: '⭐', gradient: 'from-green-500 to-green-700', max: 30, desc: 'Thái độ, kỷ luật' },
    { key: 'chuyen_mon', label: 'III. Chuyên Môn', icon: '🥋', gradient: 'from-purple-500 to-purple-700', max: 40, desc: 'Kỹ thuật chuyên sâu' },
];

export default function ScoreModal({ studentId, studentName, weekKey, onClose, autoChuyenCan }: ScoreModalProps) {
    const [criteria, setCriteria] = useState<CriterionState[]>(INITIAL_CRITERIA);
    const [notes, setNotes] = useState('');
    // Mặc định mở rộng tất cả các category
    const [expandedCats, setExpandedCats] = useState<Set<string>>(
        new Set(['chuyen_can', 'y_thuc', 'chuyen_mon'])
    );
    const toggleCat = (catKey: string) => {
        setExpandedCats(prev => {
            const next = new Set(prev);
            if (next.has(catKey)) next.delete(catKey);
            else next.add(catKey);
            return next;
        });
    };
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!containerRef.current) return;
        gsap.fromTo('.score-category',
            { opacity: 0, x: -20, rotateX: 10 },
            { opacity: 1, x: 0, rotateX: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
        );
    }, []);

    // Compute scores
    function getCatScore(catKey: string): number {
        const items = criteria.filter((c) => c.category === catKey);
        if (catKey === 'chuyen_can') {
            if (typeof autoChuyenCan === 'number') return autoChuyenCan;
            const totalDeductions = items.reduce((sum, c) => sum + c.deductions.reduce((s, d) => s + d.amount, 0), 0);
            return Math.max(0, 30 - totalDeductions);
        }
        return items.reduce((sum, c) => sum + c.value, 0);
    }

    const totalScore = CATEGORIES.reduce((sum, cat) => sum + getCatScore(cat.key), 0);

    // Update slider
    function updateSlider(criterionKey: string, value: number) {
        setCriteria((prev) =>
            prev.map((c) => (c.criterionKey === criterionKey ? { ...c, value } : c))
        );
    }

    // Add deduction
    function addDeduction(criterionKey: string, amount: number, reason: string) {
        setCriteria((prev) =>
            prev.map((c) =>
                c.criterionKey === criterionKey
                    ? { ...c, deductions: [...c.deductions, { reason, amount, date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }) }] }
                    : c
            )
        );
    }

    // Remove deduction
    function removeDeduction(criterionKey: string, idx: number) {
        setCriteria((prev) =>
            prev.map((c) =>
                c.criterionKey === criterionKey
                    ? { ...c, deductions: c.deductions.filter((_, i) => i !== idx) }
                    : c
            )
        );
    }

    // Reset
    function handleReset() {
        setCriteria(INITIAL_CRITERIA);
        setNotes('');
    }

    // Save
    function handleSave() {
        startTransition(async () => {
            const computedCriteria = criteria.map((c) => {
                if (c.category === 'chuyen_can') {
                    // Lock to autoChuyenCan
                    const val = typeof autoChuyenCan === 'number' ? autoChuyenCan : Math.max(0, c.maxValue - c.deductions.reduce((s, d) => s + d.amount, 0));
                    return { ...c, value: val };
                }
                return c;
            });

            const result = await saveScoreAction({
                studentId,
                weekKey,
                criteria: computedCriteria,
                notes,
            });

            if (!result.success) {
                toast(result.error || 'Lỗi khi lưu điểm', 'error');
            } else {
                toast(`Đã lưu điểm: ${totalScore} PT`, 'success');
                onClose();
            }
        });
    }

    return (
        <Modal
            isOpen
            onClose={onClose}
            maxWidth="max-w-sm"
            className="!p-0 overflow-hidden"
        >
            {/* Custom Header */}
            <div className="bg-gradient-to-r from-[var(--bg-tertiary)] to-[var(--bg-secondary)] p-5 border-b border-[var(--border-primary)] flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🏆</span>
                    <div>
                        <div className="text-lg font-bold text-yellow-400">Bảng Điểm Thi Đua</div>
                        <div className="text-sm text-[var(--text-secondary)]">{studentName}</div>
                    </div>
                </div>
                <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-yellow-400 transition text-xl w-8 h-8 flex items-center justify-center rounded">
                    ✕
                </button>
            </div>

            {/* Total Score */}
            <div className="mx-4 mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Điểm Tích Lũy</div>
                <div className="text-5xl font-bold text-yellow-400">{totalScore}<span className="text-sm text-[var(--text-tertiary)] ml-1">PT</span></div>
                {/* Progress bar showing total */}
                <ProgressBar value={(totalScore / 100) * 100} variant="warning" height="h-1.5" className="mt-3" />
                <div className="mt-2 text-xs text-[var(--accent-from)] flex justify-center gap-3">
                    <span>Chuyên Cần: <strong>{getCatScore('chuyen_can')}</strong>/30</span>
                    <span>Ý Thức: <strong>{getCatScore('y_thuc')}</strong>/30</span>
                    <span>Chuyên Môn: <strong>{getCatScore('chuyen_mon')}</strong>/40</span>
                </div>
                {typeof autoChuyenCan === 'number' && (
                    <div className="mt-2 text-xs text-emerald-400">
                        📊 Auto từ điểm danh: {autoChuyenCan}/30
                    </div>
                )}
            </div>

            {/* Categories */}
            <div className="p-4 space-y-4 perspective-[1000px]" ref={containerRef}>
                {CATEGORIES.map((cat) => {
                    const catCriteria = criteria.filter((c) => c.category === cat.key);
                    const catScore = getCatScore(cat.key);
                    const isExpanded = expandedCats.has(cat.key);

                    return (
                        <div key={cat.key} className="score-category rounded-[16px] overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] shadow-[0_10px_30px_rgba(0,0,0,0.2)] transform-gpu transition-all duration-300 hover:border-[var(--border-primary)]">
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCat(cat.key)}
                                className={`w-full bg-gradient-to-r ${cat.gradient} p-4 flex justify-between items-center relative overflow-hidden`}
                            >
                                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <span className="text-2xl drop-shadow-md">{cat.icon}</span>
                                    <div className="text-left">
                                        <div className="text-sm font-semibold text-white">{cat.label}</div>
                                        <div className="text-[11px] text-white/75">{cat.desc}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-black/20 px-2.5 py-1 rounded text-sm font-bold text-white">
                                        {catScore}<span className="text-[11px] opacity-70">/{cat.max}</span>
                                    </span>
                                    <span className={`text-white text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                </div>
                            </button>

                            {/* Criteria Items */}
                            {isExpanded && (
                                <div className="p-3 space-y-2">
                                    {cat.key === 'chuyen_can' ? (
                                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-5 text-center">
                                            <p className="text-sm text-gray-400 mb-3 leading-relaxed">
                                                Điểm chuyên cần được hệ thống tự động tính toán dựa trên dữ liệu điểm danh trong tuần.
                                            </p>
                                            <div className="inline-flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                <span className="text-3xl font-extrabold text-emerald-400">{getCatScore('chuyen_can')}</span>
                                                <span className="text-xs text-emerald-500 font-medium">/ {cat.max}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        catCriteria.map((crit) => (
                                            <div key={crit.criterionKey} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-3">
                                                <div className="text-sm text-[var(--text-primary)] font-medium">{crit.label}</div>
                                                <div className="mt-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[11px] text-[var(--text-tertiary)]">Điểm đạt được</span>
                                                        <span className="text-sm font-bold text-yellow-400">{crit.value}/{crit.maxValue}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={crit.maxValue}
                                                        value={crit.value}
                                                        onChange={(e) => updateSlider(crit.criterionKey, Number(e.target.value))}
                                                        className="w-full accent-yellow-400"
                                                    />
                                                    <ProgressBar
                                                        value={(crit.value / crit.maxValue) * 100}
                                                        variant={crit.value >= crit.maxValue * 0.7 ? 'success' : crit.value >= crit.maxValue * 0.4 ? 'warning' : 'danger'}
                                                        height="h-1"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Notes */}
            <div className="px-4 pb-3">
                <TextAreaField
                    label="📝 Ghi Chú / Nhận Xét"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập nhận xét cho học sinh..."
                    rows={3}
                />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2.5 px-4 pb-5">
                <Button variant="ghost" onClick={handleReset} className="flex-1 !uppercase !tracking-wider">
                    RESET
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isPending}
                    loading={isPending}
                    className="flex-[2] !uppercase !tracking-wider"
                >
                    {isPending ? 'Đang lưu...' : 'LƯU ĐIỂM'}
                </Button>
            </div>
        </Modal>
    );
}
