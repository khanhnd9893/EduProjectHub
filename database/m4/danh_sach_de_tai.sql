USE eduprojecthub;

-- ========================================================
-- Module M4: Dữ liệu mẫu 8 đề tài đồ án chuyên ngành CNTT
-- Bảng: project_topics
-- Đợt đồ án: DA_HK1_2026 (ID = 1, status = 'open')
-- ========================================================

SET NAMES utf8mb4;

INSERT INTO project_topics (
    project_round_id,
    topic_code,
    title,
    description,
    supervisor_user_id,
    max_groups,
    status,
    created_by
)
VALUES
(
    1,
    'DT001',
    'Xây dựng hệ thống quản lý đồ án sinh viên tích hợp Chatbot AI hỗ trợ tra cứu (EduProjectHub)',
    'Xây dựng nền tảng quản lý toàn diện quy trình làm đồ án tốt nghiệp, phân quyền đa vai trò (Admin, Đào tạo, Giảng viên, Sinh viên) và tích hợp Chatbot AI hỗ trợ giải đáp quy chế, tra cứu biểu mẫu tự động. Công nghệ: React, PHP 8, MySQL.',
    2,
    2,
    'open',
    3
),
(
    1,
    'DT002',
    'Phân tích nghiệp vụ và triển khai hệ thống ERP Odoo cho chuỗi nhà hàng ẩm thực',
    'Khảo sát nghiệp vụ chuỗi nhà hàng ăn uống, cấu hình và may đo các module Quản lý bán hàng (POS), Quản trị mua hàng, Quản lý kho nguyên vật liệu và Kế toán tài chính trên nền tảng ERP Odoo. Công nghệ: Python, Odoo 20.0, OWL, PostgreSQL.',
    2,
    2,
    'open',
    2
),
(
    1,
    'DT003',
    'Xây dựng hệ thống thương mại điện tử gợi ý sản phẩm cá nhân hóa dựa trên hành vi người dùng',
    'Phát triển website sàn thương mại điện tử hiện đại, tích hợp công cụ Machine Learning phân tích lịch sử duyệt web và đơn hàng để đưa ra các gợi ý sản phẩm phù hợp theo thời gian thực. Công nghệ: Next.js, Node.js, PostgreSQL, Python ML.',
    2,
    2,
    'open',
    3
),
(
    1,
    'DT004',
    'Phát triển ứng dụng di động quản lý chi tiêu cá nhân và lập kế hoạch tài chính thông minh',
    'Ứng dụng hỗ trợ người dùng theo dõi các khoản thu chi hàng ngày, quét hóa đơn bằng OCR, tự động phân loại danh mục chi tiêu và đưa ra cảnh báo thâm hụt ngân sách tài chính. Công nghệ: React Native / Flutter, Node.js, Firebase.',
    2,
    3,
    'open',
    2
),
(
    1,
    'DT005',
    'Xây dựng hệ thống điểm danh thông minh bằng nhận diện khuôn mặt thời gian thực',
    'Triển khai giải pháp điểm danh tự động cho lớp học hoặc doanh nghiệp sử dụng camera, áp dụng mô hình mạng nơ-ron học sâu phát hiện và nhận diện khuôn mặt chính xác ngay cả khi đeo khẩu trang. Công nghệ: Python, OpenCV, YOLO, FastAPI, React.',
    2,
    2,
    'open',
    3
),
(
    1,
    'DT006',
    'Thiết kế hệ thống quản lý lịch khám bệnh và hồ sơ sức khỏe điện tử trực tuyến',
    'Nền tảng kết nối bệnh nhân và cơ sở y tế: cho phép đặt lịch khám trực tuyến theo khung giờ của bác sĩ, quản lý hồ sơ bệnh án điện tử, kết quả xét nghiệm và đơn thuốc an toàn, bảo mật. Công nghệ: Vue.js / React, Laravel, MySQL.',
    2,
    2,
    'open',
    2
),
(
    1,
    'DT007',
    'Xây dựng hệ thống giám sát chất lượng không khí và điều khiển thiết bị IoT từ xa',
    'Phát triển giải pháp quan trắc môi trường thông minh thu thập nồng độ bụi mịn PM2.5, nhiệt độ, độ ẩm qua vi điều khiển ESP32, truyền tải dữ liệu qua giao thức MQTT và hiển thị dashboard cảnh báo theo thời gian thực. Công nghệ: ESP32, MQTT, Node.js, React.',
    2,
    2,
    'open',
    3
),
(
    1,
    'DT008',
    'Phát triển hệ thống quản lý kho vận và tối ưu lộ trình giao hàng nội thành',
    'Hệ thống quản lý chuỗi cung ứng logistics hỗ trợ nhập xuất tồn kho, theo dõi đơn vận và áp dụng thuật toán tìm đường tối ưu (Dijkstra/Genetic) giúp tài xế giao nhiều điểm tiết kiệm thời gian và chi phí xăng xe. Công nghệ: React, Node.js, MySQL, Maps API.',
    2,
    2,
    'open',
    2
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    supervisor_user_id = VALUES(supervisor_user_id),
    max_groups = VALUES(max_groups),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;
