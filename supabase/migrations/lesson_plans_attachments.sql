-- =============================================
-- MIGRATION: Thêm cột attachments vào lesson_plans
-- Chạy script này trong Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Thêm cột attachments (mảng URL ảnh)
ALTER TABLE lesson_plans
ADD COLUMN IF NOT EXISTS attachments text[] NOT NULL DEFAULT '{}';

-- =============================================
-- 2. Tạo Storage Bucket cho ảnh giáo án
--    (Chạy riêng nếu bucket chưa tồn tại)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-attachments', 'lesson-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy cho storage bucket
CREATE POLICY "Authenticated users can upload lesson attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-attachments');

CREATE POLICY "Anyone can view lesson attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-attachments');

CREATE POLICY "Authenticated users can delete lesson attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-attachments');
