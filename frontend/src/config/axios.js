import axios from 'axios';
import { API_ENDPOINTS } from './api';

const apiClient = axios.create({
  baseURL: API_ENDPOINTS.BASE,
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, 
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pannon_shop_token') || 
                  sessionStorage.getItem('pannon_shop_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      const method = config.method ? config.method.toUpperCase() : 'UNKNOWN';
      console.log('API Request:', method, config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Response error:', error.response?.status, error.response?.data);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('pannon_shop_token');
      localStorage.removeItem('pannon_shop_user');
      sessionStorage.removeItem('pannon_shop_token');
      sessionStorage.removeItem('pannon_shop_user');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (error.message === 'Network Error' && !error.response) {
      console.error('CORS hiba vagy a backend nem elérhető');
      error.message = 'Kapcsolódási hiba. Kérjük, próbálja újra később.';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;