import React from 'react';
import { Bell, Menu, User } from 'lucide-react';
import { useAuth } from '@/context/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  role: 'expert' | 'client' | 'admin' | 'all';
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/expert-dashboard', role: 'expert' },
  { label: 'Bookings', href: '/expert-dashboard/bookings', role: 'expert' },
  { label: 'Calendar', href: '/expert-dashboard/calendar', role: 'expert' },
  { label: 'Earnings', href: '/expert-dashboard/earnings', role: 'expert' },
  { label: 'Profile', href: '/expert-dashboard/profile', role: 'expert' },
];

const Header: React.FC<{ onMenuToggle?: () => void }> = ({ onMenuToggle }) => {
  const { state, user } = useAuth();
  const location = useLocation();
  const hasNotifications = true; // TODO: Replace with actual notifications state

  const userRole = user?.role || 'expert';
  const filteredNavItems = navItems.filter(
    item => item.role === 'all' || item.role === userRole
  );

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 w-full backdrop-blur-sm bg-white/80 supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto">
        <div className="h-16 flex items-center justify-between px-4">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="md:hidden hover:bg-[#f5f5f5] text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight">Expert Dashboard</span>
              <Separator orientation="vertical" className="h-6 hidden md:block" />
              <span className="text-sm text-[#00b22d] hidden md:block">Online</span>
            </div>
          </div>

          {/* Navigation Items - Desktop */}
          <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'text-sm font-medium relative py-4 transition-colors hover:text-[#00b22d]',
                  location.pathname === item.href
                    ? 'text-[#00b22d] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#00b22d]'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-[#f5f5f5] text-muted-foreground"
              >
                <Bell className="h-5 w-5" />
                {hasNotifications && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ff6d00] ring-2 ring-white" />
                )}
              </Button>
            </div>

            {/* Avatar and user info */}
            <div className="flex items-center gap-3 pl-2">
              <div className="flex items-center gap-3 p-1.5 rounded-full transition-colors hover:bg-[#f5f5f5] cursor-pointer">
                <div className="relative h-8 w-8 rounded-full ring-2 ring-[#00b22d]/10 overflow-hidden bg-[#f5f5f5] flex items-center justify-center">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name || 'User avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#00b22d] ring-2 ring-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium leading-none">{user?.name?.split(' ')[0] || 'Guest'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Expert'}</p>
                </div>
              </div>
            </div>
          </div>
        
        {/* Navigation Items - Mobile */}
        <div className="md:hidden overflow-x-auto">
          <nav className="flex items-center gap-4 px-4 border-t border-border">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'text-sm font-medium whitespace-nowrap py-3 transition-colors',
                  location.pathname === item.href
                    ? 'text-[#00b22d] border-b-2 border-[#00b22d]'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
