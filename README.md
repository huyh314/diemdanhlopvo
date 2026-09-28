# Võ Đường Manager

Ứng dụng quản lý học viên, điểm danh, điểm thi đua, giáo án và thư viện kỹ thuật. Đây là ứng dụng web Next.js có thể cài lên màn hình điện thoại dưới dạng PWA. Dữ liệu dùng chung được lưu trên Supabase.

## Cấu hình Supabase

1. Tạo một project Supabase.
2. Trong Netlify, thêm `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào Environment variables cho Production (và Deploy Previews nếu cần). Dùng URL và anon/publishable key của project tương ứng; không đưa service-role key vào trình duyệt hay biến `NEXT_PUBLIC_*`.
3. Cấu hình Supabase Auth → URL Configuration: đặt Site URL thành domain production của Netlify và thêm các URL callback của domain production/preview vào Redirect URLs.
4. Tắt public sign-ups trong Supabase Auth nếu chỉ một nhóm nhỏ được dùng. Tạo từng tài khoản cho người được phép trong Supabase Dashboard → Authentication → Users. App hiện chỉ có màn hình đăng nhập, chưa có giao diện mời/tạo tài khoản.

### Database và Storage

Các SQL migration nằm trong `supabase/migrations`; Netlify không tự chạy chúng khi deploy.

- Với Supabase mới, kiểm tra nội dung migration trước khi chạy theo thứ tự. `001_schema.sql` có lệnh `DROP TABLE ... CASCADE`; chỉ dùng để khởi tạo database trống, tuyệt đối không chạy lại trên database có dữ liệu.
- `003_seed_data.sql` chèn danh sách học viên khởi tạo. Xác nhận danh sách này phù hợp trước khi chạy; nếu tên trong đó là dữ liệu thật, hãy thay bằng dữ liệu mẫu và cân nhắc quyền riêng tư của repo.
- File giáo án/đòn thế được tải trực tiếp từ trình duyệt lên Supabase bằng signed upload URL; bucket phải cho phép upload theo migration 013. Ảnh đại diện giới hạn 4MB.
- Với database đã có đầy đủ schema đến migration 012, chạy migration `013_private_lesson_attachments.sql` và sau đó `014_private_avatars.sql` một lần để chuyển file giáo án/đòn thế và ảnh học viên sang private storage. Các migration này không thay thế những migration còn thiếu.
- Sao lưu database trước khi áp dụng SQL trên môi trường có dữ liệu thật. Không chạy lại migration cũ chỉ để “đồng bộ” cấu hình.

## Deploy Netlify

Repo đã có `netlify.toml` với lệnh `npm run build` và Next.js plugin. Kết nối repo với Netlify, nhập biến môi trường Supabase, rồi deploy nhánh `main`. Sau khi deploy, mở URL production và kiểm tra đăng nhập, học viên, điểm danh và upload file.

## Cài lên điện thoại

- Android: mở URL production bằng Chrome rồi chọn **Install app** hoặc **Add to Home screen**.
- iPhone/iPad: mở URL bằng Safari, chọn **Share → Add to Home Screen**.

PWA hiện hỗ trợ lưu nháp/đưa điểm danh vào hàng đợi khi mất mạng sau khi trang đã tải. Các trang và dữ liệu khác vẫn cần mạng; sau khi kết nối lại, giữ app mở để hàng đợi đồng bộ.

## Chạy và kiểm tra tại máy

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

Đặt hai biến Supabase trên trong môi trường chạy ứng dụng. Không commit `.env.local` hoặc bí mật dự án.
