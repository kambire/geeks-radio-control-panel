
import axios from 'axios';

// Configurar base URL correcta para producción
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
});

// Función para obtener el token actual
const getToken = () => {
  return localStorage.getItem('token');
};

// Función para verificar si el token está válido
const isTokenValid = (token: string | null) => {
  if (!token) return false;
  
  try {
    // Verificar que el token no esté expirado (formato simple)
    const tokenParts = token.split('-');
    if (tokenParts.length < 3) return false;
    
    const timestamp = parseInt(tokenParts[tokenParts.length - 1]);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 horas
    
    return (now - timestamp) < oneDay;
  } catch {
    return false;
  }
};

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    if (token && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token) {
      // Token inválido, limpiar storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`, {
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response interceptor error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('Unauthorized - clearing token and redirecting');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// API Service methods
export const apiService = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      console.log('Attempting login with:', credentials.username);
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Login successful, token stored');
      }
      
      return { user, token };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  getRadios: async () => {
    console.log('Fetching radios...');
    const response = await api.get('/radios');
    return response.data;
  },

  createRadio: async (radioData: any) => {
    console.log('Creating radio with data:', radioData);
    const response = await api.post('/radios', radioData);
    return response.data;
  },

  updateRadio: async (radioId: number, radioData: any) => {
    console.log('Updating radio:', radioId, radioData);
    const response = await api.put(`/radios/${radioId}`, radioData);
    return response.data;
  },

  updateRadioStatus: async (radioId: number, status: string) => {
    console.log('Updating radio status:', radioId, status);
    const response = await api.patch(`/radios/${radioId}/status`, { status });
    return response.data;
  },

  deleteRadio: async (radioId: number) => {
    console.log('Deleting radio:', radioId);
    const response = await api.delete(`/radios/${radioId}`);
    return response.data;
  },

  getUsers: async () => {
    console.log('Fetching users...');
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (userData: any) => {
    console.log('Creating user with data:', userData);
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (userId: number, userData: any) => {
    console.log('Updating user:', userId, userData);
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId: number) => {
    console.log('Deleting user:', userId);
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  getAvailablePorts: async () => {
    console.log('Fetching available ports...');
    const response = await api.get('/radios/available-ports');
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
