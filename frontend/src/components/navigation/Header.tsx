import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MockSignIn from '@/components/auth/MockSignIn';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    logout();
    navigate('/');
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
              Find Experts
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
              to="/become-expert" 
              className={`transition-all duration-200 hover:font-bold ${
                isActiveRoute('/become-expert') 
                  ? 'text-foreground font-bold bg-primary/10 px-3 py-1 rounded-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Become an Expert
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
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
            {state.user ? (
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(state.user?.role === 'expert' ? '/expert-dashboard' : state.user?.role === 'admin' ? '/admin' : '/profile')} className="flex items-center gap-2">
                  <img src={state.user.profileImage} alt={state.user.name} className="h-8 w-8 rounded-full" />
                  <span className="text-sm font-medium">{state.user.name.split(' ')[0]}</span>
                </button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <MockSignIn />
                <Button variant="default" size="sm" className="bg-gradient-primary hover:opacity-90">
                  Get Started
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
                Find Experts
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
                to="/become-expert"
                className={`transition-all duration-200 hover:font-bold px-2 py-1 ${
                  isActiveRoute('/become-expert') 
                    ? 'text-foreground font-bold bg-primary/10 rounded-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Become an Expert
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                {state.user ? (
                  <>
                    <button onClick={() => { navigate(state.user?.role === 'expert' ? '/expert-dashboard' : state.user?.role === 'admin' ? '/admin' : '/profile'); setIsMenuOpen(false); }} className="text-left px-2 py-1">Dashboard</button>
                    <button onClick={() => { handleSignOut(); setIsMenuOpen(false); }} className="text-left px-2 py-1">Sign Out</button>
                  </>
                ) : (
                  <>
                    <MockSignIn />
                    <Button variant="default" size="sm" className="bg-gradient-primary">Get Started</Button>

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