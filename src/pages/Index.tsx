
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Radio, 
  Users, 
  Package, 
  Activity, 
  Play, 
  Pause, 
  Settings,
  Plus,
  BarChart3,
  Headphones,
  Server
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import RadiosManager from "@/components/RadiosManager";
import ClientsManager from "@/components/ClientsManager";
import PlansManager from "@/components/PlansManager";
import Dashboard from "@/components/Dashboard";
import AuthLogin from "@/components/AuthLogin";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!isAuthenticated) {
    return <AuthLogin onLogin={() => setIsAuthenticated(true)} />;
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
                <h1 className="text-2xl font-bold text-white">Geeks Radio</h1>
                <p className="text-slate-400 text-sm">Panel de Administración</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsAuthenticated(false)}
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
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
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
              Radios
            </TabsTrigger>
            <TabsTrigger 
              value="clients"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger 
              value="plans"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4 mr-2" />
              Planes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="radios" className="mt-6">
            <RadiosManager />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientsManager />
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <PlansManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
