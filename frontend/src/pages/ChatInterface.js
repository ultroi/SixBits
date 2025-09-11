import React, { useState, useEffect, useRef } from 'react';
import { Send, LogOut, Plus, Search, Trash2, Copy, RefreshCw, ThumbsUp, ThumbsDown, Download, Menu, X, Sparkles, MessageSquare, Settings, History, Star, Moon, Sun, Smile } from 'lucide-react';
import { chatService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const user = { firstName: 'Akshay', lastName: 'Singh', _id: '123' };
const userProfile = {
  age: 18,
  gender: 'Male',
  class: '12th',
  academicInterests: ['Science', 'Engineering'],
  quizResults: JSON.parse(localStorage.getItem('quizResults') || 'null')
};

const ChatInterface = () => {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  const emojis = ['😊', '👍', '💡', '🎯', '🚀', '💪', '✨', '🎉'];

  useEffect(() => {
    let initialMessage = `Hello ${user.firstName}! I'm Zariya, your AI career counselor. `;

    if (userProfile.quizResults) {
      const topInterest = Object.entries(userProfile.quizResults.interests).sort(([,a], [,b]) => b - a)[0];
      const topStrength = Object.entries(userProfile.quizResults.strengths).sort(([,a], [,b]) => b - a)[0];

      initialMessage += `Based on your profile (${userProfile.class}, interested in ${userProfile.academicInterests.join(', ')}) and quiz results, I see you're strong in ${topStrength[0]} and interested in ${topInterest[0]}. How can I help you with your career planning today?`;
    } else {
      initialMessage += `I see you're in ${userProfile.class} and interested in ${userProfile.academicInterests.join(', ')}. Have you taken our aptitude quiz yet? It will help me give you more personalized recommendations.`;
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
  }, [user.firstName, userProfile.academicInterests, userProfile.class, userProfile.quizResults]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync dark mode class on the html element so Tailwind `dark:` utilities work globally
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth and navigation
  const { logout } = useAuth();
  const navigate = useNavigate();

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
    let welcomeMessage = `Hello ${user.firstName}! Starting a new conversation. `;

    if (userProfile.quizResults) {
      welcomeMessage += `I remember from your quiz that you're interested in ${userProfile.academicInterests.join(', ')}. What would you like to discuss?`;
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

  // Copy to clipboard helper with fallback
  const copyToClipboard = async (text) => {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      // continue to fallback
    }

    // Fallback
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch (e) {
      return false;
    }
  };

  const handleCopy = async (text) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      toast.success('Copied to clipboard');
    } else {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleLogout = () => {
    try {
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
      toast.error('Logout failed');
    }
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
    <div className={`flex h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-indigo-900 via-indigo-800 to-purple-800 text-white flex flex-col overflow-hidden shadow-2xl`}>
        <div className="p-6 border-b border-indigo-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Zariya AI</h1>
                <p className="text-xs text-indigo-200">Career Counselor</p>
              </div>
            </div>
          </div>

          <button
            onClick={createNewThread}
            className="w-full bg-white/10 backdrop-blur hover:bg-white/20 transition-all duration-200 rounded-xl py-3 px-4 flex items-center justify-center space-x-2 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {threads.map(thread => (
            <div
              key={thread.id}
              onClick={() => {
                setActiveThreadId(thread.id);
                setMessages(thread.messages);
              }}
              className={`group rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                thread.id === activeThreadId
                  ? 'bg-white/20 shadow-lg'
                  : 'hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-indigo-300" />
                    <h3 className="font-medium text-sm truncate">{thread.title}</h3>
                  </div>
                  <p className="text-xs text-indigo-200 mt-1 truncate">
                    {thread.messages[thread.messages.length - 1]?.content.substring(0, 50)}...
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setThreads(prev => prev.filter(t => t.id !== thread.id));
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-indigo-700/50">
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3">
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3">
              <History className="w-4 h-4" />
              <span className="text-sm">History</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-indigo-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center font-bold">
                {user.firstName[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-indigo-300">Premium Plan</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center space-x-3 text-red-300 hover:text-red-200">
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Career Consultation</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered career guidance</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Star className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 dark:text-green-400">Online</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-2">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => setInput(reply)}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div className={`max-w-2xl ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className="flex items-end space-x-2">
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${
                        message.sender === 'user' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                      {message.sender === 'bot' && (
                        <div className="flex items-center space-x-1 ml-4">
                          <button onClick={() => handleCopy(message.content)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                            <RefreshCw className="w-3 h-3 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                            <ThumbsUp className="w-3 h-3 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors">
                            <ThumbsDown className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">{user.firstName[0]}</span>
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
                <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Zariya is thinking</span>
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

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-2">
              {/* attachment upload removed */}

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-24 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  rows="1"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />

                <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  {/* mic removed */}
                </div>

                {showEmoji && (
                  <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-4 gap-1">
                      {emojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInput(prev => prev + emoji);
                            setShowEmoji(false);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors text-xl"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  !input.trim() || isLoading
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
              Zariya AI uses advanced language models to provide career guidance. Your privacy is protected.
            </p>
          </div>
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
      `}</style>
    </div>
  );
};

export default ChatInterface;
