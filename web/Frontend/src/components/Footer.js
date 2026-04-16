import React from 'react';
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiPhone,
  FiMapPin
} from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-[#0B0F19]">
      {/* Top Gradient Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>

      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Driver Management
              </h3>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-2"></div>
            </div>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed">
              Complete fleet management solution for modern businesses. Manage your vehicles, drivers, and operations with ease.
            </p>
            <div className="flex space-x-4">
              {[FiFacebook, FiTwitter, FiInstagram, FiLinkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 bg-gray-800/50 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-300"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Contact Us</h3>
              <div className="w-10 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            </div>
            <div className="space-y-4">
              {[
                { icon: FiMapPin, text: "123 Business District, Islamabad, Pakistan 44000" },
                { icon: FiPhone, text: "+92 326 522 0037" },
                { icon: FiMail, text: "driver@fleetpro.com" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-4 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800/50 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-500 text-xs">
              © 2024 FleetPro Management. All rights reserved.
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-xs">Built with</span>
              <span className="text-red-500">❤️</span>
              <span className="text-gray-500 text-xs">for modern fleet management</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
