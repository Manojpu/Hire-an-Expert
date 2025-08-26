import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`${isMobile ? 'fixed z-50' : 'fixed'} left-0 top-0 bottom-0 w-64`}> 
        <Sidebar onClose={() => setSidebarOpen(false)} isOpen={sidebarOpen} />
      </div>

      <div className={`${isMobile ? '' : 'ml-64'} min-h-screen`}> 
        <Header onMenuToggle={() => setSidebarOpen((s) => !s)} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
