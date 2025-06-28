
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Radio, 
  Activity, 
  Users, 
  Play, 
  Pause, 
  Settings,
  BarChart3,
  Headphones,
  Clock,
  TrendingUp
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ClientStats {
  stats: {
    total_radios: number;
    active_radios: number;
    total_listeners: number;
    max_listeners: number;
  };
  radios: Array<{
    id: number;
    name: string;
    status: string;
    current_listeners: number;
    max_listeners: number;
    port: number;
    mount_point: string;
    plan_name: string;
  }>;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  company?: string;
  created_at: string;
}

const ClientPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientData();
    fetchUserProfile();
  }, []);

  const fetchClientData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/client', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClientStats(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Activa</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspendida</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Mantenimiento</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Cargando panel del cliente...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <Radio className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {userProfile?.company || 'Mi Radio Online'}
                </h1>
                <p className="text-slate-400 text-sm">
                  Panel de Cliente - {userProfile?.full_name || userProfile?.username}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }}
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="radios"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Radio className="h-4 w-4 mr-2" />
              Mis Radios
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Mi Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Total Radios
                  </CardTitle>
                  <Radio className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {clientStats?.stats.total_radios || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Radios Activas
                  </CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {clientStats?.stats.active_radios || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Oyentes Actuales
                  </CardTitle>
                  <Headphones className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {clientStats?.stats.total_listeners || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Pico de Oyentes
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {clientStats?.stats.max_listeners || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Mis Radios</CardTitle>
                <CardDescription>
                  Resumen de tus emisoras de radio online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientStats?.radios.map((radio) => (
                    <div key={radio.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded">
                          <Radio className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{radio.name}</h3>
                          <p className="text-slate-400 text-sm">
                            Puerto: {radio.port} | Plan: {radio.plan_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            {radio.current_listeners} oyentes
                          </div>
                          <div className="text-slate-400 text-sm">
                            Máx: {radio.max_listeners}
                          </div>
                        </div>
                        {getStatusBadge(radio.status)}
                      </div>
                    </div>
                  ))}
                  
                  {(!clientStats?.radios || clientStats.radios.length === 0) && (
                    <div className="text-center py-8 text-slate-400">
                      No tienes radios configuradas aún.
                      <br />
                      Contacta a tu administrador para crear tu primera radio.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="radios" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Gestión de Radios</CardTitle>
                <CardDescription>
                  Administra tus emisoras de radio online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {clientStats?.radios.map((radio) => (
                    <Card key={radio.id} className="bg-slate-700/50 border-slate-600">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white flex items-center gap-2">
                            <Radio className="h-5 w-5 text-orange-500" />
                            {radio.name}
                          </CardTitle>
                          {getStatusBadge(radio.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-slate-400 text-sm">Puerto</p>
                            <p className="text-white font-semibold">{radio.port}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Oyentes</p>
                            <p className="text-white font-semibold">
                              {radio.current_listeners}/{radio.max_listeners}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Punto de Montaje</p>
                            <p className="text-white font-semibold">{radio.mount_point}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Plan</p>
                            <p className="text-white font-semibold">{radio.plan_name}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-slate-600/50 rounded-lg">
                          <h4 className="text-white font-semibold mb-2">Información de Conexión</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-slate-400">Servidor:</span>
                              <span className="text-white ml-2">tu-servidor.com:{radio.port}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Mount:</span>
                              <span className="text-white ml-2">/{radio.mount_point}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Mi Perfil</CardTitle>
                <CardDescription>
                  Información de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userProfile && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Usuario</Label>
                        <div className="text-white font-semibold">{userProfile.username}</div>
                      </div>
                      <div>
                        <Label className="text-slate-300">Email</Label>
                        <div className="text-white font-semibold">{userProfile.email}</div>
                      </div>
                      <div>
                        <Label className="text-slate-300">Nombre Completo</Label>
                        <div className="text-white font-semibold">
                          {userProfile.full_name || 'No especificado'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300">Teléfono</Label>
                        <div className="text-white font-semibold">
                          {userProfile.phone || 'No especificado'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300">Empresa</Label>
                        <div className="text-white font-semibold">
                          {userProfile.company || 'No especificado'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-300">Miembro desde</Label>
                        <div className="text-white font-semibold">
                          {new Date(userProfile.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-600">
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <Settings className="h-4 w-4 mr-2" />
                        Editar Perfil
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientPanel;
