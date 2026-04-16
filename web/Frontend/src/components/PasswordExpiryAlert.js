import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiX, FiShield } from 'react-icons/fi';

const PasswordExpiryAlert = ({
    user,
    onDismiss,
    onChangePassword,
    showExpiringWarning = true
}) => {
    if (!user) return null;

    // Check if password is expired
    const expiryDate = user.passwordExpiryDate ? new Date(user.passwordExpiryDate) : null;
    const isExpired = user.passwordExpired === true ||
        (expiryDate && expiryDate < new Date());

    // Check if password is expiring soon (within 7 days)
    const isExpiringSoon = user.passwordExpiryWarning === true ||
        (user.daysUntilPasswordExpiry !== undefined &&
            user.daysUntilPasswordExpiry !== null &&
            user.daysUntilPasswordExpiry <= 7 &&
            user.daysUntilPasswordExpiry > 0);

    // Don't show if password is not expired and not expiring soon
    if (!isExpired && (!isExpiringSoon || !showExpiringWarning)) {
        return null;
    }

    const daysRemaining = user.daysUntilPasswordExpiry;
    const daysExpired = user.daysExpired;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${isExpired
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                } border-l-4 rounded-lg p-4 mb-4 shadow-sm`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                    <div className={`flex-shrink-0 ${isExpired ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                        {isExpired ? (
                            <FiShield className="w-5 h-5 mt-0.5" />
                        ) : (
                            <FiAlertTriangle className="w-5 h-5 mt-0.5" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${isExpired ? 'text-red-900' : 'text-yellow-900'
                            }`}>
                            {isExpired
                                ? `Password Expired ${daysExpired ? `(${daysExpired} day${daysExpired !== 1 ? 's' : ''} ago)` : ''}`
                                : `Password Expiring Soon (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining)`
                            }
                        </h3>
                        <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                            {isExpired
                                ? 'Your password has expired. Please change it immediately to maintain account security.'
                                : 'Your password will expire soon. Please change it to avoid being locked out of your account.'
                            }
                        </p>
                        <button
                            onClick={onChangePassword}
                            className={`mt-3 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-300 ${isExpired
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                }`}
                        >
                            Change Password Now
                        </button>
                    </div>
                </div>
                {onDismiss && !isExpired && (
                    <button
                        onClick={onDismiss}
                        className={`flex-shrink-0 ml-4 ${isExpired ? 'text-red-600 hover:text-red-800' : 'text-yellow-600 hover:text-yellow-800'
                            } transition-colors duration-300`}
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default PasswordExpiryAlert;

