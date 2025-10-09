import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, FileText, CreditCard, Brain } from 'lucide-react';
import { useAuth } from '@/context/auth/AuthContext';
import { doSignOut } from '@/firebase/auth.js';

const AdminHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await doSignOut();
      setIsProfileDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Admin sign out error:', error);
    }
  };

  // Function to check if a route is active
  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const adminNavItems = [
    {
      name: 'Dashboard',
      path: '/admin-dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    {
      name: 'Requests',
      path: '/admin-requests',
      icon: FileText,
      description: 'User & Expert Requests'
    },
    {
      name: 'Payments',
      path: '/admin-payments',
      icon: CreditCard,
      description: 'Transaction Management'
    },
    {
      name: 'RAG System',
      path: '/admin-rag',
      icon: Brain,
      description: 'Knowledge Management'
    }
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-100 backdrop-blur-md border-b border-gray-300/50 shadow-xl shadow-gray-200/20"
      style={{ backgroundColor: '#F2F7FD' }}>
      <style>
        {`
        .glass-glow-green {
          -webkit-box-shadow: 0px 20px 20px -17px rgba(34, 197, 94, 0.53);
          -moz-box-shadow: 0px 20px 20px -17px rgba(34, 197, 94, 0.53);
          box-shadow: 0px 20px 20px -17px rgba(34, 197, 94, 0.53);
          transition: all 0.3s ease;
          transform: translateY(-2px);
          background-color: #fafafa;
        }
        .glass-glow-green:hover {
          -webkit-box-shadow: 0px 20px 35px -16px rgba(34, 197, 94, 0.65);
          -moz-box-shadow: 0px 20px 35px -16px rgba(34, 197, 94, 0.65);
          box-shadow: 0px 20px 35px -16px rgba(34, 197, 94, 0.65);
          transform: translateY(-5px);
          background-color: #f5f5f5;
        }
        .glass-icon-glow {
          -webkit-box-shadow: 0px 15px 15px -12px rgba(34, 197, 94, 0.4);
          -moz-box-shadow: 0px 15px 15px -12px rgba(34, 197, 94, 0.4);
          box-shadow: 0px 15px 15px -12px rgba(34, 197, 94, 0.4);
          transition: all 0.3s ease;
        }
        .glass-icon-glow:hover {
          -webkit-box-shadow: 0px 18px 25px -10px rgba(34, 197, 94, 0.6);
          -moz-box-shadow: 0px 18px 25px -10px rgba(34, 197, 94, 0.6);
          box-shadow: 0px 18px 25px -10px rgba(34, 197, 94, 0.6);
        }
        .glass-text-gradient {
          background: linear-gradient(to right, #1f2937, #111827 70%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0px 8px 25px rgba(34, 197, 94, 0.6);
          font-weight: 600;
        }
        `}
      </style>
      <nav className="container mx-auto px-3 md:px-4 lg:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Admin Logo & Brand */}
          <Link to="/admin-dashboard" className="flex items-center space-x-2 md:space-x-3 group min-w-0">
            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-white via-slate-50 to-gray-100 flex items-center justify-center shadow-lg shadow-gray-300/40 border-2 border-gray-200/60 group-hover:shadow-xl group-hover:shadow-gray-400/50 transition-all duration-300 group-hover:scale-105 flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/60 to-transparent"></div>
              <img src="/logo.png" alt="AddWise Logo" className="w-7 h-7 md:w-9 md:h-9 object-contain relative z-10 drop-shadow-sm" />
            </div>
            <span className="text-xl md:text-2xl font-extrabold text-slate-800 truncate">
              <span className="text-red-600">A</span>
              <span>ddWise</span>
            </span>
          </Link>

          {/* Desktop Navigation - Show at medium screens and up */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-1 justify-center max-w-4xl mx-4">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center space-x-2 lg:space-x-3 px-3 lg:px-5 py-3 rounded-xl transition-all duration-300 group border ${
                    isActive
                      ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 text-gray-800 border-emerald-200/80 backdrop-blur-sm glass-glow-green'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-gradient-to-br hover:from-slate-50 hover:to-gray-100 border-transparent hover:border-slate-200/60 hover:shadow-md hover:shadow-slate-200/40 hover:scale-102'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-br from-emerald-100 to-green-200 glass-icon-glow' 
                      : 'bg-gradient-to-br from-slate-100 to-gray-200 group-hover:from-slate-200 group-hover:to-gray-300 shadow-inner shadow-slate-300/30'
                  }`}>
                    <Icon className={`w-4 h-4 transition-all duration-300 flex-shrink-0 ${isActive ? 'scale-110 text-gray-700 drop-shadow-sm' : 'text-slate-500 group-hover:scale-105 group-hover:text-slate-600'}`} />
                  </div>
                  <div className="hidden lg:flex flex-col min-w-0">
                    <span className={`text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'glass-text-gradient' : ''}`}>{item.name}</span>
                    <span className={`text-xs opacity-80 truncate font-medium ${isActive ? 'text-gray-600' : ''}`}>{item.description}</span>
                  </div>
                  <span className={`lg:hidden text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'glass-text-gradient' : ''}`}>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile & Actions */}
          <div className="hidden sm:flex items-center space-x-3 md:space-x-4">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-3 md:gap-4 p-3 rounded-xl hover:bg-gradient-to-br hover:from-slate-50 hover:to-gray-100 hover:shadow-md hover:shadow-slate-200/40 transition-all duration-300 group border border-transparent hover:border-slate-200/60"
                >
                  <div className="relative h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-400/30 group-hover:shadow-xl group-hover:shadow-emerald-400/40 transition-all duration-300 border border-emerald-300/50">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || user.email} 
                        className="h-9 w-9 md:h-10 md:w-10 rounded-xl object-cover relative z-10"
                      />
                    ) : (
                      <User className="h-5 w-5 text-white relative z-10" />
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold text-slate-700 truncate max-w-24 lg:max-w-32 tracking-wide">
                      {user.displayName || user.email?.split('@')[0] || 'Admin'}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium tracking-wider uppercase">Administrator</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block transition-transform duration-300 group-hover:text-slate-600" />
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-2xl shadow-2xl shadow-gray-300/30 z-50">
                    <div className="py-3">
                      <div className="px-5 py-4 border-b border-gray-200/60">
                        <p className="text-sm font-semibold text-slate-700 tracking-wide">Signed in as</p>
                        <p className="text-sm text-slate-500 truncate font-medium">{user.email}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          navigate('/');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-5 py-3 text-sm text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-100 hover:text-slate-800 transition-all duration-300 font-medium tracking-wide"
                      >
                        Back to Main Site
                      </button>
                      
                      <hr className="my-2 border-gray-200/60" />
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 transition-all duration-300 flex items-center gap-3 font-medium tracking-wide"
                      >
                        <div className="p-1.5 rounded-lg bg-red-100">
                          <LogOut className="h-3.5 w-3.5" />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 rounded-xl hover:bg-gradient-to-br hover:from-slate-50 hover:to-gray-100 hover:shadow-md hover:shadow-slate-200/40 transition-all duration-300 border border-transparent hover:border-slate-200/60"
          >
            <div className="p-1 rounded-lg bg-gradient-to-br from-slate-100 to-gray-200 shadow-inner shadow-slate-300/30">
              {isMenuOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pb-6 border-t border-gray-200/60">
            <div className="flex flex-col space-y-3 mt-6">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 border ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 text-gray-800 border-emerald-200/80 glass-glow-green'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-gradient-to-br hover:from-slate-50 hover:to-gray-100 border-transparent hover:border-slate-200/60 hover:shadow-md hover:shadow-slate-200/40'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-emerald-100 to-green-200 glass-icon-glow' 
                        : 'bg-gradient-to-br from-slate-100 to-gray-200 shadow-inner shadow-slate-300/30'
                    }`}>
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-700 drop-shadow-sm' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'glass-text-gradient' : ''}`}>{item.name}</span>
                      <span className={`text-xs opacity-80 truncate font-medium ${isActive ? 'text-gray-600' : ''}`}>{item.description}</span>
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Profile Section */}
              {user && (
                <div className="mt-8 pt-6 border-t border-gray-200/60">
                  <div className="flex items-center gap-4 px-5 py-4 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl border border-slate-200/60 shadow-md shadow-slate-200/40">
                    <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-400/30 border border-emerald-300/50 flex-shrink-0">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || user.email} 
                          className="h-12 w-12 rounded-xl object-cover relative z-10"
                        />
                      ) : (
                        <User className="h-6 w-6 text-white relative z-10" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-slate-700 truncate tracking-wide">
                        {user.displayName || user.email?.split('@')[0] || 'Admin'}
                      </span>
                      <span className="text-xs text-emerald-600 font-medium tracking-wider uppercase">Administrator</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { 
                      navigate('/'); 
                      setIsMenuOpen(false); 
                    }} 
                    className="w-full text-left px-5 py-3 mt-3 text-sm text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-100 hover:text-slate-800 transition-all duration-300 rounded-xl font-medium tracking-wide"
                  >
                    Back to Main Site
                  </button>
                  
                  <button 
                    onClick={() => { 
                      handleSignOut(); 
                      setIsMenuOpen(false); 
                    }} 
                    className="w-full text-left px-5 py-3 mt-2 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 transition-all duration-300 flex items-center gap-3 rounded-xl font-medium tracking-wide"
                  >
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <LogOut className="h-4 w-4" />
                    </div>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default AdminHeader;