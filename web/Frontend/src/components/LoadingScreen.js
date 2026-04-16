import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiTruck, FiMapPin, FiNavigation } from 'react-icons/fi';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 500);
          return 100;
        }
        return prevProgress + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-400 flex items-center justify-center z-50">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-gentle"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Road/Path Animation */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-800/30 to-transparent">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 w-8 h-1 bg-white/40"
          />
        </div>
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 mt-4">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }}
            className="absolute top-0 left-0 w-8 h-1 bg-white/40"
          />
        </div>
      </div> */}

      {/* Moving Cars */}
      {/* <motion.div
        animate={{ x: ['-200px', 'calc(100vw + 200px)'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-20 left-0"
      >
        <FiTruck className="w-12 h-12 text-white/80" />
      </motion.div>
      
      <motion.div
        animate={{ x: ['-200px', 'calc(100vw + 200px)'] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute bottom-16 left-0"
      >
        <FiTruck className="w-10 h-10 text-blue-200" />
      </motion.div>

      <motion.div
        animate={{ x: ['-200px', 'calc(100vw + 200px)'] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 4 }}
        className="absolute bottom-24 left-0"
      >
        <FiTruck className="w-14 h-14 text-purple-200" />
      </motion.div> */}

      <div className="relative z-10 text-center">
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Driver Monitoring
            </span>
            <span className="text-white ml-2">System </span>
          </h1>
          <p className="text-blue-200 text-lg">Driver application</p>
        </motion.div>

        {/* Central Car Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-8 relative"
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="inline-block"
          >
            <FiTruck className="w-20 h-20 text-white drop-shadow-lg" />
          </motion.div>
          
          {/* GPS/Navigation Icon */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute -top-2 -right-2"
          >
            <FiNavigation className="w-6 h-6 text-yellow-400" />
          </motion.div>
        </motion.div>

        {/* Loading Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <div className="relative w-64 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-blue-200 mt-3 text-sm font-medium">
            {progress < 50 ? 'Initializing Fleet System...' : 
             progress < 80 ? 'Loading Dashboard...' : 
             'Almost Ready...'} {progress}%
          </p>
        </motion.div>

        {/* Animated Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex justify-center space-x-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full flex items-center justify-center"
          >
            <FiMapPin className="w-4 h-4 text-blue-400" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center"
          >
            <FiTruck className="w-5 h-5 text-white" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="w-10 h-10 border-2 border-purple-400 rounded-full flex items-center justify-center"
          >
            <FiNavigation className="w-4 h-4 text-purple-400" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;
