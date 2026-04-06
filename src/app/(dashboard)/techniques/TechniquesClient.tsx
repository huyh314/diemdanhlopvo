'use client';

import { useState, useTransition, useRef } from 'react';
import type { TechniqueRow } from '@/types/database.types';
import { createTechniqueAction, deleteTechniqueAction } from '@/lib/technique.actions';
import { Button } from '@/components/ui';

export default function TechniquesClient({ initialTechniques }: { initialTechniques: TechniqueRow[] }) {
    const [techniques, setTechniques] = useState(initialTechniques);
    const [showModal, setShowModal] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Modal state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    function resetModal() {
        setTitle('');
        setDescription('');
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setError('');
        setShowModal(false);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim() || !file) {
            setError('Vui lòng nhập tên và chọn file.');
            return;
        }

        setError('');
        setUploading(true);

        try {
            // Upload file
            const fd = new FormData();
            fd.append('file', file);

            const uploadRes = await fetch('/api/upload-media', {
                method: 'POST',
                body: fd,
            });
            const uploadJson = await uploadRes.json();

            if (!uploadRes.ok) throw new Error(uploadJson.error || 'Upload thất bại');

            const isVideo = file.type.startsWith('video/');

            // Create technique record
            startTransition(async () => {
                const result = await createTechniqueAction({
                    title,
                    description,
                    media_url: uploadJson.url,
                    media_type: isVideo ? 'video' : 'image',
                });

                if (result.success) {
                    setTechniques((prev) => [result.data, ...prev]);
                    resetModal();
                } else {
                    setError(result.error || 'Lỗi lưu thông tin');
                }
                setUploading(false);
            });
        } catch (err: any) {
            setError(err.message);
            setUploading(false);
        }
    }

    function handleDelete(id: string) {
        if (!confirm('Bạn có chắc chắn muốn xoá đòn thế này? Hành động này không thể hoàn tác.')) return;
        startTransition(async () => {
             const result = await deleteTechniqueAction(id);
             if (result.success) {
                 setTechniques((prev) => prev.filter(t => t.id !== id));
             } else {
                 alert(result.error || 'Lỗi khi xoá.');
             }
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setShowModal(true)} variant="primary" className="shadow-lg">
                    <span>+</span>
                    <span>Thêm Đòn Thế</span>
                </Button>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {techniques.length === 0 && (
                    <div className="col-span-full py-10 text-center text-[var(--text-muted)] bg-white/5 border border-white/10 rounded-2xl border-dashed">
                        Chưa có dữ liệu nào trong thư viện. Hãy thêm mới!
                    </div>
                )}
                {techniques.map(tech => (
                    <div key={tech.id} className="group relative rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden shadow-md flex flex-col">
                        <div className="aspect-square bg-black/50 relative overflow-hidden flex items-center justify-center">
                            {tech.media_type === 'video' ? (
                                <video src={tech.media_url} controls className="w-full h-full object-cover" />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={tech.media_url} alt={tech.title} className="w-full h-full object-cover" />
                            )}
                            <button
                                onClick={() => handleDelete(tech.id)}
                                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition shadow" 
                                title="Xoá đòn thế"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-3">
                            <h3 className="font-bold text-sm truncate">{tech.title}</h3>
                            {tech.description && <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">{tech.description}</p>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={resetModal} />
                    <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] shadow-2xl p-6">
                        <h2 className="text-lg font-bold mb-4">🚀 Thêm Đòn Thế Mới</h2>
                        
                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Tên đòn thế *</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ví dụ: Đấm thẳng, Đá vòng cầu..."
                                    className="w-full px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:border-[var(--accent-from)] outline-none text-sm"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Mô tả chi tiết</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Ghi chú về góc độ, điểm tiếp xúc..."
                                    className="w-full px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:border-[var(--accent-from)] outline-none text-sm resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">File minh họa (Video mp4 hoặc Ảnh jpg, png, gif) *</label>
                                <div 
                                    className="border-2 border-dashed border-[var(--border-primary)] rounded-xl p-4 text-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition flex flex-col items-center justify-center gap-2 aspect-video bg-black/30"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewUrl ? (
                                        file?.type.startsWith('video/') ? (
                                            <video src={previewUrl} className="w-full h-full object-contain" controls />
                                        ) : (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-md" />
                                        )
                                    ) : (
                                        <>
                                            <span className="text-3xl">📤</span>
                                            <span className="text-sm text-[var(--text-muted)]">Click để chọn file hoặc Kéo thả vào đây</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={resetModal} className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition">
                                    Huỷ
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={uploading || isPending}
                                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white font-semibold text-sm shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {(uploading || isPending) && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {uploading ? 'Đang tải lên...' : isPending ? 'Đang lưu...' : 'Thêm vào Thư Viện'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
