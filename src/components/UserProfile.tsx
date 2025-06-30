
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Lock, Save, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name?: string;
  phone?: string;
  company?: string;
  created_at: string;
  last_login?: string;
}

interface ProfileFormData {
  email: string;
  full_name: string;
  phone: string;
  company: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    email: '',
    full_name: '',
    phone: '',
    company: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          email: data.email || '',
          full_name: data.full_name || '',
          phone: data.phone || '',
          company: data.company || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        throw new Error('Error al cargar perfil');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil del usuario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (formData.new_password && !formData.current_password) {
      toast({
        title: "Error",
        description: "Debes ingresar tu contraseña actual para cambiarla",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const updateData: any = {
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        company: formData.company
      };

      if (formData.new_password) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Perfil actualizado correctamente",
        });
        
        // Limpiar campos de contraseña
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
        
        // Recargar perfil
        fetchProfile();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar perfil');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white">Cargando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert className="bg-red-900/20 border-red-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-300">
          No se pudo cargar la información del perfil
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <User className="h-6 w-6 text-orange-500" />
        <h2 className="text-2xl font-bold text-white">Mi Perfil</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-orange-500" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu información personal y datos de contacto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={profile.username}
                disabled
                className="bg-slate-700 border-slate-600 text-slate-400"
              />
              <p className="text-xs text-slate-400 mt-1">El usuario no se puede modificar</p>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cambiar Contraseña */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Lock className="h-5 w-5 text-orange-500" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña para mantener tu cuenta segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current_password">Contraseña Actual</Label>
              <Input
                id="current_password"
                type="password"
                value={formData.current_password}
                onChange={(e) => handleInputChange('current_password', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>

            <div>
              <Label htmlFor="new_password">Nueva Contraseña</Label>
              <Input
                id="new_password"
                type="password"
                value={formData.new_password}
                onChange={(e) => handleInputChange('new_password', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <Alert className="bg-blue-900/20 border-blue-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-blue-300">
                Deja estos campos vacíos si no deseas cambiar tu contraseña
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Información de la Cuenta */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Información de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-slate-400">Rol</Label>
              <p className="text-white font-medium">
                {profile.role === 'admin' ? 'Administrador' : 'Cliente'}
              </p>
            </div>
            <div>
              <Label className="text-slate-400">Cuenta creada</Label>
              <p className="text-white font-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-slate-400">Último acceso</Label>
              <p className="text-white font-medium">
                {profile.last_login 
                  ? new Date(profile.last_login).toLocaleDateString()
                  : 'Nunca'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveProfile}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {saving ? (
            <>Guardando...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
