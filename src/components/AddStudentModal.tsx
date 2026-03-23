'use client';

import { useState, useTransition } from 'react';
import { useToast } from './Toast';
import { createStudentAction } from '@/lib/actions';
import type { GroupId } from '@/types/database.types';
import { GROUPS, GROUP_IDS } from '@/lib/constants';
import { Modal, Button, InputField, SelectField } from './ui';

// =============================================
// ADD STUDENT MODAL
// =============================================

interface AddStudentModalProps {
    onClose: () => void;
    defaultGroup?: GroupId;
}

const DAYS = [
    { value: 2, label: 'T2' },
    { value: 3, label: 'T3' },
    { value: 4, label: 'T4' },
    { value: 5, label: 'T5' },
    { value: 6, label: 'T6' },
    { value: 7, label: 'T7' },
];

export default function AddStudentModal({ onClose, defaultGroup = GROUP_IDS[0] }: AddStudentModalProps) {
    const [name, setName] = useState('');
    const [groupId, setGroupId] = useState<GroupId>(defaultGroup);
    const [birthYear, setBirthYear] = useState('');
    const [phone, setPhone] = useState('');
    const [schedule, setSchedule] = useState<number[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    function toggleDay(day: number) {
        setSchedule((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
        );
    }

    function handleSubmit() {
        if (!name.trim()) {
            toast('Tên không được để trống', 'warning');
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.set('name', name.trim());
            formData.set('groupId', groupId);
            formData.set('birthYear', birthYear);
            formData.set('phone', phone);
            formData.set('avatarUrl', '');
            formData.set('schedule', JSON.stringify(schedule));

            const result = await createStudentAction(formData);

            if (!result.success) {
                toast(result.error || 'Lỗi khi thêm học sinh', 'error');
            } else {
                toast(`Đã thêm: ${name}`, 'success');
                onClose();
            }
        });
    }

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Thêm học sinh mới"
            maxWidth="max-w-sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isPending || !name.trim()}
                        loading={isPending}
                    >
                        {isPending ? 'Đang thêm...' : '+ Thêm'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {/* Name */}
                <InputField
                    label="Tên học sinh *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên..."
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />

                {/* Group */}
                <SelectField
                    label="Phân nhóm"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value as GroupId)}
                >
                    {GROUPS.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </SelectField>

                {/* Birth Year */}
                <InputField
                    label="Năm sinh"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="VD: 2015"
                    maxLength={4}
                />

                {/* Phone */}
                <InputField
                    label="Số điện thoại phụ huynh"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0909..."
                />

                {/* Schedule */}
                <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                        Lịch tập
                    </label>
                    <div className="flex gap-2">
                        {DAYS.map((d) => (
                            <button
                                key={d.value}
                                onClick={() => toggleDay(d.value)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition border ${schedule.includes(d.value)
                                    ? 'bg-[rgba(var(--accent-rgb-from),0.2)] text-[var(--accent-from)] border-[rgba(var(--accent-rgb-from),0.3)]'
                                    : 'bg-[var(--bg-primary)] text-[var(--text-tertiary)] border-[var(--border-primary)] hover:border-[var(--border-primary)]'
                                    }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
