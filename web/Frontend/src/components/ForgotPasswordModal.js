import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiX, FiSend, FiCheckCircle } from 'react-icons/fi';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.requestPasswordReset(email);
            if (response.success) {
                setSubmitted(true);
                toast.success('Reset link sent to your email!');
            } else {
                toast.error(response.message || 'Failed to send reset link');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error(error.message || 'Failed to send reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setSubmitted(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-blue-200 hover:text-white transition-colors"
                        >
                            <FiX className="w-6 h-6" />
                        </button>

                        <div className="p-8">
                            {!submitted ? (
                                <>
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FiMail className="w-8 h-8 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                                        <p className="text-blue-200">
                                            Enter your email address and we'll send you a link to reset your password.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-white text-sm font-medium mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                                                    placeholder="Enter your email"
                                                />
                                            </div>
                                        </div>

                                        <motion.button
                                            type="submit"
                                            disabled={loading}
                                            whileHover={!loading ? { scale: 1.02 } : {}}
                                            whileTap={!loading ? { scale: 0.98 } : {}}
                                            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Sending Link...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiSend className="w-5 h-5" />
                                                    <span>Send Reset Link</span>
                                                </>
                                            )}
                                        </motion.button>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 12 }}
                                        className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                                    >
                                        <FiCheckCircle className="w-10 h-10 text-green-400" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                                    <p className="text-blue-200 mb-8">
                                        We've sent a password reset link to <br />
                                        <span className="text-white font-semibold">{email}</span>
                                    </p>
                                    <button
                                        onClick={handleClose}
                                        className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ForgotPasswordModal;
