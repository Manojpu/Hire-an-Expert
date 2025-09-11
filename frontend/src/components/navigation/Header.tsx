import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { Menu, X, User, Search, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth/AuthContext';
import { doSignOut } from '@/firebase/auth.js';


const Header = () => { 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, loggedIn } = useAuth();
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

  const handleSignOut = async () => {
    try {
      await doSignOut();
      setIsProfileDropdownOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Function to check if a route is active
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };


  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="AddWise Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-2xl font-extrabold">
              <span className="text-red-600">A</span>
              <span className="text-gray-800">ddWise</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/categories" 
              className={`transition-all duration-200 hover:font-bold ${
                isActiveRoute('/categories') 
                  ? 'text-foreground font-bold bg-primary/10 px-3 py-1 rounded-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Find Gigs
            </Link>
            <Link 
              to="/how-it-works" 
              className={`transition-all duration-200 hover:font-bold ${
                isActiveRoute('/how-it-works') 
                  ? 'text-foreground font-bold bg-primary/10 px-3 py-1 rounded-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              How it Works
            </Link>
            <Link 
              to="/create-gig" 
              className={`transition-all duration-200 hover:font-bold ${
                isActiveRoute('/create-gig') 
                  ? 'text-foreground font-bold bg-primary/10 px-3 py-1 rounded-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create A Gig
            </Link>
          </div>

          {/* Search Bar (moved slightly left to make room for Login button) */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search experts, services..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>


          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {loggedIn && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || user.email} 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate(`/profile/${user.uid || user.id}`);
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate('/my-bookings');
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        My Bookings
                      </button>
                      {user.isExpert && (
                        <button
                          onClick={() => {
                            navigate('/expert-dashboard');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          Expert Dashboard
                        </button>
                      )}
                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            navigate('/admin-dashboard');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          Admin Dashboard
                        </button>
                      )}
                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-gradient-primary hover:opacity-90"
                  onClick={() => navigate('/signup')}
                >
                  Sign Up
                </Button>
              </>
            )}

          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              <Link
                to="/categories"
                className={`transition-all duration-200 hover:font-bold px-2 py-1 ${
                  isActiveRoute('/categories') 
                    ? 'text-foreground font-bold bg-primary/10 rounded-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Find Gigs
              </Link>
              <Link
                to="/how-it-works"
                className={`transition-all duration-200 hover:font-bold px-2 py-1 ${
                  isActiveRoute('/how-it-works') 
                    ? 'text-foreground font-bold bg-primary/10 rounded-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link
                to="/create-gig"
                className={`transition-all duration-200 hover:font-bold px-2 py-1 ${
                  isActiveRoute('/create-gig') 
                    ? 'text-foreground font-bold bg-primary/10 rounded-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Create A Gig
              </Link>

              
              {/* Mobile Menu Actions */}
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                {loggedIn && user ? (
                  <>
                    <div className="flex items-center gap-2 px-2 py-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.displayName || user.email} 
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {user.displayName || user.email?.split('@')[0] || 'User'}
                      </span>
                    </div>
                    <button 
                      onClick={() => { 
                        navigate(`/profile/${user.uid || user.id}`); 
                        setIsMenuOpen(false); 
                      }} 
                      className="text-left px-2 py-1 hover:bg-muted rounded-md transition-colors"
                    >
                      Profile
                    </button>
                    <button 
                      onClick={() => { 
                        navigate('/my-bookings'); 
                        setIsMenuOpen(false); 
                      }} 
                      className="text-left px-2 py-1 hover:bg-muted rounded-md transition-colors"
                    >
                      My Bookings
                    </button>
                    {user.isExpert && (
                      <button 
                        onClick={() => { 
                          navigate('/expert-dashboard'); 
                          setIsMenuOpen(false); 
                        }} 
                        className="text-left px-2 py-1 hover:bg-muted rounded-md transition-colors"
                      >
                        Expert Dashboard
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => { 
                          navigate('/admin-dashboard'); 
                          setIsMenuOpen(false); 
                        }} 
                        className="text-left px-2 py-1 hover:bg-muted rounded-md transition-colors"
                      >
                        Admin Dashboard
                      </button>
                    )}
                    <button 
                      onClick={() => { 
                        handleSignOut(); 
                        setIsMenuOpen(false); 
                      }} 
                      className="text-left px-2 py-1 hover:bg-muted rounded-md transition-colors text-destructive flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigate('/login');
                        setIsMenuOpen(false);
                      }}
                      className="mx-2"
                    >
                      Login
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-gradient-primary mx-2"
                      onClick={() => {
                        navigate('/signup');
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}

              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;