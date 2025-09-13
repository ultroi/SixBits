import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, Sparkles, MessageSquare } from 'lucide-react';
import { chatService } from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';


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

  // Create userProfile from user data
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
      "Help me create a study plan",
      "Tell me about career opportunities"
    ]
    : [
      "Take me to the aptitude quiz",
      "Help me choose my stream",
      "Show me nearby colleges",
      "What skills should I learn?"
    ];

  useEffect(() => {
    const userName = user?.firstName || 'there';
    const quizResults = JSON.parse(localStorage.getItem('quizResults') || 'null');
    let initialMessage = `Hello ${userName}! I'm Zariya, your AI career counselor. `;

    if (quizResults && quizResults.interests && quizResults.strengths) {
      const interestsEntries = Object.entries(quizResults.interests);
      const strengthsEntries = Object.entries(quizResults.strengths);

      if (interestsEntries.length > 0 && strengthsEntries.length > 0) {
        const topInterest = interestsEntries.sort(([, a], [, b]) => b - a)[0];
        const topStrength = strengthsEntries.sort(([, a], [, b]) => b - a)[0];

        initialMessage += `Based on your profile (${user?.class || 'student'}, interested in ${user?.academicInterests ? user.academicInterests.join(', ') : 'various subjects'}) and quiz results, I see you're strong in ${topStrength[0]} and interested in ${topInterest[0]}. How can I help you with your career planning today?`;
      } else {
        initialMessage += `I see you're in ${user?.class || 'school'} and interested in ${user?.academicInterests ? user.academicInterests.join(', ') : 'various subjects'}. Have you taken our aptitude quiz yet? It will help me give you more personalized recommendations.`;
      }
    } else {
      initialMessage += `I see you're in ${user?.class || 'school'} and interested in ${user?.academicInterests ? user.academicInterests.join(', ') : 'various subjects'}. Have you taken our aptitude quiz yet? It will help me give you more personalized recommendations.`;
    }

    const initialThread = {
      id: Date.now().toString(),
      title: 'Career Consultation',
      messages: [
        {
          id: 1,
          content: initialMessage,
          sender: 'bot',
          timestamp: new Date()
        }
      ]
    };
    setThreads([initialThread]);
    setActiveThreadId(initialThread.id);
    setMessages(initialThread.messages);
  }, [user?.firstName, user?.class, user?.academicInterests]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auth and navigation
  // const navigate = useNavigate(); // Removed unused navigate

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

    try {
      // Call the actual AI service
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

      // Add error message from bot
      const errorMessage = {
        id: messages.length + 2,
        content: `I'm sorry, I'm having trouble processing your request right now. Please try again.`,
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
    const userName = user?.firstName || 'there';
    const quizResults = JSON.parse(localStorage.getItem('quizResults') || 'null');
    let welcomeMessage = `Hello ${userName}! Starting a new conversation. `;

    if (quizResults) {
      welcomeMessage += `I remember from your quiz that you're interested in ${user?.academicInterests ? user.academicInterests.join(', ') : 'various subjects'}. What would you like to discuss?`;
    } else {
      welcomeMessage += `How can I assist you with your career planning today?`;
    }

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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Zariya</h1>
              </button>
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold text-gray-900">AI Career Counselor</h2>
                <p className="text-sm text-gray-500">Get personalized career guidance</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={createNewThread}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>

              {threads.length > 1 && (
                <button
                  onClick={() => deleteThread(activeThreadId)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Chat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Chat History Selector */}
        {threads.length > 1 && (
          <div className="mb-4 flex-shrink-0">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Conversations</h3>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {threads.slice(0, 5).map(thread => (
                <button
                  key={thread.id}
                  onClick={() => {
                    setActiveThreadId(thread.id);
                    setMessages(thread.messages);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${thread.id === activeThreadId
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{thread.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 mb-4 relative">
            <div className="h-[70vh] overflow-y-auto p-6 space-y-4 chat-scroll" style={{scrollBehavior: 'smooth'}}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`max-w-lg ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className="flex items-end space-x-2">
                    {message.sender === 'bot' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${message.sender === 'user'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                          : 'bg-gray-50 text-gray-800 border border-gray-200'
                        }`}
                    >
                      <div className="markdown-content">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      <div className="flex items-center justify-end mt-2">
                        <span className={`text-xs ${message.sender === 'user' ? 'text-indigo-100' : 'text-gray-500'
                          }`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>

                    {message.sender === 'user' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white font-bold text-sm">{user.firstName && user.firstName.length > 0 ? user.firstName[0] : 'U'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Zariya is thinking</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-3 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Questions</h3>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => setInput(reply)}
                className="bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-200 hover:border-indigo-200 text-left whitespace-nowrap"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-200 p-4 flex-shrink-0">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-3 rounded-lg transition-all duration-200 ${!input.trim() || isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-3">
            Zariya AI provides personalized career guidance. Your conversations are private and secure.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: #6366F1 #F1F5F9;
        }

        .chat-scroll::-webkit-scrollbar {
          width: 12px;
        }

        .chat-scroll::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 6px;
          margin: 4px;
        }

        .chat-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #6366F1, #8B5CF6);
          border-radius: 6px;
          border: 2px solid #F1F5F9;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #4F46E5, #7C3AED);
          transform: scale(1.1);
        }

        .chat-scroll::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, #3730A3, #581C87);
        }

        .chat-scroll::-webkit-scrollbar-corner {
          background: #F1F5F9;
        }

        .markdown-content {
          line-height: 1.6;
        }

        .markdown-content p {
          margin-bottom: 0.5rem;
        }

        .markdown-content p:last-child {
          margin-bottom: 0;
        }

        .markdown-content strong,
        .markdown-content b {
          font-weight: 600;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .markdown-content li {
          margin-bottom: 0.25rem;
        }

        .markdown-content li:last-child {
          margin-bottom: 0;
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          font-weight: 600;
          margin: 0.5rem 0 0.25rem 0;
          line-height: 1.3;
        }

        .markdown-content h1 {
          font-size: 1.1em;
        }

        .markdown-content h2 {
          font-size: 1em;
        }

        .markdown-content h3 {
          font-size: 0.95em;
        }

        .markdown-content blockquote {
          border-left: 3px solid #6366F1;
          padding-left: 0.75rem;
          margin: 0.5rem 0;
          font-style: italic;
          color: #4B5563;
        }

        .markdown-content code {
          background-color: rgba(99, 102, 241, 0.1);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875em;
        }

        .markdown-content pre {
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 0.375rem;
          padding: 0.75rem;
          margin: 0.5rem 0;
          overflow-x: auto;
          font-size: 0.875em;
        }

        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
