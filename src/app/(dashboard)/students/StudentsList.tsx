'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { mediaAccessUrl } from '@/lib/media-url';
import type { StudentRow } from '@/types/database.types';
import { bulkDeleteStudentsAction } from './actions';

type StudentGroup = {
    id: string;
    name: string;
    students: StudentRow[];
};

export default function StudentsList({ groups, total }: { groups: StudentGroup[]; total: number }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const [message, setMessage] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const allStudents = groups.flatMap((group) => group.students);
    const allSelected = allStudents.length > 0 && selectedIds.size === allStudents.length;

    function toggleStudent(id: string) {
        setMessage('');
        setSelectedIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleGroup(group: StudentGroup) {
        setMessage('');
        setSelectedIds((current) => {
            const next = new Set(current);
            const groupIsSelected = group.students.every((student) => next.has(student.id));
            for (const student of group.students) {
                if (groupIsSelected) next.delete(student.id);
                else next.add(student.id);
            }
            return next;
        });
    }

    function toggleAll() {
        setMessage('');
        setSelectedIds(allSelected ? new Set() : new Set(allStudents.map((student) => student.id)));
    }

    function deleteSelected() {
        const ids = [...selectedIds];
        if (!ids.length || isPending) return;

        const confirmed = window.confirm(
            `Ẩn ${ids.length} học sinh khỏi danh sách? Lịch sử điểm danh và điểm thi đua của các em vẫn được giữ lại.`,
        );
        if (!confirmed) return;

        setMessage('');
        startTransition(async () => {
            const result = await bulkDeleteStudentsAction(ids);
            if ('error' in result) {
                setMessage(result.error ?? 'Không thể xóa học sinh. Vui lòng thử lại.');
                return;
            }

            setSelectedIds(new Set());
            setMessage(
                result.deleted === ids.length
                    ? `Đã xóa ${result.deleted} học sinh khỏi danh sách.`
                    : `Đã xóa ${result.deleted}/${ids.length} học sinh khỏi danh sách. Các hồ sơ còn lại có thể đã được xóa trước đó.`,
            );
            router.refresh();
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">👥 Danh Sách Học Sinh</h2>
                <span className="text-sm text-gray-400">Tổng: {total} học sinh</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        disabled={isPending || allStudents.length === 0}
                        className="h-4 w-4 accent-cyan-400"
                        aria-label="Chọn tất cả học sinh"
                    />
                    Chọn tất cả
                </label>
                <span className="text-sm text-gray-400" aria-live="polite">
                    Đã chọn {selectedIds.size} / {total}
                </span>
                <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={selectedIds.size === 0 || isPending}
                    className="ml-auto rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isPending ? 'Đang xóa…' : `Xóa đã chọn${selectedIds.size ? ` (${selectedIds.size})` : ''}`}
                </button>
                {selectedIds.size > 0 && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedIds(new Set());
                            setMessage('');
                        }}
                        disabled={isPending}
                        className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
                    >
                        Bỏ chọn
                    </button>
                )}
                {message && (
                    <p role="status" className={`w-full text-sm ${message.startsWith('Đã xóa') ? 'text-emerald-300' : 'text-red-300'}`}>
                        {message}
                    </p>
                )}
            </div>

            {groups.map((group) => {
                const groupSelected = group.students.every((student) => selectedIds.has(student.id));
                const groupPartiallySelected = group.students.some((student) => selectedIds.has(student.id));

                return (
                    <section key={group.id} aria-labelledby={`group-${group.id}`}>
                        <div className="mb-3 flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={groupSelected}
                                ref={(element) => {
                                    if (element) element.indeterminate = !groupSelected && groupPartiallySelected;
                                }}
                                onChange={() => toggleGroup(group)}
                                disabled={isPending}
                                className="h-4 w-4 accent-cyan-400"
                                aria-label={`Chọn tất cả học sinh nhóm ${group.name}`}
                            />
                            <h3 id={`group-${group.id}`} className="text-sm font-bold uppercase tracking-wider text-gray-400">
                                {group.name} ({group.students.length})
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {group.students.map((student) => {
                                const isSelected = selectedIds.has(student.id);
                                return (
                                    <div
                                        key={student.id}
                                        className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                                            isSelected
                                                ? 'border-cyan-400/50 bg-cyan-400/10'
                                                : 'border-white/10 bg-white/5 hover:border-blue-500/30 hover:bg-white/10'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleStudent(student.id)}
                                            disabled={isPending}
                                            className="ml-1 h-4 w-4 shrink-0 accent-cyan-400"
                                            aria-label={`Chọn ${student.name}`}
                                        />
                                        <a href={`/students/${student.id}`} className="flex min-w-0 flex-1 items-center gap-4 py-1">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-base font-bold text-white">
                                                {student.avatar_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={mediaAccessUrl(student.avatar_url)}
                                                        alt={student.name}
                                                        width={48}
                                                        height={48}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="h-full w-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    student.name
                                                        .split(' ')
                                                        .map((word) => word[0])
                                                        .slice(-2)
                                                        .join('')
                                                        .toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="whitespace-normal break-words font-semibold leading-snug">{student.name}</h4>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                    {student.birth_year && <span>({student.birth_year})</span>}
                                                    {student.phone && <span>📱 {student.phone}</span>}
                                                </div>
                                            </div>
                                            <span className="text-gray-600">→</span>
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
