import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiRefreshCw, FiArrowLeft, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const OTPVerificationForm = ({ userId, userEmail, onVerify, onResend, onBack }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [expirationTime, setExpirationTime] = useState(600); // 10 minutes in seconds
    const inputRefs = useRef([]);

    useEffect(() => {
        // Start expiration timer
        const timer = setInterval(() => {
            setExpirationTime(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Start resend cooldown timer
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleOtpChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (value && index === 5) {
            const otpCode = newOtp.join('');
            if (otpCode.length === 6) {
                handleVerify(otpCode);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();

        if (/^\d{6}$/.test(pastedData)) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
            // Auto-submit after paste
            setTimeout(() => {
                handleVerify(pastedData);
            }, 100);
        } else {
            toast.error('Please paste a valid 6-digit code');
        }
    };

    const handleVerify = async (otpCode = null) => {
        const code = otpCode || otp.join('');

        if (code.length !== 6) {
            toast.error('Please enter a complete 6-digit code');
            return;
        }

        if (!/^\d{6}$/.test(code)) {
            toast.error('OTP code must contain only numbers');
            return;
        }

        setLoading(true);
        try {
            await onVerify(userId, code);
        } catch (error) {
            // Error is handled by parent component
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        try {
            await onResend(userId);
            setResendCooldown(60); // 60 second cooldown
            toast.success('Verification code resent to your email');
        } catch (error) {
            toast.error(error.message || 'Failed to resend code');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full max-w-lg">
            {/* Back Button */}
            {onBack && (
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={onBack}
                    className="mb-6 inline-flex items-center text-blue-200 hover:text-white transition-colors duration-300"
                >
                    <FiArrowLeft className="w-5 h-5 mr-2" />
                    Back to Login
                </motion.button>
            )}

            {/* OTP Verification Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 border border-white/20 shadow-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiShield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Verify Your Identity</h1>
                    <p className="text-blue-200">
                        We've sent a 6-digit verification code to
                    </p>
                    {userEmail && (
                        <p className="text-white font-semibold mt-1">{userEmail}</p>
                    )}
                </motion.div>

                {/* OTP Input Fields */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-6"
                >
                    <label className="block text-white text-sm font-medium mb-4 text-center">
                        Enter Verification Code
                    </label>
                    <div className="flex justify-center space-x-3 mb-4" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-14 h-14 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                disabled={loading}
                            />
                        ))}
                    </div>

                    {/* Timer */}
                    {expirationTime > 0 && (
                        <p className="text-center text-blue-200 text-sm">
                            Code expires in: <span className="font-semibold text-white">{formatTime(expirationTime)}</span>
                        </p>
                    )}
                    {expirationTime === 0 && (
                        <p className="text-center text-red-300 text-sm font-medium">
                            Code expired. Please request a new one.
                        </p>
                    )}
                </motion.div>

                {/* Error Message Placeholder */}
                <div className="mb-6 min-h-[24px]"></div>

                {/* Verify Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    onClick={() => handleVerify()}
                    disabled={loading || otp.join('').length !== 6 || expirationTime === 0}
                    whileHover={!loading && otp.join('').length === 6 ? { scale: 1.02 } : {}}
                    whileTap={!loading && otp.join('').length === 6 ? { scale: 0.98 } : {}}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Verifying...
                        </div>
                    ) : (
                        'Verify Code'
                    )}
                </motion.button>

                {/* Resend Code */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center"
                >
                    <p className="text-blue-200 text-sm mb-2">
                        Didn't receive the code?
                    </p>
                    <button
                        onClick={handleResend}
                        disabled={resendCooldown > 0 || loading}
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiRefreshCw className={`w-4 h-4 mr-2 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                </motion.div>

                {/* Help Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-6 pt-6 border-t border-white/20"
                >
                    <div className="flex items-start space-x-3 text-blue-200 text-sm">
                        <FiMail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium mb-1">Check your email</p>
                            <p className="text-xs">
                                The verification code may take a few moments to arrive.
                                Please check your spam folder if you don't see it in your inbox.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default OTPVerificationForm;
