import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const RegisterPage = ({ updateUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    licenseNumber: '',
    gender: '',
    companyEmail: '',
    profileImage: null
  });
  const [loading, setLoading] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  // License number formatting function with auto-hyphen insertion
  const formatLicenseNumber = (value) => {
    if (!value) return '';

    // Remove all non-alphanumeric characters
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, '');

    // If it starts with province codes (LHR, KHI, ISB, PES, QTA)
    if (/^(LHR|KHI|ISB|PES|QTA)/i.test(cleanValue)) {
      const province = cleanValue.slice(0, 3).toUpperCase();
      const numbers = cleanValue.slice(3);
      if (numbers.length > 0) {
        return `${province}-${numbers}`;
      }
      return province;
    }

    // For 13-digit numbers, format as new standardized style
    if (/^\d{13}$/.test(cleanValue)) {
      return `${cleanValue.slice(0, 2)}-${cleanValue.slice(2, 5)}-${cleanValue.slice(5)}`;
    }

    // For numbers being typed, add hyphens progressively
    if (/^\d+$/.test(cleanValue)) {
      if (cleanValue.length >= 2 && cleanValue.length <= 5) {
        return `${cleanValue.slice(0, 2)}-${cleanValue.slice(2)}`;
      } else if (cleanValue.length >= 6) {
        return `${cleanValue.slice(0, 2)}-${cleanValue.slice(2, 5)}-${cleanValue.slice(5)}`;
      }
    }

    // For other formats, return as is (up to 13 characters)
    return cleanValue.slice(0, 13);
  };

  // License number validation
  const validateLicenseNumber = (value) => {
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, '');

    if (cleanValue.length === 0) {
      return 'License number is required';
    }

    if (cleanValue.length > 13) {
      return 'License number cannot exceed 13 characters';
    }

    // Check for valid formats
    const isValidFormat =
      /^\d{13}$/.test(cleanValue) || // 13-digit standardized
      /^(LHR|KHI|ISB|PES|QTA)\d+$/i.test(cleanValue) || // Province codes
      /^\d{6,7}$/.test(cleanValue); // Short numeric (6-7 digits)

    if (!isValidFormat) {
      return 'Please enter a valid license number format';
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'licenseNumber') {
      // Store the original value (without formatting)
      const originalValue = value.replace(/[^A-Za-z0-9]/g, '');

      // Validate the license number
      const error = validateLicenseNumber(originalValue);
      setLicenseError(error || '');

      setFormData({
        ...formData,
        [name]: originalValue // Store original value
      });
    } else if (name === 'profileImage') {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
          toast.error('Please upload a JPG or PNG image');
          return;
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          return;
        }

        setFormData({
          ...formData,
          profileImage: file
        });
        setPreviewUrl(URL.createObjectURL(file));
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle license number input with simplified formatting
  const handleLicenseChange = (e) => {
    const { value } = e.target;
    const originalValue = value.replace(/[^A-Za-z0-9]/g, '');

    // Prevent entering more than 13 characters
    if (originalValue.length > 13) {
      return; // Don't update if more than 13 characters
    }

    // Validate the license number
    const error = validateLicenseNumber(originalValue);
    setLicenseError(error || '');

    // Update form data with original value
    setFormData({
      ...formData,
      licenseNumber: originalValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('companyEmail', formData.companyEmail);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('licenseNumber', formData.licenseNumber);
      if (formData.gender) formDataToSend.append('gender', formData.gender);
      if (formData.profileImage) formDataToSend.append('profileImage', formData.profileImage);

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        // Content-Type header is not set manually for FormData, browser sets it with boundary
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        // Show success message from backend or default message
        toast.success(data.message || 'Account created successfully!');
        // Redirect to login page instead of dashboard
        navigate('/login');
      } else {
        // Handle validation errors - show first error message
        if (data.errors && data.errors.length > 0) {
          toast.error(data.errors[0].msg || 'Validation failed');
        } else if (data.message) {
          toast.error(data.message);
        } else {
          toast.error('Registration failed');
        }
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-400 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-4xl"
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

        {/* Register Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Join Our Driver App</h1>
            <p className="text-blue-200">Create your driver account</p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-32 h-32 mb-4">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/20 bg-white/10 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-16 h-16 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <label
                  htmlFor="profileImage"
                  className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer transition-colors duration-300 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <input
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleChange}
                  className="hidden"
                  required
                />
              </div>
              <p className="text-blue-200 text-sm text-center">
                Upload a clear face photo <span className="text-red-400">*</span><br />
                <span className="text-xs opacity-75">(JPG/PNG, min 300x300, single face)</span>
              </p>
            </div>

            {/* Personal Information Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Company Email Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Company Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your company/admin email"
                />
                <p className="text-blue-200 text-xs mt-1">
                  Contact your administrator for the company email
                </p>
              </div>

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
            </div>

            {/* Contact Information Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Phone Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                  placeholder="+1234567890"
                />
              </div>

              {/* Gender Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Gender (Optional)
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                >
                  <option value="" className="bg-gray-800 text-white">Select Gender (Optional)</option>
                  <option value="male" className="bg-gray-800 text-white">Male</option>
                  <option value="female" className="bg-gray-800 text-white">Female</option>
                  <option value="other" className="bg-gray-800 text-white">Other</option>
                  <option value="prefer_not_to_say" className="bg-gray-800 text-white">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Address and License Information Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Address Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your address"
                />
              </div>

              {/* License Number Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formatLicenseNumber(formData.licenseNumber)}
                  onChange={handleLicenseChange}
                  required
                  maxLength={17} // Allow for formatted display (e.g., "41-001-00123456")
                  className={`w-full px-5 py-4 bg-white/10 border rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${licenseError
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-white/20 focus:ring-blue-400'
                    }`}
                  placeholder="Start typing your license number (e.g., LHR1234567 or 4100100123456)"
                />
                {licenseError && (
                  <p className="text-red-400 text-xs mt-1">{licenseError}</p>
                )}
                <p className="text-blue-200 text-xs mt-1">
                  Maximum 13 characters.
                </p>
              </div>
            </div>

            {/* Password Information Grid */}
            <div className="grid md:grid-cols-2 gap-6">
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
                  placeholder="Create a password"
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-blue-400 bg-white/10 border-white/20 rounded focus:ring-blue-400 focus:ring-2 mt-1"
              />
              <label className="ml-2 text-blue-200 text-sm">
                I agree to the{' '}
                <button type="button" className="text-pink-400 hover:text-blue-300 underline">
                  Terms and Conditions
                </button>
                {' '}and{' '}
                <button type="button" className="text-pink-400 hover:text-blue-300 underline">
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
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

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center"
          >
            <p className="text-blue-200">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300"
              >
                Sign in here
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
