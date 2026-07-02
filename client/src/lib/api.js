import axios from 'axios';

/**
 * Centralised axios instance — all API calls go through here.
 * Benefits:
 * - Base URL in ONE place (change backend URL once for entire app)
 * - withCredentials: true sends httpOnly cookies automatically on every request
 * - Response interceptor handles 401 globally (redirect to login)
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // required for httpOnly cookie (JWT) to be sent
});

// Global 401 handler — token expired, redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
