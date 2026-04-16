import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiTruck, FiUser, FiBarChart, FiShield, FiMapPin, FiAlertTriangle, FiStar, FiZap, FiTrendingUp } from 'react-icons/fi';
import Footer from '../components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Driver
              </span>
              <span className="text-gray-800 ml-2">Management</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex space-x-4"
          >
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-all duration-300"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 font-medium"
            >
              <span>Get Started</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        {/* Hero Section */}
        <section className="pt-16 pb-16 px-6 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Animated Gradient Orbs */}
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, -60, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, 60, 0],
                y: [0, 80, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4,
              }}
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-to-r from-blue-300/25 to-cyan-400/25 rounded-full blur-3xl"
            />

            {/* Animated Floating Shapes */}
            <motion.div
              animate={{
                y: [0, -30, 0],
                rotate: [0, 180, 360],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/4 left-1/4 w-20 h-20 border-2 border-blue-400/40 rounded-lg rotate-45"
            />
            <motion.div
              animate={{
                y: [0, 40, 0],
                rotate: [360, 180, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-purple-400/40 rounded-full"
            />
            <motion.div
              animate={{
                y: [0, -25, 0],
                rotate: [0, -180, -360],
                opacity: [0.35, 0.65, 0.35],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              className="absolute bottom-1/3 left-1/3 w-12 h-12 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-lg rotate-12"
            />

            {/* Animated Grid Pattern */}
            <motion.div
              animate={{
                opacity: [0.05, 0.12, 0.05],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(147, 51, 234, 0.15) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />

            {/* Animated Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -100, 0],
                  x: [0, Math.sin(i) * 50, 0],
                  opacity: [0, 0.6, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.8,
                }}
                className="absolute w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + i * 10}%`,
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-5xl mx-auto">
              {/* Hero Badge */}
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-100 mb-6"
              >
                <FiStar className="w-3.5 h-3.5 text-yellow-500 mr-2" />
                <span className="text-blue-700 text-xs font-semibold">Fleet Management Platform</span>
              </motion.div>

              {/* Hero Text */}
              <motion.h1
                variants={itemVariants}
                className="font-bold text-gray-900 mb-5 leading-tight"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
              >
                <span className="text-gray-900">Driver </span>
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Safety Monitoring
                </span>
                <span className="text-gray-900"> System</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
              >
                Complete fleet operations management with real-time tracking, incident reporting,
                driver management, and advanced analytics in one powerful platform.
              </motion.p>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-3 gap-6 md:gap-8 mb-12 max-w-2xl mx-auto"
              >
                {[
                  { value: "500+", label: "Active Vehicles", icon: FiTruck },
                  { value: "1,200+", label: "Drivers Managed", icon: FiUser },
                  { value: "50,000+", label: "Trips Completed", icon: FiTrendingUp }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mb-2">
                      <stat.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stat.value}</div>
                    <div className="text-xs md:text-sm text-gray-600 font-medium mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16"
              >
                <button
                  onClick={() => navigate('/register')}
                  className="group px-7 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <span>Access Platform</span>
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-7 py-3 bg-white text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <FiCheck className="w-4 h-4 text-green-600" />
                  <span>Sign In</span>
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Powerful Features for
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Modern Fleet Management</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to manage your fleet efficiently and safely
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: FiTruck,
                  title: "Fleet Management",
                  description: "Complete vehicle lifecycle management with maintenance tracking and real-time status updates",
                  color: "from-blue-500 to-blue-600",
                  bgColor: "bg-blue-50",
                  borderColor: "border-blue-200"
                },
                {
                  icon: FiUser,
                  title: "Driver Management",
                  description: "Comprehensive driver profiles, performance tracking, and safety monitoring",
                  color: "from-green-500 to-green-600",
                  bgColor: "bg-green-50",
                  borderColor: "border-green-200"
                },
                {
                  icon: FiBarChart,
                  title: "Analytics & Reports",
                  description: "Advanced analytics and detailed reporting for data-driven decision making",
                  color: "from-purple-500 to-purple-600",
                  bgColor: "bg-purple-50",
                  borderColor: "border-purple-200"
                },
                {
                  icon: FiMapPin,
                  title: "Real-time Tracking",
                  description: "Live GPS tracking with route optimization and delivery status updates",
                  color: "from-orange-500 to-orange-600",
                  bgColor: "bg-orange-50",
                  borderColor: "border-orange-200"
                },
                {
                  icon: FiAlertTriangle,
                  title: "Incident Management",
                  description: "Streamlined incident reporting and resolution with automated notifications",
                  color: "from-red-500 to-red-600",
                  bgColor: "bg-red-50",
                  borderColor: "border-red-200"
                },
                {
                  icon: FiShield,
                  title: "Security & Compliance",
                  description: "Enterprise-grade security with compliance monitoring and audit trails",
                  color: "from-indigo-500 to-indigo-600",
                  bgColor: "bg-indigo-50",
                  borderColor: "border-indigo-200"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`group bg-white rounded-2xl p-8 border-2 ${feature.borderColor} hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:-translate-y-2`}
                >
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                  Why Choose Us
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  Built for <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Modern Teams</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Our platform is designed with your team in mind, offering intuitive interfaces and powerful features that scale with your business.
                </p>
                <div className="space-y-4">
                  {[
                    "Real-time monitoring and alerts",
                    "Comprehensive analytics dashboard",
                    "Mobile-friendly interface",
                    "Enterprise-grade security"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiCheck className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700 text-lg">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { icon: FiZap, label: "Fast Response", value: "< 2s" },
                      { icon: FiTrendingUp, label: "Efficiency", value: "+40%" },
                      { icon: FiShield, label: "Security", value: "99.9%" },
                      { icon: FiStar, label: "Satisfaction", value: "4.9/5" }
                    ].map((metric, index) => (
                      <div key={index} className="bg-white rounded-xl p-6 text-center shadow-lg">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mb-3">
                          <metric.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                        <div className="text-sm text-gray-600">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Fleet Management?
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join thousands of companies already using our platform to streamline their operations
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                >
                  <span>Start Free Trial</span>
                  <FiArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border-2 border-white/30 flex items-center justify-center space-x-2"
                >
                  <FiCheck className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </motion.div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
