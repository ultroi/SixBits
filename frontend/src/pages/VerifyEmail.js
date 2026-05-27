import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import { Sparkles, Mail, KeyRound, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const initialEmail = searchParams.get('email') || '';
    const initialOtp = searchParams.get('otp') || '';
    setEmail(initialEmail);
    setOtp(initialOtp);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !otp) {
      toast.error('Email aur OTP dono required hain');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifySignupOtp({ email, otp });
      toast.success(response.message || 'Email verified');
      navigate('/login');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'OTP verify nahi ho paya';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Email pehle enter karo');
      return;
    }

    setResending(true);

    try {
      const response = await authService.resendSignupOtp(email);
      toast.success(response.message || 'New OTP sent');
      if (response.devOtp) {
        setOtp(response.devOtp);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'OTP resend nahi ho paya';
      toast.error(errorMsg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-indigo-600">Zariya</h1>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the OTP sent to your email to create your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-200/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  className="block w-full pl-10 pr-3 py-3 border rounded-xl bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none transition-colors cursor-not-allowed"
                  placeholder="email@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="block w-full pl-10 pr-3 py-3 border rounded-xl bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors tracking-[0.5em] text-center"
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>Verify OTP</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending}
              className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="font-medium text-gray-600 hover:text-gray-500"
            >
              Change signup details
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already verified?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;