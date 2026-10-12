import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ci_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ci_token');
      localStorage.removeItem('ci_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
