import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Trash2, Sparkles, MessageSquare, Paperclip, User, Bot, Square } from 'lucide-react';
import { chatService } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = () => {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isApiOnline, setIsApiOnline] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate();

  const activeThread = threads.find((thread) => thread.id === activeThreadId);

  const formatThreadDate = (date) => {
    const today = new Date();
    const target = new Date(date);
    const isSameDay =
      today.getFullYear() === target.getFullYear() &&
      today.getMonth() === target.getMonth() &&
      today.getDate() === target.getDate();

    return isSameDay ? 'Today' : 'Previous chats';
  };

  const groupedThreads = threads.reduce(
    (accumulator, thread) => {
      const timestamp = thread.messages?.[0]?.timestamp || new Date();
      const groupName = formatThreadDate(timestamp);
      accumulator[groupName].push(thread);
      return accumulator;
    },
    { Today: [], 'Previous chats': [] }
  );

  const messageMotion = {
    hidden: { opacity: 0, y: 10, scale: 0.99 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  };

  useEffect(() => {
    const welcomeMessageContent =
      "**👋 Welcome to Zariya Career Counseling Platform**\n\nExplore educational pathways, discover suitable colleges, and plan your career journey with AI-powered guidance. Ask questions or use the quick prompts below to get started.";

    const initialThread = {
      id: Date.now().toString(),
      title: 'Career Consultation',
      messages: [
        {
          id: 1,
          content: welcomeMessageContent,
          sender: 'bot',
          timestamp: new Date()
        }
      ]
    };
    setThreads([initialThread]);
    setActiveThreadId(initialThread.id);
    setMessages(initialThread.messages);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      content: input,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await chatService.sendMessage(input || userMessage.content, abortControllerRef.current.signal);
      setIsApiOnline(true);

      const botMessage = {
        id: messages.length + 2,
        content: response.message,
        sender: 'bot',
        timestamp: new Date(),
        status: 'delivered'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        console.log('Request was cancelled by user');
        return;
      }

      console.error('Chat error:', error);
      setIsApiOnline(false);

      const errorMessage = {
        id: messages.length + 2,
        content: `⚠️ Sorry, I’m having trouble right now. Please try again.`,
        sender: 'bot',
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const createNewThread = () => {
    const welcomeMessage =
      "**👋 Welcome to Zariya Career Counseling Platform**\n\nAsk questions or use the quick prompts below to get started.";

    const newThread = {
      id: Date.now().toString(),
      title: `Chat ${threads.length + 1}`,
      messages: [
        {
          id: 1,
          content: welcomeMessage,
          sender: 'bot',
          timestamp: new Date()
        }
      ]
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setMessages(newThread.messages);
  };

  const deleteThread = (threadId) => {
    if (threads.length === 1) {
      toast.error('Cannot delete the last conversation');
      return;
    }
    const updatedThreads = threads.filter(t => t.id !== threadId);
    setThreads(updatedThreads);
    if (threadId === activeThreadId) {
      const newActiveThread = updatedThreads[0];
      setActiveThreadId(newActiveThread.id);
      setMessages(newActiveThread.messages);

    }
    toast.success('Conversation deleted');
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#F8FAFC] text-[#111827] font-sans">
      <aside className="hidden w-[280px] shrink-0 border-r border-[#ECECF3] bg-[#FAFAFC] lg:flex lg:flex-col">
        <div className="border-b border-[#ECECF3] px-5 py-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D5EF8] to-[#8B5CF6] shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6D5EF8]">Zariya</p>
              <h1 className="text-[15px] font-semibold text-[#111827]">AI Career Counselor</h1>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={createNewThread}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6D5EF8] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#5f52f0] hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-5">
            {Object.entries(groupedThreads).map(([label, groupThreads]) =>
              groupThreads.length > 0 ? (
                <div key={label}>
                  <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]">{label}</p>
                  <div className="space-y-1">
                    {groupThreads.map((thread) => {
                      const isActive = thread.id === activeThreadId;
                      return (
                        <div
                          key={thread.id}
                          className={`group flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-all duration-200 ${
                            isActive ? 'bg-[#F3F0FF] shadow-sm' : 'hover:bg-white hover:shadow-sm'
                          }`}
                        >
                          <button
                            onClick={() => {
                              setActiveThreadId(thread.id);
                              setMessages(thread.messages);
                            }}
                            className={`flex min-w-0 flex-1 items-center gap-3 text-left ${
                              isActive ? 'text-[#5B4CF4]' : 'text-[#374151]'
                            }`}
                          >
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? 'bg-white text-[#6D5EF8]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{thread.title}</p>
                              <p className="truncate text-[12px] text-[#6B7280]">{thread.messages?.length || 0} messages</p>
                            </div>
                          </button>

                          {threads.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteThread(thread.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-[#9CA3AF] opacity-0 transition-all duration-200 hover:bg-white hover:text-[#EF4444] group-hover:opacity-100"
                              aria-label={`Delete ${thread.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>

      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
        <header className="sticky top-0 z-20 border-b border-[#ECECF3] bg-white/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-[#374151] lg:hidden"
              >
                <Sparkles className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-[#111827] sm:text-lg">
                  {activeThread?.title || 'How can Zariya help you today?'}
                </h2>
                <p className="hidden text-sm text-[#6B7280] sm:block">Personalized career guidance</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#374151] sm:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-[#6D5EF8]" />
                Zariya AI
              </div>
              <div
                className={`hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium sm:flex ${
                  isApiOnline
                    ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border border-rose-100 bg-rose-50 text-rose-700'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${isApiOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isApiOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="mx-auto flex w-full max-w-[850px] min-h-0 flex-1 flex-col px-4 pb-[150px] pt-6 sm:px-6 lg:px-0">
            <div className="flex-1 overflow-y-auto chat-scroll">
              <AnimatePresence mode="popLayout">
                {messages.length === 1 && messages[0]?.id === 1 && !messages.some((message) => message.sender === 'user') ? (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    className="flex min-h-[calc(100vh-220px)] flex-col items-center justify-center px-4 text-center"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#E5E7EB] bg-white shadow-sm">
                      <Sparkles className="h-10 w-10 text-[#6D5EF8]" />
                    </div>
                    <h2 className="mt-6 text-[32px] font-bold tracking-tight text-[#111827]">How can Zariya help you today?</h2>
                    <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[#6B7280]">
                      Get personalized career guidance, college recommendations, and study planning support.
                    </p>


                  </motion.div>
                ) : (
                  <div className="space-y-4 py-2">
                    {messages.map((message, index) => {
                      if (message.id === 1 && message.sender === 'bot' && messages.some((m) => m.sender === 'user')) {
                        return null;
                      }

                      const isUser = message.sender === 'user';
                      const isWelcome = message.id === 1;

                      return (
                        <motion.div
                          key={message.id}
                          variants={messageMotion}
                          initial="hidden"
                          animate="show"
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isWelcome ? 'justify-center' : ''}`}
                        >
                          <div className={`flex max-w-[92%] items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isWelcome ? 'max-w-3xl flex-col items-center' : ''}`}>
                            {!isUser && !isWelcome && (
                              <div className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5EF8] to-[#8B5CF6] text-white shadow-sm">
                                <Bot className="h-5 w-5" />
                              </div>
                            )}

                            <div className={`${isWelcome ? 'w-full text-center' : 'w-full max-w-[760px]'}`}>
                              {!isWelcome && (
                                <div className={`mb-1 flex items-center gap-2 text-[13px] text-[#6B7280] ${isUser ? 'justify-end' : 'justify-start'}`}>
                                  <span className="font-medium text-[#111827]">{isUser ? 'You' : 'Zariya'}</span>
                                  <span>•</span>
                                  <span>{formatTime(message.timestamp)}</span>
                                </div>
                              )}

                              <div
                                className={`rounded-[20px] px-5 py-4 text-[16px] leading-7 shadow-sm ${
                                  isUser
                                    ? 'bg-gradient-to-r from-[#6D5EF8] to-[#8B5CF6] text-white shadow-[0_10px_25px_rgba(109,94,248,0.18)]'
                                    : isWelcome
                                    ? 'border border-[#E5E7EB] bg-white text-[#111827] shadow-sm'
                                    : 'border border-[#E5E7EB] bg-white text-[#111827] shadow-[0_6px_20px_rgba(0,0,0,0.04)]'
                                }`}
                              >
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({ children }) => <h1 className="mb-3 text-2xl font-bold text-[#111827]">{children}</h1>,
                                    h2: ({ children }) => <h2 className="mb-2 text-xl font-semibold text-[#111827]">{children}</h2>,
                                    h3: ({ children }) => <h3 className="mb-2 text-lg font-semibold text-[#111827]">{children}</h3>,
                                    p: ({ children }) => <p className="mb-3 leading-7 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="leading-7">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold text-[#111827]">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-[#5B4CF4]">{children}</em>,
                                    code: ({ children }) => <code className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[13px]">{children}</code>,
                                    pre: ({ children }) => <pre className="mb-3 overflow-x-auto rounded-2xl bg-[#F8FAFC] p-4 text-[13px]">{children}</pre>,
                                    blockquote: ({ children }) => <blockquote className="mb-3 border-l-4 border-[#C4B5FD] pl-4 italic text-[#6B7280]">{children}</blockquote>,
                                    a: ({ children, href }) => (
                                      <a href={href} className="text-[#6D5EF8] underline underline-offset-2" target="_blank" rel="noopener noreferrer">
                                        {children}
                                      </a>
                                    ),
                                    table: ({ children }) => <div className="mb-3 overflow-x-auto"><table className="min-w-full border-collapse border border-[#E5E7EB]">{children}</table></div>,
                                    th: ({ children }) => <th className="border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-left font-semibold">{children}</th>,
                                    td: ({ children }) => <td className="border border-[#E5E7EB] px-3 py-2">{children}</td>,
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>

                                <div className={`mt-3 text-[12px] ${isUser ? 'text-white/70' : 'text-[#9CA3AF]'} ${isWelcome ? 'text-center' : 'text-right'}`}>
                                  {formatTime(message.timestamp)}
                                </div>
                              </div>
                            </div>

                            {isUser && (
                              <div className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#6D5EF8] shadow-sm ring-1 ring-[#E5E7EB]">
                                <User className="h-4.5 w-4.5" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-start"
                      >
                        <div className="flex items-end gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6D5EF8] to-[#8B5CF6] text-white shadow-sm">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                              <span>Zariya is analyzing...</span>
                              <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#6D5EF8] [animation-delay:0ms]" />
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#6D5EF8] [animation-delay:150ms]" />
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#6D5EF8] [animation-delay:300ms]" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </AnimatePresence>
            </div>
          </div>



          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-2 sm:px-6 sm:pb-3">
            <div className="mx-auto max-w-[850px]">
              <motion.div
                initial={{ y: 8, opacity: 0.98 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-end gap-2 p-2 sm:p-3">
                  <button
                    type="button"
                    className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#FAFAFC] text-[#6B7280] transition-colors hover:bg-white sm:flex"
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about careers, colleges, exams, scholarships..."
                    className="flex-1 resize-none border-0 bg-transparent px-1 py-1 text-[15px] leading-6 text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:ring-0 max-h-48 overflow-hidden"
                    rows="1"
                  />

                  <button
                    onClick={isLoading ? handleStop : handleSend}
                    disabled={!input.trim() && !isLoading}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
                      (!input.trim() && !isLoading)
                        ? 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                        : 'bg-gradient-to-r from-[#6D5EF8] to-[#8B5CF6] text-white shadow-[0_10px_20px_rgba(109,94,248,0.22)] hover:shadow-[0_12px_28px_rgba(109,94,248,0.28)]'
                    }`}
                  >
                    {isLoading ? (
                      <Square className="h-4.5 w-4.5 fill-current" />
                    ) : (
                      <Send className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>

                <div className="px-3 pb-2 sm:px-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#6B7280]">
                    <span>Press Enter to send • Shift + Enter for a new line</span>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] px-3 py-1 text-[#6B7280]">
                      <Sparkles className="h-3.5 w-3.5 text-[#6D5EF8]" />
                      Zariya AI Career Counselor
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatInterface;
