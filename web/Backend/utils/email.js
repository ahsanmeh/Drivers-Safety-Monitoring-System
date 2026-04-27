const nodemailer = require('nodemailer');

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kashif.syslab@gmail.com',
    pass: 'gofb rlgn xyau ehac' // Gmail App Password
  }
});

// Verify transporter configuration
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('Email transporter error:', error);
//   } else {
//     console.log('✅ Email server is ready to send messages');
//   }
// });

/**
 * Send OTP email to user
 * @param {String} email - Recipient email
 * @param {String} otpCode - 6-digit OTP code
 * @param {String} userName - User's name
 * @returns {Promise}
 */
const sendOTPEmail = async (email, otpCode, userName = 'User') => {
  const mailOptions = {
    from: '"Driver Safety Monitoring System" <kashif.syslab@gmail.com>',
    to: email,
    subject: 'Your Two-Factor Authentication Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Two-Factor Authentication</h2>
        <p>Hello ${userName},</p>
        <p>Your verification code for Driver Safety Monitoring System is:</p>
        <div style="background-color: #f7fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2d3748; font-size: 32px; letter-spacing: 8px; margin: 0;">${otpCode}</h1>
        </div>
        <p style="color: #718096; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #718096; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #a0aec0; font-size: 12px;">This is an automated message from Driver Safety Monitoring System. Please do not reply.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Send password reset email to user
 * @param {String} email - Recipient email
 * @param {String} resetToken - Password reset token
 * @param {String} userName - User's name
 * @param {Number} daysExpired - Number of days password has been expired
 * @returns {Promise}
 */
const sendPasswordResetEmail = async (email, resetToken, userName = 'User', daysExpired = 0) => {
  // Frontend URL - adjust this to your actual frontend URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"Driver Safety Monitoring System" <kashif.syslab@gmail.com>',
    to: email,
    subject: daysExpired > 0
      ? `Your Password Has Expired - Reset Required`
      : 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4a5568; border-bottom: 3px solid #4299e1; padding-bottom: 10px;">
          ${daysExpired > 0 ? 'Password Expired' : 'Password Reset Request'}
        </h2>
        
        <p>Hello ${userName},</p>
        
        ${daysExpired > 0 ? `
          <div style="background-color: #fed7d7; border-left: 4px solid #e53e3e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #742a2a; font-weight: bold;">
              ⚠️ Your password expired ${daysExpired} day(s) ago. You must reset your password to continue.
            </p>
          </div>
        ` : `
          <p>You have requested to reset your password. Click the button below to create a new password:</p>
        `}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; background-color: #4299e1; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            ${daysExpired > 0 ? 'Reset Expired Password' : 'Reset Password'}
          </a>
        </div>
        
        <p style="color: #718096; font-size: 14px;">
          Or copy and paste this link into your browser:
        </p>
        <p style="background-color: #f7fafc; padding: 10px; border-radius: 4px; word-break: break-all; 
           color: #4299e1; font-size: 12px; font-family: monospace;">
          <a href="${resetUrl}" style="color: #4299e1; text-decoration: none;">Click here to reset your password</a>
        </p>
        
        <div style="background-color: #fff5cd; border-left: 4px solid #d69e2e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #744210; font-size: 14px;">
            <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #a0aec0; font-size: 12px; text-align: center;">
          This is an automated message from Driver Safety Monitoring System. Please do not reply to this email.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail
};
