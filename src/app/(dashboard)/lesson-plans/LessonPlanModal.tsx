'use client';

import { useState, useTransition, useRef, useCallback } from 'react';
import { createLessonPlanAction, updateLessonPlanAction } from '@/lib/lesson-plan.actions';
import type { LessonPlanRow, LessonPlanContent, LessonPlanSection, GroupId } from '@/types/database.types';
import { GROUPS } from '@/lib/constants';

// =============================================
// SECTION CONFIG
// =============================================

const SECTION_CONFIG: Record<LessonPlanSection, { icon: string; label: string; color: string }> = {
    khoi_dong: { icon: '🔥', label: 'Khởi Động', color: 'from-orange-500/20 to-orange-400/10 border-orange-500/30 text-orange-300' },
    ky_thuat:  { icon: '⚔️', label: 'Kỹ Thuật',  color: 'from-blue-500/20 to-blue-400/10 border-blue-500/30 text-blue-300' },
    the_luc:   { icon: '💪', label: 'Thể Lực',    color: 'from-green-500/20 to-green-400/10 border-green-500/30 text-green-300' },
    tong_ket:  { icon: '📝', label: 'Tổng Kết',   color: 'from-purple-500/20 to-purple-400/10 border-purple-500/30 text-purple-300' },
};

const SECTION_ORDER: LessonPlanSection[] = ['khoi_dong', 'ky_thuat', 'the_luc', 'tong_ket'];
const DEFAULT_CONTENT: LessonPlanContent[] = SECTION_ORDER.map((type) => ({ type, items: [] }));

// =============================================
// Types
// =============================================

interface UploadingFile {
    id: string;
    file: File;
    preview: string;
    progress: 'uploading' | 'done' | 'error';
    url?: string;
    path?: string;
    error?: string;
}

interface LessonPlanModalProps {
    plan?: LessonPlanRow;
    defaultDate?: string;
    defaultGroupId?: GroupId;
    libraryTechniques?: import('@/types/database.types').TechniqueRow[];
    onClose: () => void;
    onSuccess: () => void;
}

// =============================================
// Image Lightbox
// =============================================

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <button
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white text-2xl"
                onClick={onClose}
            >
                ×
            </button>
            {url.match(/\.(mp4|webm|mov)$/i) ? (
                <video src={url} controls className="max-w-full max-h-full rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ maxHeight: 'calc(100vh - 80px)' }} />
            ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={url}
                    alt="Tài liệu giáo án"
                    className="max-w-full max-h-full rounded-xl object-contain shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxHeight: 'calc(100vh - 80px)' }}
                />
            )}
        </div>
    );
}

// =============================================
// Image Upload Zone
// =============================================

function ImageUploadZone({
    uploading,
    savedUrls,
    onAddFiles,
    onRemoveUploading,
    onRemoveSaved,
    onPreview,
}: {
    uploading: UploadingFile[];
    savedUrls: string[];
    onAddFiles: (files: File[]) => void;
    onRemoveUploading: (id: string) => void;
    onRemoveSaved: (url: string) => void;
    onPreview: (url: string) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith('image/') || f.type.startsWith('video/')
        );
        if (files.length) onAddFiles(files);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (files.length) onAddFiles(files);
        e.target.value = '';
    }

    const allImages = [
        ...savedUrls.map((url) => ({ type: 'saved' as const, url, id: url })),
        ...uploading.map((u) => ({ type: 'uploading' as const, ...u })),
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    📎 Tài Liệu Đính Kèm
                </p>
                <span className="text-[10px] text-[var(--text-muted)]">
                    Ảnh/Video · tối đa 50MB
                </span>
            </div>

            {/* Image Grid */}
            {allImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {savedUrls.map((url) => (
                        <div
                            key={url}
                            className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer"
                            onClick={() => onPreview(url)}
                        >
                            {url.match(/\.(mp4|webm|mov)$/i) ? (
                                <video src={url} className="w-full h-full object-cover transition group-hover:scale-105" />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={url}
                                    alt="Tài liệu"
                                    className="w-full h-full object-cover transition group-hover:scale-105"
                                />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 text-white text-xl transition">🔍</span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemoveSaved(url); }}
                                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-600 text-white text-xs opacity-0 group-hover:opacity-100 transition"
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {uploading.map((u) => (
                        <div
                            key={u.id}
                            className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5"
                        >
                            {u.file.type.startsWith('video/') ? (
                                <video src={u.preview} className={`w-full h-full object-cover transition ${u.progress === 'uploading' ? 'opacity-40' : 'opacity-100 group-hover:scale-105'}`} />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={u.preview}
                                    alt={u.file.name}
                                    className={`w-full h-full object-cover transition ${u.progress === 'uploading' ? 'opacity-40' : 'opacity-100 group-hover:scale-105'}`}
                                />
                            )}

                            {/* Uploading overlay */}
                            {u.progress === 'uploading' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Error overlay */}
                            {u.progress === 'error' && (
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/70 p-1 cursor-default"
                                    title={u.error}
                                >
                                    <span className="text-red-300 text-lg">⚠️</span>
                                    <span className="text-red-200 text-[9px] text-center leading-tight mt-0.5 line-clamp-2">
                                        {u.error}
                                    </span>
                                </div>
                            )}

                            {/* Done: hover to preview */}
                            {u.progress === 'done' && u.url && (
                                <>
                                    <div
                                        className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center cursor-pointer"
                                        onClick={() => onPreview(u.url!)}
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 text-white text-xl transition">🔍</span>
                                    </div>
                                </>
                            )}

                            {/* Remove button */}
                            {u.progress !== 'uploading' && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveUploading(u.id)}
                                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-600/80 hover:bg-red-600 text-white text-xs opacity-0 group-hover:opacity-100 transition"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Drop Zone */}
            <div
                className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                    isDragging
                        ? 'border-[var(--accent-from)] bg-[rgba(var(--accent-rgb-from),0.12)] scale-[1.01]'
                        : 'border-[var(--border-primary)] hover:border-[var(--accent-from)]/50 hover:bg-white/3'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center gap-2 py-5 px-4 select-none">
                    <div className={`text-3xl transition-transform ${isDragging ? 'scale-125' : ''}`}>
                        {isDragging ? '📥' : '🖼️'}
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-[var(--text-secondary)]">
                            Kéo thả ảnh vào đây
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            hoặc <span className="text-[var(--accent-from)] underline underline-offset-2">chọn file</span>
                        </p>
                    </div>
                </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />
            </div>
        </div>
    );
}

// =============================================
// MAIN MODAL
// =============================================

export default function LessonPlanModal({
    plan,
    defaultDate,
    defaultGroupId = 'nhom_1',
    libraryTechniques = [],
    onClose,
    onSuccess,
}: LessonPlanModalProps) {
    const isEdit = !!plan;
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string>('');

    // Form fields
    const [title, setTitle] = useState(plan?.title ?? '');
    const [sessionDate, setSessionDate] = useState(plan?.session_date ?? defaultDate ?? '');
    const [groupId, setGroupId] = useState<GroupId>(plan?.group_id ?? defaultGroupId);
    const [notes, setNotes] = useState(plan?.notes ?? '');
    const [content, setContent] = useState<LessonPlanContent[]>(
        plan?.content?.length ? plan.content : DEFAULT_CONTENT
    );

    // Attachment & Technique state
    const [savedUrls, setSavedUrls] = useState<string[]>(plan?.attachments ?? []);
    const [uploading, setUploading] = useState<UploadingFile[]>([]);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [techniqueIds, setTechniqueIds] = useState<string[]>(plan?.technique_ids ?? []);
    const [showTechniquePicker, setShowTechniquePicker] = useState(false);

    // ── Content Handlers ──────────────────────────────────────────

    function addItem(sectionType: LessonPlanSection) {
        setContent((prev) =>
            prev.map((sec) =>
                sec.type === sectionType
                    ? { ...sec, items: [...sec.items, ''] }
                    : sec
            )
        );
    }

    function updateItem(sectionType: LessonPlanSection, idx: number, value: string) {
        setContent((prev) =>
            prev.map((sec) =>
                sec.type === sectionType
                    ? { ...sec, items: sec.items.map((item, i) => (i === idx ? value : item)) }
                    : sec
            )
        );
    }

    function removeItem(sectionType: LessonPlanSection, idx: number) {
        setContent((prev) =>
            prev.map((sec) =>
                sec.type === sectionType
                    ? { ...sec, items: sec.items.filter((_, i) => i !== idx) }
                    : sec
            )
        );
    }

    // ── Upload Handlers ───────────────────────────────────────────

    const handleAddFiles = useCallback(async (files: File[]) => {
        const newEntries: UploadingFile[] = files.map((file) => ({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            preview: URL.createObjectURL(file),
            progress: 'uploading',
        }));

        setUploading((prev) => [...prev, ...newEntries]);

        // Upload each file
        await Promise.all(
            newEntries.map(async (entry) => {
                try {
                    const fd = new FormData();
                    fd.append('file', entry.file);

                    const res = await fetch('/api/upload-media', {
                        method: 'POST',
                        body: fd,
                    });
                    const json = await res.json();

                    if (!res.ok) {
                        setUploading((prev) =>
                            prev.map((u) =>
                                u.id === entry.id
                                    ? { ...u, progress: 'error', error: json.error ?? 'Upload thất bại' }
                                    : u
                            )
                        );
                    } else {
                        setUploading((prev) =>
                            prev.map((u) =>
                                u.id === entry.id
                                    ? { ...u, progress: 'done', url: json.url, path: json.path }
                                    : u
                            )
                        );
                    }
                } catch {
                    setUploading((prev) =>
                        prev.map((u) =>
                            u.id === entry.id
                                ? { ...u, progress: 'error', error: 'Lỗi kết nối' }
                                : u
                        )
                    );
                }
            })
        );
    }, []);

    function handleRemoveUploading(id: string) {
        setUploading((prev) => {
            const entry = prev.find((u) => u.id === id);
            if (entry?.preview) URL.revokeObjectURL(entry.preview);
            return prev.filter((u) => u.id !== id);
        });
    }

    function handleRemoveSaved(url: string) {
        setSavedUrls((prev) => prev.filter((u) => u !== url));
    }

    // ── Submit ────────────────────────────────────────────────────

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!title.trim() || !sessionDate) {
            setError('Vui lòng nhập tiêu đề và ngày dạy.');
            return;
        }

        const isStillUploading = uploading.some((u) => u.progress === 'uploading');
        if (isStillUploading) {
            setError('Vui lòng chờ ảnh upload xong trước khi lưu.');
            return;
        }

        // Collect all attachment URLs (saved + newly uploaded)
        const allAttachments = [
            ...savedUrls,
            ...uploading.filter((u) => u.progress === 'done' && u.url).map((u) => u.url!),
        ];

        startTransition(async () => {
            const result = isEdit
                ? await updateLessonPlanAction(plan!.id, {
                      sessionDate,
                      groupId,
                      title,
                      content,
                      notes,
                      attachments: allAttachments,
                      techniqueIds,
                  })
                : await createLessonPlanAction({
                      sessionDate,
                      groupId,
                      title,
                      content,
                      notes,
                      attachments: allAttachments,
                      techniqueIds,
                  });

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                setError(result.error ?? 'Có lỗi xảy ra, vui lòng thử lại.');
            }
        });
    }

    // ── Render ────────────────────────────────────────────────────

    return (
        <>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal card */}
                <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-secondary)] border border-[var(--glass-border)] shadow-2xl flex flex-col">
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] bg-[var(--bg-secondary)]/95 backdrop-blur-xl">
                        <h2 className="text-lg font-bold">
                            {isEdit ? '✏️ Chỉnh Sửa Giáo Án' : '📖 Tạo Giáo Án Mới'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition text-[var(--text-muted)] text-xl"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
                        {/* Error */}
                        {error && (
                            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                                Tiêu đề buổi học *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="VD: Bài đòn số 1 – Đấm thẳng + Đá vòng"
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-from)] transition text-sm"
                            />
                        </div>

                        {/* Date + Group row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                                    Ngày dạy *
                                </label>
                                <input
                                    type="date"
                                    value={sessionDate}
                                    onChange={(e) => setSessionDate(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-from)] transition text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                                    Nhóm *
                                </label>
                                <select
                                    value={groupId}
                                    onChange={(e) => setGroupId(e.target.value as GroupId)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-from)] transition text-sm"
                                >
                                    {GROUPS.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ── Image Attachments ── */}
                        <ImageUploadZone
                            uploading={uploading}
                            savedUrls={savedUrls}
                            onAddFiles={handleAddFiles}
                            onRemoveUploading={handleRemoveUploading}
                            onRemoveSaved={handleRemoveSaved}
                            onPreview={(url) => setLightboxUrl(url)}
                        />

                        {/* Divider */}
                        <div className="border-t border-[var(--border-primary)]" />

                        {/* ── Technique Selector ── */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                    🥋 Đòn Thế & Kỹ Thuật
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowTechniquePicker(!showTechniquePicker)}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-[var(--text-secondary)] hover:text-white"
                                >
                                    {showTechniquePicker ? 'Đóng Thư Viện' : 'Mở Thư Viện'}
                                </button>
                            </div>
                            
                            {/* Selected techniques display */}
                            {techniqueIds.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {techniqueIds.map(tid => {
                                        const t = libraryTechniques.find(tech => tech.id === tid);
                                        if (!t) return null;
                                        return (
                                            <div key={tid} className="flex items-center gap-2 pr-2 pl-1 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)] text-xs">
                                                {t.media_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={t.media_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                ) : <span className="w-5 h-5 flex items-center justify-center bg-black/40 rounded-full">🥋</span>}
                                                <span className="font-semibold truncate max-w-[120px]">{t.title}</span>
                                                <button type="button" onClick={() => setTechniqueIds(prev => prev.filter(id => id !== tid))} className="w-4 h-4 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition">×</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Technique Picker Drawer */}
                            {showTechniquePicker && (
                                <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl max-h-[250px] overflow-y-auto">
                                    {libraryTechniques.length === 0 ? (
                                        <p className="text-xs text-[var(--text-muted)] text-center italic py-4">Thư viện trống. Hãy thêm đòn thế từ menu Thư Viện Kỹ Thuật.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {libraryTechniques.map(tech => {
                                                const isSelected = techniqueIds.includes(tech.id);
                                                return (
                                                    <div 
                                                        key={tech.id} 
                                                        onClick={() => {
                                                            setTechniqueIds(prev => isSelected ? prev.filter(id => id !== tech.id) : [...prev, tech.id]);
                                                        }}
                                                        className={`relative flex flex-col p-2 rounded-lg border transition cursor-pointer ${isSelected ? 'border-[var(--accent-from)] bg-[var(--accent-from)]/10' : 'border-[var(--border-primary)] bg-white/5 hover:border-[var(--accent-from)]/40 hover:bg-white/10'}`}
                                                    >
                                                        <div className="aspect-video w-full rounded-md overflow-hidden bg-black/40 mb-1 flex items-center justify-center relative">
                                                            {tech.media_type === 'video' ? (
                                                                <span className="absolute inset-0 flex items-center justify-center text-white/50 text-2xl z-10">▶</span>
                                                            ) : null}
                                                            {tech.media_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={tech.media_url} alt="" className="w-full h-full object-cover" />
                                                            ) : <span className="text-xl opacity-50">🥋</span>}
                                                            
                                                            {isSelected && (
                                                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs shadow z-20">✓</div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-bold truncate text-[var(--text-primary)]">{tech.title}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[var(--border-primary)]" />

                        {/* Content Sections */}
                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                Nội dung buổi học
                            </p>

                            {content.map((section) => {
                                const cfg = SECTION_CONFIG[section.type];
                                return (
                                    <div
                                        key={section.type}
                                        className={`rounded-xl border bg-gradient-to-br p-4 space-y-2.5 ${cfg.color}`}
                                    >
                                        <p className="text-sm font-bold flex items-center gap-2">
                                            <span>{cfg.icon}</span>
                                            <span>{cfg.label}</span>
                                        </p>

                                        {section.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="text-xs text-[var(--text-muted)] font-mono w-4 shrink-0 text-right">
                                                    {idx + 1}.
                                                </span>
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => updateItem(section.type, idx, e.target.value)}
                                                    placeholder="Nhập nội dung..."
                                                    className="flex-1 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(section.type, idx)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/20 text-red-400 transition text-sm shrink-0"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => addItem(section.type)}
                                            className="text-xs opacity-60 hover:opacity-100 transition flex items-center gap-1"
                                        >
                                            <span>+</span>
                                            <span>Thêm mục</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                                Ghi chú (tuỳ chọn)
                            </label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Lưu ý cho buổi học này..."
                                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-from)] transition text-sm resize-none"
                            />
                        </div>

                        {/* Footer actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition text-sm font-medium"
                            >
                                Huỷ
                            </button>
                            <button
                                type="submit"
                                disabled={isPending || uploading.some((u) => u.progress === 'uploading')}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white font-semibold text-sm shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {(isPending || uploading.some((u) => u.progress === 'uploading')) && (
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                {uploading.some((u) => u.progress === 'uploading')
                                    ? 'Đang upload...'
                                    : isEdit
                                    ? 'Lưu Thay Đổi'
                                    : 'Tạo Giáo Án'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
            )}
        </>
    );
}
