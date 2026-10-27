'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, InputField } from '@/components/ui';
import { useGroups } from '@/components/GroupsProvider';
import { createGroupAction } from '@/lib/group-actions';
import { useToast } from '@/components/Toast';

export default function AddGroupButton() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [shortName, setShortName] = useState('');
    const [error, setError] = useState('');
    const [pending, startTransition] = useTransition();
    const { addGroup, error: loadError, refresh } = useGroups();
    const router = useRouter();
    const { toast } = useToast();

    function submit(event: React.FormEvent) {
        event.preventDefault();
        setError('');
        startTransition(async () => {
            try {
                const result = await createGroupAction({ name, shortName });
                if (!result.success) { setError(result.error); return; }
                addGroup(result.data);
                toast(`Đã thêm nhóm ${result.data.name}`, 'success');
                setOpen(false); setName(''); setShortName('');
                router.refresh();
            } catch { setError('Chưa tạo được nhóm. Kiểm tra kết nối và thử lại.'); }
        });
    }

    return <>
        <button type="button" onClick={() => { setError(''); setOpen(true); }} className="min-h-11 rounded-lg border border-[var(--accent-from)] px-4 text-sm font-semibold text-[var(--text-primary)]">+ Thêm nhóm</button>
        {loadError && <button type="button" onClick={refresh} className="text-sm text-amber-400">{loadError} Thử lại</button>}
        {open && <Modal isOpen onClose={() => { if (!pending) setOpen(false); }} title="Thêm nhóm mới" maxWidth="max-w-sm">
            <form onSubmit={submit} className="space-y-4">
                <InputField label="Tên nhóm" aria-label="Tên nhóm" value={name} onChange={event => setName(event.target.value)} required maxLength={80} autoFocus disabled={pending} placeholder="Ví dụ: Nhóm nâng cao" />
                <InputField label="Tên viết tắt (không bắt buộc)" value={shortName} onChange={event => setShortName(event.target.value)} maxLength={12} disabled={pending} placeholder="Ví dụ: NC" />
                {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>Hủy</Button>
                    <Button type="submit" disabled={pending}>{pending ? 'Đang tạo…' : 'Tạo nhóm'}</Button>
                </div>
            </form>
        </Modal>}
    </>;
}
