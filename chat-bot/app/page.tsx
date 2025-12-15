'use client'

import { useState } from 'react'
import styles from './page.module.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ articleId: string; url: string; title: string }>
  confidence?: number
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Save session ID
      if (data.sessionId) {
        setSessionId(data.sessionId)
      }

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        confidence: data.confidence,
      }])

      // Show warnings if needed
      if (data.requiresHuman) {
        console.warn('⚠️ Low confidence - requires human support')
      }
      if (data.clarificationNeeded) {
        console.warn('⚠️ Clarification needed')
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Lỗi: ${error.message || 'Không thể kết nối đến server'}`,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Siftly RAG Chatbot</h1>
          <p>Hỏi đáp về Siftly với AI</p>
        </div>
      </header>

      {/* Messages */}
      <main className={styles.main}>
        {messages.length === 0 && (
          <div className={styles.welcome}>
            <p>Chào mừng đến với Siftly Chatbot!</p>
            <p>Hãy đặt câu hỏi về các tính năng của Siftly</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${styles.messageWrapper} ${
              msg.role === 'user' ? styles.userMessage : styles.assistantMessage
            }`}
          >
            <div
              className={`${styles.message} ${
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble
              }`}
            >
              <div className={styles.messageContent}>{msg.content}</div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className={styles.sources}>
                  <p className={styles.sourcesTitle}>Nguồn tham khảo:</p>
                  <ul>
                    {msg.sources.map((source, i) => (
                      <li key={i}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {msg.confidence !== undefined && (
                <div className={styles.confidence}>
                  Confidence: {(msg.confidence * 100).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.loadingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </main>

      {/* Input */}
      <footer className={styles.footer}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Nhập câu hỏi của bạn..."
            disabled={isLoading}
            className={styles.input}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={styles.button}
          >
            {isLoading ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
      </footer>
    </div>
  )
}

