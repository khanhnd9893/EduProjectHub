# Kế hoạch kiểm thử

## 1. Phạm vi
Kiểm thử đăng nhập, phân quyền, quản lý đồ án, nhiệm vụ, nộp bài, nhận xét, thông báo và chatbot. Các ca dưới đây là kế hoạch; đánh dấu kết quả sau khi triển khai.

## 2. Quy ước
- **Chưa chạy:** chưa thực thi.
- Môi trường cần ghi nhận: phiên bản PHP, MySQL, trình duyệt và cấu hình.
- Dùng dữ liệu giả lập; không đưa dữ liệu sinh viên thật vào repository.

## 3. Test cases

| ID | Chức năng | Tiền điều kiện / thao tác | Kết quả mong đợi | Trạng thái |
|---|---|---|---|---|
| TC-01 | Đăng nhập hợp lệ | Nhập thông tin đúng | Tạo session và vào dashboard đúng vai trò | Chưa chạy |
| TC-02 | Sai mật khẩu | Nhập email hợp lệ, mật khẩu sai | Báo lỗi chung, không tiết lộ tài khoản có tồn tại hay không | Chưa chạy |
| TC-03 | Tài khoản bị khóa | Đăng nhập tài khoản inactive | Từ chối đăng nhập | Chưa chạy |
| TC-04 | Đăng xuất | Đăng xuất rồi dùng lại session | Session bị hủy | Chưa chạy |
| TC-05 | Phân quyền Admin | Sinh viên gọi route Admin trực tiếp | HTTP 403 hoặc chuyển trang phù hợp; không trả dữ liệu | Chưa chạy |
| TC-06 | Phạm vi giảng viên | Giảng viên A truy cập nhóm đã phân công và nhóm chưa phân công | Chỉ cho phép đọc nhóm đã phân công | Chưa chạy |
| TC-07 | Phạm vi sinh viên | Sinh viên A xem bài nộp của B | Từ chối truy cập | Chưa chạy |
| TC-08 | Tạo đề tài | Admin nhập dữ liệu hợp lệ | Đề tài được lưu | Chưa chạy |
| TC-09 | Ngày không hợp lệ | Ngày kết thúc trước ngày bắt đầu | Báo lỗi xác thực | Chưa chạy |
| TC-10 | Thêm thành viên | Thêm sinh viên hợp lệ vào đồ án | Quan hệ thành viên được lưu | Chưa chạy |
| TC-11 | Nhiệm vụ | Trưởng nhóm tạo nhiệm vụ; giảng viên được phân công xem nhiệm vụ | Trưởng nhóm tạo được; giảng viên chỉ đọc nhiệm vụ | Chưa chạy |
| TC-12 | Nộp tệp hợp lệ | Thành viên nộp PDF trong giới hạn | Lưu metadata và tệp an toàn | Chưa chạy |
| TC-13 | Tệp bị cấm | Tải lên script hoặc tệp vượt giới hạn | Từ chối, không thực thi tệp | Chưa chạy |
| TC-14 | Lịch sử nộp | Nộp lại một nhiệm vụ | Tạo bản ghi phiên bản mới | Chưa chạy |
| TC-15 | Nhận xét | Giảng viên phụ trách nhận xét | Sinh viên liên quan xem được nhận xét | Chưa chạy |
| TC-16 | Điểm ngoài phạm vi | Gửi điểm nhỏ hơn 0 hoặc lớn hơn 10 | Từ chối dữ liệu | Chưa chạy |
| TC-17 | Thông báo | Có sự kiện cần thông báo | Đúng người nhận thấy thông báo | Chưa chạy |
| TC-18 | FAQ chatbot | Hỏi câu nằm trong FAQ | Trả lời dựa trên nội dung đã duyệt | Chưa chạy |
| TC-19 | Chatbot ngoài phạm vi | Hỏi thông tin không có nguồn | Nêu giới hạn, không bịa quy định | Chưa chạy |
| TC-20 | Chatbot quyền dữ liệu | Hỏi về đồ án không thuộc người dùng | Không tiết lộ dữ liệu | Chưa chạy |
| TC-21 | SQL injection | Nhập chuỗi thử nghiệm vào form | Đầu vào được xử lý an toàn, không thay đổi truy vấn | Chưa chạy |
| TC-22 | CSRF | Gửi yêu cầu thay đổi dữ liệu thiếu token | Yêu cầu bị từ chối | Chưa chạy |
| TC-23 | Tổng hợp tiến độ nhóm | Thành viên nhóm gọi API với nhóm có nhiều trạng thái nhiệm vụ | Tổng số, số quá hạn và tỷ lệ hoàn thành khớp dữ liệu nhiệm vụ; nhiệm vụ đã hủy không tính vào mẫu số | Chưa chạy |
| TC-24 | Tiến độ theo thành viên | Gọi API tiến độ nhóm có nhiệm vụ đã giao | Trả số nhiệm vụ theo trạng thái cho từng thành viên đang hoạt động | Chưa chạy |
| TC-25 | Quyền xem tiến độ | Người không thuộc nhóm gọi API tiến độ | Trả HTTP 403, không tiết lộ dữ liệu tiến độ | Chưa chạy |
| TC-26 | Phân quyền sinh viên nhóm | Sinh viên gọi danh sách/chi tiết nhóm khác | Không trả nhóm không thuộc sinh viên | Chưa chạy |
| TC-27 | Phân quyền giảng viên nhóm | Gán lần lượt dưới 2 nhóm, đúng 2 nhóm và nhóm chưa phân công | Dưới 2 nhóm bị từ chối/không có quyền; từ 2 nhóm chỉ đọc được nhóm đã gán | Chưa chạy |
| TC-28 | Giảng viên chỉ đọc nhiệm vụ | Giảng viên được phân công gọi API sửa/trạng thái/xóa nhiệm vụ | Tất cả thao tác ghi bị từ chối; GET nhiệm vụ được phép | Chưa chạy |
| TC-29 | Sinh viên chỉ cập nhật nhiệm vụ được giao | Sinh viên trong nhóm cập nhật nhiệm vụ giao cho mình và của người khác | Nhiệm vụ của mình cập nhật được; nhiệm vụ của người khác hoặc chưa giao nhận HTTP 403 | Chưa chạy |
| TC-30 | Phân công đủ nhóm cho giảng viên | Admin gửi danh sách phân công có 1 nhóm, 2 nhóm trùng nhau, 2 nhóm hợp lệ | Hai trường hợp đầu bị từ chối; danh sách 2 nhóm hợp lệ được lưu nguyên tử | Chưa chạy |

## 4. Báo cáo kết quả
Sau khi chạy, ghi lại: ngày kiểm thử, người kiểm thử, môi trường, kết quả từng TC, lỗi phát hiện và mã issue liên quan.

## 5. Tiêu chí hoàn thành
Các ca quan trọng về xác thực, phân quyền và riêng tư phải đạt trước khi triển khai. Không xem việc chỉ ẩn nút giao diện là kiểm thử phân quyền thành công.
