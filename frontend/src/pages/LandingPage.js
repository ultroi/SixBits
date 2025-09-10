import React from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaChartLine, FaLightbulb, FaRobot } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-primary">Zariya</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="md:flex md:items-center md:space-x-10">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Find Your Career <span className="text-primary">Path</span> with Zariya
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Your AI career counselor that understands your goals, strengths, and aspirations to guide you towards your ideal career journey.
              </p>
              <div className="mt-10 flex space-x-4">
                <Link to="/signup" className="btn-primary text-lg px-8 py-3">
                  Get Started
                </Link>
                <a href="#features" className="btn-secondary text-lg px-8 py-3">
                  Learn More
                </a>
              </div>
            </div>
            <div className="mt-10 md:mt-0 md:w-1/2">
              <div className="relative rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-primary opacity-10 rounded-bl-full"></div>
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <FaRobot className="text-white text-xl" />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-gray-900">Zariya AI Assistant</h3>
                      <p className="text-gray-500 text-sm">Online now</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 rounded-lg p-3 mt-4 max-w-sm">
                    <p className="text-gray-700">How can I help with your career planning today?</p>
                  </div>
                  
                  <div className="bg-primary rounded-lg p-3 mt-4 ml-auto max-w-sm">
                    <p className="text-white">I'm interested in data science but don't know where to start.</p>
                  </div>
                  
                  <div className="bg-gray-100 rounded-lg p-3 mt-4 max-w-sm">
                    <p className="text-gray-700">That's a great field! Let me help you map out a learning path and suggest some resources to begin with...</p>
                  </div>
                  
                  <div className="mt-6 relative">
                    <input 
                      type="text" 
                      className="input-field pr-10" 
                      placeholder="Type your query here..." 
                      disabled 
                    />
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary"
                      disabled
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#4F46E5" fillOpacity="0.1" d="M0,128L48,112C96,96,192,64,288,64C384,64,480,96,576,122.7C672,149,768,171,864,160C960,149,1056,107,1152,85.3C1248,64,1344,64,1392,64L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How Zariya Works For You
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered career counseling platform adapts to your unique needs
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <FaLightbulb className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Personalized Advice</h3>
              <p className="mt-2 text-gray-600">
                Get tailored career guidance based on your skills, interests, and goals.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <FaGraduationCap className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Learning Pathways</h3>
              <p className="mt-2 text-gray-600">
                Discover the right education and training paths to reach your career goals.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <FaChartLine className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Market Insights</h3>
              <p className="mt-2 text-gray-600">
                Get up-to-date information on job market trends and in-demand skills.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <FaRobot className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">AI Memory</h3>
              <p className="mt-2 text-gray-600">
                Our AI remembers your conversations to provide consistent guidance over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to Plan Your Career Journey?
            </h2>
            <p className="mt-4 text-xl text-indigo-100 max-w-2xl mx-auto">
              Join Zariya today and get personalized guidance from our AI career counselor.
            </p>
            <div className="mt-8">
              <Link 
                to="/signup" 
                className="bg-white text-primary hover:bg-indigo-50 font-bold py-3 px-8 rounded-lg transition duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold">Zariya</h3>
              <p className="mt-2 text-gray-400">Your AI-powered career guidance companion</p>
            </div>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Resources</h4>
                <ul className="mt-4 space-y-2">
                  <li><button type="button" className="text-gray-400 hover:text-white">Blog</button></li>
                  <li><button type="button" className="text-gray-400 hover:text-white">Guides</button></li>
                  <li><button type="button" className="text-gray-400 hover:text-white">FAQ</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Legal</h4>
                <ul className="mt-4 space-y-2">
                  <li><button type="button" className="text-gray-400 hover:text-white">Privacy</button></li>
                  <li><button type="button" className="text-gray-400 hover:text-white">Terms</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Connect</h4>
                <ul className="mt-4 space-y-2">
                  <li><button type="button" className="text-gray-400 hover:text-white">Contact</button></li>
                  <li><button type="button" className="text-gray-400 hover:text-white">Support</button></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 md:flex md:items-center md:justify-between">
            <div className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Zariya. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
