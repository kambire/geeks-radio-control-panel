
# Geeks Radio - Panel de Administración

Un panel de administración completo estilo SonicPanel para gestionar radios con Shoutcast/Icecast, desarrollado con React, TypeScript y Tailwind CSS.

## 🎯 Características

### ✅ Funcionalidades Implementadas
- **Dashboard Principal**: Estadísticas en tiempo real, métricas del servidor y estado de radios
- **Gestión de Radios**: Crear, editar, suspender/activar estaciones con soporte Icecast/Shoutcast
- **Gestión de Clientes**: CRUD completo de clientes con información de contacto
- **Gestión de Planes**: Configuración de planes con límites de espacio, oyentes y bitrate
- **Autenticación**: Sistema de login seguro para administradores
- **Interfaz Moderna**: Diseño responsivo con tema oscuro y gradientes

### 🎨 Diseño
- **Tema**: Colores oscuros (slate/blue) con acentos naranjas/rojos
- **Responsive**: Adaptado para desktop, tablet y móvil
- **Animaciones**: Transiciones suaves y micro-interacciones
- **Iconografía**: Lucide React icons para una apariencia profesional

## 🚀 Instalación Rápida

### Método 1: Instalador Automático (Recomendado)
```bash
# Descargar y ejecutar instalador
curl -fsSL https://raw.githubusercontent.com/kambire/geeks-radio-control-panel/main/install.sh | bash
```

### Método 2: Instalación Manual
```bash
# Clonar repositorio
git clone https://github.com/kambire/geeks-radio-control-panel.git
cd geeks-radio-control-panel

# Instalar dependencias
npm install

# Iniciar aplicación
npm run dev
```

## 📋 Credenciales de Acceso

### Administrador por Defecto
- **Usuario**: `admin`
- **Contraseña**: `geeksradio2024`

> ⚠️ **Importante**: Cambiar estas credenciales en producción

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Iconos**: Lucide React
- **Estado**: React Hooks (useState, useEffect)
- **Routing**: React Router DOM
- **Notificaciones**: Sonner + React Hot Toast

## 📁 Estructura del Proyecto

```
geeks-radio-control-panel/
├── src/
│   ├── components/
│   │   ├── AuthLogin.tsx          # Sistema de autenticación
│   │   ├── Dashboard.tsx          # Panel principal con métricas
│   │   ├── RadiosManager.tsx      # Gestión de radios
│   │   ├── ClientsManager.tsx     # Gestión de clientes
│   │   ├── PlansManager.tsx       # Gestión de planes
│   │   └── ui/                    # Componentes de interfaz
│   ├── pages/
│   │   ├── Index.tsx              # Página principal
│   │   └── NotFound.tsx           # Página 404
│   ├── hooks/                     # Hooks personalizados
│   ├── lib/                       # Utilidades
│   └── types/                     # Definiciones TypeScript
├── install.sh                     # Instalador automático
├── update.sh                      # Script de actualización
└── README.md
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev                        # Iniciar servidor de desarrollo

# Producción
npm run build                      # Construir para producción
npm run preview                    # Vista previa de producción

# Mantenimiento
./update.sh                        # Verificar y aplicar actualizaciones
```

## 📊 Panel de Control

### Dashboard Principal
- **Métricas en Tiempo Real**: Total de radios, clientes, oyentes
- **Estado del Servidor**: CPU, memoria, ancho de banda
- **Radios Activas**: Lista de estaciones con estado actual
- **Estadísticas**: Gráficos de uso y tendencias

### Gestión de Radios
- **Crear/Editar**: Configuración completa de estaciones
- **Servidores**: Soporte para Icecast y Shoutcast
- **AutoDJ**: Habilitación opcional de AutoDJ
- **Suspensión**: Activar/suspender radios con un clic
- **Monitoreo**: Oyentes actuales y límites por plan

### Gestión de Clientes
- **Información Completa**: Nombre, email, teléfono, empresa
- **Historial**: Fecha de registro y notas
- **Estado**: Activar/desactivar cuentas
- **Relaciones**: Radios asignadas por cliente

### Gestión de Planes
- **Configuración Flexible**: Espacio, oyentes, bitrate
- **Precios**: Configuración de tarifas mensuales
- **Características**: Lista personalizable de features
- **Popularidad**: Marcar planes destacados

## 🔄 Sistema de Actualizaciones

El script `update.sh` permite actualizar el sistema de forma segura:

```bash
./update.sh
```

**Funcionalidades del updater:**
- Verificación de nuevas versiones
- Backup automático antes de actualizar
- Migración de base de datos si es necesario
- Preservación de configuraciones personalizadas
- Rollback automático en caso de error

## 🗄️ Base de Datos

### Estructura Actual (Simulada)
El sistema actualmente utiliza datos en memoria para desarrollo. Para producción se recomienda integrar:

- **SQLite**: Para instalaciones simples
- **PostgreSQL**: Para instalaciones empresariales
- **MySQL**: Como alternativa popular

### Tablas Principales
```sql
-- Clientes
clients (id, name, email, phone, company, address, status, created_at)

-- Planes
plans (id, name, description, disk_space, max_listeners, bitrate, price, features)

-- Radios
radios (id, name, client_id, plan_id, server_type, port, status, autodj_enabled)

-- Estadísticas
stats (radio_id, listeners, bandwidth, uptime, date)
```

## 🔐 Seguridad

### Autenticación
- Sistema de login con validación
- Sesiones seguras (implementar JWT en producción)
- Protección de rutas administrativas

### Recomendaciones de Producción
1. **HTTPS**: Implementar certificado SSL
2. **Variables de Entorno**: Mover credenciales a .env
3. **Rate Limiting**: Limitar intentos de login
4. **Backup**: Sistema de respaldo automático
5. **Logs**: Implementar logging de actividades

## 🚀 Despliegue

### Opción 1: Servidor VPS
```bash
# En el servidor
git clone https://github.com/kambire/geeks-radio-control-panel.git
cd geeks-radio-control-panel
./install.sh

# Configurar nginx/apache para servir la aplicación
```

### Opción 2: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Opción 3: Servicios Cloud
- **Vercel**: Despliegue automático desde GitHub
- **Netlify**: Hosting estático con funciones
- **DigitalOcean**: App Platform
- **AWS**: S3 + CloudFront

## 🔧 Configuración Avanzada

### Variables de Entorno (Producción)
```env
# Autenticación
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro

# Base de Datos
DATABASE_URL=postgresql://user:pass@localhost:5432/geeksradio

# API Externa (Opcional)
SONICPANEL_API_URL=https://api.sonicpanel.com
SONICPANEL_API_KEY=tu_api_key
```

### Integración con SonicPanel
Para conectar con la API real de SonicPanel:

1. Obtener credenciales de API
2. Configurar endpoints en `src/services/api.ts`
3. Implementar funciones de sincronización
4. Actualizar componentes para usar datos reales

## 🤝 Contribuir

### Desarrollo Local
```bash
git clone https://github.com/kambire/geeks-radio-control-panel.git
cd geeks-radio-control-panel
npm install
npm run dev
```

### Estilo de Código
- **ESLint**: Configuración incluida
- **Prettier**: Formateo automático
- **TypeScript**: Tipado estricto
- **Convenciones**: Nombres en camelCase, componentes en PascalCase

### Pull Requests
1. Fork del repositorio
2. Crear rama para feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit descriptivos: `git commit -m "feat: agregar gestión de backups"`
4. Push y crear Pull Request

## 📝 Roadmap

### v2.0 - Backend Real
- [ ] Integración con base de datos PostgreSQL
- [ ] API REST completa
- [ ] Autenticación JWT
- [ ] Sistema de roles y permisos

### v2.1 - Características Avanzadas
- [ ] Dashboard con gráficos en tiempo real
- [ ] Sistema de notificaciones
- [ ] Logs de actividad
- [ ] Backup automatizado

### v2.2 - Integraciones
- [ ] API de SonicPanel
- [ ] Webhooks para eventos
- [ ] Integración con sistemas de pago
- [ ] Panel de estadísticas avanzadas

## 📞 Soporte

### Documentación
- **Wiki**: [GitHub Wiki](https://github.com/kambire/geeks-radio-control-panel/wiki)
- **API Docs**: Documentación de endpoints (próximamente)

### Comunidad
- **Issues**: [GitHub Issues](https://github.com/kambire/geeks-radio-control-panel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kambire/geeks-radio-control-panel/discussions)

### Soporte Comercial
Para instalaciones empresariales y soporte dedicado:
- **Email**: soporte@geeksradio.com
- **GitHub**: [kambire/geeks-radio-control-panel](https://github.com/kambire/geeks-radio-control-panel)

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🏆 Créditos

Desarrollado con ❤️ por el equipo de Geeks Radio

### Tecnologías Utilizadas
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide React](https://lucide.dev/)
- [Vite](https://vitejs.dev/)

---

**¿Te gusta este proyecto?** ⭐ Dale una estrella en GitHub y compártelo con la comunidad.

**Repositorio**: https://github.com/kambire/geeks-radio-control-panel
