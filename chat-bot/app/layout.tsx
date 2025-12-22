import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Siftly RAG Chatbot',
  description: 'RAG chatbot with Supabase and DeepSeek',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

