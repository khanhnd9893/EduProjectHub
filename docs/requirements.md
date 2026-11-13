# Đặc tả yêu cầu phần mềm

## 1. Mục đích và phạm vi
SPMS hỗ trợ quản lý đề tài/đồ án theo học kỳ, phân công hướng dẫn, giao nhiệm vụ, nộp báo cáo, nhận xét và hỏi đáp. Tài liệu này là cơ sở để thiết kế, phát triển và kiểm thử.

## 2. Đối tượng sử dụng
- Quản trị viên: quản lý tài khoản và có phạm vi tra cứu dữ liệu rộng nhất.
- Người đào tạo: điều phối các nghiệp vụ học kỳ, đề tài, phân công, báo cáo và bảo vệ.
- Giảng viên: theo dõi các đồ án được phân công.
- Sinh viên: thực hiện đồ án, nộp bài và tra cứu hướng dẫn.

## 3. Yêu cầu chức năng
- FR-01: Người dùng đăng nhập/đăng xuất an toàn.
- FR-02: Người dùng được phép cập nhật các trường hồ sơ được quy định.
- FR-03: Admin tạo, cập nhật, vô hiệu hóa tài khoản; không hiển thị mật khẩu dạng rõ.
- FR-04: Người đào tạo quản lý học kỳ và thời gian bắt đầu/kết thúc; Admin chỉ được tra cứu.
- FR-05: Người đào tạo hoặc giảng viên tạo/cập nhật đề tài; Admin chỉ được tra cứu.
- FR-06: Người đào tạo phân công giảng viên hướng dẫn; trưởng nhóm quản lý thành viên trong nhóm của mình; Admin chỉ được tra cứu.
- FR-07: Giảng viên chỉ xem/chỉnh sửa đồ án được phân công; Admin có phạm vi đọc rộng nhưng không được ghi vào nghiệp vụ đồ án.
- FR-08: Giảng viên được phân công xem nhiệm vụ, thời hạn, tiêu chí hoàn thành và tiến độ nhóm; trưởng nhóm tạo/cập nhật nhiệm vụ, sinh viên được giao cập nhật trạng thái.
- FR-09: Sinh viên xem đồ án, nhiệm vụ và thời hạn mà mình được phép truy cập.
- FR-10: Sinh viên nộp phiên bản báo cáo; hệ thống lưu thời điểm và thông tin tệp.
- FR-11: Giảng viên gửi nhận xét, điểm (nếu áp dụng) và yêu cầu chỉnh sửa.
- FR-12: Hệ thống tạo thông báo cho các sự kiện quan trọng.
- FR-13: Chatbot trả lời FAQ từ nội dung đã duyệt.
- FR-14: Chatbot không tiết lộ dữ liệu cá nhân hoặc đồ án ngoài quyền người dùng.
- FR-15: Dashboard hiển thị số liệu tổng hợp phù hợp với vai trò.
- FR-16: Hệ thống lưu lịch sử hội thoại theo người dùng và kiểm soát quyền đọc.
- FR-17: Hệ thống ghi nhật ký các hành động quản trị quan trọng (bổ sung bảng audit log ở giai đoạn triển khai).

## 4. Yêu cầu phi chức năng
- NFR-01 Bảo mật: hash mật khẩu; prepared statements; CSRF protection; kiểm soát truy cập phía server; escape đầu ra.
- NFR-02 Riêng tư: chỉ thu thập dữ liệu cần thiết; không gửi dữ liệu nhạy cảm sang dịch vụ AI nếu chưa được cho phép.
- NFR-03 Tính toàn vẹn: dùng khóa ngoại và ràng buộc dữ liệu.
- NFR-04 Khả dụng: hiển thị thông báo lỗi thân thiện, không để lộ stack trace trong production.
- NFR-05 Hiệu năng: các trang danh sách thông thường hướng tới phản hồi dưới 2 giây trong môi trường demo với tải nhỏ; cần đo thực tế.
- NFR-06 Dễ bảo trì: tách controller, model, service, view và cấu hình.
- NFR-07 Tương thích: giao diện responsive, hỗ trợ phiên bản trình duyệt hiện đại.
- NFR-08 Sao lưu: có quy trình sao lưu và khôi phục cơ sở dữ liệu.
- NFR-09 Tệp tải lên: giới hạn dung lượng, xác minh MIME/đuôi tệp, tên lưu ngẫu nhiên và lưu ngoài web root nếu có thể.
- NFR-10 Khả năng kiểm thử: có test case cho nghiệp vụ và phân quyền.

## 5. Quy tắc nghiệp vụ
- BR-01: Đề tài thuộc một học kỳ.
- BR-02: Đồ án có thể cá nhân hoặc nhóm; thành viên được quản lý qua bảng liên kết.
- BR-03: Giảng viên chỉ được thao tác trên đồ án mình phụ trách.
- BR-04: Sinh viên chỉ được xem dữ liệu đồ án mà mình là thành viên.
- BR-05: Mỗi lần nộp tạo một bản ghi mới để lưu lịch sử.
- BR-06: Điểm nếu có phải nằm trong khoảng 0–100.
- BR-07: Chatbot FAQ chỉ sử dụng nguồn nội dung được duyệt; câu hỏi ngoài phạm vi phải nói rõ giới hạn.
- BR-08: Ngày kết thúc học kỳ không trước ngày bắt đầu.
- BR-09: Mỗi giảng viên phải được phân công quản lý ít nhất hai nhóm; chỉ nhóm được phân công mới hiển thị với giảng viên.

## 6. Ngoài phạm vi phiên bản đầu
- Chấm điểm tự động bằng AI.
- Tích hợp LMS hoặc hệ thống tài khoản trường.
- Ứng dụng di động native.
- Ký số và lưu trữ pháp lý.
- Tự động phát hiện đạo văn.

## 7. Tiêu chí nghiệm thu
- Các luồng đăng nhập và phân quyền hoạt động.
- CRUD chính hoạt động và dữ liệu tuân thủ khóa ngoại.
- Sinh viên nộp được tệp hợp lệ và xem được phản hồi của đồ án mình.
- Giảng viên không thể truy cập đồ án không được phân công.
- Chatbot FAQ trả lời theo nguồn được duyệt và không tiết lộ dữ liệu trái quyền.
- Có hướng dẫn cài đặt, dữ liệu demo và kết quả kiểm thử.
