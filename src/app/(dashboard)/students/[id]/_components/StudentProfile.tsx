'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateStudentAction, deleteStudentAction, uploadAvatarAction } from '../actions';
import { GROUPS, getGroupName } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import { StudentRow } from '@/types/database.types';

export default function StudentProfile({ student }: { student: StudentRow }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isUploading, startUpload] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const groupLabel = getGroupName(student.group_id);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        startUpload(async () => {
            const result = await uploadAvatarAction(student.id, formData);
            if (result?.error) {
                toast(result.error, 'error');
            } else {
                toast('Đã cập nhật ảnh đại diện', 'success');
            }
            e.target.value = '';
        });
    }

    async function handleSave(formData: FormData) {
        startTransition(async () => {
            const result = await updateStudentAction(student.id, formData);
            if (result?.error) {
                toast(result.error, 'error');
            } else {
                toast('Đã cập nhật thông tin học sinh', 'success');
                setIsEditing(false);
            }
        });
    }

    async function handleDelete() {
        if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này không? Hành động này không thể hoàn tác.')) {
            return;
        }

        startTransition(async () => {
            const result = await deleteStudentAction(student.id);
            if (result?.error) {
                toast(result.error, 'error');
            } else {
                toast('Đã xóa học sinh', 'success');
                router.push('/students');
            }
        });
    }

    if (isEditing) {
        return (
            <div className="rounded-xl bg-white/10 border border-[var(--accent-from)] p-6 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--accent-rgb-from),0.2)]">
                <form action={handleSave} className="space-y-4">
                    <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                        <h3 className="font-bold text-lg text-[var(--accent-from)]">Chỉnh sửa thông tin</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Họ và tên</label>
                            <input
                                name="name"
                                defaultValue={student.name}
                                required
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-[var(--accent-from)] focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Nhóm</label>
                            <select
                                name="group_id"
                                defaultValue={student.group_id}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-[var(--accent-from)] focus:outline-none"
                            >
                                {GROUPS.map(g => (
                                    <option key={g.id} value={g.id} className="bg-gray-900">{g.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Năm sinh</label>
                            <input
                                name="birth_year"
                                defaultValue={student.birth_year || ''}
                                placeholder="VD: 2010"
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-[var(--accent-from)] focus:outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase">Số điện thoại</label>
                            <input
                                name="phone"
                                defaultValue={student.phone || ''}
                                placeholder="VD: 0912345678"
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-[var(--accent-from)] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isPending}
                            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 disabled:opacity-50"
                        >
                            {isPending ? 'Đang xử lý...' : 'Xóa học sinh'}
                        </button>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={isPending}
                                className="px-4 py-2 border border-white/20 rounded-lg text-sm font-medium hover:bg-white/10 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-4 py-2 bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] rounded-lg text-sm font-bold text-white shadow-md hover:brightness-110 disabled:opacity-50"
                            >
                                {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm relative group overflow-hidden">
            <button
                onClick={() => setIsEditing(true)}
                className="absolute top-4 right-4 p-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
                title="Chỉnh sửa thông tin"
            >
                <span className="text-xs font-bold uppercase tracking-wider">Sửa</span> ✏️
            </button>
            <div className="flex items-center gap-5">
                <label className="relative block w-20 h-20 rounded-full cursor-pointer group shrink-0">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-lg border-2 border-transparent group-hover:border-[var(--accent-from)] transition-all">
                        {student.avatar_url ? (
                            <img
                                src={student.avatar_url}
                                alt={student.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            student.name
                                .split(' ')
                                .map((w) => w[0])
                                .slice(-2)
                                .join('')
                                .toUpperCase()
                        )}
                    </div>
                    {/* Hover Overlay */}
                    <div className={`absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isUploading ? (
                            <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <span className="text-[10px] uppercase font-bold text-center tracking-wider text-white">Đổi Ảnh</span>
                        )}
                    </div>
                </label>
                <div>
                    <h2 className="text-2xl font-bold pr-16">{student.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold whitespace-nowrap">
                            {groupLabel}
                        </span>
                        {student.birth_year && <span className="whitespace-nowrap truncate max-w-full">Sinh: {student.birth_year}</span>}
                        {student.phone && <span className="whitespace-nowrap truncate max-w-full">📱 {student.phone}</span>}
                        {(!student.birth_year && !student.phone) && <span className="text-gray-500 italic text-xs">Chưa có thông tin liên lạc</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
