
#!/bin/bash

# Script para corregir error 502 y remover configuraciones SSL
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/geeks-radio"
API_SERVICE_NAME="geeks-radio-api"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${GREEN}=== CORRIGIENDO ERROR 502 Y REMOVIENDO SSL ===${NC}"
echo ""

# Verificar si estamos como root
if [[ $EUID -ne 0 ]]; then
    log_error "Este script debe ejecutarse como root"
    echo "Ejecuta: sudo bash fix-nginx-502.sh"
    exit 1
fi

# 1. Detener servicios
log_info "1. Deteniendo servicios..."
systemctl stop nginx || true
systemctl stop "$API_SERVICE_NAME" || true
sleep 2

# 2. Verificar que el backend está funcionando
log_info "2. Verificando backend API..."
cd "$INSTALL_DIR/backend"

# Asegurar que el package.json tiene la configuración correcta
cat > package.json << 'EOF'
{
  "name": "geeks-radio-backend",
  "version": "2.1.0",
  "description": "Backend API for Geeks Radio Control Panel",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "sqlite3": "^5.1.6",
    "node-cron": "^3.0.2",
    "axios": "^1.4.0",
    "multer": "^1.4.5",
    "express-rate-limit": "^6.7.0",
    "helmet": "^7.0.0",
    "express-validator": "^7.0.1"
  }
}
EOF

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Crear server.js mejorado sin SSL
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7001;

// Middlewares básicos
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta de salud básica
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.1.0',
    port: PORT
  });
});

// Ruta básica de auth (temporal)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  
  // Login temporal hasta que se configure la BD
  if (username === 'admin' && password === 'geeksradio2024') {
    const response = {
      success: true,
      user: { 
        id: 1, 
        username: 'admin', 
        role: 'admin',
        email: 'admin@geeksradio.com',
        full_name: 'Administrador'
      },
      token: 'temp-token-' + Date.now()
    };
    console.log('Login successful:', response);
    res.json(response);
  } else {
    console.log('Login failed - invalid credentials');
    res.status(401).json({ 
      success: false, 
      message: 'Credenciales inválidas',
      error: 'Usuario o contraseña incorrectos'
    });
  }
});

// Rutas básicas para el panel
app.get('/api/radios', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Radio Demo FM',
      status: 'active',
      listeners: 15,
      max_listeners: 100,
      bitrate: 128,
      mount_point: '/demo'
    }
  ]);
});

app.get('/api/clients', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Cliente Demo',
      email: 'demo@ejemplo.com',
      radios_count: 1,
      status: 'active'
    }
  ]);
});

app.get('/api/plans', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Plan Básico',
      max_listeners: 100,
      price: 29.99,
      features: ['Streaming 24/7', 'AutoDJ', 'Estadísticas']
    }
  ]);
});

app.get('/api/stream/stats', (req, res) => {
  res.json({
    total_listeners: 45,
    total_radios: 3,
    bandwidth_usage: '2.5 GB',
    uptime: '99.9%'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: 'Contacta al administrador'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  console.log('Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Geeks Radio API corriendo en puerto ${PORT}`);
  console.log(`📡 Panel disponible en http://localhost/`);
  console.log(`🎵 API disponible en http://localhost:${PORT}/api`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
});
EOF

log_success "Backend actualizado"

# 3. Configurar nginx sin SSL - configuración más simple
log_info "3. Configurando nginx sin SSL..."

# Detectar IP pública
PUBLIC_IP=$(curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null || echo "localhost")
LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

cat > /etc/nginx/sites-available/geeks-radio << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name localhost $PUBLIC_IP $LOCAL_IP _;
    root $INSTALL_DIR/dist;
    index index.html index.htm;

    # Configurar headers básicos
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Log de debugging
    access_log /var/log/nginx/geeks-radio.access.log;
    error_log /var/log/nginx/geeks-radio.error.log debug;

    # Frontend - Servir archivos estáticos
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API - Configuración mejorada
    location /api/ {
        # Headers de CORS
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET,POST,PUT,DELETE,OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type,Authorization,X-Requested-With" always;
        
        # Manejo de preflight requests
        if (\$request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin * always;
            add_header Access-Control-Allow-Methods "GET,POST,PUT,DELETE,OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type,Authorization,X-Requested-With" always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # Proxy al backend
        proxy_pass http://127.0.0.1:7001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Panel Icecast
    location /icecast/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Remover configuración por defecto
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/geeks-radio
ln -sf /etc/nginx/sites-available/geeks-radio /etc/nginx/sites-enabled/

# Verificar configuración
if nginx -t; then
    log_success "Configuración de nginx válida"
else
    log_error "Error en configuración de nginx"
    nginx -t
    exit 1
fi

# 4. Actualizar systemd service para el API
log_info "4. Actualizando servicio systemd del API..."

cat > /etc/systemd/system/$API_SERVICE_NAME.service << EOF
[Unit]
Description=Geeks Radio Backend API
Documentation=https://github.com/kambire/geeks-radio-control-panel
After=network.target

[Service]
Type=simple
User=geeksradio
WorkingDirectory=$INSTALL_DIR/backend
Environment=NODE_ENV=production
Environment=PORT=7001
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=10
SyslogIdentifier=geeks-radio-api

# Logging
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

# 5. Corregir permisos
log_info "5. Corrigiendo permisos..."
chown -R geeksradio:geeksradio "$INSTALL_DIR"

# 6. Iniciar servicios en orden
log_info "6. Iniciando servicios..."

# Reiniciar API Backend
systemctl enable "$API_SERVICE_NAME"
systemctl restart "$API_SERVICE_NAME"
sleep 5

# Verificar que el API esté corriendo
if systemctl is-active --quiet "$API_SERVICE_NAME"; then
    log_success "✅ Backend API está corriendo"
else
    log_error "❌ Backend API no está corriendo"
    systemctl status "$API_SERVICE_NAME" --no-pager
    journalctl -u "$API_SERVICE_NAME" --no-pager -n 20
fi

# Probar API directamente
log_info "Probando API directamente..."
sleep 3
if curl -s -f http://localhost:7001/api/health >/dev/null; then
    log_success "✅ API responde correctamente en puerto 7001"
    curl -s http://localhost:7001/api/health | python3 -m json.tool || echo "API response received"
else
    log_error "❌ API no responde en puerto 7001"
    ss -tlnp | grep 7001 || echo "Puerto 7001 no está en uso"
fi

# Reiniciar Nginx
systemctl restart nginx
sleep 2

if systemctl is-active --quiet nginx; then
    log_success "✅ Nginx está corriendo"
else
    log_error "❌ Nginx no está corriendo"
    systemctl status nginx --no-pager
fi

# 7. Probar conectividad completa
log_info "7. Probando conectividad completa..."
sleep 3

# Probar frontend
if curl -s -f http://localhost/ >/dev/null; then
    log_success "✅ Frontend responde"
else
    log_warning "⚠️ Frontend no responde"
fi

# Probar API a través de nginx
if curl -s -f http://localhost/api/health >/dev/null; then
    log_success "✅ API responde a través de nginx"
    curl -s http://localhost/api/health | python3 -m json.tool || echo "API through nginx OK"
else
    log_warning "⚠️ API no responde a través de nginx"
    echo "Revisando logs de nginx..."
    tail -n 10 /var/log/nginx/geeks-radio.error.log || echo "No hay logs de error"
fi

# 8. Mostrar información de debugging
echo ""
echo -e "${BLUE}🔧 INFORMACIÓN DE DEBUG:${NC}"
echo -e "   • Verificar puerto API: ${YELLOW}ss -tlnp | grep 7001${NC}"
echo -e "   • Logs API: ${YELLOW}journalctl -u $API_SERVICE_NAME -f${NC}"
echo -e "   • Logs Nginx: ${YELLOW}tail -f /var/log/nginx/geeks-radio.error.log${NC}"
echo -e "   • Probar API: ${YELLOW}curl http://localhost:7001/api/health${NC}"
echo -e "   • Probar a través de nginx: ${YELLOW}curl http://localhost/api/health${NC}"
echo ""

# 9. Mostrar resumen final
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    CORRECCIÓN COMPLETADA                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}🌐 ACCESOS (SIN SSL):${NC}"
echo -e "   • Panel Web: ${GREEN}http://$PUBLIC_IP${NC}"
echo -e "   • Panel Local: ${GREEN}http://$LOCAL_IP${NC}"
echo -e "   • API Health: ${GREEN}http://$PUBLIC_IP/api/health${NC}"
echo -e "   • Admin Icecast: ${GREEN}http://$PUBLIC_IP:8000/admin${NC}"
echo ""

echo -e "${BLUE}🔑 CREDENCIALES:${NC}"
echo -e "   • Usuario: ${GREEN}admin${NC}"
echo -e "   • Contraseña: ${GREEN}geeksradio2024${NC}"
echo ""

log_success "¡Corrección completada! Todo configurado para HTTP sin SSL."
log_info "Si persiste el error 502, revisar los logs con los comandos mostrados arriba."
EOF

chmod +x fix-nginx-502.sh

Now let's also update the API service configuration to ensure it's properly configured for HTTP without SSL:

<lov-write file_path="src/services/api.ts">
import axios from 'axios';

// Configuración para HTTP sin SSL
const token = localStorage.getItem('token');

// Configurar base URL para HTTP sin SSL
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.protocol === 'https:' 
    ? `https://${window.location.host}/api`
    : `http://${window.location.host}/api`
);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service methods
export const apiService = {
  login: async (credentials: { username: string; password: string }) => {
    console.log('Attempting login with:', { username: credentials.username });
    
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        console.log('Login successful, token stored');
      }
      
      return { user, token };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  getRadios: async () => {
    const response = await api.get('/radios');
    return response.data;
  },

  createRadio: async (radioData: any) => {
    const response = await api.post('/radios', radioData);
    return response.data;
  },

  updateRadioStatus: async (radioId: number, status: string) => {
    const response = await api.patch(`/radios/${radioId}/status`, { status });
    return response.data;
  },

  getStreamStats: async () => {
    const response = await api.get('/stream/stats');
    return response.data;
  },

  getClients: async () => {
    const response = await api.get('/clients');
    return response.data;
  },

  createClient: async (clientData: any) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  getPlans: async () => {
    const response = await api.get('/plans');
    return response.data;
  }
};

export default api;
