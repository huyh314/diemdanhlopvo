'use client';

export default function DownloadStudentListButton() {
    async function download() {
        try {
            const res = await fetch('/api/export/student-list');
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Không thể tải danh sách');
                return;
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DanhSachHocSinh_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download Error:', error);
            alert('Lỗi tải file Excel!');
        }
    }

    return (
        <button
            onClick={download}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition text-sm font-medium"
        >
            📝 DS Học Sinh
        </button>
    );
}
