import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Siftly RAG Chatbot',
  description: 'RAG Chatbot với Supabase và DeepSeek AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}

