# Import database m5 bằng phpMyAdmin (XAMPP)

Các file cài đặt bên dưới tạo schema nhóm đồ án trong database `eduprojecthub`. Không cần gộp file; hãy import từng file theo đúng thứ tự để các khóa ngoại tham chiếu tới bảng đã tồn tại.

## Các bước

1. Mở `http://localhost/phpmyadmin`.
2. Chọn tab **Import** khi chưa chọn database, chọn file `Tai_khoan.sql` trong thư mục này và bấm **Import**. File này tự tạo database `eduprojecthub` với charset `utf8mb4`.
3. Chọn database `eduprojecthub`, lần lượt import các file:
   1. `quan_ly_do_an.sql`
   2. `quan_ly_nhom.sql`
   3. `quan_ly_thanh_vien.sql`
   4. `quan_ly_loi_moi.sql`
   5. `quan_ly_yeu_cau.sql`
   6. `quan_ly_nhiem_vu.sql`
   7. `kiem_tra_tien_do.sql`
   8. `tao_view.sql`
4. Mở tab **Structure**; cần thấy các bảng `users`, `project_rounds`, `student_groups`, `group_members`, `group_invitations`, `group_requests`, `tasks` và hai view `vw_group_list`, `vw_group_member_details`.

phpMyAdmin hỗ trợ `DELIMITER` trong file trigger `kiem_tra_tien_do.sql`; hãy import nguyên file, không xóa các dòng `DELIMITER`.

## Khôi phục khi import dở

Nếu phpMyAdmin báo `#1146 - Table 'eduprojecthub.student_groups' doesn't exist` khi chạy `tao_view.sql`, database đã được tạo nhưng các bảng nhóm chưa được import. `tao_view.sql` chỉ tạo view, không tạo bảng. Chọn database `eduprojecthub` rồi import tiếp từ `quan_ly_nhom.sql`, theo thứ tự:

1. `quan_ly_nhom.sql`
2. `quan_ly_thanh_vien.sql`
3. `quan_ly_loi_moi.sql`
4. `quan_ly_yeu_cau.sql`
5. `quan_ly_nhiem_vu.sql`
6. `kiem_tra_tien_do.sql`
7. `tao_view.sql`

Không cần chạy lại `Tai_khoan.sql` hoặc `quan_ly_do_an.sql` nếu bảng `users` và `project_rounds` đã có. Không xóa database để khắc phục lỗi này.

## File không thuộc bước cài schema

- `file examp.sql` chỉ chứa dữ liệu minh họa, không phải dữ liệu đăng nhập dùng thật. Chỉ import trên database mới sau khi cài đủ schema; không import lặp lại vì có thể trùng email/mã.
- `kiem_thu.sql` chỉ chứa các truy vấn tham khảo. Không cần import để tạo database.

## Nếu database đã tồn tại

`Tai_khoan.sql` dùng `CREATE DATABASE IF NOT EXISTS` và `CREATE TABLE IF NOT EXISTS`, nên không xóa database/bảng hiện có. Các file trigger xóa và tạo lại bốn trigger quản lý thành viên; file view tạo lại hai view. Trước khi áp dụng lên database đang có dữ liệu, hãy sao lưu trong phpMyAdmin bằng **Export**.

API backend và `Code/Backend/test.php` cùng dùng cấu hình kết nối tại `database/database.php`. Mặc định file dùng tài khoản `root` không mật khẩu, theo cấu hình XAMPP mới cài đặt. Chỉ dùng mặc định này trên máy phát triển cục bộ; không dùng tài khoản root cho môi trường triển khai. Có thể cấu hình `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` trong môi trường chạy PHP để thay đổi thông tin kết nối.

## API nhiệm vụ

Import `quan_ly_nhiem_vu.sql` sau khi tạo `student_groups` và trước khi gọi `Code/Backend/tasks.php`. API quản lý nhiệm vụ gắn với nhóm hiện có:

| Method | URL/action | Dữ liệu |
|---|---|---|
| GET | `tasks.php?action=csrf` | Lấy `csrf_token` của session |
| GET | `tasks.php?action=tasks&group_id=1` | Danh sách; tùy chọn `status=todo\|in_progress\|completed\|cancelled` |
| GET | `tasks.php?action=task&id=1` | Chi tiết nhiệm vụ |
| POST | `tasks.php?action=create` | `group_id`, `title`; tùy chọn `description`, `completion_criteria`, `assigned_to`, `priority`, `due_at` |
| PATCH | `tasks.php?action=update` | `id` và các trường muốn sửa: `title`, `description`, `completion_criteria`, `assigned_to`, `priority`, `due_at` |
| PATCH | `tasks.php?action=status` | `id`, `status` |
| DELETE | `tasks.php?action=delete` | `id` |

Gửi JSON cho thao tác ghi cùng header `X-CSRF-Token`. `due_at` nhận `YYYY-MM-DD HH:MM:SS` hoặc `null`. Quản trị viên/trưởng nhóm được quản lý nhiệm vụ; thành viên đang hoạt động được xem và cập nhật trạng thái nhiệm vụ được giao cho mình (hoặc nhiệm vụ chưa gán). Schema m5 chưa có quan hệ phân công giảng viên với nhóm, do đó API này chưa thể xác minh phạm vi giảng viên.
