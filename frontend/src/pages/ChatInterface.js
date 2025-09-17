import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, Sparkles, MessageSquare } from 'lucide-react';
import { chatService } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  // user profile
  const userProfile = {
    age: user?.age,
    gender: user?.gender,
    class: user?.class,
    academicInterests: user?.academicInterests,
    quizResults: JSON.parse(localStorage.getItem('quizResults') || 'null')
  };

  const quickReplies = userProfile.quizResults
    ? [
        "Show me courses based on my quiz results",
        "What colleges should I consider?",
        "Help me create a study plan"
      ]
    : [
        "Take me to the aptitude quiz",
        "Help me choose my stream",
        "Show me nearby colleges"
      ];

  const [showQuickReplies, setShowQuickReplies] = useState(true);

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
    setShowQuickReplies(false);

    try {
      const response = await chatService.sendMessage(input);

      const botMessage = {
        id: messages.length + 2,
        content: response.message,
        sender: 'bot',
        timestamp: new Date(),
        status: 'delivered'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);

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
    setShowQuickReplies(true);
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
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col overflow-hidden font-sans">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-20 backdrop-blur-md bg-white/70 border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-14">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Zariya
            </h1>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={createNewThread}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>

            {threads.length > 1 && (
              <button
                onClick={() => deleteThread(activeThreadId)}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col mt-14 px-4 pb-4">
        {/* Thread Selector */}
        {threads.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {threads.slice(0, 5).map((thread) => (
              <button
                key={thread.id}
                onClick={() => {
                  setActiveThreadId(thread.id);
                  setMessages(thread.messages);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  thread.id === activeThreadId
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                {thread.title}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 relative">
          <div className="h-[calc(100vh-230px)] overflow-y-auto p-6 space-y-5 chat-scroll">
            {messages.map((message) => {
              // Skip welcome message if user has sent a message
              if (message.id === 1 && message.sender === 'bot' && messages.some(m => m.sender === 'user')) {
                return null;
              }
              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user'
                      ? 'justify-end'
                      : message.id === 1
                      ? 'justify-center'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-lg ${
                      message.id === 1 ? 'text-center' : ''
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm transition-all ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                          : message.id === 1
                          ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 text-gray-800 px-6 py-5 font-medium'
                          : 'bg-gray-50 border border-gray-200 text-gray-800'
                      }`}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Custom styling for headings
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 text-indigo-700">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 text-indigo-600">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-medium mb-1 mt-2 text-indigo-500">{children}</h3>,
                          
                          // Custom styling for paragraphs
                          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                          
                          // Custom styling for lists
                          ul: ({ children }) => <ul className="mb-2 ml-4 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                          
                          // Custom styling for strong/bold
                          strong: ({ children }) => <strong className="font-bold text-indigo-700">{children}</strong>,
                          
                          // Custom styling for emphasis/italic
                          em: ({ children }) => <em className="italic text-indigo-600">{children}</em>,
                          
                          // Custom styling for code
                          code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                          
                          // Custom styling for code blocks
                          pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded-lg mb-2 overflow-x-auto text-xs">{children}</pre>,
                          
                          // Custom styling for blockquotes
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-300 pl-4 italic text-gray-600 mb-2">{children}</blockquote>,
                          
                          // Custom styling for links
                          a: ({ children, href }) => <a href={href} className="text-indigo-600 hover:text-indigo-800 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                          
                          // Custom styling for tables
                          table: ({ children }) => <div className="overflow-x-auto mb-2"><table className="min-w-full border-collapse border border-gray-300">{children}</table></div>,
                          th: ({ children }) => <th className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-left">{children}</th>,
                          td: ({ children }) => <td className="border border-gray-300 px-2 py-1">{children}</td>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      <div className="flex justify-end mt-2 text-xs text-gray-400">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-600 flex gap-2 items-center">
                  <span>Zariya is thinking</span>
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="mt-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Questions</h3>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(reply);
                    setTimeout(() => handleSend(), 10);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="mt-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl shadow-md p-3 flex items-end gap-3 sticky bottom-0">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none bg-transparent border-0 focus:ring-0 outline-none px-2 py-2 text-sm max-h-48 overflow-hidden"
            rows="1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-lg ${
              !input.trim() || isLoading
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 shadow-md text-white'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
