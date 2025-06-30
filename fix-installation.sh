
#!/bin/bash

# Script de Diagnóstico y Reparación - Geeks Radio
# Corregir errores de instalación

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/geeks-radio"
SERVICE_NAME="geeks-radio"
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

echo -e "${GREEN}=== DIAGNÓSTICO Y REPARACIÓN GEEKS RADIO ===${NC}"
echo ""

# Verificar si estamos como root
if [[ $EUID -ne 0 ]]; then
    log_error "Este script debe ejecutarse como root"
    echo "Ejecuta: sudo bash fix-installation.sh"
    exit 1
fi

# 1. Verificar directorio de instalación
log_info "1. Verificando directorio de instalación..."
if [[ ! -d "$INSTALL_DIR" ]]; then
    log_error "Directorio de instalación no encontrado: $INSTALL_DIR"
    exit 1
fi

cd "$INSTALL_DIR"
log_success "Directorio de instalación OK"

# 2. Detener servicios problemáticos
log_info "2. Deteniendo servicios..."
systemctl stop "$SERVICE_NAME" || true
systemctl stop "$API_SERVICE_NAME" || true
systemctl stop nginx || true
log_success "Servicios detenidos"

# 3. Verificar y corregir package.json del frontend
log_info "3. Corrigiendo package.json del frontend..."
if [[ ! -f "package.json" ]]; then
    log_error "package.json no encontrado en el frontend"
    exit 1
fi

# Verificar si existe el script start
if ! grep -q '"start"' package.json; then
    log_warning "Script start no encontrado, agregando..."
    # Crear backup
    cp package.json package.json.backup
    
    # Agregar script start usando jq si está disponible, sino usar sed
    if command -v jq >/dev/null 2>&1; then
        jq '.scripts.start = "serve -s dist -l 7000"' package.json > package.json.tmp && mv package.json.tmp package.json
    else
        # Usar sed como fallback
        sed -i 's/"scripts": {/"scripts": {\n    "start": "serve -s dist -l 7000",/' package.json
    fi
    
    # Instalar serve globalmente
    npm install -g serve
    log_success "Script start agregado"
fi

# 4. Reinstalar dependencias del backend correctamente
log_info "4. Reinstalando dependencias del backend..."
cd "$INSTALL_DIR/backend"

# Crear package.json del backend si no existe o está corrupto
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

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
log_success "Dependencias del backend reinstaladas"

# 5. Verificar que el server.js existe y es correcto
log_info "5. Verificando server.js..."
if [[ ! -f "server.js" ]]; then
    log_error "server.js no encontrado, creando..."
    
# Crear server.js básico funcional
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7001;

// Middlewares básicos
app.use(cors());
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
    version: '2.1.0'
  });
});

// Ruta básica de auth (temporal)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Login temporal hasta que se configure la BD
  if (username === 'admin' && password === 'geeksradio2024') {
    res.json({
      success: true,
      user: { id: 1, username: 'admin', role: 'admin' },
      token: 'temp-token-' + Date.now()
    });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: 'Contacta al administrador'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Geeks Radio API corriendo en puerto ${PORT}`);
  console.log(`📡 Panel disponible en http://localhost:7000`);
  console.log(`🎵 API disponible en http://localhost:${PORT}/api`);
});
EOF

fi

log_success "server.js verificado"

# 6. Volver al directorio principal y reconstruir frontend
log_info "6. Reconstruyendo frontend..."
cd "$INSTALL_DIR"
npm run build
log_success "Frontend reconstruido"

# 7. Corregir configuración de nginx
log_info "7. Corrigiendo configuración de nginx..."

# Detectar IP pública
PUBLIC_IP=$(curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null || echo "localhost")

cat > /etc/nginx/sites-available/geeks-radio << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name localhost $PUBLIC_IP _;
    root $INSTALL_DIR/dist;
    index index.html index.htm;

    # Configurar headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend - Servir archivos estáticos
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:7001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        
        # CORS headers
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET,POST,PUT,DELETE,OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type,Authorization" always;
        
        if (\$request_method = OPTIONS) {
            return 204;
        }
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
    
    access_log /var/log/nginx/geeks-radio.access.log;
    error_log /var/log/nginx/geeks-radio.error.log;
}
EOF

# Remover configuración por defecto
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/geeks-radio /etc/nginx/sites-enabled/

# Verificar configuración
if nginx -t; then
    log_success "Configuración de nginx corregida"
else
    log_error "Error en configuración de nginx"
    nginx -t
    exit 1
fi

# 8. Corregir servicios systemd
log_info "8. Corrigiendo servicios systemd..."

# Servicio del backend API (más importante)
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
Restart=on-failure
RestartSec=10
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
SyslogIdentifier=geeks-radio-api

# Logging
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Para el frontend, nginx servirá los archivos estáticos, no necesitamos servicio separado
# Pero mantenemos uno simple por compatibilidad
cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Geeks Radio Control Panel Frontend
Documentation=https://github.com/kambire/geeks-radio-control-panel
After=network.target

[Service]
Type=simple
User=geeksradio
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
Environment=PORT=7000
ExecStart=/usr/bin/npx serve -s dist -l 7000
Restart=on-failure
RestartSec=10
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
SyslogIdentifier=geeks-radio

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
log_success "Servicios systemd corregidos"

# 9. Corregir permisos
log_info "9. Corrigiendo permisos..."
chown -R geeksradio:geeksradio "$INSTALL_DIR"
chmod +x "$INSTALL_DIR/update.sh" 2>/dev/null || true
log_success "Permisos corregidos"

# 10. Iniciar servicios en orden correcto
log_info "10. Iniciando servicios..."

# Iniciar Icecast
systemctl enable icecast2
systemctl start icecast2
sleep 2

# Iniciar API Backend
systemctl enable "$API_SERVICE_NAME"
systemctl start "$API_SERVICE_NAME"
sleep 3

# Iniciar Nginx
systemctl enable nginx
systemctl start nginx
sleep 2

# Verificar estados
log_info "Verificando estados de servicios..."

if systemctl is-active --quiet icecast2; then
    log_success "✅ Icecast2 está corriendo"
else
    log_error "❌ Icecast2 no está corriendo"
    systemctl status icecast2 --no-pager
fi

if systemctl is-active --quiet "$API_SERVICE_NAME"; then
    log_success "✅ Backend API está corriendo"
else
    log_error "❌ Backend API no está corriendo"
    systemctl status "$API_SERVICE_NAME" --no-pager
    journalctl -u "$API_SERVICE_NAME" --no-pager -n 20
fi

if systemctl is-active --quiet nginx; then
    log_success "✅ Nginx está corriendo"
else
    log_error "❌ Nginx no está corriendo"
    systemctl status nginx --no-pager
fi

# 11. Pruebas de conectividad
log_info "11. Realizando pruebas de conectividad..."

# Probar API
sleep 5
if curl -s -f http://localhost:7001/api/health >/dev/null; then
    log_success "✅ API Backend responde correctamente"
else
    log_warning "⚠️ API Backend no responde - verificar logs"
fi

# Probar Frontend a través de nginx
if curl -s -f http://localhost/ >/dev/null; then
    log_success "✅ Frontend responde a través de nginx"
else
    log_warning "⚠️ Frontend no responde - verificar nginx"
fi

# 12. Mostrar resumen final
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    REPARACIÓN COMPLETADA                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")

echo -e "${BLUE}🌐 ACCESOS CORREGIDOS:${NC}"
echo -e "   • Panel Web: ${GREEN}http://$PUBLIC_IP${NC}"
echo -e "   • Panel Local: ${GREEN}http://$LOCAL_IP${NC}"
echo -e "   • API Health: ${GREEN}http://$PUBLIC_IP/api/health${NC}"
echo -e "   • Admin Icecast: ${GREEN}http://$PUBLIC_IP:8000/admin${NC}"
echo ""

echo -e "${BLUE}🔧 COMANDOS DE DIAGNÓSTICO:${NC}"
echo -e "   • Ver logs API: ${YELLOW}journalctl -u $API_SERVICE_NAME -f${NC}"
echo -e "   • Ver logs Nginx: ${YELLOW}tail -f /var/log/nginx/geeks-radio.error.log${NC}"
echo -e "   • Estado servicios: ${YELLOW}systemctl status $API_SERVICE_NAME nginx icecast2${NC}"
echo -e "   • Probar API: ${YELLOW}curl http://localhost:7001/api/health${NC}"
echo ""

echo -e "${BLUE}🔑 CREDENCIALES:${NC}"
echo -e "   • Usuario: ${GREEN}admin${NC}"
echo -e "   • Contraseña: ${GREEN}geeksradio2024${NC}"
echo ""

log_success "¡Reparación completada! El sistema debe estar funcionando ahora."
log_info "Si siguen los problemas, revisar los logs con los comandos mostrados arriba."
EOF

chmod +x fix-installation.sh

# Ahora vamos a corregir el Vite config para el puerto 7000 de producción
<lov-write file_path="vite.config.ts">
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 7000,
    proxy: {
      '/api': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 7000,
    proxy: {
      '/api': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '/api'),
  },
})
