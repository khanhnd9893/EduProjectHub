import apiClient from './client.js'
import { unwrap } from './response.js'
import {
  getMockUser,
  mockResolve,
  nextId,
  nowIso,
} from './mock/helpers.js'
import {
  mockChatMessages,
  mockChatSessions,
  mockFaqs,
} from './mock/chatbotMock.js'
import { isStudentRole } from '../utils/roles.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

const MOCK_FALLBACK_ANSWER =
  'Xin lỗi, mình chưa có thông tin cho câu hỏi này. Bạn hãy liên hệ giảng viên hướng dẫn nhé.'
const MIN_MATCHED_WORDS = 2
const STOP_WORDS = new Set(['lam', 'sao', 'de', 'toi', 'o', 'dau', 'khi', 'nao'])

function toWords(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOP_WORDS.has(word))
}

// FAQ chỉ hiện cho vai trò được phép xem; dùng chung cho danh sách FAQ và câu trả lời mock.
function isFaqVisible(faq, role) {
  return (
    !faq.visibility ||
    faq.visibility === 'all' ||
    faq.visibility === role.toLowerCase() ||
    (isStudentRole(role) && faq.visibility === 'student')
  )
}

function findMockAnswer(content) {
  const words = new Set(toWords(content))
  const { role } = getMockUser()
  let bestFaq = null
  let bestScore = 0

  for (const faq of mockFaqs.filter((entry) => isFaqVisible(entry, role))) {
    const score = toWords(faq.question).filter((word) => words.has(word)).length

    if (score > bestScore) {
      bestFaq = faq
      bestScore = score
    }
  }

  return bestScore >= MIN_MATCHED_WORDS ? bestFaq.answer : MOCK_FALLBACK_ANSWER
}

function addMockMessage(sessionId, sender, content) {
  const message = {
    id: nextId(mockChatMessages),
    sessionId,
    sender,
    content,
    createdAt: nowIso(),
  }
  mockChatMessages.push(message)
  return message
}

function mapMessage(message) {
  return {
    id: Number(message.id),
    sessionId: Number(message.sessionId ?? message.session_id),
    sender: message.sender,
    content: message.content,
    createdAt: message.createdAt ?? message.created_at,
  }
}

const chatbotApi = {
  async listFaqs() {
    if (useMock) {
      const { role } = getMockUser()
      return mockResolve(
        mockFaqs.filter(
          (faq) =>
            faq.status === 'published' &&
            isFaqVisible(faq, role),
        ),
      )
    }

    const faqs = await unwrap(
      apiClient.get('/chatbot.php', { params: { action: 'faqs' } }),
    )
    return faqs.map((faq) => ({
      id: Number(faq.id),
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      visibility: faq.visibility,
      status: faq.status,
    }))
  },

  async listSessions() {
    if (useMock) {
      const { id } = getMockUser()
      return mockResolve(
        mockChatSessions.filter((session) => session.userId === id),
      )
    }

    const sessions = await unwrap(
      apiClient.get('/chatbot.php', { params: { action: 'sessions' } }),
    )
    return sessions.map((session) => ({
      id: Number(session.id),
      userId: Number(session.user_id),
      title: session.title,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }))
  },

  async listMessages(sessionId) {
    if (useMock) {
      return mockResolve(
        mockChatMessages.filter(
          (message) => message.sessionId === Number(sessionId),
        ),
      )
    }

    return (
      await unwrap(
        apiClient.get('/chatbot.php', {
          params: { action: 'messages', session_id: sessionId },
        }),
      )
    ).map(mapMessage)
  },

  // Không truyền sessionId thì tạo phiên hội thoại mới.
  async sendMessage({ sessionId, content }) {
    if (useMock) {
      let session = mockChatSessions.find(
        (entry) => entry.id === Number(sessionId),
      )

      if (!session) {
        session = {
          id: nextId(mockChatSessions),
          userId: getMockUser().id,
          title: content.slice(0, 200),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        mockChatSessions.push(session)
      }

      session.updatedAt = nowIso()
      return mockResolve({
        sessionId: session.id,
        userMessage: addMockMessage(session.id, 'user', content),
        assistantMessage: addMockMessage(
          session.id,
          'assistant',
          findMockAnswer(content),
        ),
      })
    }

    const result = await unwrap(
      apiClient.post('/chatbot.php?action=send', {
        session_id: sessionId,
        content,
      }),
    )
    return {
      sessionId: Number(result.sessionId),
      userMessage: mapMessage(result.userMessage),
      assistantMessage: mapMessage(result.assistantMessage),
    }
  },
}

export default chatbotApi
