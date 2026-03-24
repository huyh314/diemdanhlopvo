-- 006_storage_bucket.sql
-- Vui lòng chạy đoạn SQL này trong mục SQL Editor của Supabase để tạo kho lưu trữ ảnh

-- 1. Tạo bucket 'avatars' và đặt quyền Public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Cho phép ai cũng có thể XEM ảnh (Public Read)
CREATE POLICY "Avatar Public Read Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- 3. Chỉ cho phép người có tài khoản (đã đăng nhập) được ĐĂNG ảnh
CREATE POLICY "Avatar Auth Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 4. Định nghĩa quyền CẬP NHẬT ảnh
CREATE POLICY "Avatar Auth Update Access" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- 5. Định nghĩa quyền XÓA ảnh
CREATE POLICY "Avatar Auth Delete Access" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
