import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, TrendingUp, Lightbulb, Bot, Sparkles, ArrowRight, Menu, X, Moon, Sun, Star, Users, Award, Zap } from 'lucide-react';

const LandingPage = () => {
  const [messages, setMessages] = useState([
    { text: "How can I help with your career planning today?", isUser: false },
    { text: "I'm interested in data science but don't know where to start.", isUser: true },
    { text: "That's a great field! Let me help you map out a learning path and suggest some resources to begin with...", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { text: inputValue, isUser: true }]);
      setInputValue('');
      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [...prev, { text: "Thanks for your question! I'm here to guide you through your career journey.", isUser: false }]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-indigo-50'}`}>
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Zariya</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
              <a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</a>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
              </button>
              {isAuthenticated ? (
                <Link to="/dashboard" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                    Login
                  </Link>
                  <Link to="/signup" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
                <a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</a>
                {isAuthenticated ? (
                  <Link to="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Login</Link>
                    <Link to="/signup" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 text-center">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-1/2 md:pr-8">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI-Powered Career Guidance</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                Find Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Career Path</span> with Zariya
              </h1>
              
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Your AI career counselor that understands your goals, strengths, and aspirations to guide you towards your ideal career journey.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link to="/signup" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group">
                    <span>Get Started Free</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <a href="#features" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center space-x-2">
                  <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Explore Features</span>
                </a>
              </div>
              
              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">1+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">50+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Career Paths</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">AI Support</div>
                </div>
              </div>
            </div>
            
            <div className="mt-16 md:mt-0 md:w-1/2 md:flex md:justify-end">
              <div className="relative max-w-lg mx-auto md:mx-0">
                {/* Background decoration */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-lg opacity-20"></div>
                
                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
                  <div className="p-6 md:p-8">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-bl-full"></div>
                    
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <Bot className="text-white text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Zariya AI Assistant</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Online now
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {messages.map((msg, index) => (
                        <div key={index} className={`rounded-2xl px-4 py-3 max-w-sm shadow-sm ${
                          msg.isUser 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white ml-auto' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 relative">
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-colors" 
                        placeholder="Type your query here..." 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                        onClick={handleSendMessage}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Features */}
      <div id="features" className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-4">
              How Zariya Works For You
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our AI-powered career counseling platform adapts to your unique needs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="group bg-gradient-to-br from-indigo-50 to-white dark:from-gray-700 dark:to-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-600">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Lightbulb className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Personalized Advice</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Get tailored career guidance based on your skills, interests, and goals.
              </p>
            </div>
            
            <div className="group bg-gradient-to-br from-indigo-50 to-white dark:from-gray-700 dark:to-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-600">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <GraduationCap className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Learning Pathways</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Discover the right education and training paths to reach your career goals.
              </p>
            </div>
            
            <div className="group bg-gradient-to-br from-indigo-50 to-white dark:from-gray-700 dark:to-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-600">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Market Insights</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Get up-to-date information on job market trends and in-demand skills.
              </p>
            </div>
            
            <div className="group bg-gradient-to-br from-indigo-50 to-white dark:from-gray-700 dark:to-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-600">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <Bot className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">AI Memory</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Our AI remembers your conversations to provide consistent guidance over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white sm:text-4xl mb-4">
              Ready to Plan Your Career Journey?
            </h2>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8 leading-relaxed">
              Join Zariya today and get personalized guidance from our AI career counselor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/signup" 
                className="bg-white text-indigo-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Get Started Free</span>
              </Link>
              <div className="flex items-center space-x-4 text-white/80">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>1+ Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Trusted AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Zariya</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                Your AI-powered career guidance companion that understands your goals and helps you navigate your professional journey with personalized advice.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><button className="text-gray-400 hover:text-white transition-colors">Blog</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Guides</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">FAQ</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Support</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><button className="text-gray-400 hover:text-white transition-colors">Privacy</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Terms</button></li>
                <li><button className="text-gray-400 hover:text-white transition-colors">Cookies</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} Zariya. All rights reserved.
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span>Made with ❤️ for career growth</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
