import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiFileText } from 'react-icons/fi';
import { incidentAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const AnswerQuestionsModal = ({ isOpen, onClose, incident, onUpdate }) => {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize answers state when modal opens or incident changes
  useEffect(() => {
    if (isOpen && incident?.questions) {
      const initialAnswers = incident.questions.map((qa, index) => ({
        questionIndex: index,
        answer: qa.answer || ''
      }));
      setAnswers(initialAnswers);
    }
  }, [isOpen, incident]);

  const updateAnswer = (index, answer) => {
    const updated = [...answers];
    updated[index].answer = answer;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required questions
      const requiredQuestions = incident.questions.filter((q, index) => q.isRequired);
      const unansweredRequired = requiredQuestions.filter((q, index) => {
        const originalIndex = incident.questions.findIndex(orig => orig === q);
        const answer = answers.find(a => a.questionIndex === originalIndex);
        return !answer || !answer.answer.trim();
      });

      if (unansweredRequired.length > 0) {
        toast.error('Please answer all required questions');
        return;
      }

      const response = await incidentAPI.answerQuestions(incident._id, { answers });

      if (response.success) {
        toast.success('Answers submitted successfully!');
        onUpdate(); // Refresh incident data
        onClose();
      } else {
        toast.error(response.message || 'Failed to submit answers');
      }
    } catch (error) {
      console.error('Error submitting answers:', error);
      toast.error('Error submitting answers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAnswers([]);
    onClose();
  };

  if (!incident || !incident.questions || incident.questions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Answer Questions</h2>
                <p className="text-gray-600 mt-1">
                  Incident #{incident.incidentNumber} - {incident.incidentType?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {incident.questions.map((qa, index) => {
                  const answerData = answers.find(a => a.questionIndex === index);
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="flex items-center mb-2">
                          <strong className="text-gray-900">Q{index + 1}:</strong>
                          <span className="ml-2 text-gray-900">{qa.question}</span>
                          {qa.isRequired && (
                            <span className="ml-2 text-red-600 text-sm font-medium">*</span>
                          )}
                        </div>
                        {qa.isRequired && (
                          <p className="text-sm text-red-600">This question is required</p>
                        )}
                      </div>
                      
                      <textarea
                        value={answerData?.answer || ''}
                        onChange={(e) => updateAnswer(index, e.target.value)}
                        placeholder="Enter your answer..."
                        maxLength={1000}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <div className="text-right text-sm text-gray-500 mt-1">
                        {(answerData?.answer || '').length}/1000 characters
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Answers</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnswerQuestionsModal;
