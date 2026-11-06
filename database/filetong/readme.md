# Chạy toàn bộ database bằng XAMPP

1. Dùng `eduprojecthub-xampp.sql` trong thư mục này để cài trên **database mới/trống**.
2. Trong XAMPP, bật MySQL, mở `http://localhost/phpmyadmin`.
3. Chọn **Import** ở trang chính, chọn file SQL này rồi nhấn **Import**.
4. Sau khi nhập thành công, bật Apache và mở `http://localhost/EduProjectHub/Code/frontend/dist/`.
5. Tài khoản demo: `sv`, `gv`, `admin`; mật khẩu `123456`.

Không import file này vào database đang có dữ liệu. File đã giữ schema và tài khoản hiện tại của dự án, bổ sung các trường hồ sơ FR01 tương thích. Không ghép nguyên file FR01 cũ vì file đó xóa bảng `users`, tạo database khác và dùng cấu trúc đăng nhập không tương thích với API PHP hiện tại.
