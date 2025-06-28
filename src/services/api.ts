
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
        return;
      }
      
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Autenticación
  async login(credentials: { username: string; password: string }) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error de autenticación');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  }

  async logout() {
    localStorage.removeItem('token');
  }

  // Perfil de usuario
  async getProfile() {
    return this.request('/profile');
  }

  async updateProfile(profileData: any) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Usuarios (solo admin)
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: number, userData: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: number) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getAdminDashboard() {
    return this.request('/dashboard/admin');
  }

  async getClientDashboard() {
    return this.request('/dashboard/client');
  }

  // Radios
  async getRadios() {
    return this.request('/radios');
  }

  async createRadio(radioData: any) {
    return this.request('/radios', {
      method: 'POST',
      body: JSON.stringify(radioData),
    });
  }

  async updateRadio(radioId: number, radioData: any) {
    return this.request(`/radios/${radioId}`, {
      method: 'PUT',
      body: JSON.stringify(radioData),
    });
  }

  async updateRadioStatus(radioId: number, status: string) {
    return this.request(`/radios/${radioId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteRadio(radioId: number) {
    return this.request(`/radios/${radioId}`, {
      method: 'DELETE',
    });
  }

  // Clientes (deprecated - now using users)
  async getClients() {
    return this.request('/users');
  }

  async createClient(clientData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ ...clientData, role: 'client' }),
    });
  }

  // Planes
  async getPlans() {
    return this.request('/plans');
  }

  async createPlan(planData: any) {
    return this.request('/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async updatePlan(planId: number, planData: any) {
    return this.request(`/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  }

  async deletePlan(planId: number) {
    return this.request(`/plans/${planId}`, {
      method: 'DELETE',
    });
  }

  // Estadísticas de streams
  async getStreamStats() {
    return this.request('/streams/stats');
  }
}

export const apiService = new ApiService();
