import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = () => {
  const { user } = useAuth();
  const { backgroundTheme, setBackgroundTheme, themeOptions, currentTheme } = useTheme();
  const location = useLocation();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard':
        return 'Operational Fleet Dashboard';
      case '/trucks':
        return 'Fleet & Vehicle Capacity Management';
      case '/packages':
        return 'Package Cargo & Freight Inventory';
      case '/optimization':
        return 'Constraint-Aware Smart Load Optimization';
      case '/delivery':
        return 'Delivery Sequence & Route Dispatch';
      case '/simulation':
        return 'What-If Logistics Simulation Lab';
      case '/reports':
        return 'Reports & Data Analytics Export';
      case '/users':
        return 'Role-Based Access Control & Audit Log';
      case '/tracking':
        return 'Shipment & Vehicle Tracking Portal';
      default:
        return 'LoadOpt Logistics';
    }
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          {getPageTitle(location.pathname)}
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>LoadOpt</span>
          <span>/</span>
          <span className="capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Background Theme Selector */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Change Background Theme"
          >
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">{currentTheme.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 text-xs z-50 animate-in fade-in">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Background Style
              </div>
              <div className="space-y-1">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setBackgroundTheme(opt.id);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                      backgroundTheme === opt.id
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div>
                      <div>{opt.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{opt.description}</div>
                    </div>
                    {backgroundTheme === opt.id && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
