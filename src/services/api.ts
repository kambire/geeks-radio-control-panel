
// API service for Geeks Radio Control Panel
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Radio {
  id: number;
  name: string;
  client_id: number;
  plan_id: number;
  server_type: 'icecast' | 'shoutcast';
  port: number;
  max_listeners: number;
  bitrate: number;
  autodj_enabled: boolean;
  mount_point: string;
  source_password: string;
  admin_password: string;
  status: 'active' | 'inactive' | 'maintenance';
  current_listeners: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  max_listeners: number;
  storage_gb: number;
  bandwidth_gb: number;
  price: number;
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface StreamStats {
  radio_id: number;
  listeners: number;
  peak_listeners: number;
  bitrate: number;
  status: string;
  uptime: string;
  song: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // Auth endpoints
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Radio endpoints
  async getRadios(): Promise<ApiResponse<Radio[]>> {
    return this.request('/radios');
  }

  async getRadio(id: number): Promise<ApiResponse<Radio>> {
    return this.request(`/radios/${id}`);
  }

  async createRadio(radio: Partial<Radio>): Promise<ApiResponse<Radio>> {
    return this.request('/radios', {
      method: 'POST',
      body: JSON.stringify(radio),
    });
  }

  async updateRadio(id: number, radio: Partial<Radio>): Promise<ApiResponse<Radio>> {
    return this.request(`/radios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(radio),
    });
  }

  async updateRadioStatus(radioId: number, status: string): Promise<ApiResponse<Radio>> {
    return this.request(`/radios/${radioId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteRadio(id: number): Promise<ApiResponse> {
    return this.request(`/radios/${id}`, { method: 'DELETE' });
  }

  // Client endpoints
  async getClients(): Promise<ApiResponse<Client[]>> {
    return this.request('/clients');
  }

  async getClient(id: number): Promise<ApiResponse<Client>> {
    return this.request(`/clients/${id}`);
  }

  async createClient(client: Partial<Client>): Promise<ApiResponse<Client>> {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async updateClient(id: number, client: Partial<Client>): Promise<ApiResponse<Client>> {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  async deleteClient(id: number): Promise<ApiResponse> {
    return this.request(`/clients/${id}`, { method: 'DELETE' });
  }

  // Plan endpoints
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    return this.request('/plans');
  }

  async getPlan(id: number): Promise<ApiResponse<Plan>> {
    return this.request(`/plans/${id}`);
  }

  async createPlan(plan: Partial<Plan>): Promise<ApiResponse<Plan>> {
    return this.request('/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async updatePlan(id: number, plan: Partial<Plan>): Promise<ApiResponse<Plan>> {
    return this.request(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    });
  }

  async deletePlan(id: number): Promise<ApiResponse> {
    return this.request(`/plans/${id}`, { method: 'DELETE' });
  }

  // Stream endpoints
  async getStreamStats(radioId?: number): Promise<ApiResponse<StreamStats[]>> {
    const endpoint = radioId ? `/streams/stats/${radioId}` : '/streams/stats';
    return this.request(endpoint);
  }

  async startStream(radioId: number): Promise<ApiResponse> {
    return this.request(`/streams/start/${radioId}`, { method: 'POST' });
  }

  async stopStream(radioId: number): Promise<ApiResponse> {
    return this.request(`/streams/stop/${radioId}`, { method: 'POST' });
  }

  async restartStream(radioId: number): Promise<ApiResponse> {
    return this.request(`/streams/restart/${radioId}`, { method: 'POST' });
  }

  // Health check
  async health(): Promise<ApiResponse<{ status: string; timestamp: string; uptime: number }>> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;
