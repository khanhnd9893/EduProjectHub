import { useEffect, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import chatbotApi from '../../api/chatbotApi.js'

function formatTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

function ChatbotPage() {
  const [faqs, setFaqs] = useState([])
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([chatbotApi.listFaqs(), chatbotApi.listSessions()])
      .then(([faqList, sessionList]) => {
        if (active) {
          setFaqs(faqList)
          setSessions(sessionList)
          setSessionId(sessionList[0]?.id ?? null)
          setIsLoading(false)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải dữ liệu chatbot.')
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (sessionId === null) {
      return undefined
    }

    let active = true
    chatbotApi
      .listMessages(sessionId)
      .then((result) => {
        if (active) {
          setMessages(result)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Không thể tải lịch sử hội thoại.')
        }
      })

    return () => {
      active = false
    }
  }, [sessionId])

  async function handleSubmit(event) {
    event.preventDefault()
    const message = content.trim()
    if (!message) {
      return
    }
    setError('')
    setIsSending(true)
    try {
      const result = await chatbotApi.sendMessage({ sessionId, content: message })
      setMessages((currentMessages) => [
        ...currentMessages,
        result.userMessage,
        result.assistantMessage,
      ])
      setSessionId(result.sessionId)
      setSessions(await chatbotApi.listSessions())
      setContent('')
    } catch (sendError) {
      setError(sendError.message || 'Không thể gửi câu hỏi.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="dashboard-page">
      <PageHeading
        title="Chatbot"
        description="Đặt câu hỏi về đồ án và xem lại lịch sử hội thoại."
        status={isLoading ? 'Đang tải' : 'FAQ'}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {isLoading ? (
        <p role="status">Đang tải chatbot...</p>
      ) : (
        <div className="chatbot-layout">
          <aside className="workspace-panel chatbot-sidebar">
            <h2>Lịch sử</h2>
            <button
              className="button-secondary"
              onClick={() => {
                setSessionId(null)
                setMessages([])
              }}
              type="button"
            >
              Hội thoại mới
            </button>
            <ul className="chat-session-list">
              {sessions.map((session) => (
                <li key={session.id}>
                  <button
                    className={session.id === sessionId ? 'is-selected' : ''}
                    onClick={() => setSessionId(session.id)}
                    type="button"
                  >
                    {session.title || 'Hội thoại'}
                  </button>
                </li>
              ))}
            </ul>
            <h3>Câu hỏi thường gặp</h3>
            <ul className="faq-list">
              {faqs.map((faq) => (
                <li key={faq.id}>
                  <button
                    onClick={() => setContent(faq.question)}
                    type="button"
                  >
                    {faq.question}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <section className="workspace-panel chat-panel">
            <div className="chat-messages" aria-live="polite">
              {messages.length ? (
                messages.map((message) => (
                  <article
                    className={`chat-message ${message.sender === 'user' ? 'from-user' : 'from-assistant'}`}
                    key={message.id}
                  >
                    <p>{message.content}</p>
                    <small>{formatTime(message.createdAt)}</small>
                  </article>
                ))
              ) : (
                <p className="muted">
                  Chọn một câu hỏi thường gặp hoặc nhập câu hỏi của bạn.
                </p>
              )}
            </div>
            <form className="chat-form" onSubmit={handleSubmit}>
              <label className="field-control">
                Câu hỏi
                <textarea
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Nhập câu hỏi..."
                  required
                  rows="2"
                  value={content}
                />
              </label>
              <button disabled={isSending} type="submit">
                {isSending ? 'Đang gửi...' : 'Gửi câu hỏi'}
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default ChatbotPage
