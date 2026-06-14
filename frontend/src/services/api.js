import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for HTTP-only session cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach headers if cookies are blocked
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    if (refreshToken) {
      config.headers['x-refresh-token'] = refreshToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session timeouts and token caching
api.interceptors.response.use(
  (response) => {
    const newAccess = response.headers['x-new-access-token'];
    const newRefresh = response.headers['x-new-refresh-token'];
    if (newAccess) {
      localStorage.setItem('accessToken', newAccess);
    }
    if (newRefresh) {
      localStorage.setItem('refreshToken', newRefresh);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized. Redirecting to admin login...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Only redirect if we are inside the admin paths
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
