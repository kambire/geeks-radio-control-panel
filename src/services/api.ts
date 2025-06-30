
import axios from 'axios';

// Configuración existente
const token = localStorage.getItem('token');

// Configurar base URL correcta para producción
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service methods
export const apiService = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    
    if (token) {
      localStorage.setItem('token', token);
    }
    
    return { user, token };
  },

  getRadios: async () => {
    const response = await api.get('/radios');
    return response.data;
  },

  createRadio: async (radioData: any) => {
    const response = await api.post('/radios', radioData);
    return response.data;
  },

  updateRadioStatus: async (radioId: number, status: string) => {
    const response = await api.patch(`/radios/${radioId}/status`, { status });
    return response.data;
  },

  getStreamStats: async () => {
    const response = await api.get('/stream/stats');
    return response.data;
  },

  getClients: async () => {
    const response = await api.get('/clients');
    return response.data;
  },

  createClient: async (clientData: any) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  getPlans: async () => {
    const response = await api.get('/plans');
    return response.data;
  }
};

export default api;
