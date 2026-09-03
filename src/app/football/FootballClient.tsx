'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, PlayerPosition } from './types';
import { INITIAL_FOOTBALL_PLAYERS } from './mockData';
import { footballAudio } from './footballAudio';

const STORAGE_PLAYERS_KEY = 'football_fifa_students_v4';
const STORAGE_ATTENDANCE_KEY = 'football_fifa_attendance_v4';
const STORAGE_SETTINGS_KEY = 'football_fifa_settings_v4';
const STORAGE_GRID_KEY = 'football_fifa_grid_cols';

function getVietnamTodayString(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function formatVietnamDateDisplay(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00+07:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
    });
}

const POSITION_CONFIG: Record<PlayerPosition, { label: string; nameVi: string; badgeBg: string; ovr: number }> = {
    GK: { label: 'GK', nameVi: 'Thủ Môn', badgeBg: 'bg-amber-600', ovr: 88 },
    DF: { label: 'DF', nameVi: 'Hậu Vệ', badgeBg: 'bg-blue-600', ovr: 86 },
    MF: { label: 'MF', nameVi: 'Tiền Vệ', badgeBg: 'bg-emerald-600', ovr: 90 },
    FW: { label: 'FW', nameVi: 'Tiền Đạo', badgeBg: 'bg-rose-600', ovr: 92 },
};

function compressStudentImage(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const targetW = 450;
                const targetH = 800; // 9:16 ratio
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(e.target?.result as string);

                const scale = Math.max(targetW / img.width, targetH / img.height);
                const x = (targetW - img.width * scale) / 2;
                const y = (targetH - img.height * scale) / 2;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                const compressed = canvas.toDataURL('image/jpeg', 0.82);
                resolve(compressed);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
}

interface ClassSettings {
    monthlySessions: number;
    monthlyFee: number;
}

export default function FootballClient() {
    const [players, setPlayers] = useState<(Player & { tuition?: 'PAID' | 'UNPAID' })[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(getVietnamTodayString());
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string[]>>({});
    const [activeTab, setActiveTab] = useState<'cards' | 'history' | 'roster'>('cards');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Grid size state: 3, 4, or 5 cards per row
    const [gridCols, setGridCols] = useState<3 | 4 | 5>(3);

    // Settings (Thầy quyết định)
    const [classSettings, setClassSettings] = useState<ClassSettings>({
        monthlySessions: 8,
        monthlyFee: 600000
    });
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [tempMonthlySessions, setTempMonthlySessions] = useState(8);
    const [tempMonthlyFee, setTempMonthlyFee] = useState(600000);

    // Range Filter for History Matrix & Excel
    const [rangeFilter, setRangeFilter] = useState<'thisWeek' | 'thisMonth' | 'allTime' | 'custom'>('thisMonth');
    const [customRangeStart, setCustomRangeStart] = useState('');
    const [customRangeEnd, setCustomRangeEnd] = useState('');

    // Ref for photo input
    const directFileInputRef = useRef<HTMLInputElement>(null);
    const targetPlayerIdForPhotoRef = useRef<string | null>(null);

    // Add / Edit Modal
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [playerFormData, setPlayerFormData] = useState<Partial<Player & { tuition?: 'PAID' | 'UNPAID' }>>({
        name: '',
        jerseyNumber: 10,
        position: 'FW',
        preferredFoot: 'Phải',
        parentPhone: '',
        remainingSessions: 8,
        totalSessionsPack: 8,
        avatar: '',
        rating: 90,
        tuition: 'PAID'
    });

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
            if (savedSettings) {
                const s = JSON.parse(savedSettings);
                setClassSettings(s);
                setTempMonthlySessions(s.monthlySessions);
                setTempMonthlyFee(s.monthlyFee);
            }

            const savedCols = localStorage.getItem(STORAGE_GRID_KEY);
            if (savedCols) setGridCols(parseInt(savedCols, 10) as any);

            const savedPlayers = localStorage.getItem(STORAGE_PLAYERS_KEY);
            if (savedPlayers) {
                setPlayers(JSON.parse(savedPlayers));
            } else {
                const enriched = INITIAL_FOOTBALL_PLAYERS.map(p => ({
                    ...p,
                    avatar: '/football-avatar.jpg',
                    rating: POSITION_CONFIG[p.position].ovr + (p.jerseyNumber % 5),
                    tuition: 'PAID' as const,
                    remainingSessions: 8
                }));
                setPlayers(enriched);
                localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(enriched));
            }

            const savedAttendance = localStorage.getItem(STORAGE_ATTENDANCE_KEY);
            if (savedAttendance) {
                setAttendanceMap(JSON.parse(savedAttendance));
            } else {
                const today = getVietnamTodayString();
                const initMap: Record<string, string[]> = {
                    [today]: ['fb-1', 'fb-7', 'fb-10', 'fb-11'],
                };
                setAttendanceMap(initMap);
                localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(initMap));
            }
        } catch (e) {
            console.error('Storage error:', e);
        }
    }, []);

    const triggerHaptic = () => {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate(35); } catch {}
        }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2500);
    };

    const savePlayers = (newPlayers: (Player & { tuition?: 'PAID' | 'UNPAID' })[]) => {
        setPlayers(newPlayers);
        try {
            localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(newPlayers));
        } catch (e) {
            console.error(e);
        }
    };

    const saveSettings = () => {
        const s = { monthlySessions: tempMonthlySessions, monthlyFee: tempMonthlyFee };
        setClassSettings(s);
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(s));
        setIsSettingsModalOpen(false);
        showToast(`⚙️ Đã lưu: ${tempMonthlySessions} buổi/tháng • ${tempMonthlyFee.toLocaleString('vi-VN')}đ`);
    };

    const changeGridCols = (cols: 3 | 4 | 5) => {
        setGridCols(cols);
        localStorage.setItem(STORAGE_GRID_KEY, String(cols));
    };

    const presentIds = useMemo(() => {
        return new Set(attendanceMap[selectedDate] || []);
    }, [attendanceMap, selectedDate]);

    const saveAttendanceForDate = (newIds: string[], targetDate: string = selectedDate) => {
        setAttendanceMap(prev => {
            const updated = { ...prev, [targetDate]: newIds };
            try {
                localStorage.setItem(STORAGE_ATTENDANCE_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error(e);
            }
            return updated;
        });
    };

    const toggleAttendance = (playerId: string) => {
        triggerHaptic();
        footballAudio.playBallKick();

        const currentList = attendanceMap[selectedDate] || [];
        const isPresent = currentList.includes(playerId);

        let nextList: string[];
        if (isPresent) {
            nextList = currentList.filter(id => id !== playerId);
        } else {
            nextList = [...currentList, playerId];
        }

        saveAttendanceForDate(nextList);

        const player = players.find(p => p.id === playerId);
        if (player) {
            const nextCount = isPresent
                ? player.remainingSessions + 1
                : Math.max(0, player.remainingSessions - 1);
            const updatedList = players.map(p => p.id === playerId ? { ...p, remainingSessions: nextCount } : p);
            savePlayers(updatedList);
        }
    };

    const openEditPlayerModal = (player: Player & { tuition?: 'PAID' | 'UNPAID' }, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        triggerHaptic();
        setEditingPlayer(player);
        setPlayerFormData({
            name: player.name,
            jerseyNumber: player.jerseyNumber,
            position: player.position,
            preferredFoot: player.preferredFoot,
            parentPhone: player.parentPhone || '',
            remainingSessions: player.remainingSessions,
            totalSessionsPack: player.totalSessionsPack,
            avatar: player.avatar,
            rating: player.rating,
            tuition: player.tuition || 'PAID'
        });
        setIsPlayerModalOpen(true);
    };

    const handleCardCameraClick = (playerId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        targetPlayerIdForPhotoRef.current = playerId;
        if (directFileInputRef.current) {
            directFileInputRef.current.value = '';
            directFileInputRef.current.click();
        }
    };

    const handleDirectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const targetId = targetPlayerIdForPhotoRef.current;
        if (file && targetId) {
            showToast('⏳ Đang gắn ảnh học viên...');
            const compressed = await compressStudentImage(file);
            const updated = players.map(p => p.id === targetId ? { ...p, avatar: compressed } : p);
            savePlayers(updated);
            showToast('✅ Đã đổi ảnh học viên vào thẻ FIFA!');
            targetPlayerIdForPhotoRef.current = null;
        }
    };

    const markAllPresent = () => {
        triggerHaptic();
        footballAudio.playWhistle();
        const allIds = players.map(p => p.id);
        saveAttendanceForDate(allIds);
        showToast(`⚡ Đã bật sáng toàn bộ thẻ ngày ${selectedDate}!`);
    };

    const resetAttendance = () => {
        triggerHaptic();
        footballAudio.playClick();
        saveAttendanceForDate([]);
        showToast('🔄 Đã đặt lại ngày này');
    };

    const renewAllForNewMonth = () => {
        if (confirm(`Gia hạn tháng mới: Cộng +${classSettings.monthlySessions} buổi học cho toàn bộ ${players.length} em?`)) {
            const updated = players.map(p => ({
                ...p,
                remainingSessions: p.remainingSessions + classSettings.monthlySessions,
                tuition: 'PAID' as const
            }));
            savePlayers(updated);
            showToast(`🎉 Đã gia hạn +${classSettings.monthlySessions} buổi cho cả lớp!`);
        }
    };

    const toggleTuition = (playerId: string) => {
        const updated = players.map(p => {
            if (p.id === playerId) {
                const nextTuition = p.tuition === 'PAID' ? 'UNPAID' as const : 'PAID' as const;
                return { ...p, tuition: nextTuition };
            }
            return p;
        });
        savePlayers(updated);
    };

    // Filter Dates for Table & Excel
    const filteredDates = useMemo(() => {
        const allDates = Object.keys(attendanceMap).sort((a, b) => a.localeCompare(b));
        if (!allDates.includes(selectedDate)) allDates.push(selectedDate);
        allDates.sort((a, b) => a.localeCompare(b));

        const today = new Date(getVietnamTodayString());

        if (rangeFilter === 'thisWeek') {
            const day = today.getDay();
            const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(today.setDate(diffToMonday));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const monStr = monday.toISOString().split('T')[0];
            const sunStr = sunday.toISOString().split('T')[0];
            return allDates.filter(d => d >= monStr && d <= sunStr);
        }

        if (rangeFilter === 'thisMonth') {
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const prefix = `${year}-${month}`;
            return allDates.filter(d => d.startsWith(prefix));
        }

        if (rangeFilter === 'custom') {
            if (!customRangeStart && !customRangeEnd) return allDates;
            return allDates.filter(d => (!customRangeStart || d >= customRangeStart) && (!customRangeEnd || d <= customRangeEnd));
        }

        return allDates;
    }, [attendanceMap, selectedDate, rangeFilter, customRangeStart, customRangeEnd]);

    // Export to Excel CSV
    const exportToExcelCSV = () => {
        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += `BÁO CÁO ĐIỂM DANH VÀ HỌC PHÍ LỚP BÓNG ĐÁ\n`;
        csvContent += `Thời gian xuất: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\n`;
        csvContent += `Quy định gói: ${classSettings.monthlySessions} buổi/tháng - Mức thu: ${classSettings.monthlyFee.toLocaleString('vi-VN')} VNĐ\n\n`;

        const headers = ['STT', 'Họ Và Tên', 'Số Áo', 'Vị Trí', 'Số Buổi Còn', 'Học Phí Tháng'];
        filteredDates.forEach(d => headers.push(d));
        headers.push('Tổng Điểm Danh');
        headers.push('Tỉ Lệ Chuyên Cần (%)');
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

        players.forEach((p, idx) => {
            let attended = 0;
            const row = [
                idx + 1,
                `"${p.name}"`,
                `"#${p.jerseyNumber}"`,
                `"${p.position}"`,
                p.remainingSessions,
                p.tuition === 'PAID' ? '"Đã đóng"' : '"Chưa đóng"'
            ];

            filteredDates.forEach(d => {
                const isPresent = attendanceMap[d]?.includes(p.id);
                if (isPresent) attended++;
                row.push(isPresent ? '"Có mặt (1)"' : '"Vắng (0)"');
            });

            const pct = filteredDates.length > 0 ? Math.round((attended / filteredDates.length) * 100) : 0;
            row.push(`"${attended}/${filteredDates.length}"`);
            row.push(`"${pct}%"`);
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bao_Cao_Diem_Danh_${getVietnamTodayString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('📥 Đã xuất file Excel (.csv) thành công!');
    };

    const presentCount = presentIds.size;
    const absentCount = players.length - presentCount;
    const rate = players.length > 0 ? Math.round((presentCount / players.length) * 100) : 0;
    const isCompact = gridCols >= 4;

    return (
        <div className="min-h-screen bg-[#050d08] text-white flex flex-col justify-between select-none font-sans">
            <input type="file" ref={directFileInputRef} accept="image/*" onChange={handleDirectFileChange} className="hidden" />

            {/* TOP BAR */}
            <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#07130c]/95 border-b border-amber-500/20 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5 shadow-xl">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-600 flex items-center justify-center text-lg shadow-md border border-amber-200 text-black font-black">
                            ⚽
                        </div>
                        <div>
                            <h1 className="text-xs sm:text-sm font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 uppercase">
                                ĐIỂM DANH LỚP BÓNG ĐÁ
                            </h1>
                            <p className="text-[9px] text-zinc-400">
                                Gói: {classSettings.monthlySessions} buổi/tháng • {classSettings.monthlyFee.toLocaleString('vi-VN')}đ
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setIsSettingsModalOpen(true)}
                            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition"
                        >
                            <span>⚙️</span>
                            <span className="hidden sm:inline">Học Phí</span>
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                triggerHaptic();
                                footballAudio.playClick();
                                setSelectedDate(e.target.value);
                            }}
                            className="bg-zinc-900 text-amber-300 border border-amber-500/40 rounded-xl px-2 py-1 text-xs font-black focus:outline-none"
                        />
                    </div>
                </div>
            </header>

            {/* STATS BAR */}
            <div className="max-w-5xl mx-auto w-full px-4 pt-2.5">
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-2 text-center">
                        <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">Có mặt hôm nay</span>
                        <div className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">
                            {presentCount} em
                        </div>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 text-center">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Chưa điểm danh</span>
                        <div className="text-lg sm:text-xl font-black text-zinc-400 mt-0.5">
                            {absentCount} em
                        </div>
                    </div>
                    <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-2 text-center">
                        <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Tỉ lệ tham gia</span>
                        <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">
                            {rate}%
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="max-w-5xl mx-auto w-full px-4 mt-2.5">
                <div className="flex p-1 bg-black/60 border border-white/10 rounded-2xl gap-1">
                    <button
                        onClick={() => { triggerHaptic(); setActiveTab('cards'); }}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                            activeTab === 'cards'
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <span>🃏</span>
                        <span>Thẻ Điểm Danh</span>
                    </button>
                    <button
                        onClick={() => { triggerHaptic(); setActiveTab('history'); }}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                            activeTab === 'history'
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-lg'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <span>📊</span>
                        <span>Thống Kê & Excel</span>
                    </button>
                    <button
                        onClick={() => { triggerHaptic(); setActiveTab('roster'); }}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                            activeTab === 'roster'
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <span>👥</span>
                        <span>Học Viên & Thu Phí</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-3 pb-28 space-y-4">
                {/* TAB 1: CARDS WITH 3, 4, 5 COLUMNS & BRIGHT NATURAL CARDS */}
                {activeTab === 'cards' && (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            {/* Grid Switcher (3, 4, 5 columns) */}
                            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-zinc-700">
                                <span className="text-[10px] text-zinc-400 px-1 font-bold">Thu phóng:</span>
                                {([3, 4, 5] as const).map(col => (
                                    <button
                                        key={col}
                                        onClick={() => changeGridCols(col)}
                                        className={`px-2 py-1 rounded-lg text-xs font-black transition ${
                                            gridCols === col
                                                ? 'bg-amber-400 text-black'
                                                : 'text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        {col} thẻ
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                    onClick={markAllPresent}
                                    className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs rounded-xl shadow active:scale-95 transition"
                                >
                                    ⚡ Tất Cả Có Mặt
                                </button>
                                <button
                                    onClick={resetAttendance}
                                    className="px-2.5 py-1.5 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl active:scale-95 transition"
                                >
                                    🔄 Đặt Lại
                                </button>
                            </div>
                        </div>

                        {/* Cards Grid: Adaptive Columns */}
                        <div className={`grid gap-2 sm:gap-3.5 ${
                            gridCols === 3 ? 'grid-cols-3' : gridCols === 4 ? 'grid-cols-4' : 'grid-cols-5'
                        }`}>
                            {players.map(player => {
                                const isPresent = presentIds.has(player.id);
                                const posConfig = POSITION_CONFIG[player.position];
                                const ovr = player.rating || posConfig.ovr;
                                const avatarSrc = player.avatar || '/football-avatar.jpg';

                                return (
                                    <div
                                        key={player.id}
                                        onClick={() => toggleAttendance(player.id)}
                                        style={{ aspectRatio: '9 / 16' }}
                                        className={`relative rounded-2xl sm:rounded-3xl cursor-pointer select-none transition-all duration-200 overflow-hidden flex flex-col justify-between p-1.5 sm:p-2.5 border-2 active:scale-95 ${
                                            isPresent
                                                ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)] scale-[1.02]'
                                                : 'border-zinc-800 hover:border-zinc-700'
                                        }`}
                                    >
                                        {/* Player Real Photo Background (Tự nhiên, tràn toàn bộ thẻ) */}
                                        <div className="absolute inset-0 z-0 bg-zinc-900">
                                            <img src={avatarSrc} alt={player.name} className="w-full h-full object-cover object-top" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/50" />
                                            {isPresent && (
                                                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/25 via-transparent to-yellow-300/30 mix-blend-screen pointer-events-none" />
                                            )}
                                        </div>

                                        {/* Card Top: OVR, Number, Edit ✏️ & Camera 📷 */}
                                        <div className="relative z-10 flex items-start justify-between">
                                            <div className="flex flex-col items-center bg-black/60 backdrop-blur-md rounded-lg px-1.5 py-0.5 border border-amber-500/30">
                                                <span className={`${isCompact ? 'text-xs' : 'text-sm sm:text-base'} font-black text-amber-300 leading-none`}>
                                                    {ovr}
                                                </span>
                                                <span className={`text-[7px] sm:text-[8px] font-extrabold px-0.5 rounded text-white ${posConfig.badgeBg}`}>
                                                    {posConfig.label}
                                                </span>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <div className={`${isCompact ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 sm:w-8 sm:h-8 text-xs'} rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black flex items-center justify-center shadow`}>
                                                    #{player.jerseyNumber}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => openEditPlayerModal(player, e)}
                                                        className={`${isCompact ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'} rounded-md bg-black/70 border border-amber-400/60 text-amber-300 flex items-center justify-center hover:bg-amber-400 hover:text-black transition shadow`}
                                                        title="Sửa thông tin học viên"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleCardCameraClick(player.id, e)}
                                                        className={`${isCompact ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'} rounded-md bg-black/70 border border-amber-400/60 text-amber-300 flex items-center justify-center hover:bg-amber-400 hover:text-black transition shadow`}
                                                        title="Chụp/đổi ảnh học viên này"
                                                    >
                                                        📷
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Bottom: Nameplate & Status */}
                                        <div className="relative z-10 space-y-1">
                                            <div className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 text-black py-0.5 px-1 rounded text-center shadow font-black">
                                                <div className={`${isCompact ? 'text-[9px]' : 'text-[11px] sm:text-xs'} uppercase truncate leading-tight font-['Impact',sans-serif]`}>
                                                    {player.name}
                                                </div>
                                            </div>

                                            <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-1.5 py-0.5 flex items-center justify-between text-[8px] sm:text-[9px] text-zinc-300">
                                                <span className="truncate">Còn <strong>{player.remainingSessions}b</strong></span>
                                                {isPresent ? (
                                                    <span className="text-amber-400 font-black">✓ Có mặt</span>
                                                ) : (
                                                    <span className="text-zinc-400">Chưa điểm</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* TAB 2: THỐNG KÊ & XUẤT EXCEL */}
                {activeTab === 'history' && (
                    <div className="space-y-3.5">
                        <div className="bg-black/60 border border-white/10 rounded-2xl p-3.5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                                        <span>📊</span>
                                        <span>Bảng Thống Kê Số Buổi & Chuyên Cần</span>
                                    </h2>
                                    <p className="text-[10px] text-zinc-400">Xem theo tuần, theo tháng hoặc khoảng ngày bất kỳ</p>
                                </div>

                                <button
                                    onClick={exportToExcelCSV}
                                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-black text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
                                >
                                    <span className="text-sm">📥</span>
                                    <span>Xuất File Excel</span>
                                </button>
                            </div>

                            {/* Range Filters */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800">
                                <button
                                    onClick={() => setRangeFilter('thisWeek')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                        rangeFilter === 'thisWeek' ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                                    }`}
                                >
                                    Tuần Này
                                </button>
                                <button
                                    onClick={() => setRangeFilter('thisMonth')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                        rangeFilter === 'thisMonth' ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                                    }`}
                                >
                                    Tháng Này
                                </button>
                                <button
                                    onClick={() => setRangeFilter('allTime')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                        rangeFilter === 'allTime' ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                                    }`}
                                >
                                    Tất Cả
                                </button>

                                <div className="flex items-center gap-1 text-[11px] text-zinc-300 ml-auto">
                                    <span>Từ:</span>
                                    <input
                                        type="date"
                                        value={customRangeStart}
                                        onChange={(e) => { setCustomRangeStart(e.target.value); setRangeFilter('custom'); }}
                                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-amber-300"
                                    />
                                    <span>Đến:</span>
                                    <input
                                        type="date"
                                        value={customRangeEnd}
                                        onChange={(e) => { setCustomRangeEnd(e.target.value); setRangeFilter('custom'); }}
                                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-amber-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Attendance Table */}
                        <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-black/40 shadow-xl">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-950/90 text-zinc-400 uppercase text-[10px]">
                                        <th className="p-3 sticky left-0 bg-zinc-950 z-20 min-w-[130px]">Học viên</th>
                                        <th className="p-2 text-center min-w-[45px]">Vị trí</th>
                                        {filteredDates.map(d => (
                                            <th
                                                key={d}
                                                className={`p-2 text-center min-w-[55px] cursor-pointer hover:text-amber-400 transition ${
                                                    d === selectedDate ? 'text-amber-400 font-black bg-amber-500/10' : ''
                                                }`}
                                                onClick={() => { setSelectedDate(d); setActiveTab('cards'); }}
                                            >
                                                {formatVietnamDateDisplay(d).split(',')[0]}
                                                <span className="block text-[8px] opacity-75">{d.slice(5)}</span>
                                            </th>
                                        ))}
                                        <th className="p-3 text-center min-w-[80px] text-amber-400 font-black">
                                            Tổng Buổi
                                        </th>
                                        <th className="p-3 text-center min-w-[85px] text-emerald-400 font-black">
                                            Học Phí Tháng
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                    {players.map(player => {
                                        let attended = 0;
                                        filteredDates.forEach(d => {
                                            if (attendanceMap[d]?.includes(player.id)) attended++;
                                        });
                                        const pct = filteredDates.length > 0 ? Math.round((attended / filteredDates.length) * 100) : 0;
                                        const isPaid = player.tuition === 'PAID';

                                        return (
                                            <tr key={player.id} className="hover:bg-white/5 transition">
                                                <td className="p-3 sticky left-0 bg-[#07130c] z-10">
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={player.avatar || '/football-avatar.jpg'}
                                                            className="w-6 h-6 rounded-md object-cover border border-amber-400 shrink-0"
                                                            alt=""
                                                        />
                                                        <span className="font-extrabold text-white text-xs truncate max-w-[110px]">
                                                            {player.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${POSITION_CONFIG[player.position].badgeBg} text-white`}>
                                                        {player.position}
                                                    </span>
                                                </td>
                                                {filteredDates.map(d => {
                                                    const isChecked = attendanceMap[d]?.includes(player.id);
                                                    return (
                                                        <td
                                                            key={d}
                                                            className={`p-2 text-center cursor-pointer ${d === selectedDate ? 'bg-amber-500/5' : ''}`}
                                                            onClick={() => {
                                                                const cur = attendanceMap[d] || [];
                                                                const next = cur.includes(player.id)
                                                                    ? cur.filter(id => id !== player.id)
                                                                    : [...cur, player.id];
                                                                saveAttendanceForDate(next, d);
                                                                triggerHaptic();
                                                                footballAudio.playBallKick();
                                                            }}
                                                        >
                                                            {isChecked ? (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/40">
                                                                    ✓
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-600 font-bold text-xs">
                                                                    ✕
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-3 text-center font-bold text-xs bg-[#07130c]">
                                                    <span className="text-amber-400 font-black">{attended}/{filteredDates.length}b</span>
                                                    <span className="block text-[9px] text-zinc-400">({pct}%)</span>
                                                </td>
                                                <td className="p-3 text-center text-xs">
                                                    <button
                                                        onClick={() => toggleTuition(player.id)}
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                                            isPaid
                                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                                        }`}
                                                    >
                                                        {isPaid ? 'Đã đóng' : 'Chưa đóng'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: ROSTER */}
                {activeTab === 'roster' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xs sm:text-sm font-black text-white">Danh Sách Học Viên ({players.length} em)</h2>
                                <p className="text-[10px] text-zinc-400">Theo dõi số buổi và tình trạng học phí</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={renewAllForNewMonth}
                                    className="px-2.5 py-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-xl text-xs font-bold active:scale-95"
                                >
                                    🔄 Nạp Tháng Cả Lớp
                                </button>
                                <button
                                    onClick={() => {
                                        triggerHaptic();
                                        setEditingPlayer(null);
                                        setPlayerFormData({
                                            name: '',
                                            jerseyNumber: Math.floor(Math.random() * 50) + 1,
                                            position: 'FW',
                                            preferredFoot: 'Phải',
                                            parentPhone: '',
                                            remainingSessions: classSettings.monthlySessions,
                                            totalSessionsPack: classSettings.monthlySessions,
                                            avatar: '/football-avatar.jpg',
                                            rating: 88,
                                            tuition: 'PAID'
                                        });
                                        setIsPlayerModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-amber-400 text-black font-black rounded-xl text-xs active:scale-95"
                                >
                                    ➕ Thêm Em
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {players.map(player => {
                                const isPaid = player.tuition === 'PAID';
                                return (
                                    <div
                                        key={player.id}
                                        className="bg-black/50 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between gap-2.5"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border-2 border-amber-500/40 shrink-0 relative">
                                                <img src={player.avatar || '/football-avatar.jpg'} alt={player.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-xs text-white">#{player.jerseyNumber} {player.name} ({player.position})</div>
                                                <div className="text-[10px] text-zinc-400 mt-0.5">
                                                    Còn <strong className="text-amber-400">{player.remainingSessions}</strong> buổi • 
                                                    <span className={player.tuition === 'PAID' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                                        {player.tuition === 'PAID' ? ' Đã đóng học phí' : ' Chưa đóng học phí'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={(e) => openEditPlayerModal(player, e)}
                                                className="px-2.5 py-1.5 bg-zinc-800 border border-amber-400/50 text-amber-300 rounded-xl text-xs font-bold active:scale-95 flex items-center gap-1"
                                                title="Sửa thông tin học viên"
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                onClick={(e) => handleCardCameraClick(player.id, e)}
                                                className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl text-xs font-bold active:scale-95 flex items-center gap-1"
                                                title="Đổi ảnh"
                                            >
                                                📷 Đổi ảnh
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const updated = players.map(p => p.id === player.id ? { ...p, remainingSessions: p.remainingSessions + classSettings.monthlySessions, tuition: 'PAID' as const } : p);
                                                    savePlayers(updated);
                                                    showToast(`Đã nạp +${classSettings.monthlySessions}b cho ${player.name}`);
                                                }}
                                                className="px-2.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold active:scale-95"
                                            >
                                                +{classSettings.monthlySessions}b
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Xóa học viên này?')) {
                                                        const updated = players.filter(p => p.id !== player.id);
                                                        savePlayers(updated);
                                                    }
                                                }}
                                                className="px-2 py-1.5 bg-rose-950/40 text-rose-400 rounded-xl text-xs font-bold"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* FIXED BOTTOM NAVIGATION BAR */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#07130c]/95 border-t border-amber-500/20 backdrop-blur-2xl pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
                <div className="max-w-md mx-auto flex items-center justify-around px-4 min-h-[62px] relative">
                    <button
                        onClick={() => { triggerHaptic(); setActiveTab('cards'); }}
                        className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 ${
                            activeTab === 'cards' ? 'text-amber-400 font-black -translate-y-0.5' : 'text-zinc-500'
                        }`}
                    >
                        <span className="text-xl leading-none">🃏</span>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold">Thẻ FIFA</span>
                    </button>

                    <button
                        onClick={() => { triggerHaptic(); setActiveTab('history'); }}
                        className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 ${
                            activeTab === 'history' ? 'text-amber-400 font-black -translate-y-0.5' : 'text-zinc-500'
                        }`}
                    >
                        <span className="text-xl leading-none">📊</span>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold">Bảng Excel</span>
                    </button>

                    <button
                        onClick={() => { triggerHaptic(); setActiveTab('roster'); }}
                        className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 ${
                            activeTab === 'roster' ? 'text-amber-400 font-black -translate-y-0.5' : 'text-zinc-500'
                        }`}
                    >
                        <span className="text-xl leading-none">👥</span>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold">Học Phí ({players.length})</span>
                    </button>
                </div>
            </nav>

            {/* MODAL SETTINGS (HỌC PHÍ & SỐ BUỔI DO THẦY QUYẾT ĐỊNH) */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0c1a10] border border-amber-500/30 rounded-3xl max-w-sm w-full p-5 space-y-3.5 text-xs">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <h3 className="font-black text-sm text-amber-300 flex items-center gap-1.5">
                                <span>⚙️</span>
                                <span>Cài Đặt Số Buổi & Học Phí Tháng</span>
                            </h3>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="text-zinc-400 text-sm">✕</button>
                        </div>

                        <div>
                            <label className="block text-zinc-300 font-bold mb-1">Số buổi trong 1 tháng</label>
                            <input
                                type="number"
                                value={tempMonthlySessions}
                                onChange={(e) => setTempMonthlySessions(parseInt(e.target.value, 10) || 8)}
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2.5 text-white font-black text-sm text-center"
                            />
                            <p className="text-[10px] text-zinc-400 mt-1">Ví dụ: 8 buổi (tuần 2 buổi) hoặc 12 buổi (tuần 3 buổi)</p>
                        </div>

                        <div>
                            <label className="block text-zinc-300 font-bold mb-1">Học phí tháng (VNĐ)</label>
                            <input
                                type="number"
                                step="50000"
                                value={tempMonthlyFee}
                                onChange={(e) => setTempMonthlyFee(parseInt(e.target.value, 10) || 600000)}
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2.5 text-amber-300 font-black text-sm text-center"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsSettingsModalOpen(false)} className="px-3.5 py-2 bg-zinc-800 text-zinc-300 rounded-xl font-bold">
                                Hủy
                            </button>
                            <button onClick={saveSettings} className="px-5 py-2 bg-amber-400 text-black font-black rounded-xl shadow-lg">
                                Lưu Cài Đặt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THÊM / SỬA HỌC VIÊN */}
            {isPlayerModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0c1a10] border border-amber-500/30 rounded-3xl max-w-sm w-full p-5 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <h3 className="font-black text-sm text-amber-300">
                                {editingPlayer ? `✏️ Sửa Thông Tin: ${editingPlayer.name}` : 'Thêm Học Viên Mới'}
                            </h3>
                            <button onClick={() => setIsPlayerModalOpen(false)} className="text-zinc-400 text-sm">✕</button>
                        </div>
                        
                        <div>
                            <label className="block text-zinc-400 mb-1">Tên học viên in trên thẻ *</label>
                            <input
                                type="text"
                                required
                                value={playerFormData.name || ''}
                                onChange={(e) => setPlayerFormData({ ...playerFormData, name: e.target.value })}
                                placeholder="NGUYỄN VĂN AN"
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2 text-white uppercase font-black"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-zinc-400 mb-1">Số áo</label>
                                <input
                                    type="number"
                                    value={playerFormData.jerseyNumber ?? 10}
                                    onChange={(e) => setPlayerFormData({ ...playerFormData, jerseyNumber: parseInt(e.target.value, 10) || 1 })}
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2 text-white font-bold text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-zinc-400 mb-1">OVR</label>
                                <input
                                    type="number"
                                    value={playerFormData.rating ?? 90}
                                    onChange={(e) => setPlayerFormData({ ...playerFormData, rating: parseInt(e.target.value, 10) || 85 })}
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2 text-amber-400 font-black text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-zinc-400 mb-1">Vị trí</label>
                                <select
                                    value={playerFormData.position || 'FW'}
                                    onChange={(e) => setPlayerFormData({ ...playerFormData, position: e.target.value as PlayerPosition })}
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2 text-white font-bold"
                                >
                                    <option value="GK">GK</option>
                                    <option value="DF">DF</option>
                                    <option value="MF">MF</option>
                                    <option value="FW">FW</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-zinc-400 mb-1">Số buổi còn lại</label>
                                <input
                                    type="number"
                                    value={playerFormData.remainingSessions ?? classSettings.monthlySessions}
                                    onChange={(e) => setPlayerFormData({ ...playerFormData, remainingSessions: parseInt(e.target.value, 10) || 0 })}
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2 text-white font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-zinc-400 mb-1">Học phí tháng</label>
                                <select
                                    value={playerFormData.tuition || 'PAID'}
                                    onChange={(e) => setPlayerFormData({ ...playerFormData, tuition: e.target.value as any })}
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2 text-white font-bold"
                                >
                                    <option value="PAID">✅ Đã đóng</option>
                                    <option value="UNPAID">⏳ Chưa đóng</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-zinc-400 mb-1">Chân thuận</label>
                                <select
                                    value={playerFormData.preferredFoot || 'Phải'}
                                    onChange={(e) => setPlayerFormData({ ...playerFormData, preferredFoot: e.target.value as any })}
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2 text-white font-bold"
                                >
                                    <option value="Phải">Chân Phải</option>
                                    <option value="Trái">Chân Trái</option>
                                    <option value="Hai chân">Hai Chân</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-zinc-400 mb-1">SĐT Phụ huynh</label>
                                <input
                                    type="tel"
                                    placeholder="09..."
                                    value={playerFormData.parentPhone || ''}
                                    onChange={(e) => setPlayerFormData({ ...playerFormData, parentPhone: e.target.value })}
                                    className="w-full bg-black/50 border border-zinc-700 rounded-xl p-2 text-white font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsPlayerModalOpen(false)} className="px-3.5 py-2 bg-zinc-800 text-zinc-300 rounded-xl font-bold">
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    if (!playerFormData.name?.trim()) return alert('Nhập tên học viên');
                                    
                                    if (editingPlayer) {
                                        const updated = players.map(p => p.id === editingPlayer.id ? {
                                            ...p,
                                            name: playerFormData.name!.trim(),
                                            jerseyNumber: playerFormData.jerseyNumber || 10,
                                            position: playerFormData.position || 'FW',
                                            preferredFoot: playerFormData.preferredFoot || 'Phải',
                                            parentPhone: playerFormData.parentPhone || '',
                                            remainingSessions: playerFormData.remainingSessions ?? p.remainingSessions,
                                            rating: playerFormData.rating || 90,
                                            tuition: playerFormData.tuition || 'PAID'
                                        } : p);
                                        savePlayers(updated);
                                        setIsPlayerModalOpen(false);
                                        showToast('✅ Đã lưu thay đổi cho ' + playerFormData.name);
                                    } else {
                                        const newP = {
                                            id: 'fb-' + Date.now(),
                                            name: playerFormData.name.trim(),
                                            jerseyNumber: playerFormData.jerseyNumber || 10,
                                            position: playerFormData.position || 'FW',
                                            preferredFoot: (playerFormData.preferredFoot as any) || 'Phải',
                                            parentPhone: playerFormData.parentPhone || '',
                                            remainingSessions: playerFormData.remainingSessions || classSettings.monthlySessions,
                                            totalSessionsPack: classSettings.monthlySessions,
                                            avatar: '/football-avatar.jpg',
                                            rating: playerFormData.rating || 90,
                                            tuition: playerFormData.tuition || 'PAID'
                                        };
                                        savePlayers([...players, newP]);
                                        setIsPlayerModalOpen(false);
                                        showToast('⚽ Đã thêm học viên mới ' + newP.name);
                                    }
                                }}
                                className="px-5 py-2 bg-amber-400 text-black font-black rounded-xl shadow-lg"
                            >
                                {editingPlayer ? 'Lưu Thay Đổi' : 'Tạo Thẻ Học Viên'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-black font-black px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-1.5 text-xs animate-bounce">
                    <span>📢</span>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
