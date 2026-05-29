import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { GraduationCap, TrendingUp, Lightbulb, Bot, Sparkles, ArrowRight, Menu, X, Moon, Sun, Star, Users, Award, Zap } from 'lucide-react';

const LandingPage = () => {
  const [messages, setMessages] = useState([
    { text: "How can I help with your career planning today?", isUser: false },
    { text: "I'm interested in data science but don't know where to start.", isUser: true },
    { text: "That's a great field! Let me help you map out a learning path and suggest some resources to begin with...", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const floatingParticles = useMemo(() => (
    [...Array(20)].map((_, index) => ({
      id: index,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`,
    }))
  ), []);

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

  // Smooth scroll to a section by id with offset so sticky navbar doesn't cover headings
  const scrollToId = (id) => {
    const el = document.getElementById(id.replace('#', ''));
    if (!el) return;
    // get navbar height (sticky top element)
    const nav = document.querySelector('nav');
    const offset = nav ? nav.getBoundingClientRect().height + 8 : 16; // small padding
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // Handle initial hash on mount (e.g., visiting /#about)
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      // slight delay to allow layout to settle
      setTimeout(() => {
        scrollToId(id);
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] text-white relative overflow-visible dark">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_35%)] pointer-events-none"></div>
      {/* Navigation */}
      <nav className="bg-white/5 dark:bg-black/20 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-indigo-600">Zariya</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToId('features')} className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</button>
              <button onClick={() => scrollToId('about')} className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</button>
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
                  <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg">
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
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">About</a>
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
      <div className="relative overflow-hidden py-6 md:py-12 min-h-[calc(100vh-4rem)]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 blur-[140px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[140px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 md:-mt-10 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-400">AI-Powered Career Guidance</span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-[1.08] tracking-tighter">
                Shape Your Future With
                <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  AI-Powered Career Intelligence
                </span>
              </h1>

              <p className="text-base md:text-lg text-gray-300 max-w-lg">
                Your personal AI career counselor that understands your goals, strengths, and aspirations.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 text-base shadow-xl shadow-indigo-500/30 transition-all hover:scale-105">
                    Go to Dashboard <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 text-base shadow-xl shadow-indigo-500/30 transition-all hover:scale-105">
                    Get Started Free <ArrowRight className="w-5 h-5" />
                  </Link>
                )}

                <button 
                  onClick={() => scrollToId('features')}
                  className="border border-white/30 hover:border-white/50 bg-white/5 backdrop-blur-xl px-8 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 transition-all hover:bg-white/10"
                >
                  <Zap className="w-5 h-5" /> Explore Features
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold">1K+</div>
                  <div className="text-sm text-gray-400">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm text-gray-400">Career Paths</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-sm text-gray-400">AI Support</div>
                </div>
              </div>
            </div>

            {/* Right Side - Enhanced Chat Interface */}
            <div className="relative flex justify-center items-center">
              <div className="absolute -inset-6 md:-inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl rounded-3xl pointer-events-none"></div>

              <div className="relative w-full md:w-[95%] lg:w-[640px] xl:w-[450px] h-[490px] flex flex-col bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/20">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Zariya AI</p>
                    <p className="text-xs text-emerald-300 flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      Always Online
                    </p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div 
                  className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent hide-scrollbar"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        msg.isUser 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-gray-800 text-gray-200 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-white/10 bg-transparent">
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full bg-gray-900 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Ask anything about your career..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 p-3 rounded-xl transition-colors"
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

      <motion.div
        id="about"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.25 }}
        className="bg-transparent py-32 relative overflow-hidden"
      > 
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 blur-[140px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 blur-[140px] rounded-full"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_55%)]"></div>
        </div>
        <div className="absolute inset-0 pointer-events-none">
          {floatingParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-indigo-400 rounded-full animate-pulse"
              style={{
                top: particle.top,
                left: particle.left,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">About Zariya</h2>
            <p className="mt-4 text-base md:text-lg text-gray-600 dark:text-gray-300">
              Zariya is an AI-powered career guidance platform built to help students and professionals
              discover meaningful career paths, learn the skills they need, and make data-driven decisions
              about education and job opportunities.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base md:text-lg text-gray-900 dark:text-white mb-2">Our Mission</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Empower people with personalized, accessible career guidance so they can make confident decisions about their future.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base md:text-lg text-gray-900 dark:text-white mb-2">How it Works</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Leverages conversational AI, market insights, and curated learning pathways to generate recommendations tailored to each user's goals and background.</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-base md:text-lg text-gray-900 dark:text-white mb-2">Privacy</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">We prioritize user privacy and only use data to improve guidance; personal data is protected and never shared without consent.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        id="features"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.2 }}
        className="bg-transparent py-32 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 blur-[140px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 blur-[140px] rounded-full"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_55%)]"></div>
        </div>
        <div className="absolute inset-0 pointer-events-none">
          {floatingParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-indigo-400 rounded-full animate-pulse"
              style={{
                top: particle.top,
                left: particle.left,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
              }}
            />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-4">
              How Zariya Works For You
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our AI-powered career counseling platform adapts to your unique needs
            </p>
          </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="group bg-white/5 backdrop-blur-2xl p-8 rounded-2xl shadow-lg hover:scale-105 hover:border-indigo-400/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-500 transform hover:-translate-y-2 border border-white/10 dark:border-white/10">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                <Lightbulb className="text-white text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Personalized Advice</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                Get tailored career guidance based on your skills, interests, and goals.
              </p>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-2xl p-8 rounded-2xl shadow-lg hover:scale-105 hover:border-indigo-400/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-500 transform hover:-translate-y-2 border border-white/10 dark:border-white/10">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                <GraduationCap className="text-white text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Learning Pathways</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                Discover the right education and training paths to reach your career goals.
              </p>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-2xl p-8 rounded-2xl shadow-lg hover:scale-105 hover:border-indigo-400/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-500 transform hover:-translate-y-2 border border-white/10 dark:border-white/10">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                <TrendingUp className="text-white text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Market Insights</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                Get up-to-date information on job market trends and in-demand skills.
              </p>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-2xl p-8 rounded-2xl shadow-lg hover:scale-105 hover:border-indigo-400/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition-all duration-500 transform hover:-translate-y-2 border border-white/10 dark:border-white/10">
              <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                <Bot className="text-white text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">AI Memory</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                Our AI remembers your conversations to provide consistent guidance over time.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.2 }}
        className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 py-32 relative overflow-hidden"
      >
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-cyan-300/10 blur-[140px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center relative">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white sm:text-4xl mb-4">
              Ready to Plan Your Career Journey?
            </h2>
            <p className="text-base md:text-lg text-indigo-100 max-w-2xl mx-auto mb-8 leading-relaxed">
              Join Zariya today and get personalized guidance from our AI career counselor.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/signup" 
                className="bg-white text-indigo-600 hover:bg-gray-100 font-bold py-3.5 px-7 rounded-xl text-sm md:text-base transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
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
      </motion.div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Zariya</h3>
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
