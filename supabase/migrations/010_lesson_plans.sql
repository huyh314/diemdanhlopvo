-- =============================================
-- MIGRATION: Thêm bảng lesson_plans
-- Chạy script này trong Supabase Dashboard → SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS lesson_plans (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    week_key     text NOT NULL,          -- VD: "2025-W15" (ISO week year-week)
    session_date date NOT NULL,          -- Ngày cụ thể của buổi học
    group_id     text NOT NULL CHECK (group_id IN ('nhom_1', 'nhom_2', 'nhom_3')),
    title        text NOT NULL,          -- Tiêu đề / chủ đề buổi học
    content      jsonb NOT NULL DEFAULT '[]'::jsonb, -- Nội dung chi tiết (mảng sections)
    notes        text,                   -- Ghi chú tuỳ chọn
    created_at   timestamptz DEFAULT now() NOT NULL,
    updated_at   timestamptz DEFAULT now() NOT NULL
);

-- Index để query nhanh theo tuần và nhóm
CREATE INDEX IF NOT EXISTS idx_lesson_plans_week_key   ON lesson_plans (week_key);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_session_date ON lesson_plans (session_date);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_group_id   ON lesson_plans (group_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION fn_update_lesson_plans_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lesson_plans_updated_at
    BEFORE UPDATE ON lesson_plans
    FOR EACH ROW EXECUTE FUNCTION fn_update_lesson_plans_timestamp();

-- RLS: chỉ user đã xác thực mới được truy cập
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lesson_plans"
    ON lesson_plans FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert lesson_plans"
    ON lesson_plans FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update lesson_plans"
    ON lesson_plans FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete lesson_plans"
    ON lesson_plans FOR DELETE
    TO authenticated
    USING (true);

-- =============================================
-- Cấu trúc JSON của cột content (tham khảo):
-- [
--   { "type": "khoi_dong", "items": ["Chạy vòng 5 phút", "Khởi động khớp"] },
--   { "type": "ky_thuat",  "items": ["Đấm thẳng 3 bộ x 20 cái", "Đòn đá vòng"] },
--   { "type": "the_luc",   "items": ["20 đẩy tay", "Gánh tấn 3 phút"] },
--   { "type": "tong_ket",  "items": ["Ôn bài cũ", "Đánh giá buổi học"] }
-- ]
-- =============================================
