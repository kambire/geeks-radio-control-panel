
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Radio, 
  PlayCircle, 
  PauseCircle, 
  Settings, 
  Trash2, 
  Edit,
  Headphones,
  Server
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RadioStation {
  id: number;
  name: string;
  user_id?: number;
  username?: string;
  email?: string;
  plan_id?: number;
  plan_name?: string;
  server_type: string;
  port?: number;
  status: 'active' | 'inactive' | 'suspended';
  current_listeners?: number;
  max_listeners: number;
  bitrate: number;
  mount_point?: string;
  created_at: string;
}

interface Plan {
  id: number;
  name: string;
  max_listeners: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const RadiosManager = () => {
  const [radios, setRadios] = useState<RadioStation[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRadio, setEditingRadio] = useState<RadioStation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    user_id: "",
    plan_id: "",
    server_type: "shoutcast",
    bitrate: 128,
    max_listeners: 100,
    mount_point: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchRadios(),
        fetchPlans(),
        fetchUsers()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRadios = async () => {
    try {
      console.log('Fetching radios...');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/radios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Radios response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Radios data received:', data);
        setRadios(data);
      } else {
        console.error('Error fetching radios:', response.status);
        toast({
          title: "Error",
          description: "No se pudieron cargar las radios",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error fetching radios:', error);
      toast({
        title: "Error",
        description: "Error de conexión al cargar radios",
        variant: "destructive",
      });
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((user: User) => user.role === 'client'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      console.log('Submitting radio form:', formData);
      const token = localStorage.getItem('token');
      const url = editingRadio ? `/api/radios/${editingRadio.id}` : '/api/radios';
      const method = editingRadio ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('Radio submit response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Radio submit result:', result);
        
        toast({
          title: "Éxito",
          description: `Radio ${editingRadio ? 'actualizada' : 'creada'} exitosamente`,
        });
        
        await fetchRadios();
        resetForm();
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        console.error('Error submitting radio:', errorData);
        throw new Error(errorData.error || 'Error en la operación');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (radio: RadioStation) => {
    setEditingRadio(radio);
    setFormData({
      name: radio.name,
      user_id: radio.user_id?.toString() || "",
      plan_id: radio.plan_id?.toString() || "",
      server_type: radio.server_type,
      bitrate: radio.bitrate,
      max_listeners: radio.max_listeners,
      mount_point: radio.mount_point || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta radio?')) return;

    try {
      console.log('Deleting radio:', id);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/radios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Radio eliminada exitosamente",
        });
        await fetchRadios();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error eliminando radio');
      }
    } catch (error) {
      console.error('Error deleting radio:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'No se pudo eliminar la radio',
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      const radio = radios.find(r => r.id === id);
      if (!radio) return;

      const newStatus = radio.status === 'active' ? 'inactive' : 'active';
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/radios/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: `Radio ${newStatus === 'active' ? 'activada' : 'desactivada'}`,
          description: `${radio.name} ha sido ${newStatus === 'active' ? 'activada' : 'desactivada'}.`,
        });
        await fetchRadios();
      }
    } catch (error) {
      console.error('Error toggling radio status:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la radio",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      user_id: "",
      plan_id: "",
      server_type: "shoutcast",
      bitrate: 128,
      max_listeners: 100,
      mount_point: ""
    });
    setEditingRadio(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Cargando radios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white flex items-center">
                <Radio className="h-5 w-5 mr-2 text-orange-500" />
                Gestión de Radios
              </CardTitle>
              <CardDescription className="text-slate-400">
                Administra todas las estaciones de radio del sistema ({radios.length} radios)
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={() => {
                    setEditingRadio(null);
                    resetForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Radio
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingRadio ? 'Editar Radio' : 'Nueva Radio'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingRadio ? 'Modifica los datos de la radio' : 'Configura una nueva estación de radio'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">Nombre de la Radio</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Ej: Radio Rock FM"
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user_id" className="text-slate-300">Cliente</Label>
                      <Select 
                        value={formData.user_id} 
                        onValueChange={(value) => setFormData({...formData, user_id: value})}
                        disabled={submitting}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id.toString()} className="text-white">
                              {user.username} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan_id" className="text-slate-300">Plan</Label>
                      <Select 
                        value={formData.plan_id} 
                        onValueChange={(value) => setFormData({...formData, plan_id: value})}
                        disabled={submitting}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {plans.map(plan => (
                            <SelectItem key={plan.id} value={plan.id.toString()} className="text-white">
                              {plan.name} (Max: {plan.max_listeners} oyentes)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="server_type" className="text-slate-300">Servidor</Label>
                      <Select 
                        value={formData.server_type} 
                        onValueChange={(value) => setFormData({...formData, server_type: value})}
                        disabled={submitting}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="shoutcast" className="text-white">SHOUTcast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_listeners" className="text-slate-300">Máx. Oyentes</Label>
                      <Input
                        id="max_listeners"
                        type="number"
                        value={formData.max_listeners}
                        onChange={(e) => setFormData({...formData, max_listeners: parseInt(e.target.value) || 100})}
                        className="bg-slate-700 border-slate-600 text-white"
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bitrate" className="text-slate-300">Bitrate (kbps)</Label>
                      <Select 
                        value={formData.bitrate.toString()} 
                        onValueChange={(value) => setFormData({...formData, bitrate: parseInt(value)})}
                        disabled={submitting}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="64" className="text-white">64 kbps</SelectItem>
                          <SelectItem value="96" className="text-white">96 kbps</SelectItem>
                          <SelectItem value="128" className="text-white">128 kbps</SelectItem>
                          <SelectItem value="192" className="text-white">192 kbps</SelectItem>
                          <SelectItem value="320" className="text-white">320 kbps</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mount_point" className="text-slate-300">Mount Point</Label>
                      <Input
                        id="mount_point"
                        value={formData.mount_point}
                        onChange={(e) => setFormData({...formData, mount_point: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="/stream"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="border-slate-600 text-slate-300"
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      disabled={submitting}
                    >
                      {submitting ? 'Guardando...' : (editingRadio ? 'Actualizar' : 'Crear')} Radio
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {radios.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No hay radios registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Radio</TableHead>
                  <TableHead className="text-slate-300">Cliente</TableHead>
                  <TableHead className="text-slate-300">Plan</TableHead>
                  <TableHead className="text-slate-300">Oyentes</TableHead>
                  <TableHead className="text-slate-300">Estado</TableHead>
                  <TableHead className="text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {radios.map((radio) => (
                  <TableRow key={radio.id} className="border-slate-700">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {radio.status === 'active' ? (
                          <PlayCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <PauseCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-white">{radio.name}</p>
                          <p className="text-sm text-slate-400">
                            {radio.server_type} | {radio.bitrate}kbps
                            {radio.mount_point && ` | ${radio.mount_point}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white">{radio.username || 'Sin asignar'}</p>
                        <p className="text-sm text-slate-400">{radio.email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white">{radio.plan_name || 'Sin plan'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Headphones className="h-4 w-4 text-green-500" />
                        <span className="text-white">
                          {radio.current_listeners || 0} / {radio.max_listeners}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={radio.status === 'active' ? 'default' : 'destructive'}
                        className={radio.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                      >
                        {radio.status === 'active' ? 'Activa' : radio.status === 'inactive' ? 'Inactiva' : 'Suspendida'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus(radio.id)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          {radio.status === 'active' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(radio)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(radio.id)}
                          className="border-red-600 text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RadiosManager;
