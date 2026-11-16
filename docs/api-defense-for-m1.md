# Tài liệu tích hợp API Defense & Chấm điểm đồ án (Dành cho Frontend / M1)

> **Tài liệu tham chiếu:** Hệ thống API Quản lý Bảo vệ đồ án và Điểm số (`Code/Backend/defense.php`, `Code/Backend/reports.php`, CSDL `database/bao_ve_diem_so.sql`).

---

## 1. Kết luận chính thức về thang điểm chấm đồ án

### 🎯 KẾT LUẬN: Thang điểm đang sử dụng là **0 – 10** (Thang điểm 10)
Toàn bộ hệ thống hiện tại (từ CSDL MySQL, Backend PHP cho đến Frontend React) **đồng nhất 100% sử dụng thang điểm từ 0.00 đến 10.00**, làm tròn tối đa 2 chữ số thập phân (`DECIMAL(4,2)`).

### 🔍 Bằng chứng chi tiết từ Mã nguồn & Cơ sở dữ liệu:

1. **Ràng buộc toàn vẹn trong Cơ sở dữ liệu (`database/bao_ve_diem_so.sql` và `database/bao_cao_do_an.sql`):**
   - Bảng điểm bảo vệ `defense_scores`:
     ```sql
     score DECIMAL(4,2) NOT NULL,
     CONSTRAINT chk_defense_scores_score CHECK (score >= 0 AND score <= 10)
     ```
   - Bảng điểm tổng kết `final_grades`:
     ```sql
     total_score DECIMAL(4,2) NOT NULL,
     CONSTRAINT chk_final_grades_score CHECK (total_score >= 0 AND total_score <= 10)
     ```
   - Bảng nhận xét báo cáo `report_feedback`:
     ```sql
     score DECIMAL(4,2) NULL,
     CONSTRAINT chk_report_feedback_score CHECK (score IS NULL OR (score >= 0 AND score <= 10))
     ```
   - File kiến trúc [database/README.md](file:///c:/Users/pc/EduProjectHub/database/README.md) (dòng 42):
     > *"All scores use a 0–10 scale."*

2. **Logic kiểm tra và tính toán trong Backend (`Code/Backend/defense.php` & `reports.php`):**
   - Hàm `defenseScore($value)` trong `defense.php`:
     ```php
     apiRequire($score >= 0 && $score <= 10, 400, "$field phải nằm trong khoảng từ 0 đến 10.");
     return round($score, 2);
     ```
   - Trọng số tính điểm gợi ý:
     ```php
     const DEFENSE_REPORT_WEIGHT = 0.4;  // 40% Điểm báo cáo
     const DEFENSE_DEFENSE_WEIGHT = 0.6; // 60% Điểm bảo vệ hội đồng
     // Điểm gợi ý = round(0.4 * Điểm báo cáo + 0.6 * Điểm bảo vệ, 2)
     ```
   - Hàm nhận xét trong `reports.php`:
     ```php
     apiRequire($score === null || (is_numeric($score) && (float) $score >= 0 && (float) $score <= 10), 400, 'Điểm phải nằm trong khoảng từ 0 đến 10.');
     ```

3. **Giao diện người dùng trong Frontend React:**
   - Trang hiển thị điểm [GradesPage.jsx](file:///c:/Users/pc/EduProjectHub/Code/frontend/src/features/grades/GradesPage.jsx) (dòng 67):
     ```jsx
     <strong className="grade-score">{Number(grade.totalScore).toFixed(2)} / 10</strong>
     ```

*(Ghi chú: Mục BR-06 trong tài liệu đặc tả sơ khai `requirements.md` từng đề cập thang 0–100, nhưng trong quá trình chuẩn hóa CSDL và hiện thực mã nguồn, nhóm đã thống nhất chuyển sang thang điểm 0–10 để phù hợp với chuẩn đào tạo đại học).*

---

## 2. Danh mục API chi tiết Module Bảo vệ đồ án (`defense.php`)

- **Base URL:** `/EduProjectHub/Code/Backend/defense.php` (hoặc cấu hình qua `apiClient`)
- **Headers bắt buộc khi gửi dữ liệu (`POST`, `PATCH`):**
  - `Content-Type: application/json`
  - `X-CSRF-Token: <token>`
  - Cookie Session HTTP-only

---

### 2.1. Tra cứu danh sách giảng viên (Lập hội đồng)
- **URL:** `GET /defense.php?action=lecturers`
- **Quyền:** `admin`, `training_manager`
- **Response thành công (200 OK):**
```json
{
  "data": [
    { "id": 3, "full_name": "TS. Trần Thị B" },
    { "id": 7, "full_name": "ThS. Lê Hoàng C" }
  ]
}
```

---

### 2.2. Danh sách hội đồng bảo vệ
- **URL:** `GET /defense.php?action=councils`
- **Query Params tùy chọn:** `round_id=<id>`
- **Quyền:** `admin`, `training_manager`, `lecturer` (giảng viên chỉ thấy hội đồng mình tham gia).
- **Response thành công (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "project_round_id": 1,
      "round_name": "Đồ án học kỳ 1 năm 2026",
      "name": "Hội đồng chuyên ngành KTPM 01",
      "created_at": "2026-11-15 10:00:00",
      "members": [
        { "lecturer_user_id": 3, "lecturer_name": "TS. Trần Thị B", "council_role": "chair" },
        { "lecturer_user_id": 7, "lecturer_name": "ThS. Lê Hoàng C", "council_role": "secretary" },
        { "lecturer_user_id": 8, "lecturer_name": "TS. Phạm Văn D", "council_role": "member" }
      ]
    }
  ]
}
```

---

### 2.3. Tạo hội đồng bảo vệ mới
- **URL:** `POST /defense.php?action=create_council`
- **Quyền:** `training_manager`
- **Request Body:**
```json
{
  "project_round_id": 1,
  "name": "Hội đồng chuyên ngành KTPM 01",
  "members": [
    { "lecturer_user_id": 3, "council_role": "chair" },
    { "lecturer_user_id": 7, "council_role": "secretary" },
    { "lecturer_user_id": 8, "council_role": "member" }
  ]
}
```
*(Lưu ý: Bắt buộc phải có đúng 1 `chair`, từ 1 đến 20 thành viên, không được trùng giảng viên).*
- **Response thành công (201 Created):**
```json
{
  "data": { "id": 1 }
}
```

---

### 2.4. Cập nhật hội đồng bảo vệ
- **URL:** `PATCH /defense.php?action=update_council`
- **Quyền:** `training_manager`
- **Request Body:**
```json
{
  "id": 1,
  "name": "Hội đồng chuyên ngành KTPM 01 (Cập nhật)",
  "members": [
    { "lecturer_user_id": 3, "council_role": "chair" },
    { "lecturer_user_id": 7, "council_role": "secretary" }
  ]
}
```
- **Response thành công (200 OK):**
```json
{
  "message": "Đã cập nhật hội đồng bảo vệ."
}
```

---

### 2.5. Danh sách lịch bảo vệ
- **URL:** `GET /defense.php?action=schedules`
- **Query Params tùy chọn:** `group_id=<id>`, `council_id=<id>`
- **Quyền:** Mọi vai trò đã đăng nhập (sinh viên chỉ thấy lịch nhóm mình; giảng viên thấy lịch nhóm phụ trách hoặc hội đồng mình chấm).
- **Response thành công (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "council_id": 1,
      "council_name": "Hội đồng chuyên ngành KTPM 01",
      "group_id": 1,
      "group_name": "Nhóm EduProjectHub",
      "group_code": "N01",
      "defense_at": "2027-01-15 08:30:00",
      "location": "Phòng E.302",
      "status": "scheduled",
      "note": "Chuẩn bị slide và source code demo",
      "my_council_role": "chair"
    }
  ]
}
```

---

### 2.6. Chi tiết 1 lịch bảo vệ
- **URL:** `GET /defense.php?action=schedule&id={id}`
- **Quyền:** Sinh viên thuộc nhóm, giảng viên liên quan, đào tạo, admin.
- **Response thành công (200 OK):**
```json
{
  "data": {
    "id": 1,
    "council_id": 1,
    "group_id": 1,
    "defense_at": "2027-01-15 08:30:00",
    "location": "Phòng E.302",
    "status": "scheduled",
    "note": "Chuẩn bị slide và source code demo",
    "my_council_role": "chair",
    "council_members": [
      { "lecturer_user_id": 3, "lecturer_name": "TS. Trần Thị B", "council_role": "chair" }
    ],
    "students": [
      { "user_id": 5, "full_name": "Nguyễn Văn A", "student_code": "20110001", "member_role": "leader" }
    ],
    "scores": [
      {
        "id": 1,
        "student_user_id": 5,
        "student_name": "Nguyễn Văn A",
        "lecturer_user_id": 3,
        "lecturer_name": "TS. Trần Thị B",
        "score": 8.50,
        "comment": "Báo cáo rõ ràng, trả lời tốt câu hỏi",
        "graded_at": "2027-01-15 09:30:00"
      }
    ]
  }
}
```

---

### 2.7. Lên lịch bảo vệ cho nhóm
- **URL:** `POST /defense.php?action=create_schedule`
- **Quyền:** `training_manager`
- **Request Body:**
```json
{
  "council_id": 1,
  "group_id": 1,
  "defense_at": "2027-01-15 08:30:00",
  "location": "Phòng E.302",
  "status": "scheduled",
  "note": "Chuẩn bị máy chiếu và tài liệu in"
}
```
- **Response thành công (201 Created):**
```json
{
  "data": { "id": 1 }
}
```

---

### 2.8. Cập nhật lịch bảo vệ
- **URL:** `PATCH /defense.php?action=update_schedule`
- **Quyền:** `training_manager`
- **Request Body:**
```json
{
  "id": 1,
  "defense_at": "2027-01-15 09:00:00",
  "location": "Phòng Hội trường A",
  "status": "scheduled",
  "note": "Đổi phòng theo yêu cầu khoa"
}
```
*(Trạng thái `status` hợp lệ: `scheduled`, `completed`, `postponed`, `cancelled`)*
- **Response thành công (200 OK):**
```json
{
  "message": "Đã cập nhật lịch bảo vệ."
}
```

---

### 2.9. Chấm điểm bảo vệ đồ án (Từng thành viên hội đồng)
- **URL:** `POST /defense.php?action=score`
- **Quyền:** `lecturer` (phải là thành viên trong hội đồng bảo vệ của lịch đó).
- **Request Body:**
```json
{
  "schedule_id": 1,
  "student_user_id": 5,
  "score": 8.5,
  "comment": "Nắm vững kiến trúc phần mềm, phản biện tốt."
}
```
*(Thang điểm: 0.00 đến 10.00)*
- **Response thành công (200 OK):**
```json
{
  "data": {
    "schedule_id": 1,
    "student_user_id": 5,
    "score": 8.5
  }
}
```

---

### 2.10. Xem tổng hợp điểm của nhóm (Grade Summary)
- **URL:** `GET /defense.php?action=grade_summary&group_id={groupId}`
- **Quyền:** `training_manager` hoặc `chair` (chủ tịch hội đồng của nhóm).
- **Response thành công (200 OK):**
```json
{
  "data": {
    "group_id": 1,
    "group_name": "Nhóm EduProjectHub",
    "report_score": 8.00,
    "council_member_count": 3,
    "weights": {
      "report": 0.4,
      "defense": 0.6
    },
    "students": [
      {
        "user_id": 5,
        "full_name": "Nguyễn Văn A",
        "student_code": "20110001",
        "defense_score": 8.50,
        "defense_score_count": 3,
        "suggested_total": 8.30,
        "grade": {
          "student_user_id": 5,
          "total_score": 8.50,
          "status": "draft",
          "note": "Điểm tổng kết thống nhất bởi hội đồng",
          "published_at": null,
          "updated_at": "2027-01-15 10:00:00"
        }
      }
    ]
  }
}
```

---

### 2.11. Lưu điểm tổng kết cho sinh viên
- **URL:** `POST /defense.php?action=save_grade`
- **Quyền:** `training_manager` hoặc `chair` (chủ tịch hội đồng).
- **Request Body:**
```json
{
  "group_id": 1,
  "student_user_id": 5,
  "total_score": 8.5,
  "status": "draft",
  "note": "Đạt loại Giỏi"
}
```
*(Trạng thái `status`: `draft` hoặc `published`)*
- **Response thành công (200 OK):**
```json
{
  "data": {
    "group_id": 1,
    "student_user_id": 5,
    "total_score": 8.5,
    "status": "draft"
  }
}
```

---

### 2.12. Công bố điểm chính thức cho cả nhóm
- **URL:** `POST /defense.php?action=publish_grades`
- **Quyền:** `training_manager` hoặc `chair` (chủ tịch hội đồng).
- **Điều kiện:** Toàn bộ thành viên trong nhóm phải đã có điểm tổng kết (`draft`).
- **Request Body:**
```json
{
  "group_id": 1
}
```
- **Response thành công (200 OK):**
```json
{
  "data": {
    "published": 3
  }
}
```

---

### 2.13. Xem điểm tổng kết đã công bố (`reports.php`)
- **URL:** `GET /reports.php?action=grades`
- **Query Params tùy chọn:** `group_id=<id>`
- **Quyền:**
  - `student`: Xem điểm của chính mình sau khi đã `published`.
  - `lecturer`: Xem điểm các nhóm mình được phân công hướng dẫn.
  - `admin`, `training_manager`: Xem toàn bộ điểm.
- **Response thành công (200 OK):**
```json
{
  "data": [
    {
      "group_id": 1,
      "group_name": "Nhóm EduProjectHub",
      "student_id": 5,
      "student_name": "Nguyễn Văn A",
      "total_score": "8.50",
      "status": "published",
      "note": "Đạt loại Giỏi",
      "published_at": "2027-01-15 11:00:00",
      "updated_at": "2027-01-15 11:00:00"
    }
  ]
}
```
