import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    // Redirect will happen automatically due to auth context
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900">3S Resume Screener</span>
              </Link>
            </div>
            
            {/* Desktop navigation links */}
            {isAuthenticated && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4 sm:items-center">
                <Link 
                  to="/dashboard" 
                  className={`${isActive('/dashboard') ? 'nav-link-active' : 'nav-link'}`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/help" 
                  className={`${isActive('/help') ? 'nav-link-active' : 'nav-link'}`}
                >
                  Help
                </Link>
              </div>
            )}
          </div>
          
          {/* User menu and mobile menu button */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center">
                {/* User info */}
                <div className="hidden md:flex items-center mr-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-white"
                >
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
                
                {/* Mobile menu button */}
                <div className="flex items-center sm:hidden ml-3">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  >
                    <span className="sr-only">Open main menu</span>
                    {isMenuOpen ? (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link to="/login" className="btn btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && isAuthenticated && (
        <div className="sm:hidden animate-fadeIn">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              to="/dashboard" 
              className={`block px-3 py-2 text-base font-medium ${
                isActive('/dashboard') 
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              to="/help" 
              className={`block px-3 py-2 text-base font-medium ${
                isActive('/help') 
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Help
            </Link>
            
            {/* Mobile user info */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user?.email || ''}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-white hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 