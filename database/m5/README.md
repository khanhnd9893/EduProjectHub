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
   6. `phan_cong_giang_vien.sql`
   7. `quan_ly_nhiem_vu.sql`
   8. `kiem_tra_tien_do.sql`
   9. `tao_view.sql`
4. Mở tab **Structure**; cần thấy các bảng `users`, `project_rounds`, `student_groups`, `group_members`, `group_invitations`, `group_requests`, `group_lecturers`, `tasks` và hai view `vw_group_list`, `vw_group_member_details`.

phpMyAdmin hỗ trợ `DELIMITER` trong file trigger `kiem_tra_tien_do.sql`; hãy import nguyên file, không xóa các dòng `DELIMITER`.

## Khôi phục khi import dở

Nếu phpMyAdmin báo `#1146 - Table 'eduprojecthub.student_groups' doesn't exist` khi chạy `tao_view.sql`, database đã được tạo nhưng các bảng nhóm chưa được import. `tao_view.sql` chỉ tạo view, không tạo bảng. Chọn database `eduprojecthub` rồi import tiếp từ `quan_ly_nhom.sql`, theo thứ tự:

1. `quan_ly_nhom.sql`
2. `quan_ly_thanh_vien.sql`
3. `quan_ly_loi_moi.sql`
4. `quan_ly_yeu_cau.sql`
5. `phan_cong_giang_vien.sql`
6. `quan_ly_nhiem_vu.sql`
7. `kiem_tra_tien_do.sql`
8. `tao_view.sql`

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

Gửi JSON cho thao tác ghi cùng header `X-CSRF-Token`. `due_at` nhận `YYYY-MM-DD HH:MM:SS` hoặc `null`. Quản trị viên/trưởng nhóm được quản lý nhiệm vụ; thành viên đang hoạt động được xem nhiệm vụ của nhóm và chỉ cập nhật trạng thái nhiệm vụ được giao cho mình. Giảng viên được phân công chỉ xem danh sách/chi tiết, không được thay đổi nhiệm vụ.

## API tiến độ

`GET /Code/Backend/progress.php?action=group&group_id=1` trả về thông tin nhóm, số nhiệm vụ theo trạng thái, số nhiệm vụ quá hạn/chưa giao, tỷ lệ hoàn thành và thống kê nhiệm vụ được giao cho từng thành viên. Tỷ lệ hoàn thành tính bằng `completed / (total - cancelled)`; nếu không có nhiệm vụ hợp lệ thì trả `0`. Thành viên đang hoạt động, giảng viên có ít nhất 2 nhóm được phân công và quản trị viên được xem. Tiến độ được tổng hợp từ bảng `tasks`, không lưu thêm dữ liệu trùng lặp; cần import `quan_ly_nhiem_vu.sql` trước khi sử dụng.

## Phân quyền giảng viên, sinh viên

- Sinh viên chỉ xem danh sách/chi tiết nhóm mình đang tham gia; thành viên chỉ cập nhật trạng thái nhiệm vụ được giao cho chính mình. Trưởng nhóm được quản lý nhóm và nhiệm vụ.
- Giảng viên phải được phân công ít nhất 2 nhóm mới xem được danh sách, nhiệm vụ và tiến độ; chỉ đọc, không được thay đổi nhóm/nhiệm vụ/trạng thái.
- Admin có quyền đọc toàn bộ dữ liệu và quản lý theo quy tắc hiện hành.
- `group_lecturers` lưu phân công giảng viên–nhóm. Chỉ admin được cập nhật phân công qua `POST /Code/Backend/groups.php?action=assign_lecturer`. Gửi CSRF token trong header `X-CSRF-Token` và danh sách đầy đủ các nhóm mới của giảng viên (tối thiểu 2 nhóm khác nhau):

```json
{
  "lecturer_user_id": 5,
  "group_ids": [1, 2]
}
```

API thay thế toàn bộ phân công của giảng viên trong một transaction. Để bỏ một nhóm, gửi lại danh sách đầy đủ còn lại; danh sách vẫn phải có ít nhất 2 nhóm. Cấu hình nào ít hơn 2 nhóm sẽ bị từ chối, và giảng viên có dữ liệu phân công cũ dưới ngưỡng sẽ không có quyền truy cập cho đến khi admin cập nhật đủ nhóm.
