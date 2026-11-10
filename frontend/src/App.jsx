import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TruckManagement } from './pages/TruckManagement';
import { PackageManagement } from './pages/PackageManagement';
import { OptimizationView } from './pages/OptimizationView';
import { DeliveryPlanning } from './pages/DeliveryPlanning';
import { WhatIfSimulation } from './pages/WhatIfSimulation';
import { Reports } from './pages/Reports';
import { UserManagement } from './pages/UserManagement';
import { TrackingPortal } from './pages/TrackingPortal';

// Component to redirect root / based on role
function RoleBasedRedirect() {
  const { isViewer } = useAuth();
  return <Navigate to={isViewer ? '/tracking' : '/dashboard'} replace />;
}

// Protected Route for Manager and Admin only
function ManagerOrAdminRoute({ children }) {
  const { canModify } = useAuth();
  if (!canModify) {
    return <Navigate to="/tracking" replace />;
  }
  return children;
}

// Protected Route for Admin only
function AdminOnlyRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />

          {/* Authenticated Workspace */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<RoleBasedRedirect />} />

            {/* Viewer Essential Portal */}
            <Route path="/tracking" element={<TrackingPortal />} />

            {/* Operational Management (Admin & Manager) */}
            <Route
              path="/dashboard"
              element={
                <ManagerOrAdminRoute>
                  <Dashboard />
                </ManagerOrAdminRoute>
              }
            />
            <Route
              path="/trucks"
              element={
                <ManagerOrAdminRoute>
                  <TruckManagement />
                </ManagerOrAdminRoute>
              }
            />
            <Route
              path="/packages"
              element={
                <ManagerOrAdminRoute>
                  <PackageManagement />
                </ManagerOrAdminRoute>
              }
            />
            <Route
              path="/optimization"
              element={
                <ManagerOrAdminRoute>
                  <OptimizationView />
                </ManagerOrAdminRoute>
              }
            />
            <Route
              path="/delivery"
              element={
                <ManagerOrAdminRoute>
                  <DeliveryPlanning />
                </ManagerOrAdminRoute>
              }
            />
            <Route
              path="/simulation"
              element={
                <ManagerOrAdminRoute>
                  <WhatIfSimulation />
                </ManagerOrAdminRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ManagerOrAdminRoute>
                  <Reports />
                </ManagerOrAdminRoute>
              }
            />

            {/* Admin Exclusive */}
            <Route
              path="/users"
              element={
                <AdminOnlyRoute>
                  <UserManagement />
                </AdminOnlyRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
}
