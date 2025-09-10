import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiLogOut } from 'react-icons/fi';
import { AiOutlineUser } from 'react-icons/ai';
import { RiRobot2Line } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/api';
import ReactMarkdown from 'react-markdown';

const ChatInterface = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load chat history when component mounts
    const loadChatHistory = async () => {
      try {
        const { messages: chatHistory } = await chatService.getChatHistory();
        
        if (chatHistory && chatHistory.length > 0) {
          // Format the messages with IDs and timestamps
          const formattedMessages = chatHistory.map((msg, index) => ({
            id: index + 1,
            content: msg.content,
            sender: msg.sender,
            timestamp: new Date(msg.timestamp)
          }));
          
          setMessages(formattedMessages);
        } else {
          // If no chat history, add initial bot message
          setMessages([
            {
              id: 1,
              content: `Hello ${user.firstName}! I'm Zariya, your AI career counselor. How can I help you with your career journey today?`,
              sender: 'bot',
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Set default welcome message if there's an error
        setMessages([
          {
            id: 1,
            content: "Hello! I'm Zariya, your AI career counselor. How can I help you with your career journey today?",
            sender: 'bot',
            timestamp: new Date()
          }
        ]);
      }
    };
    
    loadChatHistory();
  }, [user.firstName]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      content: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Use the chat service
      const response = await chatService.sendMessage(input);
      
      const botMessage = {
        id: messages.length + 2,
        content: response.message,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get a response. Please try again.');
      
      // Add error message from bot
      const errorMessage = {
        id: messages.length + 2,
        content: `I'm sorry ${user.firstName}, I'm having trouble processing your request right now. Please try again later.`,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Zariya</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                  {user.firstName.charAt(0)}
                </div>
                <span className="ml-2 text-gray-700">{user.firstName} {user.lastName}</span>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-primary"
            >
              <FiLogOut className="mr-1" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Chat Container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gray-100">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-2xl px-4 py-3 max-w-[85%] md:max-w-[70%] flex ${
                  message.sender === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none shadow-md'
                }`}
              >
                <div className="mr-3 flex-shrink-0">
                  {message.sender === 'user' ? (
                    <AiOutlineUser className={message.sender === 'user' ? 'text-white' : 'text-primary'} size={20} />
                  ) : (
                    <RiRobot2Line className="text-primary" size={20} />
                  )}
                </div>
                <div>
                  {message.sender === 'bot' ? (
                    <div className="markdown-content">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                  <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-white text-gray-800 shadow-md rounded-tl-none max-w-[85%] md:max-w-[70%] flex">
                <div className="mr-3 flex-shrink-0">
                  <RiRobot2Line className="text-primary" size={20} />
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex items-end space-x-2">
            <div className="flex-grow relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="w-full border border-gray-300 rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={1}
                style={{ minHeight: '50px', maxHeight: '150px' }}
              ></textarea>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`absolute right-3 bottom-3 text-white p-1.5 rounded-full ${
                  !input.trim() || isLoading ? 'bg-gray-400' : 'bg-primary hover:bg-secondary'
                }`}
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">
            Zariya uses AI for career guidance. Your conversations are stored to provide personalized advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
