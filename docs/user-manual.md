# Hướng dẫn sử dụng

> Tài liệu mô tả các luồng dự kiến. Các chức năng chỉ sử dụng được sau khi backend và giao diện tương ứng được triển khai.

## 1. Yêu cầu
- Trình duyệt hiện đại.
- Tài khoản được quản trị viên cấp.
- Với môi trường phát triển: PHP 8.x, MySQL và Apache hoặc môi trường tương đương.

## 2. Cài đặt local
1. Cài và khởi động Apache/MySQL.
2. Import `database/schema.sql` vào MySQL.
3. Import `database/seed.sql` nếu cần dữ liệu demo.
4. Tạo cấu hình kết nối database trong môi trường local, không commit bí mật.
5. Đặt document root trỏ vào thư mục `public/`.
6. Mở ứng dụng trên trình duyệt khi đã triển khai entry point và các route.

## 3. Đăng nhập
1. Mở trang đăng nhập.
2. Nhập email và mật khẩu được cấp.
3. Hệ thống chuyển đến dashboard theo vai trò.
4. Đăng xuất khi dùng xong trên thiết bị dùng chung.

Dữ liệu demo (nếu đã import seed):
- Admin: `admin@example.test`
- Giảng viên: `lecturer@example.test`
- Sinh viên: `student@example.test`
- Mật khẩu mẫu: `ChangeMe123!`

Các tài khoản trên chỉ là dữ liệu minh họa. Không dùng thông tin demo trên hệ thống công khai; hãy đổi mật khẩu trước khi triển khai.

## 4. Sinh viên
1. Xem thông tin đồ án và thành viên.
2. Khi tạo nhóm thành công, tài khoản tự chuyển sang vai trò Trưởng nhóm; quyền quản lý chỉ áp dụng cho nhóm vừa tạo.
3. Mở danh sách nhiệm vụ để xem trạng thái và hạn nộp.
4. Tải báo cáo đúng định dạng và dung lượng quy định.
5. Ghi chú cho lần nộp nếu cần.
6. Xem lịch sử nộp và nhận xét của giảng viên.
7. Dùng chatbot để hỏi về quy trình, hướng dẫn và dữ liệu mà mình có quyền xem.

## 5. Giảng viên
1. Mở danh sách đồ án được phân công.
2. Xem tiến độ và nhiệm vụ.
3. Mở bài nộp để kiểm tra.
4. Gửi nhận xét và điểm nếu được áp dụng.
5. Theo dõi các lần nộp lại.

## 6. Quản trị viên
1. Tạo tài khoản bằng thông tin thật; tìm kiếm, cập nhật hồ sơ và gán một trong năm vai trò.
2. Khóa/mở tài khoản hoặc đặt lại mật khẩu; mật khẩu không được hiển thị lại và chỉ lưu dạng hash.
3. Có thể xóa tài khoản sau khi xác nhận; thao tác bị từ chối nếu tài khoản còn liên kết với nhóm hoặc dữ liệu nghiệp vụ. Hãy chuyển quyền hay xử lý liên kết trước khi thử lại. Không thể tự xóa hoặc xóa quản trị viên hoạt động cuối cùng.
4. Tra cứu học kỳ, đề tài, nhóm, nhiệm vụ, báo cáo, hội đồng và lịch bảo vệ trên toàn hệ thống.
5. Các trang nghiệp vụ của quản trị viên chỉ có quyền xem; người đào tạo quản lý học kỳ, đề tài, phân công, báo cáo và bảo vệ, còn trưởng nhóm quản lý thành viên và nhiệm vụ trong nhóm của mình.
6. Cấu hình hệ thống, nhật ký hoạt động và sao lưu/khôi phục chưa có API quản trị tương ứng.

## 7. Chatbot
- Hỏi câu ngắn, nêu rõ phần cần hỗ trợ.
- Ưu tiên nội dung FAQ và quy định chính thức.
- Không nhập mật khẩu, token, dữ liệu cá nhân nhạy cảm hoặc thông tin không được phép chia sẻ.
- Chatbot có thể trả lời chưa đầy đủ; xác minh các quyết định học vụ với giảng viên hoặc đơn vị phụ trách.

## 8. Khắc phục lỗi thường gặp
- **Không kết nối được DB:** kiểm tra MySQL đang chạy, tên database, host và thông tin kết nối local.
- **Không đăng nhập được demo:** xác minh seed đã import, tạo hash bằng `password_hash()` và kiểm tra bằng `password_verify()`.
- **Không tải được tệp:** kiểm tra giới hạn dung lượng, loại tệp cho phép và quyền ghi thư mục lưu trữ.
- **Chatbot không phản hồi:** kiểm tra route backend, log lỗi và cấu hình API nếu tích hợp AI.

## 9. Báo lỗi
Khi báo lỗi, cung cấp bước tái hiện, kết quả mong đợi, kết quả thực tế và thông báo lỗi đã loại bỏ thông tin bí mật.
