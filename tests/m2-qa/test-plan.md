# Kế hoạch kiểm thử hệ thống EduProjectHub

| Mục | Nội dung |
|---|---|
| Người kiểm thử | M2 – Quang (vai trò tester từ tuần 4) |
| Nhánh làm việc | `m2-qa-testing`, tách từ `Demo` tại commit `5b304d1` |
| Thời gian | Tuần 4 – tuần 6 (16/11/2026 – 04/12/2026) |
| Phiên bản tài liệu | 1.0 – 16/11/2026 |

## 1. Mục đích

Kiểm tra toàn bộ hệ thống trên nhánh `Demo` sau khi các thành viên chỉnh sửa và bổ sung chức năng trong tuần 4–6, nhằm:

- Phát hiện lỗi chức năng, lỗi phân quyền và lỗi giao diện trước khi demo.
- Bảo đảm mỗi lần merge vào `Demo` không làm hỏng chức năng đã chạy (kiểm thử hồi quy).
- Tạo minh chứng kết quả kiểm thử cho báo cáo HKDN (phụ lục kết quả kiểm thử).

## 2. Tài liệu căn cứ

| Tài liệu | Dùng để |
|---|---|
| `docs/requirements.md` | Yêu cầu chức năng FR-01 – FR-17, phi chức năng NFR-01 – NFR-10, quy tắc nghiệp vụ BR-01 – BR-09, tiêu chí nghiệm thu |
| `database/README.md` | Cài đặt CSDL, bảng endpoint API, quy tắc phân quyền phía server |
| `docs/user-manual.md` | Luồng sử dụng theo vai trò |
| `tests/test-cases.md` (M3) | 30 ca kiểm thử TC-01 – TC-30 đã có |
| Wireframe Figma FR04–FR07 | Kiểm tra giao diện M2 |

`tests/test-cases.md` do M3 phụ trách. Bộ kiểm thử này **không sửa và không chép lại** file đó: các ca trùng nội dung chỉ ghi tham chiếu `TC-xx`, các ca mới đặt mã riêng `QA-…` (mục 7).

## 3. Phạm vi kiểm thử

### 3.1. Trong phạm vi

| Nhóm chức năng | Yêu cầu liên quan | Người phụ trách sửa lỗi | Thay đổi tuần 4–6 |
|---|---|---|---|
| Đăng nhập, 3 cổng đăng nhập, đăng xuất | FR-01 | M1 (giao diện), M3 (API) | M1 tách 3 cổng sinh viên / giảng viên / quản trị |
| Hồ sơ cá nhân, đổi mật khẩu | FR-02 | M1, M3 | M3 thêm chỉnh sửa hồ sơ cho các vai trò |
| Quản lý tài khoản (Admin) | FR-03, FR-17 | M1, M3 | M3 thêm xóa tài khoản |
| Đợt đồ án / học kỳ | FR-04, BR-08 | M1, M4 | M4 chỉnh quản lý đợt |
| Đề tài và đăng ký đề tài | FR-05, BR-01 | M1, M4 | M4 chỉnh đăng ký đề tài |
| Nhóm, thành viên, lời mời, yêu cầu tham gia | FR-06, FR-07, BR-02, BR-09 | M2 (giao diện), M5 (API) | M5 chỉnh phân nhóm |
| Nhiệm vụ và tiến độ | FR-08, FR-09 | M2, M5 | M5 chỉnh nhiệm vụ, tiến độ |
| Báo cáo, phiên bản, nhận xét, điểm | FR-10, FR-11, BR-05, BR-06 | M2, M6 | M6 chỉnh báo cáo, phản hồi |
| Bảo vệ và điểm số | FR-11 | M6 | M6 chỉnh bảo vệ, điểm số |
| Thông báo | FR-12 | Leader | — |
| Chatbot | FR-13, FR-14, FR-16, BR-07 | M2, M6 | M6 chỉnh chatbot |
| Tổng quan (dashboard) | FR-15 | M1 | — |
| Bảo mật cơ bản, tệp tải lên, giao diện responsive | NFR-01, NFR-04, NFR-07, NFR-09 | Theo chức năng | — |

### 3.2. Ngoài phạm vi

- Các mục ngoài phạm vi phiên bản đầu trong `docs/requirements.md` mục 6.
- Kiểm thử tải và hiệu năng chuyên sâu (NFR-05 chỉ đo thời gian phản hồi thủ công).
- Sao lưu và khôi phục CSDL (NFR-08) — chưa được triển khai theo `database/README.md`.
- Các sơ đồ UML, ERD của M3, M5, M6 (không phải phần mềm chạy được).

## 4. Vai trò và tài khoản kiểm thử

| Vai trò | Tài khoản | Cổng đăng nhập | Có ở chế độ mock | Có ở CSDL demo |
|---|---|---|---|---|
| Sinh viên | `sv` | `/login` | Có | Có |
| Sinh viên chưa có nhóm | `sv2` (CSDL demo có thêm `sv3` – `sv6`) | `/login` | Có | Có |
| Trưởng nhóm | `truongnhom` | `/login` | Có | Có (nhóm `N03`) |
| Giảng viên | `gv` | `/lecturer-login` | Có | Có (được gán 2 nhóm) |
| Người đào tạo | `daotao` | `/admin-login` | Có | Có |
| Quản trị viên | `admin` | `/admin-login` | Có | Có |

Mật khẩu chung: `123456`. Chỉ dùng dữ liệu giả, không đưa dữ liệu sinh viên thật vào repository.

Để kiểm thử phân quyền theo phạm vi dữ liệu (TC-06, TC-27), trên môi trường B cần tạo thêm: một giảng viên thứ hai chỉ được gán 1 nhóm, và một sinh viên thuộc nhóm khác.

## 5. Môi trường kiểm thử

### 5.1. Môi trường A – chế độ mock (chỉ giao diện)

Dùng để kiểm tra giao diện, luồng bấm và kiểm thử hồi quy nhanh. **Không dùng để kết luận về phân quyền hay dữ liệu**, vì mock chạy hoàn toàn trên trình duyệt và có thể khác backend (ví dụ: ở mock sinh viên thấy mọi nhóm, còn API thật chỉ trả nhóm của mình).

```bash
cd Code/frontend
npm ci
# tạo Code/frontend/.env.local với nội dung: VITE_USE_MOCK=true
npm run dev
```

Mở `http://localhost:5173`.

### 5.2. Môi trường B – backend thật (XAMPP)

Dùng cho kiểm thử chức năng, phân quyền, dữ liệu và bảo mật. Đã dựng xong trên máy kiểm thử ngày 16/11/2026.

| Thành phần | Cấu hình trên máy kiểm thử |
|---|---|
| XAMPP | `C:\xampp` – Apache 2.4.58, PHP 8.2.12, MariaDB 10.4.32 |
| Apache | Cổng **8080** (cổng 80 do IIS của Windows dùng) |
| MariaDB | Cổng 3306, tài khoản `root` không mật khẩu (mặc định của `database/database.php`) |
| Mã nguồn | Liên kết thư mục `C:\xampp\htdocs\EduProjectHub` → thư mục repo |
| CSDL | `eduprojecthub`, import từ `database/filetong/eduprojecthub-xampp.sql` (24 bảng, 10 tài khoản demo) |
| PHP tải tệp | `file_uploads` bật, `upload_max_filesize` và `post_max_size` = 40M (đủ cho giới hạn 10 MB) |

Máy có thêm dịch vụ **MySQL80** cài riêng chạy cổng 3307; không dùng và không tắt dịch vụ này.

**Các bước dựng lại (khi cần):**

1. Trong XAMPP Control Panel, bật **Apache** và **MySQL**.
2. Tạo liên kết thư mục (chỉ làm một lần):
   ```bat
   mklink /J "C:\xampp\htdocs\EduProjectHub" "F:\Học Kì Doanh Nghiệp\HKDN3\EduProjectHub"
   ```
   Kiểm tra: `http://localhost:8080/EduProjectHub/Code/Backend/auth.php?action=me` trả lỗi 401 là bình thường khi chưa đăng nhập.
3. Mở `http://localhost:8080/phpmyadmin`, **Import** `database/filetong/eduprojecthub-xampp.sql` khi CSDL `eduprojecthub` chưa tồn tại (xem `database/README.md`). Mỗi vòng kiểm thử lớn nên xóa CSDL và import lại để dữ liệu sạch.
4. Build frontend để Apache phục vụ:
   ```bash
   cd Code/frontend
   cp .env.example .env.production   # VITE_USE_MOCK=false
   npm run build
   ```
   Mở `http://localhost:8080/EduProjectHub/Code/frontend/dist/`. Sau mỗi lần kéo code mới từ `Demo` phải build lại.

Không dùng `npm run dev` cho môi trường B trên máy này: `vite.config.js` chuyển tiếp API tới `http://localhost` (cổng 80, đang là IIS) chứ không phải cổng 8080. Không sửa `vite.config.js` vì đây là cấu hình chung của nhóm.

### 5.3. Trình duyệt và kích thước màn hình

- Trình duyệt chính: Chrome bản mới nhất. Kiểm tra phụ: Microsoft Edge.
- Kích thước: máy tính 1280×800, máy tính bảng 768×1024, điện thoại 375×812 (dùng chế độ thiết bị của DevTools).

Mỗi vòng kiểm thử ghi lại môi trường thực tế (phiên bản PHP, MySQL, trình duyệt, commit của `Demo`) vào `test-results.md`.

## 6. Loại kiểm thử

| Loại | Nội dung | Môi trường |
|---|---|---|
| Kiểm thử nhanh (smoke) | Đăng nhập 6 tài khoản, mở mọi trang trên menu, không có lỗi trên trang và console | A, B |
| Chức năng | Từng chức năng theo FR, đúng dữ liệu vào – ra | B |
| Phân quyền | Mỗi vai trò chỉ thấy và chỉ thao tác được trong phạm vi cho phép. **Kiểm tra cả bằng cách gọi API trực tiếp**, không chỉ xem nút có bị ẩn hay không | B |
| Kiểm tra dữ liệu nhập | Trường bắt buộc, ngày không hợp lệ, điểm ngoài khoảng, tệp sai định dạng hoặc quá dung lượng | A, B |
| Bảo mật cơ bản | Thiếu CSRF token, chuỗi SQL injection, tải tệp nguy hiểm, truy cập tệp báo cáo trực tiếp qua URL, thông báo lỗi không lộ thông tin hệ thống | B |
| Giao diện | Bố cục theo wireframe (phần M2), responsive 3 kích thước, thông báo lỗi dễ hiểu | A |
| Hồi quy | Chạy lại các ca chính mỗi khi có merge vào `Demo` | A, B |
| Tích hợp đầu – cuối | Một luồng xuyên suốt 5 vai trò: tạo đợt → đề tài → nhóm → nhiệm vụ → nộp báo cáo → nhận xét → điểm → chatbot | B |

Kiểm thử do tester thực hiện thủ công. Sau mỗi lần có merge vào `Demo`, tester tự kéo về, chạy lại các ca liên quan và báo lỗi cho thành viên phụ trách theo mục 8.

## 7. Quy ước ca kiểm thử

Bộ ca kiểm thử nằm trong `tests/m2-qa/test-cases.md`.

- Mã ca: `QA-<nhóm>-<số>`, ví dụ `QA-AUTH-01`, `QA-TEAM-03`.

  | Mã nhóm | Chức năng |
  |---|---|
  | `AUTH` | Đăng nhập, cổng đăng nhập, đăng xuất |
  | `PROF` | Hồ sơ, đổi mật khẩu |
  | `USER` | Quản lý tài khoản |
  | `SEM` | Đợt đồ án |
  | `TOPIC` | Đề tài, đăng ký đề tài |
  | `TEAM` | Nhóm, thành viên, lời mời, yêu cầu |
  | `TASK` | Nhiệm vụ, tiến độ |
  | `RPT` | Báo cáo, nhận xét |
  | `DEF` | Bảo vệ, điểm số |
  | `NOTI` | Thông báo |
  | `CHAT` | Chatbot |
  | `UI` | Giao diện, responsive |
  | `SEC` | Bảo mật |
  | `E2E` | Luồng tích hợp đầu – cuối |

- Mỗi ca gồm: mã, chức năng, vai trò, tiền điều kiện, các bước, dữ liệu, kết quả mong đợi, môi trường (A/B), mức ưu tiên, tham chiếu `TC-xx` hoặc FR nếu có.
- Mức ưu tiên: **Cao** (xác thực, phân quyền, mất hoặc lộ dữ liệu), **Trung bình** (chức năng chính), **Thấp** (giao diện, câu chữ).
- Kết quả: `Đạt`, `Lỗi` (kèm mã `BUG-xx`), `Bị chặn` (không chạy được vì lỗi khác hoặc thiếu chức năng), `Chưa chạy`.

## 8. Quy trình báo lỗi

Mỗi lỗi được ghi vào bảng lỗi trong `tests/m2-qa/test-results.md` với mã riêng `BUG-<số>` (ví dụ `BUG-01`), sau đó tester báo cho leader và thành viên phụ trách trong mục **"Khó khăn cần hỗ trợ"** của report (thứ 2, 4, 6).

### 8.1. Mẫu ghi lỗi

```
Mã lỗi: BUG-01
Tiêu đề: <mô tả ngắn lỗi>
Ca kiểm thử: QA-TEAM-05
Môi trường: B (XAMPP) – Demo @ <commit> – Chrome <phiên bản>
Vai trò / tài khoản: truongnhom

Các bước tái hiện:
1. ...
2. ...

Kết quả thực tế: ...
Kết quả mong đợi: ...
Mức độ: Nghiêm trọng / Cao / Trung bình / Thấp
Người phụ trách sửa: M1 / M2 / ... / M6
Minh chứng: ảnh chụp, log console hoặc phản hồi API
Trạng thái: Mới / Đã báo / Đã sửa / Đã kiểm tra lại
```

### 8.2. Mức độ nghiêm trọng

| Mức | Ý nghĩa | Ví dụ |
|---|---|---|
| Nghiêm trọng | Lộ dữ liệu, vượt quyền, mất dữ liệu, không đăng nhập được | Sinh viên xem được báo cáo nhóm khác |
| Cao | Chức năng chính không dùng được, không có cách khác | Không nộp được báo cáo hợp lệ |
| Trung bình | Chức năng chạy sai một phần hoặc có cách khác | Tiến độ tính sai khi có nhiệm vụ đã hủy |
| Thấp | Giao diện, câu chữ, không ảnh hưởng chức năng | Menu xuống dòng ở màn 1280 px |

### 8.3. Người xử lý và vòng đời lỗi

- Người phụ trách sửa xác định theo bảng ở mục 3.1. Lỗi phần giao diện M2 (FR04–FR07) do M2 tự sửa trên nhánh `m2-qa-testing`, commit ghi kèm mã lỗi, ví dụ `fix(m2): ... (BUG-03)`.
- Vòng đời: **Mới** (tester ghi nhận) → **Đã báo** (đưa vào report) → **Đã sửa** (người phụ trách merge vào `Demo`) → **Đã kiểm tra lại** nếu tester chạy lại đạt; nếu chưa đạt thì quay về **Đã báo** kèm ghi chú.
- Lỗi mức Nghiêm trọng hoặc Cao được báo ngay trong report gần nhất, không chờ hết vòng kiểm thử.

## 9. Tiêu chí bắt đầu và kết thúc

**Bắt đầu một vòng kiểm thử khi:**

- Code đã được merge vào `Demo`, `npm run lint` và `npm run build` đạt.
- Môi trường B import được CSDL mới và đăng nhập được bằng tài khoản demo.

**Kết thúc giai đoạn kiểm thử (cuối tuần 6) khi:**

- 100% ca mức ưu tiên Cao đã chạy và đạt.
- Ít nhất 90% ca mức Trung bình đạt; các ca còn lỗi đã được ghi mã `BUG-xx` và được leader chấp nhận.
- Không còn lỗi mức Nghiêm trọng hoặc Cao chưa sửa.
- Luồng tích hợp đầu – cuối (`QA-E2E`) đạt trên môi trường B.
- Đáp ứng các tiêu chí nghiệm thu trong `docs/requirements.md` mục 7.

## 10. Lịch thực hiện

Mốc báo cáo với leader: thứ 2, 4, 6 trước 19:00.

| Tuần | Thứ 2 | Thứ 4 | Thứ 6 |
|---|---|---|---|
| **4** (16–20/11) | Kế hoạch kiểm thử; dựng môi trường B | Ca kiểm thử AUTH, PROF, USER, SEM, TOPIC | Ca kiểm thử TEAM, TASK, RPT, DEF, NOTI, CHAT, UI, SEC; chạy vòng 1 (smoke) trên `Demo` hiện tại |
| **5** (23–27/11) | Chạy vòng 2: phần M1, M3 (đăng nhập, hồ sơ, tài khoản) | Chạy vòng 2: phần M4, M5 (đợt, đề tài, nhóm, nhiệm vụ) | Chạy vòng 2: phần M6 (báo cáo, bảo vệ, chatbot); tổng hợp lỗi đưa vào report |
| **6** (30/11–04/12) | Kiểm thử lại các lỗi đã sửa (hồi quy) | Luồng tích hợp đầu – cuối 5 vai trò | Báo cáo kết quả kiểm thử cuối cùng |

Lịch vòng 2 phụ thuộc thời điểm các thành viên merge vào `Demo`; phần nào chưa merge sẽ dời sang buổi sau và ghi vào kết quả.

## 11. Sản phẩm bàn giao

| Sản phẩm | Vị trí |
|---|---|
| Kế hoạch kiểm thử | `tests/m2-qa/test-plan.md` (file này) |
| Bộ ca kiểm thử | `tests/m2-qa/test-cases.md` |
| Kết quả từng vòng kiểm thử | `tests/m2-qa/test-results.md` |
| Danh sách lỗi | Bảng lỗi `BUG-xx` trong `tests/m2-qa/test-results.md`; báo trong report thứ 2, 4, 6 |
| Ảnh chụp minh chứng | Kèm theo từng lỗi và phụ lục báo cáo HKDN |
| Báo cáo kết quả kiểm thử cuối cùng | Cuối `test-results.md` (tuần 6) |

## 12. Rủi ro và điểm cần làm rõ

| # | Rủi ro / điểm lệch | Ảnh hưởng | Hướng xử lý |
|---|---|---|---|
| 1 | Chức năng đang được sửa đồng thời trong tuần 4–6 | Ca kiểm thử phải cập nhật theo | Chạy kiểm thử theo từng lần merge; ghi commit của `Demo` cho mỗi vòng |
| 2 | Chế độ mock khác backend thật | Lỗi bị che khi chỉ kiểm thử bằng mock | Mọi kết luận về phân quyền, dữ liệu chỉ lấy từ môi trường B |
| 3 | `docs/requirements.md` BR-06 ghi điểm 0–100, còn `database/README.md` và giao diện dùng thang 0–10 | Kiểm thử điểm không có kết quả mong đợi thống nhất | Hỏi leader và M6; tạm kiểm theo thang 0–10 |
| 4 | `tests/test-cases.md` TC-02 nhắc "email hợp lệ", nhưng hệ thống đăng nhập bằng `username` | Ca TC-02 cần hiểu theo `username` | Ghi chú khi tham chiếu, báo M3 cập nhật |
| 5 | Dữ liệu mock khác dữ liệu demo trong CSDL (ví dụ: `sv` thấy 2 nhóm ở mock nhưng 1 nhóm ở backend thật) | Kết quả mong đợi khác nhau giữa môi trường A và B | Ca kiểm thử dữ liệu ghi kết quả mong đợi theo CSDL demo (môi trường B) |
| 6 | Sinh viên chưa có nhóm không có cách tìm nhóm để gửi yêu cầu tham gia (API `request` nhận `group_id`, không nhận mã nhóm) | Luồng yêu cầu tham gia có thể bị chặn | Kiểm thử và báo lỗi cho M5 nếu vẫn còn |
| 7 | Kiểm thử phân quyền qua API cần gửi request trực tiếp | Cần công cụ ngoài trình duyệt | Dùng DevTools (Console, `fetch`) hoặc Postman, ghi lại request trong mục lỗi |
