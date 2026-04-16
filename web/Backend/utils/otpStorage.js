/**
 * In-memory OTP storage
 * Stores OTP codes with expiration time
 * Format: { userId: { code: '123456', expiresAt: Date, email: 'user@email.com' } }
 */
const otpStorage = new Map();

/**
 * Generate 6-digit OTP code
 * @returns {String} 6-digit code
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP for user
 * @param {String} userId - User ID
 * @param {String} email - User email
 * @param {Number} expiresInMinutes - Expiration time in minutes (default: 10)
 * @returns {String} Generated OTP code
 */
const storeOTP = (userId, email, expiresInMinutes = 10) => {
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    otpStorage.set(userId.toString(), {
        code,
        expiresAt,
        email
    });

    // Clean up expired OTPs periodically (optional - can be done on verification)
    return code;
};

/**
 * Verify OTP code for user
 * @param {String} userId - User ID
 * @param {String} code - OTP code to verify
 * @returns {Object} { valid: Boolean, message: String }
 */
const verifyOTP = (userId, code) => {
    const stored = otpStorage.get(userId.toString());

    if (!stored) {
        return { valid: false, message: 'OTP not found or expired' };
    }

    if (new Date() > stored.expiresAt) {
        otpStorage.delete(userId.toString());
        return { valid: false, message: 'OTP has expired' };
    }

    if (stored.code !== code) {
        return { valid: false, message: 'Invalid OTP code' };
    }

    // OTP is valid - remove it (one-time use)
    otpStorage.delete(userId.toString());
    return { valid: true, message: 'OTP verified successfully' };
};

/**
 * Remove OTP for user (cleanup)
 * @param {String} userId - User ID
 */
const removeOTP = (userId) => {
    otpStorage.delete(userId.toString());
};

/**
 * Get OTP info for user (for debugging)
 * @param {String} userId - User ID
 * @returns {Object|null}
 */
const getOTPInfo = (userId) => {
    return otpStorage.get(userId.toString()) || null;
};

module.exports = {
    generateOTP,
    storeOTP,
    verifyOTP,
    removeOTP,
    getOTPInfo
};
