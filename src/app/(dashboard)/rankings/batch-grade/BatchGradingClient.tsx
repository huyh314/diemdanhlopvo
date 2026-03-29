'use client';

import { useState, useTransition, useEffect, useMemo, useCallback } from 'react';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { saveBatchScoresAction } from './actions';
import { StudentRow, ScoreCategory } from '@/types/database.types';
import { getGroupShortName } from '@/lib/constants';

interface ScoreCriteriaItem {
    label: string;
    group: 'cc' | 'yt' | 'cm';
    groupLabel: string;
    max: number;
    auto?: boolean;
    category: ScoreCategory;
}

const CRITERIA: Record<string, ScoreCriteriaItem> = {
    // category mapping matches DB
    diemdanh: { label: 'Điểm danh & Chuyên cần', group: 'cc', groupLabel: 'Chuyên Cần', max: 30, auto: true, category: 'chuyen_can' },
    lephep: { label: 'Lễ phép, chào hỏi đầy đủ', group: 'yt', groupLabel: 'Ý Thức – Kỷ Luật', max: 10, category: 'y_thuc' },
    tratttu: { label: 'Giữ trật tự trong giờ học', group: 'yt', groupLabel: 'Ý Thức – Kỷ Luật', max: 10, category: 'y_thuc' },
    dongphuc: { label: 'Mặc đồng phục đúng quy định', group: 'yt', groupLabel: 'Ý Thức – Kỷ Luật', max: 10, category: 'y_thuc' },
    ktcoban: { label: 'Kỹ thuật cơ bản', group: 'cm', groupLabel: 'Chuyên Môn', max: 10, category: 'chuyen_mon' },
    quyenthual: { label: 'Quyền thuật', group: 'cm', groupLabel: 'Chuyên Môn', max: 10, category: 'chuyen_mon' },
    doikhang: { label: 'Đối kháng', group: 'cm', groupLabel: 'Chuyên Môn', max: 10, category: 'chuyen_mon' },
    theluc: { label: 'Thể lực', group: 'cm', groupLabel: 'Chuyên Môn', max: 10, category: 'chuyen_mon' },
};

function getGroupIcon(g: string) { return g === 'cc' ? '🚀' : g === 'yt' ? '⭐' : '🥋'; }

function getCriterionColorClasses(group: string) {
    if (group === 'cc') return { text: 'text-orange-500', hex: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    if (group === 'yt') return { text: 'text-yellow-400', hex: '#facc15', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' };
    return { text: 'text-teal-400', hex: '#2dd4bf', bg: 'bg-teal-400/10', border: 'border-teal-400/30' };
}

const MemoizedStudentRow = React.memo(({
    student,
    value,
    max,
    colorHex,
    colorBorder,
    colorText,
    onChange
}: {
    student: StudentRow;
    value: number;
    max: number;
    colorHex: string;
    colorBorder: string;
    colorText: string;
    onChange: (id: string, val: number) => void;
}) => {
    const pct = (value / max) * 100;
    return (
        <div className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4 transition-colors">
            <div className="flex items-center gap-4 md:w-1/3 shrink-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-inner">
                    {student.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        student.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
                    )}
                </div>
                <div>
                    <div className="font-semibold text-sm">{student.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5 bg-black/30 px-1.5 py-0.5 rounded max-w-max">
                        {getGroupShortName(student.group_id)}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center gap-4 w-full pl-2">
                <div className="flex-1 relative group h-8 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max={max}
                        step="1"
                        value={value}
                        onChange={(e) => onChange(student.id, parseInt(e.target.value, 10))}
                        className="w-full h-2 cursor-pointer absolute inset-0 m-auto appearance-none rounded-full"
                        style={{
                            background: `linear-gradient(to right, ${colorHex} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`
                        }}
                    />
                </div>

                <div className={`shrink-0 w-12 h-10 rounded-xl bg-black/40 border-2 ${colorBorder} ${colorText} flex items-center justify-center font-orbitron font-bold text-lg pointer-events-none transition-colors`}>
                    {value}
                </div>
            </div>
        </div>
    );
});
MemoizedStudentRow.displayName = 'MemoizedStudentRow';

export default function BatchGradingClient({
    students,
    existingScores,
    weekKey
}: {
    students: StudentRow[];
    existingScores: any[];
    weekKey: string;
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, startSaveTransition] = useTransition();
    const [isSwitchingTab, startTabTransition] = useTransition();

    const [activeKey, setActiveKey] = useState<string>('lephep');
    const [step, setStep] = useState<1 | 2 | 3>(2);
    const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

    // State structure: scores[criterionKey][studentId] = number
    const [localScores, setLocalScores] = useState<Record<string, Record<string, number>>>(() => {
        const init: Record<string, Record<string, number>> = {};
        Object.keys(CRITERIA).forEach(k => {
            init[k] = {};
            students.forEach(s => { init[k][s.id] = 0; });
        });

        // Initialize from existing DB scores
        students.forEach(s => {
            const studentScore = existingScores.find(es => es.student_id === s.id);
            if (studentScore && studentScore.score_criteria) {
                studentScore.score_criteria.forEach((crit: any) => {
                    if (init[crit.criterion_key]) {
                        init[crit.criterion_key][s.id] = crit.value;
                    }
                });
            }
        });

        return init;
    });

    const activeCr = CRITERIA[activeKey];
    const { text: colorText, bg: colorBg, border: colorBorder, hex: colorHex } = getCriterionColorClasses(activeCr.group);

    // Derived statistics
    const stats = useMemo(() => {
        const vals = students.map(s => localScores[activeKey][s.id] || 0);
        const total = vals.reduce((a, b) => a + b, 0);
        const avg = vals.length > 0 ? (total / vals.length) : 0;
        return { avg: avg.toFixed(1), total, count: vals.length };
    }, [localScores, activeKey, students]);

    function handleSelectCriterion(key: string) {
        if (CRITERIA[key].auto) return; // Prevent selection if handled automatically somewhere else, or allow viewing
        startTabTransition(() => {
            setActiveKey(key);
            setStep(2);
        });
    }

    const handleScoreChange = useCallback((studentId: string, value: number) => {
        setLocalScores(prev => {
            // Tối ưu hóa: Nếu điểm không thay đổi, không cập nhật state để tránh re-render
            if (prev[activeKey]?.[studentId] === value) return prev;
            return {
                ...prev,
                [activeKey]: {
                    ...prev[activeKey],
                    [studentId]: value
                }
            };
        });
    }, [activeKey]);

    function handleSetAll(val: number) {
        const capped = Math.min(val, activeCr.max);
        setLocalScores(prev => {
            const newScores = { ...prev };
            newScores[activeKey] = { ...newScores[activeKey] };
            students.forEach(s => {
                newScores[activeKey][s.id] = capped;
            });
            return newScores;
        });
    }

    function handleSave() {
        startSaveTransition(async () => {
            const payload = {
                weekKey,
                category: activeCr.category,
                criterionKey: activeKey,
                label: activeCr.label,
                maxValue: activeCr.max,
                studentValues: students.map(s => ({
                    studentId: s.id,
                    value: localScores[activeKey][s.id] || 0
                }))
            };

            const result = await saveBatchScoresAction(payload);

            if (result.error) {
                toast(result.error, 'error');
            } else {
                toast(`Đã lưu điểm: ${activeCr.label}`, 'success');
                setSavedKeys(prev => new Set(prev).add(activeKey));

                // Animation states
                setStep(3);
                setTimeout(() => setStep(1), 1000);
            }
        });
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 relative pb-28 md:pb-6">

            {/* Left Panel: Criteria List */}
            <div className="w-full md:w-80 flex-shrink-0 bg-white/5 border border-white/10 rounded-2xl overflow-hidden self-start md:sticky md:top-6">
                <div className="p-4 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    📋 Tiêu chí chấm điểm
                </div>

                <div className="p-3 space-y-4">
                    {/* Render Groups manually based on order */}
                    {/* GROUP 1: CC */}
                    <div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1 bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider">
                            🚀 I. Chuyên Cần
                            <span className="ml-auto bg-orange-500/20 px-2 py-0.5 rounded-full text-[10px]">0-30đ</span>
                        </div>
                        {Object.entries(CRITERIA).filter(([, c]) => c.group === 'cc').map(([k, c]) => (
                            <button
                                key={k}
                                onClick={() => handleSelectCriterion(k)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${activeKey === k ? 'bg-white/10' : 'hover:bg-white/5 opacity-80 hover:opacity-100'} relative`}
                            >
                                {activeKey === k && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-orange-500"></span>}
                                <span className="text-base text-center w-5">📅</span>
                                <span className="flex-1 font-medium">{c.label}</span>
                                <span className="text-xs font-bold text-gray-500">{c.max}đ</span>
                                {savedKeys.has(k) && <div className="w-2 h-2 rounded-full bg-green-500 ml-1"></div>}
                            </button>
                        ))}
                        <div className="mt-2 mx-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-xs leading-relaxed flex gap-2">
                            <span>⚡</span> Mục này thường được hệ thống tự tính từ điểm danh. Bạn vẫn có thể chỉnh bên phải.
                        </div>
                    </div>

                    {/* GROUP 2: YT */}
                    <div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1 bg-yellow-400/10 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                            ⭐ II. Ý Thức – Kỷ Luật
                            <span className="ml-auto bg-yellow-400/20 px-2 py-0.5 rounded-full text-[10px]">0-30đ</span>
                        </div>
                        {Object.entries(CRITERIA).filter(([, c]) => c.group === 'yt').map(([k, c]) => (
                            <button
                                key={k}
                                onClick={() => handleSelectCriterion(k)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${activeKey === k ? 'bg-white/10' : 'hover:bg-white/5 opacity-80 hover:opacity-100'} relative`}
                            >
                                {activeKey === k && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-yellow-400"></span>}
                                <span className="flex-1 font-medium">{c.label}</span>
                                <span className="text-xs font-bold text-gray-500">{c.max}đ</span>
                                {savedKeys.has(k) && <div className="w-2 h-2 rounded-full bg-green-500 ml-1"></div>}
                            </button>
                        ))}
                    </div>

                    {/* GROUP 3: CM */}
                    <div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1 bg-teal-400/10 text-teal-400 text-xs font-bold uppercase tracking-wider">
                            🥋 III. Chuyên Môn
                            <span className="ml-auto bg-teal-400/20 px-2 py-0.5 rounded-full text-[10px]">0-40đ</span>
                        </div>
                        {Object.entries(CRITERIA).filter(([, c]) => c.group === 'cm').map(([k, c]) => (
                            <button
                                key={k}
                                onClick={() => handleSelectCriterion(k)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${activeKey === k ? 'bg-white/10' : 'hover:bg-white/5 opacity-80 hover:opacity-100'} relative`}
                            >
                                {activeKey === k && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-teal-400"></span>}
                                <span className="flex-1 font-medium">{c.label}</span>
                                <span className="text-xs font-bold text-gray-500">{c.max}đ</span>
                                {savedKeys.has(k) && <div className="w-2 h-2 rounded-full bg-green-500 ml-1"></div>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Scoring area */}
            <div className="flex-1 flex flex-col gap-4 relative">

                {/* Header Info */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-5">
                    <div className={`px-4 py-2 rounded-full text-sm font-bold border ${colorBg} ${colorText} ${colorBorder} inline-flex items-center gap-2 w-max`}>
                        {getGroupIcon(activeCr.group)} {activeCr.label}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold">{activeCr.label}</h3>
                        <p className="text-xs text-gray-400">Nhóm {activeCr.groupLabel} · Tối đa {activeCr.max} điểm</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleSetAll(activeCr.max)} className="px-4 py-2 text-sm font-semibold rounded-xl bg-white/5 border border-white/10 hover:border-[var(--gold)] hover:text-[var(--gold)] transition">
                            Tất cả Max
                        </button>
                        <button onClick={() => handleSetAll(0)} className="px-4 py-2 text-sm font-semibold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                            Reset
                        </button>
                    </div>
                </div>

                {/* Styles for range sliders extracted to single tag */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                        input[type=range]::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 22px;
                            height: 22px;
                            border-radius: 50%;
                            background: #fff;
                            border: 4px solid ${colorHex};
                            cursor: pointer;
                            transition: transform 0.1s;
                            box-shadow: 0 0 10px rgba(0,0,0,0.5);
                        }
                        input[type=range]::-webkit-slider-thumb:hover {
                            transform: scale(1.2);
                        }
                    `
                }} />

                {/* List of students with sliders */}
                <div className="grid gap-3">
                    {students.map(s => {
                        const val = localScores[activeKey][s.id] || 0;
                        return (
                            <MemoizedStudentRow
                                key={s.id}
                                student={s}
                                value={val}
                                max={activeCr.max}
                                colorHex={colorHex}
                                colorBorder={colorBorder}
                                colorText={colorText}
                                onChange={handleScoreChange}
                            />
                        );
                    })}
                </div>

                {/* Bottom Save Bar */}
                <div className="sticky bottom-4 z-50 mt-4 bg-[#16171c]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-between gap-6 mx-0">
                    <div className="flex gap-4 md:gap-8 pl-2">
                        <div className="text-center">
                            <div className="text-xl md:text-2xl font-orbitron font-bold text-[var(--gold)]">{stats.count}</div>
                            <div className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest mt-1">Học sinh</div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-3 px-6 py-3 bg-[var(--gold)] text-black rounded-xl font-bold md:text-base text-sm hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(245,166,35,0.4)] transition-all active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {isSaving ? 'Đang lưu...' : '💾 Lưu & Tiếp theo'}
                    </button>
                </div>
            </div>

        </div>
    );
}
