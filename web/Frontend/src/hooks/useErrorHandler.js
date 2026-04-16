import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FiAlertTriangle } from 'react-icons/fi';

export const useErrorHandler = () => {
  const handleError = useCallback((error, context = '') => {
    console.error(`Error in ${context}:`, error);
    
    // Handle different types of errors
    if (error.message) {
      // API errors with specific messages
      toast.error(error.message);
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Network errors
      toast.error('Network error. Please check your internet connection.');
    } else if (error.name === 'ChunkLoadError') {
      // Chunk loading errors (common in development)
      toast.error('Failed to load resources. Please refresh the page.');
    } else {
      // Generic errors
      toast.error('An unexpected error occurred. Please try again.');
    }
  }, []);

  const handleApiError = useCallback((error, operation = 'operation') => {
    console.error(`API Error during ${operation}:`, error);
    
    // Handle specific HTTP status codes
    if (error.message.includes('403')) {
      toast.error('Access denied. You do not have permission to perform this action.');
    } else if (error.message.includes('404')) {
      toast.error('The requested resource was not found.');
    } else if (error.message.includes('422')) {
      toast.error('Invalid data provided. Please check your input.');
    } else if (error.message.includes('429')) {
      toast.error('Too many requests. Please wait a moment and try again.');
    } else if (error.message.includes('500')) {
      toast.error('Server error. Please try again later.');
    } else if (error.message.includes('Session expired')) {
      toast.error('Your session has expired. Please login again.');
    } else {
      toast.error(error.message || `Failed to ${operation}. Please try again.`);
    }
  }, []);

  const handleSuccess = useCallback((message) => {
    toast.success(message);
  }, []);

  const handleWarning = useCallback((message) => {
    toast(message, {
      icon: <FiAlertTriangle className="w-4 h-4" />,
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    });
  }, []);

  return {
    handleError,
    handleApiError,
    handleSuccess,
    handleWarning
  };
};

export default useErrorHandler;
