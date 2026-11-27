# 🎓 HỆ THỐNG QUẢN LÝ ĐỒ ÁN SINH VIÊN KẾT HỢP CHATBOT

**Student Project Management System with Chatbot**

Hệ thống quản lý đồ án sinh viên là ứng dụng web có giao diện React và backend PHP/MySQL. Phần giao diện hiện có các cổng đăng nhập theo vai trò, hồ sơ cá nhân, quản lý tài khoản cho quản trị viên, tra cứu/đăng ký đề tài, quản lý đợt đồ án theo quyền và dashboard hiển thị số liệu phù hợp với vai trò. Các chức năng nhóm, nhiệm vụ, báo cáo, điểm số và chatbot được mô tả ở các mục tương ứng bên dưới; mức độ hỗ trợ cụ thể cần đối chiếu với giao diện/API hiện có.

---

## 📌 MỤC LỤC

- [1. Giới thiệu dự án](#muc-1)
- [2. Lý do chọn đề tài](#muc-2)
- [3. Mục tiêu dự án](#muc-3)
- [4. Phạm vi dự án](#muc-4)
- [5. Đối tượng sử dụng](#muc-5)
- [6. Chức năng hệ thống](#muc-6)
- [7. Công nghệ sử dụng](#muc-7)
- [8. Kiến trúc hệ thống](#muc-8)
- [9. Cấu trúc thư mục](#muc-9)
- [10. Thiết kế cơ sở dữ liệu](#muc-10)
- [11. Quy trình nghiệp vụ](#muc-11)
- [12. Bảo mật hệ thống](#muc-12)
- [13. Cài đặt và chạy dự án](#muc-13)
- [14. Kiểm thử](#muc-14)
- [15. Kế hoạch phát triển](#muc-15)
- [16. Hướng dẫn đóng góp](#muc-16)
- [17. Tác giả](#muc-17)
- [18. Giấy phép](#muc-18)

---

<a id="muc-1"></a>

## 📖 1. GIỚI THIỆU DỰ ÁN

Trong quá trình đào tạo tại các trường đại học, việc quản lý đồ án sinh viên thường liên quan đến nhiều công việc như đăng ký đề tài, phân công giảng viên hướng dẫn, theo dõi tiến độ, trao đổi tài liệu và đánh giá kết quả.

Nếu các công việc này được thực hiện thủ công hoặc thông qua nhiều công cụ riêng biệt, việc theo dõi tiến độ và quản lý thông tin có thể mất nhiều thời gian.

Dự án **Student Project Management System with Chatbot** được xây dựng nhằm tập trung các nghiệp vụ quản lý đồ án vào một nền tảng web thống nhất.

Hệ thống có năm vai trò nghiệp vụ: quản trị viên, sinh viên, trưởng nhóm, giảng viên và người đào tạo. Các quyền được kiểm tra ở backend; trưởng nhóm chỉ có quyền quản lý trong nhóm mình phụ trách. Chatbot hiện hỗ trợ tra cứu FAQ theo phạm vi vai trò.

### Thông tin dự án

| Thuộc tính | Nội dung |
|---|---|
| Tên dự án | Hệ thống quản lý đồ án sinh viên kết hợp Chatbot |
| Tên tiếng Anh | Student Project Management System with Chatbot |
| Loại dự án | Ứng dụng web |
| Lĩnh vực | Giáo dục, quản lý đào tạo |
| Backend | PHP 8.x |
| Frontend | React 19, JavaScript/JSX, CSS, Vite |
| Cơ sở dữ liệu | MySQL |
| Môi trường phát triển | Visual Studio Code, XAMPP |
| Quản lý mã nguồn | Git và GitHub |
| Ngôn ngữ giao diện | Tiếng Việt |
| Trạng thái | Đang phát triển |

---

<a id="muc-2"></a>

## 🎯 2. LÝ DO CHỌN ĐỀ TÀI

Đề tài được lựa chọn dựa trên nhu cầu số hóa quy trình quản lý đồ án tại các cơ sở đào tạo.

Các vấn đề cần giải quyết bao gồm:

- Thông tin đề tài được lưu trữ ở nhiều nơi.
- Sinh viên khó theo dõi trạng thái và thời hạn hoàn thành đồ án.
- Giảng viên cần một công cụ thống nhất để theo dõi sinh viên được phân công hướng dẫn.
- Việc trao đổi tài liệu và nhận xét có thể thiếu tính tập trung.
- Quản trị viên cần quản lý tài khoản và tra cứu dữ liệu toàn hệ thống; người đào tạo điều phối học kỳ, đề tài và các nghiệp vụ đồ án.
- Sinh viên có thể mất thời gian tìm kiếm hướng dẫn sử dụng hoặc câu trả lời cho các câu hỏi thường gặp.

Việc xây dựng hệ thống giúp chuẩn hóa quy trình, tập trung dữ liệu và cải thiện khả năng trao đổi thông tin giữa các bên.

Chatbot được tích hợp nhằm giảm thời gian tra cứu những thông tin cơ bản, giúp người dùng tiếp cận hướng dẫn nhanh chóng hơn.

---

<a id="muc-3"></a>

## 🚀 3. MỤC TIÊU DỰ ÁN

### 3.1. Mục tiêu tổng quát

Xây dựng một hệ thống web hỗ trợ quản lý đồ án sinh viên xuyên suốt vòng đời thực hiện đồ án, đồng thời tích hợp chatbot để hỗ trợ tra cứu thông tin và hướng dẫn người dùng.

### 3.2. Mục tiêu cụ thể

- Đăng nhập bằng username qua ba cổng: sinh viên/trưởng nhóm, giảng viên, quản trị viên/người đào tạo; từ chối tài khoản dùng sai cổng.
- Xem và cập nhật hồ sơ cá nhân, đổi mật khẩu; mã sinh viên chỉ đọc.
- Quản trị viên tạo, tìm kiếm, cập nhật, khóa/mở khóa tài khoản và đặt lại mật khẩu tạm thời.
- Dashboard hiển thị số liệu khác nhau theo vai trò, không dùng số liệu nhóm/nhiệm vụ cho dashboard quản trị.
- Quản lý đợt đồ án theo quyền người đào tạo; quản trị viên chỉ xem.
- Tra cứu, tìm kiếm, xem chi tiết và đăng ký đề tài theo quyền vai trò.
- Quản lý danh sách đề tài đồ án.
- Hỗ trợ đăng ký và phân công đề tài.
- Quản lý nhóm sinh viên thực hiện đồ án.
- Hỗ trợ phân công giảng viên hướng dẫn.
- Theo dõi tiến độ thực hiện đồ án.
- Quản lý nhiệm vụ và thời hạn hoàn thành.
- Cho phép nộp báo cáo và tài liệu liên quan.
- Hỗ trợ giảng viên nhận xét và đánh giá tiến độ.
- Gửi thông báo về các hoạt động quan trọng.
- Tích hợp chatbot hỗ trợ các câu hỏi thường gặp.
- Bảo vệ dữ liệu và giới hạn quyền truy cập theo vai trò.
- Xây dựng cơ sở dữ liệu có cấu trúc, dễ bảo trì và mở rộng.

---

<a id="muc-4"></a>

## 📋 4. PHẠM VI DỰ ÁN

### 4.1. Phạm vi chức năng mục tiêu

Dự án hướng đến các nghiệp vụ dưới đây. Mức độ đã triển khai được mô tả riêng tại mục 6:

1. Quản lý tài khoản và phân quyền.
2. Quản lý đề tài đồ án.
3. Đăng ký và quản lý nhóm sinh viên.
4. Phân công giảng viên hướng dẫn.
5. Quản lý nhiệm vụ và tiến độ.
6. Nộp và quản lý tài liệu.
7. Nhận xét và đánh giá.
8. Thông báo trong hệ thống.
9. Chatbot hỏi đáp thông tin.
10. Thống kê và báo cáo phục vụ quản lý.

### 4.2. Phạm vi triển khai ban đầu

Phiên bản đầu tiên hướng đến một ứng dụng web chạy trong môi trường phát triển cục bộ, sử dụng PHP và MySQL.

Chatbot có thể bắt đầu bằng cơ chế câu hỏi thường gặp được lưu trữ trong hệ thống. Sau khi chức năng cơ bản hoạt động ổn định, dự án có thể được mở rộng để tích hợp dịch vụ AI thông qua API.

### 4.3. Ngoài phạm vi phiên bản đầu tiên

Các chức năng sau có thể được cân nhắc trong những phiên bản tiếp theo:

- Ứng dụng di động độc lập.
- Tích hợp chữ ký số.
- Tích hợp hệ thống quản lý học tập của trường.
- Phân tích tiến độ bằng mô hình học máy.
- Chatbot AI có khả năng truy xuất tài liệu nội bộ.
- Triển khai hạ tầng đám mây quy mô lớn.

---

<a id="muc-5"></a>

## 👥 5. ĐỐI TƯỢNG SỬ DỤNG VÀ PHÂN QUYỀN

Hệ thống có năm vai trò tài khoản. Các quyền dưới đây mô tả phạm vi nghiệp vụ; chức năng chỉ được xem là đã có khi được nêu trong mục 6. Vai trò trưởng nhóm kế thừa các quyền sinh viên, nhưng quyền điều phối luôn bị giới hạn ở nhóm mà tài khoản đang là trưởng nhóm.

### 5.1. Quản trị viên — Admin

Quản trị viên phụ trách kiểm soát hệ thống và có phạm vi xem dữ liệu rộng nhất.

- Đăng nhập, đăng xuất và xem hồ sơ tài khoản.
- Tạo/cập nhật tài khoản, nhập thông tin thật, gán một trong năm vai trò và khóa/mở tài khoản. Mật khẩu được băm và không hiển thị lại.
- Cấu hình hệ thống, nhật ký hoạt động và sao lưu/khôi phục là các yêu cầu mở rộng, chưa có API quản trị tương ứng.

### 5.2. Sinh viên — Student

Sinh viên tham gia nhóm, thực hiện nhiệm vụ và nộp báo cáo.

- Đăng nhập, đăng xuất và xem hồ sơ hiện tại.
- Xem đề tài đang mở; trưởng nhóm gửi đăng ký đại diện cho nhóm.
- Tạo nhóm, gửi yêu cầu tham gia, nhận lời mời và xem thông tin thành viên nhóm. Khi tạo nhóm thành công, vai trò tài khoản được nâng từ Sinh viên lên Trưởng nhóm.
- Xem nhiệm vụ, cập nhật trạng thái nhiệm vụ được giao và theo dõi tiến độ nhóm.
- Nộp phiên bản báo cáo; xem phản hồi, thông báo, lịch bảo vệ và điểm đã công bố.
- Sử dụng chatbot FAQ và xem lịch sử hội thoại cá nhân.

### 5.3. Trưởng nhóm — Team Leader

Trưởng nhóm là tài khoản sinh viên được giao vai trò trưởng của một nhóm cụ thể. Ngoài chức năng sinh viên, trưởng nhóm có thể:

- Cập nhật thông tin nhóm và quản lý thành viên trong nhóm mình.
- Gửi lời mời, duyệt/từ chối yêu cầu tham gia và theo dõi lời mời đã gửi.
- Tạo, phân công, cập nhật và theo dõi nhiệm vụ của nhóm.
- Đăng ký đề tài và theo dõi trạng thái đăng ký của nhóm.
- Nộp báo cáo đại diện nhóm và xem phản hồi, thông báo, lịch bảo vệ của nhóm.

Trưởng nhóm không tự động có quyền quản lý nhóm khác. Backend đối chiếu ID người dùng với trưởng nhóm được ghi nhận trong dữ liệu thành viên/nhóm.

### 5.4. Giảng viên — Lecturer

Giảng viên hướng dẫn và đánh giá các nhóm trong phạm vi được phân công.

- Xem nhóm được phân công theo chính sách truy cập hiện tại.
- Xem tiến độ, nhiệm vụ và báo cáo trong phạm vi được phép.
- Tạo và cập nhật nhiệm vụ cho nhóm được phân công.
- Tạo/cập nhật đề tài và xử lý đăng ký đề tài.
- Gửi nhận xét, điểm phản hồi báo cáo; tham gia hội đồng và chấm điểm bảo vệ nếu là thành viên hội đồng.
- Quản lý FAQ chatbot.

### 5.5. Người đào tạo — Training Manager

Người đào tạo điều phối nghiệp vụ đồ án, không quản trị kỹ thuật tài khoản.

- Xem, tạo và cập nhật đợt đồ án; xem danh sách nhóm và tình hình tiến độ.
- Quản lý đề tài và xử lý đăng ký đề tài.
- Phân công giảng viên hướng dẫn.
- Truy cập các luồng báo cáo, hội đồng và lịch bảo vệ hiện có.

Cấu hình thời hạn đăng ký/nộp báo cáo, xuất báo cáo tổng kết và thống kê chuyên biệt cần được triển khai thêm nếu cần.

<a id="muc-6"></a>

## ⚙️ 6. CHỨC NĂNG HỆ THỐNG

Mục này ghi rõ chức năng đang được hỗ trợ bởi API/giao diện hiện có và những phần chưa nên xem là hoàn tất.

### 6.1. Xác thực và hồ sơ

- Đăng nhập bằng tài khoản và mật khẩu đã băm; phiên PHP dùng để xác thực yêu cầu.
- Đăng xuất và bảo vệ thao tác thay đổi dữ liệu bằng CSRF token.
- Lấy thông tin người dùng hiện tại và hiển thị hồ sơ cơ bản.
- Quản trị viên có thể tạo, tìm kiếm, cập nhật tài khoản, gán vai trò, khóa/mở khóa và đặt mật khẩu khởi tạo; mật khẩu chỉ lưu dưới dạng hash.
- Người dùng có thể cập nhật hồ sơ cá nhân và đổi mật khẩu (mật khẩu mới tối thiểu 8 ký tự); mã sinh viên chỉ đọc trên giao diện hồ sơ. Khôi phục mật khẩu chưa được triển khai.

### 6.2. Đợt đồ án

- Người đào tạo được tạo và cập nhật đợt đồ án; quản trị viên được xem toàn bộ đợt ở chế độ chỉ đọc; giảng viên được xem danh sách đợt.
- Sinh viên chỉ xem các đợt đang mở hoặc đang diễn ra.
- Có thể cập nhật trạng thái đợt; cấu hình riêng hạn đăng ký, hạn nộp báo cáo và lịch bảo vệ chưa có API hoàn chỉnh.

### 6.3. Đề tài và đăng ký

- Quản lý/hiển thị đề tài theo vai trò; người đào tạo và giảng viên có thể tạo/cập nhật, quản trị viên được xem toàn bộ đề tài và đăng ký ở chế độ chỉ đọc.
- Trưởng nhóm đăng ký đề tài cho nhóm thuộc cùng đợt; người có quyền xử lý đăng ký có thể duyệt hoặc từ chối.
- Hệ thống kiểm tra trạng thái đề tài, nhóm, đợt và sức chứa.
- Trạng thái đề tài hiện dùng `draft`, `open`, `closed`; đăng ký dùng `pending`, `approved`, `rejected`, `cancelled`.
- Xóa đề tài và bộ lọc/tìm kiếm nâng cao chưa được triển khai.

### 6.4. Nhóm và phân công giảng viên

- Tạo nhóm; khi sinh viên tạo nhóm thành công, hệ thống cập nhật vai trò tài khoản thành Trưởng nhóm. Xem nhóm và thành viên trong phạm vi quyền.
- Gửi/duyệt yêu cầu tham gia, gửi/nhận lời mời và quản lý thành viên.
- Ràng buộc trưởng nhóm phải là thành viên đang hoạt động; kiểm tra giới hạn thành viên và không cho sinh viên thuộc nhiều nhóm đang hoạt động trong cùng đợt.
- Phân công giảng viên cho nhóm do người đào tạo thực hiện; quản trị viên được xem dữ liệu nhóm và phân công ở chế độ chỉ đọc.
- Chỉ trưởng nhóm của nhóm tương ứng mới được quản lý thành viên; quản trị viên không thêm, xóa hoặc đổi trưởng nhóm.
- Quyền nhóm trưởng được xác thực theo từng nhóm, không chỉ dựa vào giá trị vai trò tài khoản.

### 6.5. Nhiệm vụ và tiến độ

- Trưởng nhóm và giảng viên được phân công tạo/sửa nhiệm vụ theo quyền; trưởng nhóm có thể xóa hoặc hủy nhiệm vụ. Quản trị viên chỉ xem dữ liệu nhiệm vụ.
- Sinh viên được giao nhiệm vụ cập nhật trạng thái của mình; quản trị viên không thay đổi trạng thái nhiệm vụ.
- Xem tổng hợp tiến độ nhiệm vụ theo nhóm và thành viên; hỗ trợ nhận biết nhiệm vụ quá hạn.
- Trạng thái nhiệm vụ hiện dùng `todo`, `in_progress`, `completed`, `cancelled`.
- Nhật ký tiến độ tự do và xuất báo cáo tiến độ chưa được triển khai như một chức năng riêng.

### 6.6. Báo cáo, phản hồi và điểm

- Sinh viên/trưởng nhóm nộp báo cáo dạng tệp; hệ thống lưu các phiên bản và cho phép xem lịch sử nộp.
- Giảng viên có quyền nhận xét và chấm điểm phản hồi trong thang 0–10.
- Người học xem phản hồi và điểm tổng kết sau khi được công bố.
- Quy trình xác nhận đủ điều kiện bảo vệ và thông báo yêu cầu chỉnh sửa riêng chưa có luồng nghiệp vụ hoàn chỉnh.

### 6.7. Hội đồng và lịch bảo vệ

- Người đào tạo quản lý hội đồng, thành viên hội đồng và lịch bảo vệ; quản trị viên được xem dữ liệu hội đồng, lịch và điểm ở chế độ chỉ đọc.
- Thành viên hội đồng có thể chấm điểm bảo vệ; người học xem lịch và kết quả được công bố.
- Tự động xếp lịch tối ưu và xuất biên bản/tổng kết chưa được triển khai.

### 6.8. Thông báo

- Người dùng xem thông báo riêng của mình và đánh dấu một hoặc tất cả là đã đọc.
- Database phát thông báo cho các sự kiện hiện được cấu hình như giao/cập nhật nhiệm vụ, nhận xét báo cáo và thay đổi lịch bảo vệ.
- Nhắc hạn qua email hoặc thông báo đẩy chưa được hỗ trợ.

### 6.9. Chatbot FAQ

- Người dùng gửi câu hỏi, xem các phiên và tin nhắn hội thoại của chính mình.
- Chatbot tìm câu trả lời trong FAQ đã công bố; nội dung được lọc theo quyền hiển thị.
- Giảng viên quản lý FAQ; quản trị viên được xem FAQ ở mọi phạm vi hiển thị nhưng không chỉnh sửa. Người đào tạo và trưởng nhóm có phạm vi FAQ riêng, trưởng nhóm cũng xem được FAQ dành cho sinh viên.
- Kết nối mô hình AI bên ngoài, tra cứu dữ liệu đồ án trực tiếp và cấu hình kết nối chatbot chưa được triển khai.

### 6.10. Chức năng quản trị chưa triển khai

Các yêu cầu sau cần bổ sung API và giao diện trước khi giới thiệu là chức năng đang hoạt động:

- Nhật ký đăng nhập/hoạt động, cấu hình trạng thái hệ thống và sao lưu/khôi phục.
- Thống kê chuyên sâu theo đợt và xuất báo cáo tổng kết.
- Cấu hình riêng hạn đăng ký/nộp báo cáo theo từng đợt.

### 6.11. Thống kê và báo cáo

Dashboard cơ bản theo vai trò đã có trong giao diện. Sinh viên/giảng viên thấy số nhóm và nhiệm vụ trong phạm vi được trả về; quản trị viên thấy tổng tài khoản, đề tài đang mở, đợt đang hoạt động và tổng số đề tài; người đào tạo thấy các chỉ số đề tài và đợt. Thống kê chuyên sâu theo đợt và xuất báo cáo chưa có giao diện/API hoàn chỉnh.

---

<a id="muc-7"></a>

## 🛠️ 7. CÔNG NGHỆ SỬ DỤNG

| Công nghệ | Vai trò |
|---|---|
| PHP 8.x | Xử lý nghiệp vụ phía máy chủ |
| MySQL | Lưu trữ dữ liệu |
| React | Xây dựng giao diện component |
| JavaScript/JSX | Xử lý tương tác phía trình duyệt |
| CSS | Thiết kế và định dạng giao diện |
| Vite | Phát triển và build frontend |
| Apache | Máy chủ web trong môi trường phát triển |
| XAMPP | Môi trường PHP, Apache và MySQL cục bộ |
| Visual Studio Code | Trình soạn thảo mã nguồn |
| Git | Quản lý phiên bản |
| GitHub | Lưu trữ mã nguồn và theo dõi công việc |

### Công cụ phát triển

- Hệ điều hành: Windows hoặc hệ điều hành tương thích.
- Trình duyệt: Google Chrome, Microsoft Edge hoặc Firefox.
- Công cụ quản lý cơ sở dữ liệu: phpMyAdmin hoặc MySQL client.
- Công cụ quản lý mã nguồn: GitHub.

### Nguyên tắc lựa chọn công nghệ

Dự án sử dụng PHP và MySQL nhằm tạo ra một hệ thống có cấu trúc tương đối đơn giản, thuận tiện cho việc học tập, triển khai trên máy cá nhân và phát triển theo từng giai đoạn.

---

<a id="muc-8"></a>

## 🏗️ 8. KIẾN TRÚC HỆ THỐNG

Hệ thống được định hướng theo mô hình phân tầng để tách biệt giao diện, nghiệp vụ và dữ liệu.

### 8.1. Các tầng chính

**Presentation Layer — Tầng giao diện**

Chịu trách nhiệm hiển thị thông tin và tiếp nhận thao tác của người dùng.

Frontend hiện tại sử dụng:

- React 19 và JSX.
- JavaScript ES modules.
- CSS.
- Vite 8 cho môi trường phát triển và build.
- React Router cho điều hướng giao diện.

**Application Layer — Tầng xử lý nghiệp vụ**

Chịu trách nhiệm xử lý các yêu cầu từ giao diện, xác thực quyền truy cập và thực hiện nghiệp vụ.

Các thành phần dự kiến:

- Controllers.
- Models.
- Services.
- Middleware.

**Data Layer — Tầng dữ liệu**

Chịu trách nhiệm lưu trữ và truy xuất thông tin.

Công nghệ:

- MySQL.
- PDO hoặc cơ chế truy cập cơ sở dữ liệu tương đương.

**Chatbot Service — Dịch vụ chatbot**

Chịu trách nhiệm tiếp nhận câu hỏi, xử lý nội dung và trả về câu trả lời phù hợp.

Ban đầu, dịch vụ có thể sử dụng dữ liệu FAQ nội bộ. Việc tích hợp AI là một hướng mở rộng.

### 8.2. Luồng xử lý tổng quát

1. Người dùng truy cập hệ thống bằng trình duyệt.
2. Người dùng gửi yêu cầu thông qua giao diện.
3. Máy chủ tiếp nhận yêu cầu.
4. Hệ thống xác thực phiên và kiểm tra quyền truy cập.
5. Tầng nghiệp vụ xử lý yêu cầu.
6. Hệ thống truy vấn hoặc cập nhật dữ liệu MySQL.
7. Kết quả được trả về giao diện.
8. Nếu yêu cầu liên quan đến chatbot, dịch vụ chatbot xử lý câu hỏi và trả về nội dung phù hợp.

### 8.3. Nguyên tắc thiết kế

- Phân chia mã nguồn theo trách nhiệm.
- Hạn chế trộn truy vấn SQL với mã hiển thị giao diện.
- Tái sử dụng các thành phần dùng chung.
- Kiểm tra dữ liệu đầu vào.
- Xử lý lỗi rõ ràng.
- Thiết kế cơ sở dữ liệu có ràng buộc.
- Cho phép mở rộng thêm chức năng mà không phải viết lại toàn bộ hệ thống.

---

<a id="muc-9"></a>

## 📁 9. CẤU TRÚC THƯ MỤC

Cấu trúc mã nguồn hiện tại:

```text
EduProjectHub/
│
├── Code/
│   ├── Backend/       # PHP JSON APIs
│   └── frontend/      # React/Vite application
├── database/
│   ├── filetong/      # Gói SQL để nạp database demo
│   ├── Tai_khoan.sql
│   ├── quan_ly_*.sql
│   └── schema-*.sql
├── docs/
├── tests/
└── README.md
```

<a id="muc-10"></a>

## 🗄️ 10. THIẾT KẾ CƠ SỞ DỮ LIỆU

Cơ sở dữ liệu được thiết kế để quản lý người dùng, đề tài, nhóm thực hiện, nhiệm vụ, tài liệu và hội thoại chatbot.

### 10.1. Các bảng dữ liệu dự kiến

| Bảng | Mục đích |
|---|---|
| `users` | Tài khoản, username và vai trò |
| `project_rounds` | Học kỳ/đợt đồ án |
| `student_groups`, `group_members` | Nhóm đồ án và thành viên |
| `group_invitations`, `group_requests` | Lời mời và yêu cầu tham gia nhóm |
| `group_lecturers` | Phân công giảng viên theo nhóm |
| `tasks` | Nhiệm vụ và tiến độ |
| `reports`, `report_versions`, `report_feedback` | Đợt báo cáo, phiên bản và phản hồi |
| `defense_*`, `final_grades` | Hội đồng, lịch bảo vệ và điểm |
| `chatbot_faqs` | Câu hỏi thường gặp |
| `chat_sessions` | Quản lý phiên hội thoại chatbot |
| `chat_messages` | Lưu nội dung tin nhắn hội thoại |

Các tệp SQL tạo toàn bộ bảng trong một database `eduprojecthub`; xem thứ tự cài đặt chính xác tại `database/README.md`.

### 10.2. Quan hệ dữ liệu tổng quát

- `project_rounds` liên kết với nhiều nhóm qua `student_groups.project_round_id`.
- Nhóm liên kết với tài khoản qua `group_members` và với giảng viên qua `group_lecturers`.
- Một nhóm có thể có nhiều nhiệm vụ và đợt báo cáo.
- Một nhiệm vụ có thể có nhiều lần cập nhật trạng thái.
- Một báo cáo có nhiều phiên bản; mỗi phiên bản có thể có phản hồi.
- Điểm và lịch bảo vệ dùng `users.id` cùng `student_groups.id`.
- Một người dùng có thể nhận nhiều thông báo.
- Một phiên chatbot có thể chứa nhiều tin nhắn.

### 10.3. Nguyên tắc thiết kế cơ sở dữ liệu

- Xác định khóa chính cho từng bảng.
- Sử dụng khóa ngoại khi phù hợp.
- Thiết lập ràng buộc dữ liệu.
- Lựa chọn kiểu dữ liệu phù hợp.
- Xây dựng chỉ mục cho các trường thường xuyên truy vấn.
- Tránh lưu trùng lặp thông tin không cần thiết.
- Sử dụng giao dịch cho các nghiệp vụ cần tính toàn vẹn dữ liệu.
- Kiểm tra quyền truy cập trước khi đọc hoặc cập nhật dữ liệu.

---

<a id="muc-11"></a>

## 🔄 11. QUY TRÌNH NGHIỆP VỤ

### 11.1. Quy trình đăng ký đồ án

1. Người đào tạo hoặc tài khoản được phân quyền chuẩn bị đợt đồ án và thời gian đăng ký.
2. Người đào tạo hoặc giảng viên tạo danh sách đề tài theo quyền hiện có; quản trị viên chỉ tra cứu.
3. Sinh viên đăng nhập hệ thống.
4. Sinh viên xem danh sách đề tài có thể đăng ký.
5. Sinh viên gửi yêu cầu đăng ký.
6. Hệ thống kiểm tra điều kiện đăng ký và tình trạng đề tài.
7. Hệ thống ghi nhận yêu cầu hoặc cập nhật trạng thái đăng ký.
8. Người có thẩm quyền phê duyệt nếu quy trình yêu cầu.
9. Hệ thống thông báo kết quả cho sinh viên.

### 11.2. Quy trình thực hiện đồ án

1. Đề tài và nhóm sinh viên được xác nhận.
2. Giảng viên hướng dẫn được phân công.
3. Giảng viên tạo nhiệm vụ và thời hạn.
4. Sinh viên thực hiện nhiệm vụ.
5. Sinh viên cập nhật tiến độ.
6. Sinh viên nộp báo cáo hoặc tài liệu.
7. Giảng viên xem và gửi nhận xét.
8. Sinh viên điều chỉnh theo phản hồi.
9. Hệ thống cập nhật trạng thái hoàn thành theo quy định.

### 11.3. Quy trình sử dụng chatbot

1. Người dùng mở giao diện chatbot.
2. Người dùng nhập câu hỏi.
3. Hệ thống kiểm tra dữ liệu đầu vào.
4. Dịch vụ chatbot phân tích câu hỏi.
5. Hệ thống tìm câu trả lời từ nguồn dữ liệu được phép sử dụng.
6. Chatbot trả lời người dùng.
7. Nếu không tìm thấy câu trả lời phù hợp, hệ thống hướng dẫn người dùng tìm tài liệu hoặc liên hệ người phụ trách.

---

<a id="muc-12"></a>

## 🔐 12. BẢO MẬT HỆ THỐNG

Bảo mật là một yêu cầu quan trọng do hệ thống lưu trữ thông tin tài khoản, dữ liệu học tập và tài liệu đồ án.

### 12.1. Xác thực và quản lý mật khẩu

- Không lưu mật khẩu dưới dạng văn bản thuần.
- Sử dụng `password_hash()` để tạo mã băm mật khẩu trong PHP.
- Sử dụng `password_verify()` để kiểm tra mật khẩu.
- Quản lý phiên đăng nhập phù hợp.
- Hủy phiên khi người dùng đăng xuất.
- Có cơ chế giới hạn các lần đăng nhập thất bại khi cần thiết.

### 12.2. Phân quyền

- Kiểm tra vai trò ở phía máy chủ.
- Không dựa vào việc ẩn nút trên giao diện để bảo vệ chức năng.
- Chỉ cho phép người dùng truy cập dữ liệu thuộc phạm vi quyền hạn.
- Kiểm tra quyền sở hữu đề tài, nhiệm vụ và tài liệu trước khi thao tác.
- Ngăn chặn việc sửa dữ liệu bằng cách thay đổi ID trên URL hoặc yêu cầu gửi lên máy chủ.

### 12.3. Bảo vệ cơ sở dữ liệu

- Sử dụng prepared statements thông qua PDO hoặc cơ chế tương đương.
- Không ghép trực tiếp dữ liệu người dùng vào câu truy vấn SQL.
- Tài khoản cơ sở dữ liệu chỉ nên có quyền cần thiết.
- Không công khai thông tin kết nối cơ sở dữ liệu.
- Sao lưu dữ liệu định kỳ khi triển khai thực tế.

### 12.4. Bảo vệ giao diện và yêu cầu HTTP

- Kiểm tra và chuẩn hóa dữ liệu đầu vào.
- Escape dữ liệu trước khi hiển thị HTML.
- Áp dụng CSRF protection cho các thao tác thay đổi dữ liệu.
- Hạn chế XSS và SQL injection.
- Kiểm tra loại tệp, dung lượng và tên tệp khi tải lên.
- Không cho phép thực thi trực tiếp các tệp tải lên.
- Không hiển thị thông tin lỗi nội bộ nhạy cảm cho người dùng cuối.

### 12.5. Bảo vệ thông tin chatbot

- Không đưa mật khẩu hoặc bí mật hệ thống vào nội dung hội thoại.
- Không cho chatbot tự ý truy cập dữ liệu ngoài phạm vi được cấp phép.
- Không để lộ API key ở mã JavaScript phía trình duyệt.
- Chỉ gửi dữ liệu cần thiết đến dịch vụ AI bên ngoài.
- Xem xét chính sách lưu trữ và xóa lịch sử hội thoại.
- Không coi câu trả lời của chatbot là quyết định chính thức đối với điểm số hoặc kết quả học tập.

---

<a id="muc-13"></a>

## 💻 13. CÀI ĐẶT VÀ CHẠY DỰ ÁN

Hướng dẫn dưới đây chạy React/Vite ở chế độ phát triển và PHP/MySQL qua XAMPP trên Windows. Hướng dẫn triển khai build production nằm trong [Code/frontend/README.md](Code/frontend/README.md).

### 13.1. Yêu cầu môi trường

- PHP 8.x, MySQL/MariaDB và Apache (có thể dùng XAMPP).
- Node.js/npm.
- Trình duyệt web hiện đại.

### 13.2. Đặt mã nguồn dưới Apache

Đặt repository trong `C:\xampp\htdocs\EduProjectHub`, hoặc tạo directory junction tại đường dẫn đó trỏ đến thư mục repository. Trong XAMPP, bật **Apache** và **MySQL**.

### 13.3. Tạo database demo mới

Với cài đặt mới, nạp `database/filetong/eduprojecthub-xampp.sql` theo hướng dẫn trong [database/README.md](database/README.md). Gói này dành cho database mới; không import vào database đã có dữ liệu. Với database hiện hữu, làm theo mục “Existing databases” trong `database/README.md` thay vì nạp lại gói demo.

Thông tin kết nối mặc định cho local được mô tả trong [database/README.md](database/README.md). Không đưa mật khẩu hoặc cấu hình bí mật vào README.

### 13.4. Cấu hình và chạy frontend

Mở PowerShell tại thư mục repository, rồi chạy:

```powershell
cd Code/frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Mở URL Vite được in ra trong terminal (mặc định `http://localhost:5173`). `.env.example` đặt `VITE_USE_MOCK=false`, tức frontend gọi PHP API thật. Nếu cần UI demo mock, dùng file `.env.local` với `VITE_USE_MOCK=true`; không dùng mock để kiểm tra quyền hoặc dữ liệu backend.

Cấu hình proxy phát triển trong `vite.config.js` trỏ API tới `http://localhost` trên cổng 80. Nếu Apache chạy cổng khác, proxy mặc định không tự chuyển sang cổng đó. Không đổi proxy chung nếu chưa thống nhất với nhóm; có thể chạy frontend build qua Apache theo [Code/frontend/README.md](Code/frontend/README.md).

Khi kiểm thử nhiều vai trò, chỉ đăng nhập một tài khoản tại một thời điểm trong cùng trình duyệt vì phiên đăng nhập dùng chung cookie. Dùng cửa sổ ẩn danh hoặc trình duyệt riêng để giữ các phiên độc lập.

### 13.5. Tài khoản demo

Database demo có tài khoản `sv`, `truongnhom`, `gv`, `daotao` và `admin`; mật khẩu demo là `123456` theo [database/README.md](database/README.md). Chỉ dùng trong môi trường demo local; không dùng hoặc công khai các thông tin này trên hệ thống triển khai.

---

<a id="muc-14"></a>

## 🧪 14. KIỂM THỬ

Dự án cần được kiểm thử theo từng chức năng trước khi phát hành.

### 14.1. Kiểm thử xác thực

| Mã kiểm thử | Trường hợp | Kết quả mong đợi |
|---|---|---|
| TC-AUTH-01 | Đăng nhập với thông tin hợp lệ | Đăng nhập thành công |
| TC-AUTH-02 | Nhập sai mật khẩu | Hiển thị thông báo phù hợp |
| TC-AUTH-03 | Truy cập trang cần đăng nhập khi chưa xác thực | Yêu cầu đăng nhập |
| TC-AUTH-04 | Sinh viên truy cập chức năng chỉ dành cho quản trị viên | Từ chối truy cập |

### 14.2. Kiểm thử quản lý đề tài

| Mã kiểm thử | Trường hợp | Kết quả mong đợi |
|---|---|---|
| TC-PROJ-01 | Tạo đề tài với dữ liệu hợp lệ | Đề tài được lưu |
| TC-PROJ-02 | Tạo đề tài thiếu trường bắt buộc | Hiển thị lỗi kiểm tra dữ liệu |
| TC-PROJ-03 | Tìm kiếm theo từ khóa | Hiển thị kết quả phù hợp |
| TC-PROJ-04 | Đăng ký đề tài không còn khả dụng | Hệ thống từ chối đăng ký |

### 14.3. Kiểm thử tiến độ và tài liệu

| Mã kiểm thử | Trường hợp | Kết quả mong đợi |
|---|---|---|
| TC-TASK-01 | Tạo nhiệm vụ hợp lệ | Nhiệm vụ được lưu |
| TC-TASK-02 | Cập nhật trạng thái nhiệm vụ | Trạng thái được cập nhật |
| TC-SUB-01 | Nộp tệp hợp lệ | Hệ thống ghi nhận lần nộp |
| TC-SUB-02 | Nộp tệp không được phép | Hệ thống từ chối |
| TC-SUB-03 | Người không có quyền truy cập tài liệu | Hệ thống từ chối truy cập |

### 14.4. Kiểm thử chatbot

| Mã kiểm thử | Trường hợp | Kết quả mong đợi |
|---|---|---|
| TC-BOT-01 | Nhập câu hỏi có trong FAQ | Trả về câu trả lời phù hợp |
| TC-BOT-02 | Nhập câu hỏi chưa được hỗ trợ | Hướng dẫn người dùng tìm hỗ trợ khác |
| TC-BOT-03 | Gửi nội dung rỗng | Yêu cầu nhập câu hỏi |
| TC-BOT-04 | Nhập nội dung bất thường | Xử lý an toàn, không làm hỏng hệ thống |

Các trường hợp trên là danh sách kiểm thử dự kiến. Kết quả đạt hoặc không đạt cần được ghi nhận sau khi chức năng thực tế được triển khai.

---

<a id="muc-15"></a>

## 🗺️ 15. KẾ HOẠCH PHÁT TRIỂN

Dự án được chia thành các giai đoạn nhằm dễ theo dõi tiến độ và kiểm soát chất lượng.

### Giai đoạn 1: Phân tích và thiết kế

- Thu thập yêu cầu.
- Xác định vai trò người dùng.
- Phân tích nghiệp vụ.
- Thiết kế cơ sở dữ liệu.
- Xây dựng kiến trúc hệ thống.
- Viết tài liệu đặc tả.

**Kết quả dự kiến:** Tài liệu yêu cầu và thiết kế ban đầu.

### Giai đoạn 2: Xây dựng nền tảng

- Khởi tạo cấu trúc dự án.
- Cấu hình cơ sở dữ liệu.
- Xây dựng chức năng đăng nhập.
- Triển khai phân quyền.
- Xây dựng giao diện dùng chung.

**Kết quả dự kiến:** Nền tảng xác thực và giao diện cơ bản.

### Giai đoạn 3: Phát triển nghiệp vụ

- Quản lý tài khoản.
- Quản lý đề tài.
- Quản lý nhóm.
- Phân công giảng viên.
- Quản lý nhiệm vụ.
- Nộp báo cáo và tài liệu.
- Nhận xét và thông báo.

**Kết quả dự kiến:** Các chức năng quản lý đồ án cốt lõi.

### Giai đoạn 4: Tích hợp chatbot

- Xây dựng bộ câu hỏi thường gặp.
- Xây dựng giao diện chatbot.
- Xử lý câu hỏi và câu trả lời.
- Lưu lịch sử hội thoại khi cần thiết.
- Kiểm thử các tình huống không tìm thấy câu trả lời.
- Đánh giá khả năng mở rộng sang AI.

**Kết quả dự kiến:** Chatbot hỗ trợ các câu hỏi cơ bản.

### Giai đoạn 5: Kiểm thử và hoàn thiện

- Kiểm thử chức năng.
- Kiểm thử phân quyền.
- Kiểm thử bảo mật cơ bản.
- Sửa lỗi.
- Hoàn thiện tài liệu hướng dẫn.
- Chuẩn bị dữ liệu trình diễn.

**Kết quả dự kiến:** Phiên bản có thể trình diễn và đánh giá.

### Giai đoạn 6: Triển khai và mở rộng

- Chuẩn bị môi trường triển khai.
- Cấu hình máy chủ.
- Sao lưu và phục hồi dữ liệu.
- Theo dõi lỗi.
- Bổ sung tính năng theo phản hồi.

**Kết quả dự kiến:** Phiên bản triển khai theo điều kiện thực tế.

---

<a id="muc-16"></a>

## 🤝 16. HƯỚNG DẪN ĐÓNG GÓP

Các đóng góp nhằm cải thiện mã nguồn, tài liệu và chất lượng dự án đều được khuyến khích.

### Quy trình đóng góp

1. Tạo bản fork của repository nếu cần.
2. Tạo nhánh mới cho tính năng hoặc bản sửa lỗi.
3. Thực hiện thay đổi.
4. Kiểm tra các chức năng có liên quan.
5. Commit với thông điệp rõ ràng.
6. Tạo Pull Request để đề xuất thay đổi.

Ví dụ tên nhánh:

```text
feature/project-management
feature/chatbot
fix/login-validation
docs/update-readme
```

Ví dụ thông điệp commit:

```text
feat: add project management
fix: validate login input
docs: update installation guide
```

### Nguyên tắc đóng góp

- Viết mã nguồn rõ ràng và dễ bảo trì.
- Không đưa mật khẩu hoặc API key vào repository.
- Không đưa dữ liệu cá nhân thật vào dữ liệu mẫu.
- Cập nhật tài liệu khi thay đổi chức năng.
- Kiểm thử thay đổi trước khi gửi Pull Request.
- Tôn trọng quy tắc phân quyền và bảo mật của hệ thống.

---

<a id="muc-17"></a>

## 👨‍💻 17. TÁC GIẢ

**Tên dự án:** Hệ thống quản lý đồ án sinh viên kết hợp Chatbot

**Tên tiếng Anh:** Student Project Management System with Chatbot

**Tác giả:** Nhóm 4

**Trường:** TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI

**Khoa/Bộ môn:** Khoa Công nghệ thông tin

**Giảng viên hướng dẫn:** Đặng Nhân Cách

**PM phụ trách:** Phạm Văn Phi Long

Repository: `EduProjectHub`

---

<a id="muc-18"></a>

## 📄 18. GIẤY PHÉP

Dự án có thể sử dụng giấy phép MIT nếu tác giả muốn cho phép người khác sử dụng, sửa đổi và phân phối mã nguồn theo các điều kiện của giấy phép này.

Nếu lựa chọn MIT License, hãy tạo tệp `LICENSE` ở thư mục gốc và sử dụng nội dung giấy phép MIT chính thức. Thay thông tin bản quyền bằng thông tin tác giả và năm phù hợp.

Nếu đây là đồ án học tập có yêu cầu riêng của trường, cần kiểm tra quy định về quyền sở hữu trí tuệ và chia sẻ mã nguồn trước khi công bố giấy phép.

---

## 📌 TRẠNG THÁI DỰ ÁN

Các hạng mục sẽ được cập nhật theo tiến độ thực hiện.

- [x] Khởi tạo repository GitHub.
- [ ] Hoàn thiện tài liệu README.
- [ ] Phân tích yêu cầu chi tiết.
- [ ] Thiết kế cơ sở dữ liệu.
- [ ] Xây dựng cấu trúc thư mục.
- [x] Xây dựng chức năng đăng nhập.
- [x] Xây dựng chức năng phân quyền.
- [x] Phát triển quản lý đề tài.
- [ ] Phát triển quản lý nhóm sinh viên.
- [ ] Phát triển quản lý tiến độ.
- [ ] Phát triển chức năng nộp báo cáo.
- [ ] Phát triển chức năng nhận xét.
- [ ] Phát triển hệ thống thông báo.
- [ ] Tích hợp chatbot FAQ.
- [ ] Kiểm thử hệ thống.
- [ ] Hoàn thiện tài liệu sử dụng.
- [ ] Chuẩn bị triển khai.


---

## ⭐ ĐỊNH HƯỚNG PHÁT TRIỂN

Mục tiêu dài hạn là xây dựng một nền tảng quản lý đồ án có giao diện thân thiện, nghiệp vụ rõ ràng, dữ liệu nhất quán và có khả năng mở rộng.

Các hướng phát triển tiềm năng gồm:

- Chatbot AI hỗ trợ tra cứu tài liệu.
- Dashboard thống kê tiến độ.
- Nhắc hạn nộp báo cáo tự động.
- Tìm kiếm đề tài nâng cao.
- Lịch sử thay đổi và phiên bản tài liệu.
- Tích hợp email thông báo.
- Phân tích tiến độ theo học kỳ.
- Tăng cường kiểm thử tự động.

---

**Student Project Management System with Chatbot**  
*Quản lý đồ án tập trung — Theo dõi tiến độ rõ ràng — Hỗ trợ sinh viên hiệu quả.*
