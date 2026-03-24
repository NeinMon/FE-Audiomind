import { useState } from 'react'

type Message = {
  role: 'assistant' | 'user'
  text: string
}

type AiAssistantProps = {
  busy?: boolean
  meetingId?: number | null
  onAsk: (message: string) => Promise<string>
}

const initialMessages: Message[] = [
  {
    role: 'assistant',
    text: 'Xin chào! Tôi là trợ lý học tập của bạn. Bạn muốn tìm hiểu phần nào?',
  },
]

export default function AiAssistant({ busy, meetingId, onAsk }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    const message = input.trim()
    if (!message || sending) return

    setInput('')
    setSending(true)

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: message },
      { role: 'assistant', text: 'Đang xử lý...' },
    ])

    try {
      const response = await onAsk(message)
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', text: response }
        return next
      })
    } catch (error) {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          text: 'Xin lỗi, tôi chưa thể xử lý yêu cầu này.',
        }
        return next
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="assistant">
      <div className="assistant__header">
        <span className="assistant__icon">🤖</span>
        <h2>Trợ lý bài giảng AI</h2>
        <span className="assistant__pill">Meeting ID: {meetingId ?? '--'}</span>
      </div>

      <div className="assistant__messages">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`chat-bubble chat-bubble--${msg.role}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="assistant__preview">
        <div className="mindmap">
          <div className="mindmap__canvas">
            <svg
              className="mindmap__lines"
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M50 10 L25 28 L12 46" />
              <path d="M50 10 L25 28 L28 48" />
              <path d="M50 10 L75 28 L70 44" />
              <path d="M50 10 L75 28 L88 46" />
            </svg>

            <div className="mindmap__node mindmap__node--root">Đồ án môn học</div>
            <div className="mindmap__node mindmap__node--left">Tổng quan</div>
            <div className="mindmap__node mindmap__node--left-bottom">Ví dụ</div>
            <div className="mindmap__node mindmap__node--right">Quy trình</div>
            <div className="mindmap__node mindmap__node--right-bottom">Kết luận</div>
          </div>
        </div>
        <div className="chat-bubble chat-bubble--assistant">
          Nếu bạn muốn, mình có thể vẽ sơ đồ đẹp hơn để đặt vào slide hoặc website.
        </div>
      </div>

      <div className="assistant__input">
        <input
          type="text"
          placeholder="Hỏi bất kỳ..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSend()
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={busy || sending}
        >
          Gửi
        </button>
      </div>
    </section>
  )
}
