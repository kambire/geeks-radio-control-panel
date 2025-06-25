
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Radio, 
  Users, 
  Package, 
  Activity, 
  TrendingUp, 
  Server,
  Headphones,
  PlayCircle,
  PauseCircle
} from "lucide-react";

const Dashboard = () => {
  // Datos simulados - en producción vendrían del backend
  const stats = {
    totalRadios: 12,
    activeRadios: 8,
    suspendedRadios: 4,
    totalClients: 10,
    totalPlans: 4,
    totalListeners: 1247,
    serverLoad: 68,
    bandwidth: 2.4
  };

  const recentRadios = [
    { id: 1, name: "Radio Rock FM", client: "Juan Pérez", status: "active", listeners: 156 },
    { id: 2, name: "Salsa Total", client: "María García", status: "active", listeners: 89 },
    { id: 3, name: "Pop Latino", client: "Carlos Ruiz", status: "suspended", listeners: 0 },
    { id: 4, name: "Reggaeton Mix", client: "Ana López", status: "active", listeners: 203 },
    { id: 5, name: "Música Clásica", client: "Pedro Silva", status: "active", listeners: 45 }
  ];

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Radios
            </CardTitle>
            <Radio className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRadios}</div>
            <p className="text-xs text-slate-400">
              {stats.activeRadios} activas, {stats.suspendedRadios} suspendidas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalClients}</div>
            <p className="text-xs text-slate-400">
              +2 nuevos este mes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Oyentes Totales
            </CardTitle>
            <Headphones className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalListeners.toLocaleString()}</div>
            <p className="text-xs text-slate-400">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Planes Activos
            </CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalPlans}</div>
            <p className="text-xs text-slate-400">
              Básico, Premium, Pro, Enterprise
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos y métricas del servidor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Server className="h-5 w-5 mr-2 text-orange-500" />
              Estado del Servidor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">Carga del CPU</span>
                <span className="text-sm text-white">{stats.serverLoad}%</span>
              </div>
              <Progress value={stats.serverLoad} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">Ancho de Banda</span>
                <span className="text-sm text-white">{stats.bandwidth} GB/h</span>
              </div>
              <Progress value={48} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">Memoria RAM</span>
                <span className="text-sm text-white">6.2 GB / 16 GB</span>
              </div>
              <Progress value={39} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-500" />
              Radios Recientes
            </CardTitle>
            <CardDescription className="text-slate-400">
              Estado actual de las radios más activas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRadios.map((radio) => (
                <div key={radio.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {radio.status === 'active' ? (
                      <PlayCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <PauseCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{radio.name}</p>
                      <p className="text-xs text-slate-400">{radio.client}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={radio.status === 'active' ? 'default' : 'destructive'}
                      className={radio.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                    >
                      {radio.status === 'active' ? 'Activa' : 'Suspendida'}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {radio.listeners} oyentes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
