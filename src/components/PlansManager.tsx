
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Package, 
  Edit,
  Trash2,
  HardDrive,
  Users as UsersIcon,
  Zap,
  DollarSign
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Plan {
  id: number;
  name: string;
  description: string;
  diskSpace: number; // GB
  maxListeners: number;
  bitrate: number; // kbps
  price: number;
  features: string[];
  isPopular: boolean;
  status: 'active' | 'inactive';
  clientsCount: number;
}

const PlansManager = () => {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: 1,
      name: "Básico",
      description: "Perfecto para empezar con tu primera radio",
      diskSpace: 5,
      maxListeners: 100,
      bitrate: 128,
      price: 15,
      features: ["Icecast/Shoutcast", "Soporte básico", "Panel web"],
      isPopular: false,
      status: "active",
      clientsCount: 3
    },
    {
      id: 2,
      name: "Premium",
      description: "Ideal para radios en crecimiento",
      diskSpace: 15,
      maxListeners: 500,
      bitrate: 192,
      price: 35,
      features: ["Icecast/Shoutcast", "AutoDJ incluido", "Soporte prioritario", "Estadísticas avanzadas"],
      isPopular: true,
      status: "active",
      clientsCount: 5
    },
    {
      id: 3,
      name: "Pro",
      description: "Para radios profesionales",
      diskSpace: 50,
      maxListeners: 1000,
      bitrate: 320,
      price: 75,
      features: ["Icecast/Shoutcast", "AutoDJ avanzado", "Soporte 24/7", "API completa", "Múltiples streams"],
      isPopular: false,
      status: "active",
      clientsCount: 2
    },
    {
      id: 4,
      name: "Enterprise",
      description: "Solución personalizada para grandes empresas",
      diskSpace: 200,
      maxListeners: 5000,
      bitrate: 320,
      price: 200,
      features: ["Todo incluido", "Servidor dedicado", "Soporte personalizado", "SLA garantizado"],
      isPopular: false,
      status: "active",
      clientsCount: 1
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    diskSpace: 5,
    maxListeners: 100,
    bitrate: 128,
    price: 15,
    features: "",
    isPopular: false
  });

  const handleCreate = () => {
    const newPlan: Plan = {
      id: Date.now(),
      name: formData.name,
      description: formData.description,
      diskSpace: formData.diskSpace,
      maxListeners: formData.maxListeners,
      bitrate: formData.bitrate,
      price: formData.price,
      features: formData.features.split('\n').filter(f => f.trim()),
      isPopular: formData.isPopular,
      status: "active",
      clientsCount: 0
    };

    setPlans([...plans, newPlan]);
    setIsDialogOpen(false);
    resetForm();
    toast({
      title: "Plan creado",
      description: `El plan "${formData.name}" ha sido creado exitosamente.`,
    });
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      diskSpace: plan.diskSpace,
      maxListeners: plan.maxListeners,
      bitrate: plan.bitrate,
      price: plan.price,
      features: plan.features.join('\n'),
      isPopular: plan.isPopular
    });
    setIsDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingPlan) return;

    const updatedPlans = plans.map(plan => 
      plan.id === editingPlan.id 
        ? { 
            ...plan, 
            ...formData,
            features: formData.features.split('\n').filter(f => f.trim())
          }
        : plan
    );

    setPlans(updatedPlans);
    setIsDialogOpen(false);
    setEditingPlan(null);
    resetForm();
    toast({
      title: "Plan actualizado",
      description: `El plan "${formData.name}" ha sido actualizado exitosamente.`,
    });
  };

  const handleDelete = (id: number) => {
    const plan = plans.find(p => p.id === id);
    if (plan && plan.clientsCount > 0) {
      toast({
        title: "No se puede eliminar",
        description: "Este plan tiene clientes asignados. Reasigna los clientes primero.",
        variant: "destructive",
      });
      return;
    }

    setPlans(plans.filter(p => p.id !== id));
    toast({
      title: "Plan eliminado",
      description: `El plan "${plan?.name}" ha sido eliminado.`,
      variant: "destructive",
    });
  };

  const toggleStatus = (id: number) => {
    const updatedPlans = plans.map(plan => 
      plan.id === id 
        ? { 
            ...plan, 
            status: plan.status === 'active' ? 'inactive' as const : 'active' as const
          }
        : plan
    );
    setPlans(updatedPlans);
    
    const plan = plans.find(p => p.id === id);
    toast({
      title: `Plan ${plan?.status === 'active' ? 'desactivado' : 'activado'}`,
      description: `${plan?.name} ha sido ${plan?.status === 'active' ? 'desactivado' : 'activado'}.`,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      diskSpace: 5,
      maxListeners: 100,
      bitrate: 128,
      price: 15,
      features: "",
      isPopular: false
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-500" />
                Gestión de Planes
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configura los planes de servicio disponibles
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => {
                    setEditingPlan(null);
                    resetForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingPlan ? 'Modifica las características del plan' : 'Crea un nuevo plan de servicios'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Nombre del Plan *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Ej: Premium"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-slate-300">Precio (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description" className="text-slate-300">Descripción</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Descripción breve del plan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diskSpace" className="text-slate-300">Espacio en Disco (GB)</Label>
                    <Input
                      id="diskSpace"
                      type="number"
                      value={formData.diskSpace}
                      onChange={(e) => setFormData({...formData, diskSpace: parseInt(e.target.value)})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxListeners" className="text-slate-300">Máx. Oyentes</Label>
                    <Input
                      id="maxListeners"
                      type="number"
                      value={formData.maxListeners}
                      onChange={(e) => setFormData({...formData, maxListeners: parseInt(e.target.value)})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bitrate" className="text-slate-300">Bitrate Máximo (kbps)</Label>
                    <Input
                      id="bitrate"
                      type="number"
                      value={formData.bitrate}
                      onChange={(e) => setFormData({...formData, bitrate: parseInt(e.target.value)})}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPopular"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                      className="rounded border-slate-600"
                    />
                    <Label htmlFor="isPopular" className="text-slate-300">Plan Popular</Label>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="features" className="text-slate-300">Características (una por línea)</Label>
                    <Textarea
                      id="features"
                      value={formData.features}
                      onChange={(e) => setFormData({...formData, features: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Icecast/Shoutcast&#10;AutoDJ incluido&#10;Soporte 24/7"
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-600 text-slate-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={editingPlan ? handleUpdate : handleCreate}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {editingPlan ? 'Actualizar' : 'Crear Plan'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="bg-slate-700/50 border-slate-600 relative">
                {plan.isPopular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      Más Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {plan.description}
                  </CardDescription>
                  <div className="text-3xl font-bold text-white">
                    ${plan.price}
                    <span className="text-sm text-slate-400 font-normal">/mes</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="h-4 w-4 text-blue-400" />
                        <span className="text-slate-300 text-sm">Espacio</span>
                      </div>
                      <span className="text-white font-medium">{plan.diskSpace} GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <UsersIcon className="h-4 w-4 text-green-400" />
                        <span className="text-slate-300 text-sm">Oyentes</span>
                      </div>
                      <span className="text-white font-medium">{plan.maxListeners}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        <span className="text-slate-300 text-sm">Bitrate</span>
                      </div>
                      <span className="text-white font-medium">{plan.bitrate} kbps</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-600 pt-3">
                    <p className="text-slate-300 text-sm font-medium mb-2">Características:</p>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-slate-400 text-xs flex items-center">
                          <div className="w-1 h-1 bg-purple-400 rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-600 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <Badge 
                        variant={plan.status === 'active' ? 'default' : 'destructive'}
                        className={plan.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                      >
                        {plan.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <span className="text-slate-400 text-sm">
                        {plan.clientsCount} {plan.clientsCount === 1 ? 'cliente' : 'clientes'}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(plan.id)}
                        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        {plan.status === 'active' ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(plan.id)}
                        className="border-red-600 text-red-400 hover:bg-red-900/20"
                        disabled={plan.clientsCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlansManager;
