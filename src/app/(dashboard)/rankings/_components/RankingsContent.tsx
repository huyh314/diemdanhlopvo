import { getStudentRankings, getAverageRankings } from '@/lib/dal';
import PdfExporter from '@/components/PdfExporter';
import ScoreButton from '@/components/ScoreButton';
import { getGroupShortName } from '@/lib/constants';
import Link from 'next/link';

export default async function RankingsContent({ week, mode = 'weekly', weeks = 4 }: { week?: string; mode?: string; weeks?: number }) {
    const isAverage = mode === 'average';
    const rankings = isAverage
        ? await getAverageRankings(weeks)
        : await getStudentRankings(week);

    return (
        <>
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">🏆 Bảng Xếp Hạng Thi Đua</h2>
                    <span className="text-sm font-mono text-gray-400">
                        {rankings.length} học sinh
                    </span>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10 flex-wrap gap-4">
                    <div className="flex gap-2">
                        <Link
                            href="/rankings/batch-grade"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-orange-500 to-[var(--gold)] text-amber-950 hover:brightness-110 transition shadow-[0_0_15px_rgba(245,166,35,0.3)] mr-2"
                        >
                            ⚡ Chấm Điểm Hàng Loạt
                        </Link>
                        <Link
                            href={`/rankings?mode=weekly${week ? `&week=${week}` : ''}`}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!isAverage ? 'bg-[var(--accent-from)]/20 text-blue-300 border border-[var(--accent-from)]/40 shadow-[var(--glass-shadow)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent hover:bg-white/5'}`}
                        >
                            Theo Tuần
                        </Link>
                        <Link
                            href={`/rankings?mode=average&weeks=${weeks}`}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isAverage ? 'bg-[var(--accent-from)]/20 text-blue-300 border border-[var(--accent-from)]/40 shadow-[var(--glass-shadow)]' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-transparent hover:bg-white/5'}`}
                        >
                            Trung Bình
                        </Link>
                    </div>

                    {isAverage ? (
                        <form method="GET" action="/rankings" className="flex items-center gap-3">
                            <input type="hidden" name="mode" value="average" />
                            <label className="text-sm text-gray-400 hidden sm:inline">Tính trung bình:</label>
                            <input
                                type="number"
                                name="weeks"
                                defaultValue={weeks}
                                min={2} max={52}
                                className="w-16 bg-black/30 border border-white/20 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-sm text-gray-400">tuần gần nhất</span>
                            <button type="submit" className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-sm transition">Xác nhận</button>
                        </form>
                    ) : (
                        <PdfExporter rankings={rankings as any} weekKey={week} />
                    )}
                </div>
            </div>

            {rankings.length >= 3 && (
                <div className="flex justify-center items-end gap-2 sm:gap-6 mb-10 mt-8">
                    {/* Top 2 */}
                    <div className="flex flex-col items-center w-28 sm:w-32 hover:-translate-y-2 transition-transform duration-300">
                        <div className="relative">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-200 border-4 border-slate-300 shadow-lg flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-500 z-10 relative">
                                {rankings[1].student_name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()}
                            </div>
                            <div className="absolute -bottom-3 -right-2 w-8 h-8 rounded-full bg-slate-300 border-2 border-[var(--bg-primary)] flex items-center justify-center text-sm font-bold text-slate-700 z-20">2</div>
                        </div>
                        <div className="mt-4 font-bold text-center text-sm sm:text-base px-1 truncate w-full">{rankings[1].student_name.split(' ').slice(-2).join(' ')}</div>
                        <div className="text-xs text-slate-400 font-mono mt-1">{isAverage ? (rankings[1] as any).avg_total : (rankings[1] as any).total}đ</div>
                        <div className="h-24 sm:h-28 w-full mt-3 rounded-t-xl bg-gradient-to-t from-slate-500/20 to-slate-400/40 border-t border-x border-slate-400/50 shadow-inner"></div>
                    </div>

                    {/* Top 1 */}
                    <div className="flex flex-col items-center w-32 sm:w-36 z-10 hover:-translate-y-2 transition-transform duration-300">
                        <div className="relative">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-4xl z-30 drop-shadow-md animate-bounce">👑</div>
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-yellow-100 border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center justify-center text-2xl sm:text-3xl font-bold text-yellow-600 z-10 relative">
                                {rankings[0].student_name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()}
                            </div>
                            <div className="absolute -bottom-3 -right-2 w-8 h-8 rounded-full bg-yellow-400 border-2 border-[var(--bg-primary)] flex items-center justify-center text-sm font-bold text-yellow-900 z-20 shadow-sm">1</div>
                        </div>
                        <div className="mt-4 font-bold text-center text-base sm:text-lg px-1 text-yellow-500 truncate w-full">{rankings[0].student_name.split(' ').slice(-2).join(' ')}</div>
                        <div className="text-xs text-yellow-600/70 font-mono mt-1 font-bold">{isAverage ? (rankings[0] as any).avg_total : (rankings[0] as any).total}đ</div>
                        <div className="h-32 sm:h-36 w-full mt-3 rounded-t-xl bg-gradient-to-t from-yellow-600/20 to-yellow-500/40 border-t border-x border-yellow-500/50 shadow-inner"></div>
                    </div>

                    {/* Top 3 */}
                    <div className="flex flex-col items-center w-28 sm:w-32 hover:-translate-y-2 transition-transform duration-300">
                        <div className="relative">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-50 border-4 border-orange-300 shadow-md flex items-center justify-center text-lg sm:text-xl font-bold text-orange-600 z-10 relative">
                                {rankings[2].student_name.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()}
                            </div>
                            <div className="absolute -bottom-3 -right-2 w-7 h-7 rounded-full bg-orange-300 border-2 border-[var(--bg-primary)] flex items-center justify-center text-xs font-bold text-orange-900 z-20">3</div>
                        </div>
                        <div className="mt-4 font-bold text-center text-sm sm:text-base px-1 truncate w-full">{rankings[2].student_name.split(' ').slice(-2).join(' ')}</div>
                        <div className="text-xs text-orange-400 font-mono mt-1">{isAverage ? (rankings[2] as any).avg_total : (rankings[2] as any).total}đ</div>
                        <div className="h-16 sm:h-20 w-full mt-3 rounded-t-xl bg-gradient-to-t from-orange-600/20 to-orange-500/40 border-t border-x border-orange-500/50 shadow-inner"></div>
                    </div>
                </div>
            )}

            <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] backdrop-blur-[var(--glass-blur)] shadow-[var(--glass-shadow)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px] md:min-w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-primary)] bg-white/[0.02]">
                                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-16">Hạng</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Họ Tên</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-20">Nhóm</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-24">Chuyên Cần</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-24">Ý Thức</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-24">Chuyên Môn</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-20">Tổng</th>
                                {!isAverage && <th className="px-4 py-3 text-center text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-28">Thao Tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {rankings.map((r: any) => {
                                const cc = isAverage ? r.avg_cc : r.cat_chuyen_can;
                                const yt = isAverage ? r.avg_yt : r.cat_y_thuc;
                                const cm = isAverage ? r.avg_cm : r.cat_chuyen_mon;
                                const total = isAverage ? r.avg_total : r.total;
                                const subInfo = isAverage ? `(${r.weeks_count} tuần)` : null;

                                return (
                                    <tr
                                        key={r.student_id}
                                        className={`border-b border-white/5 transition duration-[var(--transition-fast)] hover:bg-white/5 ${r.rank <= 3 ? 'bg-yellow-500/5' : ''}`}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <span className={r.rank <= 3 ? 'text-lg filter drop-shadow-md' : 'text-sm text-gray-500'}>
                                                {r.medal || r.rank}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg">
                                                    {r.student_name
                                                        .split(' ')
                                                        .map((w: string) => w[0])
                                                        .slice(-2)
                                                        .join('')
                                                        .toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{r.student_name}</span>
                                                    {subInfo && <span className="text-[10px] text-gray-500">{subInfo}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--status-present-bg)] text-[var(--status-present-text)] border border-[var(--status-present-border)]">
                                                {getGroupShortName(r.group_id)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono text-[var(--text-muted)]">{cc}</td>
                                        <td className="px-4 py-3 text-center font-mono text-[var(--text-muted)]">{yt}</td>
                                        <td className="px-4 py-3 text-center font-mono text-[var(--text-muted)]">{cm}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`font-bold ${total >= 70
                                                    ? 'text-[var(--status-present-text)] drop-shadow-sm'
                                                    : total >= 50
                                                        ? 'text-[var(--status-excused-text)]'
                                                        : 'text-gray-400'
                                                    }`}
                                            >
                                                {total}
                                            </span>
                                        </td>
                                        {!isAverage && (
                                            <td className="px-4 py-3 text-center">
                                                <ScoreButton
                                                    studentId={r.student_id}
                                                    studentName={r.student_name}
                                                    weekKey={r.week_key}
                                                    autoChuyenCan={r.cat_chuyen_can}
                                                />
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}

                            {rankings.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <p className="text-4xl mb-2 opacity-50">📊</p>
                                        <p>Chưa có dữ liệu xếp hạng</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
