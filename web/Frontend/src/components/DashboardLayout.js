import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi';

const getBackendUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL.replace(/\/api$/, '');
    }
    return `http://${window.location.hostname}:5000`;
};
const BACKEND_URL = getBackendUrl();

const DashboardLayout = ({ children, user, activePage, navigationItems }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get breadcrumb path based on active page
  const getBreadcrumbPath = () => {
    const role = user?.role;
    const homePath = role === 'admin' ? '/dashboard/trips' : '/driver-dashboard/trips';
    const homeLabel = role === 'admin' ? 'Admin Dashboard' : 'Driver Dashboard';

    return [
      { label: homeLabel, path: homePath, icon: FiHome },
      { label: activePage, path: null, icon: null }
    ];
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    // Hard reload the page to clear any cached state
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header - Full Width */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 px-6 py-4 z-30">
        <div className="flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-600 hover:text-gray-900 mr-4 lg:hidden"
            >
              <FiMenu className="w-6 h-6" />
            </button>

            {/* Logo/Brand Text - Same width as sidebar */}
            <div className="w-64 mr-8">
              <h1 className="text-xl font-bold text-theme-text-primary">
                <span className="bg-gradient-to-r from-theme-primary to-theme-accent-blue bg-clip-text text-transparent">
                  {user?.role === 'admin' ? 'Admin' : 'Driver'}
                </span>
                <span className="ml-1 text-theme-text-primary">Dashboard</span>
              </h1>
            </div>

            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2">
              {getBreadcrumbPath().map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-2 text-gray-400">/</span>
                  )}
                  {item.path ? (
                    <button
                      onClick={() => navigate(item.path)}
                      className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors duration-300"
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ) : (
                    <span className="flex items-center space-x-1 text-gray-800">
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span className="text-sm font-semibold capitalize">{item.label}</span>
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-300 hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5 5-5h-5m-6 10v-5a6 6 0 00-12 0v5h12z" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img
                    src={
                      user.profileImage.startsWith('http')
                        ? user.profileImage
                        : user.profileImage.startsWith('/')
                          ? `${BACKEND_URL}${user.profileImage}`
                          : `${BACKEND_URL}/uploads/${user.profileImage}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className={`text-white font-semibold text-sm ${user?.profileImage ? 'hidden' : 'flex'}`}>
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-theme-sidebar-bg shadow-2xl z-20 hidden lg:flex flex-col">
        {/* Navigation */}
        <div className="flex flex-col flex-1 min-h-0">
          <nav className="flex-1 px-3 pt-6 overflow-y-auto min-h-[calc(100vh-140px)]">
            {navigationItems.map((item, index) => (
              <motion.button
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-4 py-3 mb-2 text-left rounded-lg transition-all duration-300 ${activePage === item.name
                  ? 'bg-theme-primary text-white shadow-lg'
                  : 'text-theme-text-secondary hover:bg-theme-primary-light hover:text-theme-text-primary'
                  }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </motion.button>
            ))}
          </nav>

          {/* Logout Button - Fixed at bottom */}
          <div className="px-3 pb-6 pt-4 flex-shrink-0">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: navigationItems.length * 0.1 }}
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-left rounded-lg text-theme-text-secondary hover:bg-red-600 hover:text-white transition-all duration-300"
            >
              <FiLogOut className="w-5 h-5 mr-3" />
              <span className="font-medium">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Page Content */}
        <main className="pt-28 p-6 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 w-64 h-screen bg-theme-sidebar-bg shadow-2xl flex flex-col"
          >
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-300 flex-shrink-0">
              <h1 className="text-xl font-bold text-theme-text-primary">
                <span className="bg-gradient-to-r from-theme-primary to-theme-accent-blue bg-clip-text text-transparent">
                  {user?.role === 'admin' ? 'Admin' : 'Driver'}
                </span>
                <span className="ml-1 text-theme-text-primary">Dashboard</span>
              </h1>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-theme-text-secondary hover:text-theme-text-primary transition-colors duration-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex flex-col flex-1 min-h-0">
              <nav className="flex-1 px-3 pt-6 overflow-y-auto">
                {navigationItems.map((item, index) => (
                  <motion.button
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 mb-2 text-left rounded-lg transition-all duration-300 ${activePage === item.name
                      ? 'bg-theme-primary text-white shadow-lg'
                      : 'text-theme-text-secondary hover:bg-theme-primary-light hover:text-theme-text-primary'
                      }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Mobile Logout Button - Fixed at bottom */}
              <div className="px-3 pb-6 pt-4 flex-shrink-0">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: navigationItems.length * 0.1 }}
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-3 text-left rounded-lg text-theme-text-secondary hover:bg-red-600 hover:text-white transition-all duration-300"
                >
                  <FiLogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
