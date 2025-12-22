import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, ExternalLink, User, Mail, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { getSupabaseClient } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant' | 'agent';
  content: string;
  sources?: Array<{ articleId: string; url: string; title: string }>;
  confidence?: number;
  requiresHuman?: boolean;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [showUserInfoForm, setShowUserInfoForm] = useState(false);
  const [showHandoffForm, setShowHandoffForm] = useState(false);
  const [pendingHandoff, setPendingHandoff] = useState<{ sessionId: string; reason: string; confidence: number } | null>(null);
  const [handoffStatus, setHandoffStatus] = useState<{ success: boolean; ticketNumber?: string; message: string } | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<any>(null);
  const [handoffTicketId, setHandoffTicketId] = useState<string | null>(null);
  const [hasChosenQuickOption, setHasChosenQuickOption] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick options are sourced from the FAQ questions in `chat-bot/docs`
  const QUICK_OPTIONS: Array<{ label: string; message: string }> = [
    { label: 'AI & Technology', message: 'What AI technology does Siftly use to process email?' },
    { label: 'Privacy', message: 'Is my email data uploaded to Siftly or DeepSeek servers?' },
    { label: 'Summarization', message: 'How do I enable email summarization?' },
    { label: 'Classification', message: 'Can I create custom email classification labels?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Supabase client (prefers build-time VITE_*, falls back to /api/public-config at runtime)
  useEffect(() => {
    let cancelled = false;
    getSupabaseClient().then((client) => {
      if (cancelled) return;
      setSupabaseClient(client);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // If user already has an existing handoff ticket/session (e.g. after refresh),
  // automatically re-enable realtime so agent replies show up in the widget.
  useEffect(() => {
    if (!supabaseClient) return;
    if (!sessionId) return;
    if (!handoffTicketId) return;
    setIsRealtimeEnabled(true);
  }, [supabaseClient, sessionId, handoffTicketId]);

  // Restore session/handoff state so user doesn't see the ticket UI again after first creation.
  useEffect(() => {
    try {
      const storedSessionId = localStorage.getItem('siftly_chat_session_id');
      const storedTicketId = localStorage.getItem('siftly_handoff_ticket_id');
      const storedChosen = localStorage.getItem('siftly_chosen_quick_option');

      if (storedSessionId && !sessionId) setSessionId(storedSessionId);
      if (storedTicketId && !handoffTicketId) setHandoffTicketId(storedTicketId);
      if (storedChosen === '1') setHasChosenQuickOption(true);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (sessionId) localStorage.setItem('siftly_chat_session_id', sessionId);
    } catch {
      // ignore
    }
  }, [sessionId]);

  useEffect(() => {
    try {
      if (handoffTicketId) localStorage.setItem('siftly_handoff_ticket_id', handoffTicketId);
    } catch {
      // ignore
    }
  }, [handoffTicketId]);

  useEffect(() => {
    try {
      localStorage.setItem('siftly_chosen_quick_option', hasChosenQuickOption ? '1' : '0');
    } catch {
      // ignore
    }
  }, [hasChosenQuickOption]);

  // Subscribe to agent messages in realtime after successful handoff
  useEffect(() => {
    if (!isRealtimeEnabled) return;
    if (!sessionId) return;
    const s = supabaseClient;
    if (!s) return;

    const channel = s
      .channel(`handoff:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'handoff_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: { content?: unknown } }) => {
          const row: any = payload.new;
          const content = typeof row?.content === 'string' ? row.content : '';
          if (!content) return;

          setMessages((prev) => [...prev, { role: 'agent', content }]);
        }
      )
      .subscribe();

    return () => {
      s.removeChannel(channel);
    };
  }, [isRealtimeEnabled, sessionId, supabaseClient]);

  const isInHandoffMode = Boolean(handoffTicketId);

  const resetChat = () => {
    try {
      localStorage.removeItem('siftly_chat_session_id');
      localStorage.removeItem('siftly_handoff_ticket_id');
      localStorage.removeItem('siftly_chosen_quick_option');
    } catch {
      // ignore
    }

    setMessages([]);
    setInput('');
    setIsLoading(false);
    setSessionId(null);
    setUserName('');
    setUserEmail('');
    setShowUserInfoForm(false);
    setShowHandoffForm(false);
    setPendingHandoff(null);
    setHandoffStatus(null);
    setIsCreatingTicket(false);
    setIsRealtimeEnabled(false);
    setHandoffTicketId(null);
    setHasChosenQuickOption(false);
  };

  const sendQuickOption = async (message: string) => {
    if (isLoading) return;
    setHasChosenQuickOption(true);
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        confidence: data.confidence,
        requiresHuman: data.requiresHuman,
      }]);

      // If backend still requests handoff, fall back to current handoff flow
      if (data.requiresHuman && data.sessionId) {
        setPendingHandoff({
          sessionId: data.sessionId,
          reason: data.confidence < 0.6
            ? `Low Confidence - ${Math.round(data.confidence * 100)}%`
            : 'User requested human',
          confidence: data.confidence || 0,
        });
        setShowHandoffForm(true);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I can't connect to the server right now. (${error.message || 'Unknown error'})`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // If we're already in handoff mode, send messages directly to Zoho ticket (no more ticket UI).
      if (isInHandoffMode && sessionId) {
        const response = await fetch('/api/chat/handoff/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            ticketId: handoffTicketId,
            content: userMessage,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (data && data.ok === false) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.needsZohoReauth
              ? '⚠️ Unable to send your message into Zoho ticket (missing Zoho OAuth scope for UPDATE/REPLY). Please re-generate `ZOHO_REFRESH_TOKEN` with `Desk.tickets.UPDATE` or `Desk.tickets.ALL`, then restart `chat-bot`.'
              : `⚠️ Sent locally, but failed to forward to Zoho: ${String(data.error || 'unknown error')}`,
          }]);
        }

        setIsLoading(false);
        return;
      }

      // New behavior: if user didn't choose a quick option and typed a custom question, trigger handoff.
      if (!hasChosenQuickOption) {
        // Create session + save first user message for context, then ask for contact info (one-time)
        const sessionRes = await fetch('/api/chat/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            userName: userName.trim() || undefined,
            userEmail: userEmail.trim() || undefined,
          }),
        });

        if (!sessionRes.ok) {
          throw new Error(`HTTP error! status: ${sessionRes.status}`);
        }

        const sessionData = await sessionRes.json();
        if (sessionData.sessionId) {
          setSessionId(sessionData.sessionId);
          setPendingHandoff({
            sessionId: sessionData.sessionId,
            reason: 'User asked a custom question',
            confidence: 0,
          });
          setShowHandoffForm(true);
          setIsLoading(false);
          return;
        }
      }

      // Assuming chat-bot server is running on localhost:3000
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        confidence: data.confidence,
        requiresHuman: data.requiresHuman,
      }]);

      // Check if handoff is required
      if (data.requiresHuman && data.sessionId) {
        setPendingHandoff({
          sessionId: data.sessionId,
          reason: data.confidence < 0.6 
            ? `Low Confidence - ${Math.round(data.confidence * 100)}%`
            : 'User requested human',
          confidence: data.confidence || 0,
        });
        setShowHandoffForm(true);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I can't connect to the server right now. (${error.message || 'Unknown error'})`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCreateHandoffTicket = async () => {
    if (!pendingHandoff || !userName.trim() || !userEmail.trim()) {
      return;
    }

    // Validate email format
    if (!validateEmail(userEmail.trim())) {
      setHandoffStatus({
        success: false,
        message: 'Please enter a valid email address',
      });
      return;
    }

    setIsCreatingTicket(true);
    setHandoffStatus(null);

    try {
      const response = await fetch('/api/chat/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: pendingHandoff.sessionId,
          userName: userName.trim(),
          userEmail: userEmail.trim(),
          handoffReason: pendingHandoff.reason,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setHandoffStatus({
          success: true,
          ticketNumber: data.ticketNumber,
          message: data.message || 'Ticket created successfully',
        });
        setShowHandoffForm(false);
        setHandoffTicketId(data.ticketId || null);
        setPendingHandoff(null);

        // Enable realtime silently (no extra chat messages).
        if (supabaseClient) setIsRealtimeEnabled(true);
        
        // Add a single success message to chat
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `A support agent will contact you via email ${userEmail.trim()} as soon as possible.`,
        }]);
      } else {
        throw new Error(data.error || 'Failed to create ticket');
      }
    } catch (error: any) {
      console.error('Handoff error:', error);
      setHandoffStatus({
        success: false,
        message: error.message || 'An error occurred while creating the ticket. Please try again later.',
      });
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSkipHandoff = () => {
    setShowHandoffForm(false);
    setPendingHandoff(null);
    setHandoffStatus(null);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 w-[380px] h-[600px] bg-white dark:bg-zinc-900 rounded-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900 bg-[linear-gradient(90deg,rgba(51,255,249,1)_0%,rgba(39,180,222,1)_25%,rgba(22,69,181,1)_100%)] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-bold text-lg text-black">Siftly Assistant</h3>
                <p className="text-xs text-zinc-500">Ask me anything about Siftly</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Reset chat"
                  title="Reset chat"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close chat"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900/50">
              {messages.length === 0 && (
                <div className="text-center text-zinc-500 dark:text-zinc-400 mt-20">
                  <div className="bg-zinc-100 dark:bg-zinc-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={24} />
                  </div>
                  <p className="text-sm">Hi! How can I help you today?</p>

                  {!hasChosenQuickOption && !isInHandoffMode && (
                    <div className="mt-4 flex flex-col gap-2">
                      {QUICK_OPTIONS.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => sendQuickOption(opt.message)}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                        >
                          {opt.label}
                        </button>
                      ))}
                      <p className="text-xs text-zinc-400 mt-2">
                        Tip: choose an option above for instant answers, or type your own question to talk to a human.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : msg.role === 'agent'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-zinc-900 dark:text-zinc-100 border border-emerald-200 dark:border-emerald-800 rounded-bl-none shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className={msg.role === 'user' ? 'markdown-user' : 'markdown-assistant'}>
                      {msg.role === 'agent' && (
                        <div className="mb-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          Support agent
                        </div>
                      )}
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                          strong: ({ children }) => (
                            <strong className={`font-semibold ${msg.role === 'user' ? 'text-white' : ''}`}>
                              {children}
                            </strong>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`hover:underline ${
                                msg.role === 'user'
                                  ? 'text-blue-200 hover:text-white'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {children}
                            </a>
                          ),
                          ul: ({ children }) => (
                            <ul className={`list-disc list-inside my-2 space-y-1 ${msg.role === 'user' ? 'text-white' : ''}`}>
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className={`list-decimal list-inside my-2 space-y-1 ${msg.role === 'user' ? 'text-white' : ''}`}>
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => <li className="ml-4">{children}</li>,
                          h1: ({ children }) => (
                            <h1 className={`text-lg font-bold mb-2 mt-3 first:mt-0 ${msg.role === 'user' ? 'text-white' : ''}`}>
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className={`text-base font-bold mb-2 mt-3 first:mt-0 ${msg.role === 'user' ? 'text-white' : ''}`}>
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className={`text-sm font-bold mb-2 mt-3 first:mt-0 ${msg.role === 'user' ? 'text-white' : ''}`}>
                              {children}
                            </h3>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {msg.requiresHuman && (
                      <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                          <AlertCircle size={12} />
                          <span className="font-medium">Needs human support</span>
                        </div>
                      </div>
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                        <p className="text-xs font-medium text-zinc-500 mb-1">Sources:</p>
                        <div className="space-y-1">
                          {msg.sources.map((source, i) => (
                            <a
                              key={i}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <ExternalLink size={10} />
                              <span className="truncate">{source.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-bl-none border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Handoff Form */}
            <AnimatePresence>
              {showHandoffForm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800"
                >
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
                      Connect with Support Agent
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Please provide your information so we can contact you
                    </p>
                  </div>

                  {handoffStatus && !handoffStatus.success && (
                    <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                        <AlertCircle size={14} />
                        <span>{handoffStatus.message}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mb-3">
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Your name"
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-zinc-900 dark:text-white placeholder-zinc-500"
                        disabled={isCreatingTicket}
                      />
                    </div>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => {
                          setUserEmail(e.target.value);
                          // Clear error when user types
                          if (handoffStatus && !handoffStatus.success) {
                            setHandoffStatus(null);
                          }
                        }}
                        placeholder="Your email"
                        className={`w-full pl-10 pr-3 py-2 bg-white dark:bg-zinc-800 border rounded-lg focus:outline-none focus:ring-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 ${
                          handoffStatus && !handoffStatus.success && handoffStatus.message.includes('email')
                            ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                            : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'
                        }`}
                        disabled={isCreatingTicket}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateHandoffTicket}
                      disabled={isCreatingTicket || !userName.trim() || !userEmail.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      {isCreatingTicket ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Creating ticket...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          <span>Create support ticket</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSkipHandoff}
                      disabled={isCreatingTicket}
                      className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 transition-colors text-sm"
                    >
                      Skip
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="w-full pl-4 pr-12 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-zinc-900 dark:text-white placeholder-zinc-500"
                  disabled={isLoading || showHandoffForm}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim() || showHandoffForm}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[linear-gradient(90deg,rgba(51,255,249,1)_0%,rgba(39,180,222,1)_25%,rgba(22,69,181,1)_100%)] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-transparent rounded-full flex items-center justify-center z-40"
          aria-label="Toggle chat"
        >
          <img src="/figmaAssets/contact.png" alt="Contact" className="w-14 h-14" />
        </motion.button>
      )}
    </>
  );
}
