import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RefreshCw } from 'lucide-react';

export const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const { themeClass } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Initializing LoadOpt Workspace...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`flex h-screen ${themeClass} overflow-hidden transition-all duration-300`}>
      {/* Sidebar Navigation */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
