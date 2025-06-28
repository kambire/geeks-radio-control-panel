
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, Lock, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

interface AuthLoginProps {
  onLogin: () => void;
}

const AuthLogin = ({ onLogin }: AuthLoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiService.login({ username, password });
      
      toast({
        title: "Login exitoso",
        description: `Bienvenido, ${response.user.full_name || response.user.username}`,
      });
      
      onLogin();
    } catch (error) {
      toast({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "Credenciales incorrectas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/90 backdrop-blur-sm border-slate-700">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full w-fit">
            <Radio className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Geeks Radio</CardTitle>
            <CardDescription className="text-slate-400">
              Panel de Administración - Ingresa tus credenciales
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h4 className="text-white font-semibold mb-2 text-center">Acceso al Sistema</h4>
            <p className="text-slate-300 text-sm text-center">
              Las credenciales serán proporcionadas por el administrador del sistema después de la instalación.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthLogin;
