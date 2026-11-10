/**
 * Central API Client for LoadOpt Backend Services
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getStoredToken = () => localStorage.getItem('loadopt_token');
export const setStoredToken = (token) => localStorage.setItem('loadopt_token', token);
export const removeStoredToken = () => {
  localStorage.removeItem('loadopt_token');
  localStorage.removeItem('loadopt_user');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('loadopt_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem('loadopt_user', JSON.stringify(user));
};

async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    removeStoredToken();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      setStoredToken(data.access_token);
      setStoredUser(data.user);
    }
    return data;
  },
  getCurrentUser: () => apiRequest('/auth/me'),

  // Trucks
  getTrucks: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.min_weight) searchParams.set('min_weight', params.min_weight);
    if (params.max_weight) searchParams.set('max_weight', params.max_weight);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/trucks${query}`);
  },
  getTruck: (id) => apiRequest(`/trucks/${id}`),
  createTruck: (payload) => apiRequest('/trucks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTruck: (id, payload) => apiRequest(`/trucks/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTruck: (id) => apiRequest(`/trucks/${id}`, { method: 'DELETE' }),

  // Packages
  getPackages: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.destination) searchParams.set('destination', params.destination);
    if (params.status) searchParams.set('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiRequest(`/packages${query}`);
  },
  getPackage: (id) => apiRequest(`/packages/${id}`),
  createPackage: (payload) => apiRequest('/packages', { method: 'POST', body: JSON.stringify(payload) }),
  updatePackage: (id, payload) => apiRequest(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePackage: (id) => apiRequest(`/packages/${id}`, { method: 'DELETE' }),

  // Optimization
  runOptimization: (payload = {}) => apiRequest('/optimization/run', { method: 'POST', body: JSON.stringify(payload) }),
  getOptimizationRuns: () => apiRequest('/optimization/runs'),
  resetAssignments: () => apiRequest('/optimization/reset', { method: 'POST' }),

  // What-If Simulation
  runSimulation: (payload) => apiRequest('/simulation/run', { method: 'POST', body: JSON.stringify(payload) }),
  applySimulation: (payload) => apiRequest('/simulation/apply', { method: 'POST', body: JSON.stringify(payload) }),

  // Dashboard & Reports
  getDashboardMetrics: () => apiRequest('/dashboard'),
  getReportsSummary: () => apiRequest('/reports/summary'),
  downloadTrucksCsv: () => apiRequest('/reports/export/trucks'),
  downloadPackagesCsv: () => apiRequest('/reports/export/packages'),
  downloadAssignmentsCsv: () => apiRequest('/reports/export/assignments'),

  // Admin User Management
  getUsers: () => apiRequest('/users'),
  toggleUserStatus: (id) => apiRequest(`/users/${id}/status`, { method: 'PUT' }),
  getAuditLogs: () => apiRequest('/users/audit-logs'),

  // Tracking Lookup
  trackShipmentOrTruck: (query) => apiRequest(`/tracking/lookup?query=${encodeURIComponent(query)}`),
};
