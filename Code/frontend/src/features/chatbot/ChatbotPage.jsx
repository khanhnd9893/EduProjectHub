import { useEffect, useRef, useState } from 'react'
import PageHeading from '../../components/PageHeading.jsx'
import chatbotApi from '../../api/chatbotApi.js'

const GREETING =
  'Chào bạn. Mình có thể tra cứu đề tài, nhiệm vụ, hạn nộp và quy định của đợt đồ án. Bạn muốn hỏi gì?'
const SUGGESTION_LIMIT = 4
const DAY_MS = 24 * 60 * 60 * 1000

function formatTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

// Chia lịch sử theo mốc thời gian như wireframe FR07.2.
function groupSessions(sessions) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const groups = [
    { label: 'Hôm nay', items: [] },
    { label: '7 ngày qua', items: [] },
    { label: 'Cũ hơn', items: [] },
  ]

  for (const session of sessions) {
    const time = new Date(session.updatedAt ?? session.createdAt).getTime()
    if (time >= startOfToday.getTime()) {
      groups[0].items.push(session)
    } else if (time >= startOfToday.getTime() - 7 * DAY_MS) {
      groups[1].items.push(session)
    } else {
      groups[2].items.push(session)
    }
  }

  return groups.filter((group) => group.items.length > 0)
}

function ChatbotPage() {
  const [faqs, setFaqs] = useState([])
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [pendingQuestion, setPendingQuestion] = useState('')
  const [searchText, setSearchText] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

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

  async function sendQuestion(question) {
    const message = question.trim()
    if (!message || pendingQuestion) {
      return
    }
    setError('')
    setPendingQuestion(message)
    setContent('')
    try {
      const result = await chatbotApi.sendMessage({ sessionId, content: message })
      setMessages((currentMessages) => [
        ...currentMessages,
        result.userMessage,
        result.assistantMessage,
      ])
      setSessionId(result.sessionId)
      setSessions(await chatbotApi.listSessions())
    } catch (sendError) {
      setContent(message)
      setError(sendError.message || 'Không thể gửi câu hỏi.')
    } finally {
      setPendingQuestion('')
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendQuestion(content)
  }

  // Enter để gửi, Shift + Enter để xuống dòng.
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      sendQuestion(content)
    }
  }

  function startNewConversation() {
    setSessionId(null)
    setMessages([])
    setError('')
    inputRef.current?.focus()
  }

  async function handleCopy(message) {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedMessageId(message.id)
    } catch {
      // Một số trình duyệt chặn Clipboard API; dùng ô ẩn để sao chép thay thế.
      const textarea = document.createElement('textarea')
      textarea.value = message.content
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      textarea.remove()
      if (copied) {
        setCopiedMessageId(message.id)
      } else {
        setError('Trình duyệt không cho phép sao chép tự động.')
      }
    }
  }

  const suggestions = faqs.slice(0, SUGGESTION_LIMIT)
  const normalizedSearch = searchText.trim().toLowerCase()
  const sessionGroups = groupSessions(
    sessions.filter((session) =>
      (session.title || 'Hội thoại').toLowerCase().includes(normalizedSearch),
    ),
  )
  const isEmptyConversation = messages.length === 0 && !pendingQuestion

  return (
    <section className="dashboard-page">
      <PageHeading
        title="Chatbot"
        description="Trợ lý hỏi đáp về đề tài, nhiệm vụ, hạn nộp và quy định của đợt đồ án."
        status={isLoading ? 'Đang tải' : 'FAQ'}
      />
      {error && <p className="alert-error" role="alert">{error}</p>}
      {isLoading ? (
        <p role="status">Đang tải chatbot...</p>
      ) : (
        <div className="chatbot-layout">
          <aside className="workspace-panel chatbot-sidebar">
            <h2>Lịch sử hội thoại</h2>
            <button
              className="button-secondary"
              onClick={startNewConversation}
              type="button"
            >
              Hội thoại mới
            </button>
            <div className="field-control">
              <input
                aria-label="Tìm trong hội thoại"
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tìm trong hội thoại"
                type="search"
                value={searchText}
              />
            </div>
            {sessionGroups.length === 0 ? (
              <p className="muted">
                {sessions.length === 0
                  ? 'Chưa có hội thoại nào.'
                  : 'Không tìm thấy hội thoại phù hợp.'}
              </p>
            ) : (
              sessionGroups.map((group) => (
                <div className="chat-session-group" key={group.label}>
                  <p className="eyebrow">{group.label}</p>
                  <ul className="chat-session-list">
                    {group.items.map((session) => (
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
                </div>
              ))
            )}
          </aside>
          <section className="workspace-panel chat-panel">
            {isEmptyConversation ? (
              <div className="chat-empty">
                <h2>Chưa có hội thoại nào</h2>
                <p className="muted">
                  Hỏi trợ lý về đề tài, nhiệm vụ, hạn nộp hay quy định của đợt đồ án.
                  Trợ lý chỉ trả lời trong phạm vi dữ liệu bạn được phép xem.
                </p>
                <div className="chat-suggestions">
                  {suggestions.map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => sendQuestion(faq.question)}
                      type="button"
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
                <button
                  className="chat-start-button"
                  onClick={() => inputRef.current?.focus()}
                  type="button"
                >
                  Bắt đầu hội thoại
                </button>
              </div>
            ) : (
              <div className="chat-messages" aria-live="polite">
                <article className="chat-message from-assistant">
                  <p>{GREETING}</p>
                </article>
                {messages.map((message) => (
                  <article
                    className={`chat-message ${message.sender === 'user' ? 'from-user' : 'from-assistant'}`}
                    key={message.id}
                  >
                    <p>{message.content}</p>
                    <small>
                      {formatTime(message.createdAt)}
                      {message.sender !== 'user' && (
                        <button
                          className="chat-message-action"
                          onClick={() => handleCopy(message)}
                          type="button"
                        >
                          {copiedMessageId === message.id ? 'Đã sao chép' : 'Sao chép'}
                        </button>
                      )}
                    </small>
                  </article>
                ))}
                {pendingQuestion && (
                  <>
                    <article className="chat-message from-user">
                      <p>{pendingQuestion}</p>
                    </article>
                    <article
                      aria-label="Trợ lý đang trả lời"
                      className="chat-message from-assistant chat-typing"
                    >
                      <span />
                      <span />
                      <span />
                    </article>
                  </>
                )}
              </div>
            )}
            <form className="chat-form" onSubmit={handleSubmit}>
              {!isEmptyConversation && (
                <div className="chat-suggestions">
                  {suggestions.slice(0, 3).map((faq) => (
                    <button
                      disabled={Boolean(pendingQuestion)}
                      key={faq.id}
                      onClick={() => sendQuestion(faq.question)}
                      type="button"
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
              )}
              <label className="field-control">
                Câu hỏi
                <textarea
                  onChange={(event) => setContent(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu hỏi về đề tài, nhiệm vụ hoặc hạn nộp..."
                  ref={inputRef}
                  required
                  rows="2"
                  value={content}
                />
              </label>
              <button disabled={Boolean(pendingQuestion)} type="submit">
                {pendingQuestion ? 'Đang gửi...' : 'Gửi câu hỏi'}
              </button>
              <p className="chat-note">
                Nhấn Enter để gửi, Shift + Enter để xuống dòng. Trợ lý chỉ truy cập dữ liệu
                trong phạm vi quyền của bạn; thông tin quan trọng nên đối chiếu lại với
                giảng viên.
              </p>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default ChatbotPage
