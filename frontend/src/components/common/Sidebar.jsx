import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Package,
  Cpu,
  Navigation,
  FlaskConical,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, isAdmin, isManager, isViewer, logout } = useAuth();

  // Role-specific navigation items
  let navItems = [];

  if (isViewer) {
    // Viewer only sees targeted shipment & truck delivery tracking
    navItems = [
      { name: 'Shipment Tracking', path: '/tracking', icon: Navigation, badge: 'Portal' },
    ];
  } else {
    // Admin and Logistics Manager have operational control
    navItems = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Truck Fleet', path: '/trucks', icon: Truck },
      { name: 'Packages', path: '/packages', icon: Package },
      { name: 'Load Optimization', path: '/optimization', icon: Cpu, badge: 'Core' },
      { name: 'Delivery Planning', path: '/delivery', icon: Navigation },
      { name: 'What-If Simulation', path: '/simulation', icon: FlaskConical },
      { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      { name: 'Track Deliveries', path: '/tracking', icon: Navigation },
      ...(isAdmin ? [{ name: 'User Management', path: '/users', icon: ShieldCheck }] : []),
    ];
  }

  const roleBadgeColors = {
    ADMIN: 'bg-purple-900/60 text-purple-300 border-purple-700',
    LOGISTICS_MANAGER: 'bg-blue-900/60 text-blue-300 border-blue-700',
    VIEWER: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80">
        <Logo size="sm" variant="dark" collapsed={isCollapsed} />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Info & Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <div className="mt-1">
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-md border font-semibold tracking-wider uppercase ${
                    roleBadgeColors[user?.role] || roleBadgeColors.VIEWER
                  }`}
                >
                  {user?.role?.replace('_', ' ') || 'VIEWER'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
