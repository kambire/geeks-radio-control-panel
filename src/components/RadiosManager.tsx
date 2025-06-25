
import { useState } from "react";
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
  client: string;
  plan: string;
  server: string;
  port: number;
  status: 'active' | 'suspended';
  listeners: number;
  maxListeners: number;
  bitrate: number;
  autodjEnabled: boolean;
  createdAt: string;
}

const RadiosManager = () => {
  const [radios, setRadios] = useState<RadioStation[]>([
    {
      id: 1,
      name: "Radio Rock FM",
      client: "Juan Pérez",
      plan: "Premium",
      server: "Icecast",
      port: 8000,
      status: "active",
      listeners: 156,
      maxListeners: 500,
      bitrate: 128,
      autodjEnabled: true,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      name: "Salsa Total",
      client: "María García",
      plan: "Básico",
      server: "Shoutcast",
      port: 8001,
      status: "active",
      listeners: 89,
      maxListeners: 100,
      bitrate: 96,
      autodjEnabled: false,
      createdAt: "2024-01-20"
    },
    {
      id: 3,
      name: "Pop Latino",
      client: "Carlos Ruiz",
      plan: "Pro",
      server: "Icecast",
      port: 8002,
      status: "suspended",
      listeners: 0,
      maxListeners: 1000,
      bitrate: 192,
      autodjEnabled: true,
      createdAt: "2024-02-01"
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRadio, setEditingRadio] = useState<RadioStation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    plan: "",
    server: "Icecast",
    port: 8000,
    maxListeners: 100,
    bitrate: 128,
    autodjEnabled: false
  });

  const plans = ["Básico", "Premium", "Pro", "Enterprise"];
  const clients = ["Juan Pérez", "María García", "Carlos Ruiz", "Ana López", "Pedro Silva"];

  const handleCreate = () => {
    const newRadio: RadioStation = {
      id: Date.now(),
      name: formData.name,
      client: formData.client,
      plan: formData.plan,
      server: formData.server,
      port: formData.port,
      status: "active",
      listeners: 0,
      maxListeners: formData.maxListeners,
      bitrate: formData.bitrate,
      autodjEnabled: formData.autodjEnabled,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRadios([...radios, newRadio]);
    setIsDialogOpen(false);
    resetForm();
    toast({
      title: "Radio creada",
      description: `La radio "${formData.name}" ha sido creada exitosamente.`,
    });
  };

  const handleEdit = (radio: RadioStation) => {
    setEditingRadio(radio);
    setFormData({
      name: radio.name,
      client: radio.client,
      plan: radio.plan,
      server: radio.server,
      port: radio.port,
      maxListeners: radio.maxListeners,
      bitrate: radio.bitrate,
      autodjEnabled: radio.autodjEnabled
    });
    setIsDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingRadio) return;

    const updatedRadios = radios.map(radio => 
      radio.id === editingRadio.id 
        ? { ...radio, ...formData }
        : radio
    );

    setRadios(updatedRadios);
    setIsDialogOpen(false);
    setEditingRadio(null);
    resetForm();
    toast({
      title: "Radio actualizada",
      description: `La radio "${formData.name}" ha sido actualizada exitosamente.`,
    });
  };

  const handleDelete = (id: number) => {
    const radio = radios.find(r => r.id === id);
    setRadios(radios.filter(r => r.id !== id));
    toast({
      title: "Radio eliminada",
      description: `La radio "${radio?.name}" ha sido eliminada.`,
      variant: "destructive",
    });
  };

  const toggleStatus = (id: number) => {
    const updatedRadios = radios.map(radio => 
      radio.id === id 
        ? { 
            ...radio, 
            status: radio.status === 'active' ? 'suspended' as const : 'active' as const,
            listeners: radio.status === 'active' ? 0 : radio.listeners
          }
        : radio
    );
    setRadios(updatedRadios);
    
    const radio = radios.find(r => r.id === id);
    toast({
      title: `Radio ${radio?.status === 'active' ? 'suspendida' : 'activada'}`,
      description: `${radio?.name} ha sido ${radio?.status === 'active' ? 'suspendida' : 'activada'}.`,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      client: "",
      plan: "",
      server: "Icecast",
      port: 8000,
      maxListeners: 100,
      bitrate: 128,
      autodjEnabled: false
    });
  };

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
                Administra todas las estaciones de radio del sistema
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
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Nombre de la Radio</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Ej: Radio Rock FM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client" className="text-slate-300">Cliente</Label>
                    <Select value={formData.client} onValueChange={(value) => setFormData({...formData, client: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {clients.map(client => (
                          <SelectItem key={client} value={client} className="text-white">
                            {client}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan" className="text-slate-300">Plan</Label>
                    <Select value={formData.plan} onValueChange={(value) => setFormData({...formData, plan: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Selecciona un plan" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {plans.map(plan => (
                          <SelectItem key={plan} value={plan} className="text-white">
                            {plan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server" className="text-slate-300">Servidor</Label>
                    <Select value={formData.server} onValueChange={(value) => setFormData({...formData, server: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="Icecast" className="text-white">Icecast</SelectItem>
                        <SelectItem value="Shoutcast" className="text-white">Shoutcast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port" className="text-slate-300">Puerto</Label>
                    <Input
                      id="port"
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
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
                    <Label htmlFor="bitrate" className="text-slate-300">Bitrate (kbps)</Label>
                    <Select value={formData.bitrate.toString()} onValueChange={(value) => setFormData({...formData, bitrate: parseInt(value)})}>
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
                  <div className="flex items-center space-x-2 col-span-2">
                    <Switch 
                      id="autodj"
                      checked={formData.autodjEnabled}
                      onCheckedChange={(checked) => setFormData({...formData, autodjEnabled: checked})}
                    />
                    <Label htmlFor="autodj" className="text-slate-300">Habilitar AutoDJ</Label>
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
                    onClick={editingRadio ? handleUpdate : handleCreate}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {editingRadio ? 'Actualizar' : 'Crear Radio'}
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
                <TableHead className="text-slate-300">Radio</TableHead>
                <TableHead className="text-slate-300">Cliente</TableHead>
                <TableHead className="text-slate-300">Servidor</TableHead>
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
                          {radio.server} : {radio.port} | {radio.bitrate}kbps
                          {radio.autodjEnabled && " | AutoDJ"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white">{radio.client}</p>
                      <p className="text-sm text-slate-400">Plan {radio.plan}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Server className="h-4 w-4 text-blue-500" />
                      <span className="text-white">{radio.server}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Headphones className="h-4 w-4 text-green-500" />
                      <span className="text-white">
                        {radio.listeners} / {radio.maxListeners}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={radio.status === 'active' ? 'default' : 'destructive'}
                      className={radio.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                    >
                      {radio.status === 'active' ? 'Activa' : 'Suspendida'}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default RadiosManager;
