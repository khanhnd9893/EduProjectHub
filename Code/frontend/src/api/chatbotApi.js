import { backendNotImplemented } from './response.js'
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

function findMockAnswer(content) {
  const words = new Set(toWords(content))
  let bestFaq = null
  let bestScore = 0

  for (const faq of mockFaqs) {
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

const chatbotApi = {
  async listFaqs() {
    if (useMock) {
      return mockResolve(mockFaqs.filter((faq) => faq.status === 'published'))
    }

    return backendNotImplemented('FAQ chatbot')
  },

  async listSessions() {
    if (useMock) {
      const { id } = getMockUser()
      return mockResolve(
        mockChatSessions.filter((session) => session.userId === id),
      )
    }

    return backendNotImplemented('phiên chatbot')
  },

  async listMessages(sessionId) {
    if (useMock) {
      return mockResolve(
        mockChatMessages.filter(
          (message) => message.sessionId === Number(sessionId),
        ),
      )
    }

    return backendNotImplemented('tin nhắn chatbot')
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

    return backendNotImplemented('gửi tin nhắn chatbot')
  },
}

export default chatbotApi
