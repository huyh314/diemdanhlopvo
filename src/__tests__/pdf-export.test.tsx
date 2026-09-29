import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PdfExporter from '@/components/PdfExporter';
import type { StudentReportData } from '@/components/pdf/SemesterReportTemplate';

const { capture, save, addImage } = vi.hoisted(() => ({
    capture: vi.fn(), save: vi.fn(), addImage: vi.fn(),
}));

vi.mock('@/components/Toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('html2canvas', () => ({ default: capture }));
vi.mock('jspdf', () => ({
    jsPDF: class {
        addPage = vi.fn();
        addImage = addImage;
        save = save;
    },
}));

const rankings: StudentReportData[] = [1, 2].map((n) => ({
    student_id: `student-${n}`, student_name: `Học sinh ${n}`, group_id: `nhom_${n}`,
    cat_chuyen_can: 10, cat_y_thuc: 10, cat_chuyen_mon: 10, total: 30, rank: n,
}));
const canvas = { width: 800, height: 1100, toDataURL: () => 'data:image/jpeg;base64,example' };

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    capture.mockResolvedValue(canvas);
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('PDF export with on-demand print layouts', () => {
    it.each([
        { trigger: /BXH/, ids: ['pdf-ranking-template-nhom_1', 'pdf-ranking-template-nhom_2'], file: 'BangXepHang_2026-W40.pdf' },
        { trigger: /Phiếu Kết Quả/, ids: ['pdf-report-student-1', 'pdf-report-student-2'], file: 'PhieuKetQua_HangLoat_2026-W40.pdf' },
    ])('exports every page after closing the preview: $file', async ({ trigger, ids, file }) => {
        let finishCapture!: (value: typeof canvas) => void;
        capture.mockImplementationOnce(() => new Promise((resolve) => { finishCapture = resolve; }));

        render(<PdfExporter rankings={rankings} weekKey="2026-W40" />);
        expect(document.querySelector('[id^="pdf-"]')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: trigger }));
        ids.forEach((id) => expect(document.getElementById(id)).not.toBeNull());
        fireEvent.click(screen.getAllByRole('button', { name: /Tải về PDF/ })[0]);
        await waitFor(() => expect(capture).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
        ids.forEach((id) => expect(document.getElementById(id)).not.toBeNull());
        await act(async () => { finishCapture(canvas); });

        await waitFor(() => expect(save).toHaveBeenCalledWith(file));
        expect(capture.mock.calls.map(([element]) => element.id)).toEqual(ids);
        expect(addImage).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(document.querySelector('[id^="pdf-"]')).toBeNull());
    });
});
