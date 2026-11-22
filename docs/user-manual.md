# Hướng dẫn sử dụng

Tài liệu này mô tả các chức năng có giao diện/API trong repository hiện tại. Chức năng nào chưa có giao diện hoặc API tương ứng sẽ được ghi rõ là chưa hỗ trợ.

## 1. Yêu cầu
- Trình duyệt hiện đại.
- Tài khoản được cấp trong cơ sở dữ liệu của môi trường đang dùng.
- Để chạy ứng dụng đầy đủ tại máy local: PHP 8.x, MySQL/MariaDB, Apache và Node.js/npm.

## 2. Cài đặt local
1. Đặt repository trong thư mục Apache `C:\xampp\htdocs\EduProjectHub`. Nếu cần tạo directory junction, xem hướng dẫn trong mục **Gặp 404 hoặc 502** bên dưới.
2. Khởi động Apache và MySQL trong XAMPP.
3. Với database mới, nạp `database/filetong/eduprojecthub-xampp.sql` theo hướng dẫn tại [database/README.md](../database/README.md). Đây là gói demo dùng cho database mới; không import đè lên database đang có dữ liệu.
4. Trong `Code/frontend`, tạo file `.env` từ `.env.example`, sau đó cài và chạy frontend:
   ```powershell
   Copy-Item .env.example .env
   npm install
   npm run dev
   ```
5. Mở địa chỉ Vite được in trong terminal (mặc định `http://localhost:5173`). Cấu hình Vite hiện proxy API tới `http://localhost` (cổng 80); nếu Apache chạy cổng khác, proxy phát triển mặc định sẽ không trỏ tới cổng đó.
6. Tham khảo [Code/frontend/README.md](../Code/frontend/README.md) và [database/README.md](../database/README.md) nếu cần cấu hình môi trường khác.

Không ghi thông tin kết nối hoặc bí mật vào tài liệu/repository. Nếu dùng tài khoản demo, chỉ dùng trong môi trường local.

## 3. Đăng nhập
1. Nhập **tên đăng nhập** và mật khẩu; hệ thống không dùng email làm tên đăng nhập.
2. Chọn đúng cổng theo tài khoản:
   - `/login`: sinh viên và trưởng nhóm.
   - `/lecturer-login`: giảng viên.
   - `/admin-login`: quản trị viên và người đào tạo.
3. Nếu đăng nhập ở cổng không dành cho vai trò của tài khoản, hệ thống từ chối đăng nhập tại cổng đó.
4. Sau khi đăng xuất, hệ thống đưa bạn về cổng đăng nhập đã dùng gần nhất.

Tài khoản demo từ database seed (chỉ dùng cho môi trường demo local): `sv`, `truongnhom`, `gv`, `daotao`, `admin`; mật khẩu demo là `123456`. Không dùng tài khoản/mật khẩu demo trên hệ thống công khai.

[Ảnh: ba cổng đăng nhập]

### 3.1. Menu theo vai trò

Các mục chung là **Tổng quan**, **Hồ sơ**, **Thông báo**, **Đề tài**, **Nhóm**, **Nhiệm vụ**, **Tiến độ**, **Báo cáo**, **Điểm số** và **Chatbot**; các mục nghiệp vụ chỉ hoạt động trong phạm vi quyền của tài khoản.

| Vai trò | Mục menu bổ sung/không hiển thị | Phạm vi M1 chính |
|---|---|---|
| Quản trị viên | Có **Tài khoản** và **Đợt đồ án** | Quản lý tài khoản; tra cứu đề tài và đợt đồ án ở chế độ chỉ xem. |
| Người đào tạo | Có **Đợt đồ án**; không có **Tài khoản** | Tạo/cập nhật đợt đồ án; tạo/cập nhật đề tài và xử lý đăng ký theo quyền hiện có. |
| Giảng viên | Không có **Tài khoản** và **Đợt đồ án** | Xem đề tài, tạo/cập nhật đề tài và xử lý đăng ký theo quyền hiện có. |
| Sinh viên | Không có **Tài khoản** và **Đợt đồ án** | Xem đề tài đang mở; trưởng nhóm có thể đăng ký đề tài cho nhóm mình. |
| Trưởng nhóm | Giống menu sinh viên | Có quyền sinh viên; thao tác trưởng nhóm chỉ áp dụng với nhóm mình phụ trách. |

### 3.2. Hồ sơ cá nhân và đổi mật khẩu

1. Chọn **Hồ sơ** trên menu.
2. Có thể cập nhật họ tên, email, số điện thoại và khoa/đơn vị.
3. Mã sinh viên chỉ đọc, không sửa được trên trang hồ sơ.
4. Đổi mật khẩu bằng cách nhập mật khẩu hiện tại, mật khẩu mới và xác nhận. Mật khẩu mới phải có ít nhất 8 ký tự, khác mật khẩu hiện tại và hai lần nhập phải khớp.

[Ảnh: hồ sơ cá nhân và đổi mật khẩu]

### 3.3. Dashboard theo vai trò

Chọn **Tổng quan** để xem các chỉ số tương ứng với vai trò:
- Sinh viên/trưởng nhóm và giảng viên: số nhóm trong phạm vi được trả về, nhiệm vụ đang mở và hạn gần nhất (nếu có).
- Quản trị viên: tổng tài khoản, đề tài đang mở, đợt đồ án đang hoạt động và tổng đề tài.
- Người đào tạo: số đề tài đang mở, đợt đồ án đang hoạt động và tổng đề tài.

Dashboard hiện là phần tổng quan các chỉ số trên, không phải báo cáo thống kê đầy đủ theo đợt.

[Ảnh: dashboard theo vai trò]

## 4. Sinh viên
1. Trong **Đề tài**, xem đề tài đang mở; dùng tìm kiếm theo mã, tên, mô tả hoặc giảng viên, sau đó mở **Chi tiết đề tài**.
2. Sinh viên không phải trưởng nhóm chỉ xem danh sách đề tài; trưởng nhóm gửi đăng ký cho nhóm mình và theo dõi trạng thái đăng ký.
   [Ảnh: danh sách và chi tiết đề tài]
3. Xem thông tin đồ án và thành viên.
4. Khi tạo nhóm thành công, tài khoản tự chuyển sang vai trò Trưởng nhóm; quyền quản lý chỉ áp dụng cho nhóm vừa tạo.
5. Mở danh sách nhiệm vụ để xem trạng thái và hạn nộp.
6. Vào Báo cáo, tìm hoặc lọc đợt theo trạng thái nộp của nhóm, rồi chọn **Xem chi tiết**. Với đợt đang mở, chọn hoặc kéo thả tệp PDF, DOC, DOCX (tối đa 10 MB) để nộp.
7. Ghi chú cho lần nộp nếu cần.
8. Xem lịch sử nộp và nhận xét của giảng viên.
9. Dùng chatbot để hỏi về quy trình, hướng dẫn và dữ liệu mà mình có quyền xem.

## 5. Giảng viên
1. Trong **Đề tài**, tìm kiếm và xem chi tiết đề tài; giảng viên có thể tạo/cập nhật đề tài và xử lý đăng ký theo quyền hiện có.
   [Ảnh: danh sách và chi tiết đề tài]
2. Mở danh sách đồ án được phân công.
3. Xem tiến độ và nhiệm vụ.
4. Mở bài nộp để kiểm tra.
5. Gửi nhận xét và điểm nếu được áp dụng.
6. Theo dõi các lần nộp lại.

## 6. Quản trị viên
1. Vào **Tài khoản** để tạo tài khoản, tìm kiếm/lọc theo vai trò hoặc trạng thái, sửa thông tin và vai trò, khóa/mở khóa hoặc đặt lại mật khẩu. Khi tạo tài khoản sinh viên/trưởng nhóm, nhập mã sinh viên.
2. Mật khẩu tạm thời sau khi tạo tài khoản hoặc đặt lại chỉ hiển thị một lần; chuyển thông tin này an toàn cho người dùng. Giao diện không hiển thị mật khẩu hash.
   [Ảnh: quản lý tài khoản]
3. Vào **Đề tài** hoặc **Đợt đồ án** để tra cứu dữ liệu; quản trị viên chỉ được xem, không chỉnh sửa.
   [Ảnh: quản lý đợt đồ án]
4. Vào **Hồ sơ** để cập nhật thông tin cá nhân hoặc đổi mật khẩu.
5. Các trang nghiệp vụ nhóm, nhiệm vụ, báo cáo, hội đồng và lịch bảo vệ tuân theo phạm vi quyền xem đã cấp; quản trị viên không ghi dữ liệu vào nghiệp vụ đồ án.
6. Cấu hình hệ thống, nhật ký hoạt động và sao lưu/khôi phục chưa có API quản trị tương ứng.

## 7. Người đào tạo
1. Vào **Đợt đồ án** để xem danh sách; dùng bộ lọc trạng thái, chọn **Thêm học kỳ** để tạo đợt, hoặc chọn **Chỉnh sửa** để cập nhật. Có thể đóng/mở đợt và cần xác nhận trước khi đổi trạng thái.
   [Ảnh: quản lý đợt đồ án]
2. Trong **Đề tài**, tìm kiếm và xem chi tiết; người đào tạo có thể tạo/cập nhật đề tài, đổi trạng thái và duyệt/từ chối đăng ký theo quyền hiện có.
   [Ảnh: quản lý đề tài và duyệt đăng ký]
3. Trong **Báo cáo**, chọn **Tạo đợt báo cáo**, chọn nhóm, nhập thông tin và lưu. Có thể chọn một đợt để chỉnh sửa; sinh viên nộp báo cáo ở đợt đang mở và giảng viên nhận xét phiên bản đã nộp.
4. Người đào tạo cũng có thể truy cập các luồng phân công, hội đồng và lịch bảo vệ hiện có qua các mục được hiển thị trong menu.

## 8. Chatbot
- Hỏi câu ngắn, nêu rõ phần cần hỗ trợ.
- Ưu tiên nội dung FAQ và quy định chính thức.
- Không nhập mật khẩu, token, dữ liệu cá nhân nhạy cảm hoặc thông tin không được phép chia sẻ.
- Chatbot có thể trả lời chưa đầy đủ; xác minh các quyết định học vụ với giảng viên hoặc đơn vị phụ trách.

## 9. Khắc phục lỗi thường gặp
- **Không kết nối được DB:** kiểm tra MySQL đang chạy, tên database, host và thông tin kết nối local.
- **Không đăng nhập được tài khoản demo:** mở bảng `users` trong phpMyAdmin, nếu không có `daotao` hoặc `truongnhom` thì database là bản cũ; nạp lại gói `database/filetong/eduprojecthub-xampp.sql` vào database mới theo `database/README.md`. Đăng nhập đúng cổng theo vai trò và mật khẩu demo ghi ở mục 3.
- **Không tải được tệp:** kiểm tra giới hạn dung lượng, loại tệp cho phép và quyền ghi thư mục lưu trữ.
- **Chatbot không phản hồi:** kiểm tra route backend, log lỗi và cấu hình API nếu tích hợp AI.
- **Đăng nhập sai cổng:** hệ thống từ chối; hãy dùng đúng cổng tương ứng với vai trò tài khoản.
- **Tên người dùng hiển thị đúng nhưng không có dữ liệu hoặc gặp 403:** kiểm tra danh tính phiên bằng cách mở `http://localhost/EduProjectHub/Code/Backend/auth.php?action=me`. Nếu trình duyệt đang giữ phiên của tài khoản khác, hãy đăng xuất hoặc dùng cửa sổ ẩn danh. Nếu danh tính đúng mà vẫn gặp 403, kiểm tra quyền của vai trò đối với chức năng đó.
- **Gặp 404 hoặc 502:** kiểm tra Apache đã chạy và repository nằm tại `C:\xampp\htdocs\EduProjectHub`. Nếu cần tạo directory junction:
  1. Tắt Apache trong XAMPP.
  2. Mở Command Prompt.
  3. Chạy `cd C:\xampp\htdocs`.
  4. Nếu đã có thư mục `EduProjectHub`, đổi tên bằng `ren EduProjectHub EduProjectHub_old`.
  5. Chạy lệnh ví dụ `mklink /J EduProjectHub "D:\Thu-muc\Ten-repo"`. Phải thay **cả đoạn** `D:\Thu-muc\Ten-repo` bằng đường dẫn thật của repository, lấy từ thanh địa chỉ File Explorer. Đây chỉ là ví dụ; không gõ nguyên chữ mẫu.
  6. Kết quả đúng có dạng `Junction created for EduProjectHub <<===>>` kèm đường dẫn thật.
  7. Nếu lỡ tạo liên kết sai, chạy `rmdir EduProjectHub` trong `C:\xampp\htdocs` (chỉ gỡ liên kết, không xóa dữ liệu thật) rồi tạo lại. Không xóa thư mục bằng File Explorer hoặc `del`.
  8. Bật lại Apache trong XAMPP.

## 10. Báo lỗi
Khi báo lỗi, cung cấp bước tái hiện, kết quả mong đợi, kết quả thực tế và thông báo lỗi đã loại bỏ thông tin bí mật.
