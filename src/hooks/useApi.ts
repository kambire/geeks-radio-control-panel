
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { toast } from './use-toast';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async (apiCall: () => Promise<any>, successMessage?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      
      if (successMessage) {
        toast({
          title: "Éxito",
          description: successMessage,
        });
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    handleApiCall,
    clearError: () => setError(null),
  };
};

// Hook específico para radios con datos reales
export const useRadios = () => {
  const [radios, setRadios] = useState([]);
  const [streamStats, setStreamStats] = useState([]);
  const { loading, error, handleApiCall } = useApi();

  const fetchRadios = async () => {
    const result = await handleApiCall(() => apiService.getRadios());
    setRadios(result);
    return result;
  };

  const createRadio = async (radioData: any) => {
    const result = await handleApiCall(
      () => apiService.createRadio(radioData),
      'Radio creada exitosamente'
    );
    
    // Refrescar lista
    await fetchRadios();
    return result;
  };

  const updateRadioStatus = async (radioId: number, status: string) => {
    await handleApiCall(
      () => apiService.updateRadioStatus(radioId, status),
      `Radio ${status === 'active' ? 'activada' : 'suspendida'} exitosamente`
    );
    
    // Refrescar lista
    await fetchRadios();
  };

  const fetchStreamStats = async () => {
    const result = await handleApiCall(() => apiService.getStreamStats());
    setStreamStats(result);
    return result;
  };

  useEffect(() => {
    fetchRadios();
    
    // Actualizar estadísticas cada 30 segundos
    const interval = setInterval(fetchStreamStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    radios,
    streamStats,
    loading,
    error,
    fetchRadios,
    createRadio,
    updateRadioStatus,
    fetchStreamStats,
  };
};

// Hook para clientes
export const useClients = () => {
  const [clients, setClients] = useState([]);
  const { loading, error, handleApiCall } = useApi();

  const fetchClients = async () => {
    const result = await handleApiCall(() => apiService.getClients());
    setClients(result);
    return result;
  };

  const createClient = async (clientData: any) => {
    const result = await handleApiCall(
      () => apiService.createClient(clientData),
      'Cliente creado exitosamente'
    );
    
    await fetchClients();
    return result;
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
  };
};

// Hook para planes
export const usePlans = () => {
  const [plans, setPlans] = useState([]);
  const { loading, error, handleApiCall } = useApi();

  const fetchPlans = async () => {
    const result = await handleApiCall(() => apiService.getPlans());
    setPlans(result);
    return result;
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    fetchPlans,
  };
};
