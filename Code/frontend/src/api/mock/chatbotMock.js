import { daysFromNow } from './helpers.js'

// Tên trường theo chatbot_faqs, chat_sessions, chat_messages.
export const mockFaqs = [
  {
    id: 1,
    question: 'Khi nào hết hạn đăng ký đề tài?',
    answer:
      'Thời hạn đăng ký đề tài được công bố theo từng đợt trong học kỳ. Bạn xem chi tiết tại mục Đề tài sau khi đăng nhập.',
    category: 'Đề tài',
    status: 'published',
  },
  {
    id: 2,
    question: 'Tôi nộp báo cáo ở đâu?',
    answer:
      'Vào mục Báo cáo, chọn đợt báo cáo đang mở và tải tệp lên. Hệ thống lưu lại từng phiên bản đã nộp.',
    category: 'Báo cáo',
    status: 'published',
  },
  {
    id: 3,
    question: 'Làm sao để xem điểm đồ án?',
    answer: 'Vào mục Điểm số để xem điểm tổng kết sau khi giảng viên công bố.',
    category: 'Điểm số',
    status: 'published',
  },
  {
    id: 4,
    question: 'Làm sao để tham gia nhóm đồ án?',
    answer:
      'Vào mục Nhóm, chọn nhóm muốn tham gia và gửi yêu cầu, hoặc chấp nhận lời mời từ trưởng nhóm.',
    category: 'Nhóm',
    status: 'published',
  },
]

export const mockChatSessions = [
  {
    id: 1,
    userId: 1,
    title: 'Hỏi về nộp báo cáo',
    createdAt: daysFromNow(-3),
    updatedAt: daysFromNow(-3),
  },
  {
    id: 2,
    userId: 2,
    title: 'Hỏi về điểm đồ án',
    createdAt: daysFromNow(-4),
    updatedAt: daysFromNow(-4),
  },
]

export const mockChatMessages = [
  {
    id: 1,
    sessionId: 1,
    sender: 'user',
    content: 'Tôi nộp báo cáo ở đâu?',
    createdAt: daysFromNow(-3),
  },
  {
    id: 2,
    sessionId: 1,
    sender: 'assistant',
    content: mockFaqs[1].answer,
    createdAt: daysFromNow(-3),
  },
  {
    id: 3,
    sessionId: 2,
    sender: 'user',
    content: 'Làm sao để xem điểm đồ án?',
    createdAt: daysFromNow(-4),
  },
  {
    id: 4,
    sessionId: 2,
    sender: 'assistant',
    content: mockFaqs[2].answer,
    createdAt: daysFromNow(-4),
  },
]
