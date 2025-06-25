
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
  Users, 
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Radio
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  radiosCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  notes?: string;
}

const ClientsManager = () => {
  const [clients, setClients] = useState<Client[]>([
    {
      id: 1,
      name: "Juan Pérez",
      email: "juan.perez@email.com",
      phone: "+1 234 567 8901",
      company: "Rock FM Productions",
      address: "Av. Principal 123, Ciudad",
      radiosCount: 2,
      status: "active",
      createdAt: "2024-01-15",
      notes: "Cliente premium con múltiples radios"
    },
    {
      id: 2,
      name: "María García",
      email: "maria.garcia@email.com",
      phone: "+1 234 567 8902",
      company: "Salsa Music Group",
      radiosCount: 1,
      status: "active",
      createdAt: "2024-01-20"
    },
    {
      id: 3,
      name: "Carlos Ruiz",
      email: "carlos.ruiz@email.com",
      phone: "+1 234 567 8903",
      radiosCount: 1,
      status: "inactive",
      createdAt: "2024-02-01",
      notes: "Cuenta suspendida por falta de pago"
    },
    {
      id: 4,
      name: "Ana López",
      email: "ana.lopez@email.com",
      phone: "+1 234 567 8904",
      company: "Urban Radio Network",
      radiosCount: 3,
      status: "active",
      createdAt: "2024-02-10"
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    notes: ""
  });

  const handleCreate = () => {
    const newClient: Client = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      address: formData.address,
      radiosCount: 0,
      status: "active",
      createdAt: new Date().toISOString().split('T')[0],
      notes: formData.notes
    };

    setClients([...clients, newClient]);
    setIsDialogOpen(false);
    resetForm();
    toast({
      title: "Cliente creado",
      description: `El cliente "${formData.name}" ha sido creado exitosamente.`,
    });
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company || "",
      address: client.address || "",
      notes: client.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingClient) return;

    const updatedClients = clients.map(client => 
      client.id === editingClient.id 
        ? { ...client, ...formData }
        : client
    );

    setClients(updatedClients);
    setIsDialogOpen(false);
    setEditingClient(null);
    resetForm();
    toast({
      title: "Cliente actualizado",
      description: `El cliente "${formData.name}" ha sido actualizado exitosamente.`,
    });
  };

  const handleDelete = (id: number) => {
    const client = clients.find(c => c.id === id);
    if (client && client.radiosCount > 0) {
      toast({
        title: "No se puede eliminar",
        description: "Este cliente tiene radios asignadas. Elimina las radios primero.",
        variant: "destructive",
      });
      return;
    }

    setClients(clients.filter(c => c.id !== id));
    toast({
      title: "Cliente eliminado",
      description: `El cliente "${client?.name}" ha sido eliminado.`,
      variant: "destructive",
    });
  };

  const toggleStatus = (id: number) => {
    const updatedClients = clients.map(client => 
      client.id === id 
        ? { 
            ...client, 
            status: client.status === 'active' ? 'inactive' as const : 'active' as const
          }
        : client
    );
    setClients(updatedClients);
    
    const client = clients.find(c => c.id === id);
    toast({
      title: `Cliente ${client?.status === 'active' ? 'desactivado' : 'activado'}`,
      description: `${client?.name} ha sido ${client?.status === 'active' ? 'desactivado' : 'activado'}.`,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      notes: ""
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                Gestión de Clientes
              </CardTitle>
              <CardDescription className="text-slate-400">
                Administra la información de todos los clientes
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  onClick={() => {
                    setEditingClient(null);
                    resetForm();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {editingClient ? 'Modifica los datos del cliente' : 'Registra un nuevo cliente en el sistema'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="juan@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="+1 234 567 8900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-300">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address" className="text-slate-300">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Dirección completa"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes" className="text-slate-300">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Notas adicionales sobre el cliente"
                      rows={3}
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
                    onClick={editingClient ? handleUpdate : handleCreate}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {editingClient ? 'Actualizar' : 'Crear Cliente'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Cliente</TableHead>
                <TableHead className="text-slate-300">Contacto</TableHead>
                <TableHead className="text-slate-300">Empresa</TableHead>
                <TableHead className="text-slate-300">Radios</TableHead>
                <TableHead className="text-slate-300">Estado</TableHead>
                <TableHead className="text-slate-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="border-slate-700">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{client.name}</p>
                      <p className="text-sm text-slate-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Desde {client.createdAt}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-white flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-2 text-blue-400" />
                        {client.email}
                      </p>
                      <p className="text-slate-400 flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-2 text-green-400" />
                        {client.phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white">{client.company || "Sin empresa"}</p>
                      {client.address && (
                        <p className="text-sm text-slate-400">{client.address}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Radio className="h-4 w-4 text-orange-400" />
                      <span className="text-white font-medium">{client.radiosCount}</span>
                      <span className="text-slate-400 text-sm">
                        {client.radiosCount === 1 ? 'radio' : 'radios'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={client.status === 'active' ? 'default' : 'destructive'}
                      className={client.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                    >
                      {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(client.id)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        {client.status === 'active' ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                        className="border-red-600 text-red-400 hover:bg-red-900/20"
                        disabled={client.radiosCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsManager;
