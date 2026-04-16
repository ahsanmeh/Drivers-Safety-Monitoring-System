import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authAPI } from '../services/api';
import OTPVerificationForm from '../components/OTPVerificationForm';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const LoginPage = ({ updateUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    if (loading) return; // Prevent multiple submissions

    setLoading(true);

    try {
      const data = await authAPI.login(formData);

      if (data.success) {
        // Check if 2FA is required
        if (data.data.requires2FA) {
          setUserId(data.data.userId);
          setUserEmail(formData.email);
          setShowOTPForm(true);
          toast.success(data.message || 'Verification code sent to your email');
        } else {
          // Normal login flow
          const userData = data.data.user;

          localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(userData));
          updateUser(userData);

          // Show warning if password expiring soon
          if (userData.passwordExpiryWarning) {
            toast(`Your password will expire in ${userData.daysUntilPasswordExpiry} day(s). Please change it soon.`, {
              icon: '⚠️',
              style: {
                background: '#fbbf24',
                color: '#fff',
              },
            });
          } else {
            toast.success('Login successful!');
          }

          // Navigate based on user role
          if (userData.role === 'admin') {
            navigate('/dashboard');
          } else {
            navigate('/driver-dashboard');
          }
        }
      } else {
        // Check if password expired error
        if (data.message && typeof data.message === 'object' && data.message.passwordExpired) {
          const email = data.message.email || formData.email;
          toast(`Your password expired ${data.message.daysExpired} day(s) ago. A password reset link has been sent to ${email}.`, {
            icon: '📧',
            duration: 8000,
            style: {
              background: '#4299e1',
              color: '#fff',
            },
          });
        } else {
          toast.error(data.message || 'Login failed');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (userId, otpCode) => {
    setLoading(true);
    try {
      const data = await authAPI.verify2FA(userId, otpCode);

      if (data.success) {
        const userData = data.data.user;

        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        updateUser(userData);

        if (userData.passwordExpiryWarning) {
          toast(`Your password will expire in ${userData.daysUntilPasswordExpiry} day(s). Please change it soon.`, {
            icon: '⚠️',
            style: {
              background: '#fbbf24',
              color: '#fff',
            },
          });
        } else {
          toast.success('Two-factor authentication verified. Login successful!');
        }

        if (userData.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/driver-dashboard');
        }
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (error) {
      toast.error(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async (userId) => {
    try {
      const data = await authAPI.resend2FA(userId);
      if (data.success) {
        toast.success(data.message || 'Verification code resent to your email');
      } else {
        toast.error(data.message || 'Failed to resend code');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification code');
    }
  };

  const handleBackToLogin = () => {
    setShowOTPForm(false);
    setUserId(null);
    setUserEmail('');
    setFormData({ email: formData.email, password: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-400 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <AnimatePresence mode="wait">
        {showOTPForm ? (
          <motion.div
            key="otp-form"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full max-w-lg"
          >
            <OTPVerificationForm
              userId={userId}
              userEmail={userEmail}
              onVerify={handleOTPVerify}
              onResend={handleResendOTP}
              onBack={handleBackToLogin}
            />
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 w-full max-w-lg"
          >
            {/* Back to Landing */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <Link
                to="/"
                className="inline-flex items-center text-blue-200 hover:text-white transition-colors duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </motion.div>

            {/* Login Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-white/20 shadow-2xl">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center mb-8"
              >
                <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-blue-200">Sign in to your account</p>
              </motion.div>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Email Field */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your password"
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-400 bg-white/10 border-white/20 rounded focus:ring-blue-400 focus:ring-2"
                    />
                    <span className="ml-2 text-blue-200 text-sm">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-blue-200 hover:text-white text-sm transition-colors duration-300"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </motion.form>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="my-6 flex items-center"
              >
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-4 text-blue-200 text-sm">or</span>
                <div className="flex-1 border-t border-white/20"></div>
              </motion.div>

              {/* Register Link */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-center"
              >
                <p className="text-blue-200">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300"
                  >
                    Sign up here
                  </Link>
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
};

export default LoginPage;
