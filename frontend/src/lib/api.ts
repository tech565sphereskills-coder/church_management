import axios from 'axios';
import { toast } from 'sonner';
import { loadingEvents } from '@/lib/utils';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://church-management-fp8e.onrender.com/api',
});

// Add a request interceptor to automatically attach the access_token
api.interceptors.request.use(
  (config) => {
    loadingEvents.setLoading(true);
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    loadingEvents.setLoading(false);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 refresh and global errors
api.interceptors.response.use(
  (response) => {
    loadingEvents.setLoading(false);
    return response;
  },
  async (error) => {
    loadingEvents.setLoading(false);
    const originalRequest = error.config;

    // Handle 401 Unauthorized specifically for token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const accessToken = response.data.access;
          localStorage.setItem('access_token', accessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
          }
          return Promise.reject(refreshError);
        }
      }
    }

    // Global Error Toasts for professional UX
    if (error.response) {
      const status = error.response.status;

      if (status === 403) {
        toast.error('Permission Denied', {
          description: "You don't have the required permissions to perform this action.",
        });
      } else if (status >= 500) {
        toast.error('System Error', {
          description: 'A server-side error occurred. The technical team has been notified.',
        });
      }
    } else if (error.request) {
       toast.error('Network Error', {
         description: 'Unable to reach the server. Please check your internet connection.',
       });
    }

    return Promise.reject(error);
  }
);

export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://church-management-fp8e.onrender.com/api',
});

export default api;
