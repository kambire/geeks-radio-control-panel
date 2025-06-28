#!/bin/bash

# Geeks Radio - Instalador Automático Completo
# Version: 2.0.0
# Descripción: Instalación completa con Icecast, SHOUTcast y Backend
# Repositorio: https://github.com/kambire/geeks-radio-control-panel

set -e

# Variables de entorno para instalación desatendida
export DEBIAN_FRONTEND=noninteractive

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables de configuración
PROJECT_NAME="geeks-radio-control-panel"
DEFAULT_PORT=3000
API_PORT=3001
INSTALL_DIR="/opt/geeks-radio"
SERVICE_NAME="geeks-radio"
LOG_FILE="/var/log/geeks-radio-install.log"
REPO_URL="https://github.com/kambire/geeks-radio-control-panel.git"
ICECAST_CONFIG_DIR="/etc/icecast2"
SHOUTCAST_DIR="/opt/shoutcast"
STREAMS_DIR="/opt/geeks-radio/streams"

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Mostrar banner
show_banner() {
    clear
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    GEEKS RADIO PANEL                         ║"
    echo "║              Instalación Automática Completa                ║"
    echo "║                     Versión 2.0.0                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar si se ejecuta como root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script debe ejecutarse como root"
        log_info "Ejecuta: sudo $0"
        exit 1
    fi
}

# Detectar sistema operativo
detect_system() {
    log_info "Detectando sistema operativo..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get >/dev/null 2>&1; then
            DISTRO="ubuntu"
            PKG_MANAGER="apt-get"
            log_info "Sistema detectado: Ubuntu/Debian"
        elif command -v yum >/dev/null 2>&1; then
            DISTRO="centos"
            PKG_MANAGER="yum"
            log_info "Sistema detectado: CentOS/RHEL"
        elif command -v dnf >/dev/null 2>&1; then
            DISTRO="fedora"
            PKG_MANAGER="dnf"
            log_info "Sistema detectado: Fedora"
        else
            log_error "Distribución Linux no soportada"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        DISTRO="macos"
        PKG_MANAGER="brew"
        log_info "Sistema detectado: macOS"
    else
        log_error "Sistema operativo no soportado: $OSTYPE"
        exit 1
    fi
}

# Configurar instalación desatendida para Icecast
configure_icecast_unattended() {
    log_info "Configurando instalación desatendida de Icecast..."
    
    case $DISTRO in
        "ubuntu")
            # Preconfigurar respuestas para Icecast2
            echo 'icecast2 icecast2/icecast-setup boolean true' | debconf-set-selections
            echo 'icecast2 icecast2/hostname string localhost' | debconf-set-selections
            echo 'icecast2 icecast2/sourcepassword password geeksradio2024' | debconf-set-selections
            echo 'icecast2 icecast2/relaypassword password geeksradio2024' | debconf-set-selections
            echo 'icecast2 icecast2/adminpassword password geeksradio2024' | debconf-set-selections
            ;;
    esac
}

# Instalar dependencias del sistema
install_system_dependencies() {
    log_info "Instalando dependencias del sistema..."
    
    case $DISTRO in
        "ubuntu")
            apt-get update -y
            apt-get install -y curl wget git nginx sqlite3 build-essential python3 python3-pip debconf-utils
            ;;
        "centos"|"fedora")
            $PKG_MANAGER update -y
            $PKG_MANAGER install -y curl wget git nginx sqlite gcc gcc-c++ make python3 python3-pip
            ;;
        "macos")
            if ! command -v brew >/dev/null 2>&1; then
                log_info "Instalando Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install curl wget git nginx sqlite3
            ;;
    esac
    
    log_success "Dependencias del sistema instaladas"
}

# Instalar Node.js y npm
install_nodejs() {
    log_info "Instalando Node.js y npm..."
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        log_info "Node.js ya está instalado: $NODE_VERSION"
    else
        case $DISTRO in
            "ubuntu")
                curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
                apt-get install -y nodejs
                ;;
            "centos"|"fedora")
                curl -fsSL https://rpm.nodesource.com/setup_lts.x | bash -
                $PKG_MANAGER install -y nodejs npm
                ;;
            "macos")
                brew install node npm
                ;;
        esac
    fi
    
    log_success "Node.js instalado: $(node --version)"
    log_success "npm instalado: $(npm --version)"
}

# Instalar servidores de streaming
install_streaming_servers() {
    log_info "Instalando servidores de streaming..."
    
    # Configurar instalación desatendida antes de instalar
    configure_icecast_unattended
    
    # Instalar Icecast2
    case $DISTRO in
        "ubuntu")
            apt-get update -y
            apt-get install -y icecast2
            # Habilitar Icecast2 automáticamente
            sed -i 's/ENABLE=false/ENABLE=true/' /etc/default/icecast2 2>/dev/null || true
            ;;
        "centos"|"fedora")
            $PKG_MANAGER install -y icecast
            ;;
        "macos")
            brew install icecast
            ;;
    esac
    
    # Configurar Icecast2 con configuración personalizada
    log_info "Configurando Icecast2..."
    mkdir -p "$ICECAST_CONFIG_DIR"
    tee "$ICECAST_CONFIG_DIR/icecast.xml" > /dev/null << 'ICECAST_EOF'
<icecast>
    <location>Earth</location>
    <admin>admin@geeksradio.com</admin>
    <limits>
        <clients>1000</clients>
        <sources>100</sources>
        <queue-size>524288</queue-size>
        <client-timeout>30</client-timeout>
        <header-timeout>15</header-timeout>
        <source-timeout>10</source-timeout>
        <burst-on-connect>1</burst-on-connect>
        <burst-size>65535</burst-size>
    </limits>
    <authentication>
        <source-password>geeksradio2024</source-password>
        <relay-password>geeksradio2024</relay-password>
        <admin-user>admin</admin-user>
        <admin-password>geeksradio2024</admin-password>
    </authentication>
    <hostname>localhost</hostname>
    <listen-socket>
        <port>8000</port>
    </listen-socket>
    <http-headers>
        <header name="Access-Control-Allow-Origin" value="*" />
    </http-headers>
    <fileserve>1</fileserve>
    <paths>
        <basedir>/usr/share/icecast2</basedir>
        <logdir>/var/log/icecast2</logdir>
        <webroot>/usr/share/icecast2/web</webroot>
        <adminroot>/usr/share/icecast2/admin</adminroot>
        <pidfile>/var/run/icecast2/icecast2.pid</pidfile>
        <alias source="/" destination="/status.xsl"/>
    </paths>
    <logging>
        <accesslog>access.log</accesslog>
        <errorlog>error.log</errorlog>
        <loglevel>3</loglevel>
        <logsize>10000</logsize>
    </logging>
    <security>
        <chroot>0</chroot>
        <changeowner>
            <user>icecast2</user>
            <group>icecast</group>
        </changeowner>
    </security>
</icecast>
ICECAST_EOF
    
    # Descargar e instalar SHOUTcast (versión gratuita)
    log_info "Instalando SHOUTcast Server..."
    mkdir -p "$SHOUTCAST_DIR"
    cd /tmp
    
    if [[ "$DISTRO" != "macos" ]]; then
        # Descargar SHOUTcast para Linux
        wget -q http://download.nullsoft.com/shoutcast/tools/sc_serv2_linux_x64-latest.tar.gz || true
        if [[ -f "sc_serv2_linux_x64-latest.tar.gz" ]]; then
            tar -xzf sc_serv2_linux_x64-latest.tar.gz -C "$SHOUTCAST_DIR"
            chmod +x "$SHOUTCAST_DIR/sc_serv"
        fi
    fi
    
    # Crear configuración básica de SHOUTcast
    tee "$SHOUTCAST_DIR/sc_serv_basic.conf" > /dev/null << 'SHOUT_EOF'
; SHOUTcast server configuration
password=geeksradio2024
adminpassword=geeksradio2024
portbase=8001
logfile=logs/sc_serv.log
realtime=1
screensaver=geeksradio
unique=1
SHOUT_EOF
    
    # Crear directorios de logs
    mkdir -p "$SHOUTCAST_DIR/logs"
    mkdir -p "$STREAMS_DIR"
    mkdir -p /var/log/icecast2
    
    log_success "Servidores de streaming instalados"
}

# Crear usuario para la aplicación
create_app_user() {
    if [[ "$DISTRO" == "macos" ]]; then
        log_info "Saltando creación de usuario en macOS"
        CREATE_USER=false
        return
    fi
    
    log_info "Creando usuario para la aplicación..."
    
    if ! id "geeksradio" &>/dev/null; then
        useradd -r -s /bin/bash -d "$INSTALL_DIR" geeksradio
        log_success "Usuario 'geeksradio' creado"
        CREATE_USER=true
    else
        log_info "Usuario 'geeksradio' ya existe"
        CREATE_USER=true
    fi
}

# Descargar aplicación desde GitHub
download_application() {
    log_info "Descargando aplicación desde GitHub..."
    
    if [[ -d "$INSTALL_DIR" ]]; then
        log_info "Directorio existe, actualizando..."
        cd "$INSTALL_DIR"
        git pull origin main || {
            log_warning "Error al actualizar, clonando de nuevo..."
            cd /opt
            rm -rf geeks-radio
            git clone "$REPO_URL" geeks-radio
        }
    else
        cd /opt
        git clone "$REPO_URL" geeks-radio
    fi
    
    cd "$INSTALL_DIR"
    log_success "Aplicación descargada"
}

# Instalar dependencias de la aplicación
install_app_dependencies() {
    log_info "Instalando dependencias de la aplicación..."
    cd "$INSTALL_DIR"
    npm install
    log_success "Dependencias instaladas"
}

# Construir aplicación
build_application() {
    log_info "Construyendo aplicación..."
    cd "$INSTALL_DIR"
    npm run build
    log_success "Aplicación construida"
}

# Crear backend API
create_backend_api() {
    log_info "Creando backend API..."
    
    cd "$INSTALL_DIR"
    
    # Crear estructura de backend
    mkdir -p backend/{routes,models,services,config}
    
    # Crear package.json para backend
    tee backend/package.json > /dev/null << 'BACKEND_PACKAGE_EOF'
{
  "name": "geeks-radio-backend",
  "version": "1.0.0",
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
    "express-rate-limit": "^6.7.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
BACKEND_PACKAGE_EOF
    
    # Crear servidor principal
    tee backend/server.js > /dev/null << 'SERVER_EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const radioRoutes = require('./routes/radios');
const clientRoutes = require('./routes/clients');
const planRoutes = require('./routes/plans');
const streamRoutes = require('./routes/streams');

// Inicializar base de datos
const db = require('./config/database');
db.init();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana por IP
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/radios', radioRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/streams', streamRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Geeks Radio API corriendo en puerto ${PORT}`);
  console.log(`📡 Panel disponible en http://localhost:3000`);
  console.log(`🎵 API disponible en http://localhost:${PORT}/api`);
});
SERVER_EOF
    
    log_success "Backend API creado"
}

# Configurar servicio systemd
configure_systemd_service() {
    if [[ "$DISTRO" == "macos" ]] || [[ "$CREATE_USER" == false ]]; then
        log_info "Saltando configuración de servicio systemd"
        return
    fi
    
    log_info "Configurando servicio systemd..."
    
    tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << SYSTEMD_EOF
[Unit]
Description=Geeks Radio Control Panel
Documentation=https://github.com/kambire/geeks-radio-control-panel
After=network.target

[Service]
Type=simple
User=geeksradio
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
Environment=PORT=$DEFAULT_PORT
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
SyslogIdentifier=geeks-radio

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF
    
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    log_success "Servicio systemd configurado"
}

# Configurar nginx
configure_nginx() {
    log_info "Configurando nginx..."
    
    # Detener nginx si está corriendo
    systemctl stop nginx 2>/dev/null || true
    
    NGINX_CONFIG="/etc/nginx/sites-available/geeks-radio"
    
    tee "$NGINX_CONFIG" > /dev/null << NGINX_EOF
server {
    listen 80;
    server_name localhost;
    
    # Frontend
    location / {
        proxy_pass http://127.0.0.1:$DEFAULT_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Archivos estáticos
    location /assets/ {
        alias $INSTALL_DIR/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Logs
    access_log /var/log/nginx/geeks-radio.access.log;
    error_log /var/log/nginx/geeks-radio.error.log;
}
NGINX_EOF
    
    # Habilitar sitio
    if [[ -d "/etc/nginx/sites-enabled" ]]; then
        ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
    fi
    
    # Verificar configuración
    if nginx -t; then
        log_success "Configuración de nginx creada"
    else
        log_error "Error en la configuración de nginx"
        exit 1
    fi
}

# Configurar firewall
configure_firewall() {
    log_info "Configurando firewall..."
    
    if command -v ufw >/dev/null 2>&1; then
        ufw --force enable
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw allow 8000:8100/tcp
        log_success "Firewall configurado con ufw"
    elif command -v firewall-cmd >/dev/null 2>&1; then
        systemctl enable firewalld
        systemctl start firewalld
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=8000-8100/tcp
        firewall-cmd --reload
        log_success "Firewall configurado con firewalld"
    else
        log_warning "No se encontró sistema de firewall"
    fi
}

# Iniciar servicios
start_services() {
    log_info "Iniciando servicios..."
    
    if [[ "$CREATE_USER" == true ]] && [[ "$DISTRO" != "macos" ]]; then
        chown -R geeksradio:geeksradio "$INSTALL_DIR"
        
        systemctl start icecast2
        systemctl enable icecast2
        systemctl start $SERVICE_NAME
        systemctl start nginx
        
        if systemctl is-active --quiet $SERVICE_NAME; then
            log_success "Servicio $SERVICE_NAME iniciado"
        else
            log_error "Error al iniciar $SERVICE_NAME"
            systemctl status $SERVICE_NAME --no-pager
        fi
        
        if systemctl is-active --quiet nginx; then
            log_success "Servicio nginx iniciado"
        else
            log_error "Error al iniciar nginx"
            systemctl status nginx --no-pager
        fi
        
        if systemctl is-active --quiet icecast2; then
            log_success "Servicio icecast2 iniciado"
        else
            log_error "Error al iniciar icecast2"
            systemctl status icecast2 --no-pager
        fi
    else
        log_info "Iniciando manualmente en macOS o sin usuario dedicado"
        cd "$INSTALL_DIR"
        npm start &
    fi
}

# Crear script de actualización
create_update_script() {
    log_info "Creando script de actualización..."
    
    tee "$INSTALL_DIR/update.sh" > /dev/null << 'UPDATE_EOF'
#!/bin/bash

# Geeks Radio - Sistema de Actualización

INSTALL_DIR="/opt/geeks-radio"
SERVICE_NAME="geeks-radio"

log_info() {
    echo "[INFO] $1"
}

log_success() {
    echo "[SUCCESS] $1"
}

echo "Geeks Radio - Sistema de Actualización"
echo ""

log_info "Verificando actualizaciones desde GitHub..."
cd "$INSTALL_DIR"

git fetch origin main

if git diff HEAD origin/main --quiet; then
    log_success "No hay actualizaciones disponibles"
    exit 0
fi

log_info "Actualizaciones encontradas, aplicando..."

# Detener servicios
sudo systemctl stop "$SERVICE_NAME" 2>/dev/null || true

# Actualizar código
git pull origin main

# Instalar dependencias
npm install

# Construir aplicación
npm run build

# Reiniciar servicios
sudo systemctl start "$SERVICE_NAME" 2>/dev/null || true
sudo systemctl restart nginx 2>/dev/null || true

log_success "Actualización completada"
UPDATE_EOF
    
    chmod +x "$INSTALL_DIR/update.sh"
    log_success "Script de actualización creado"
}

# Crear scripts adicionales
create_additional_scripts() {
    log_info "Creando scripts adicionales..."
    
    # Script de monitoreo de streams
    tee "$INSTALL_DIR/monitor-streams.sh" > /dev/null << 'MONITOR_EOF'
#!/bin/bash

# Geeks Radio - Monitor de Streams
# Monitorea el estado de todos los streams activos

INSTALL_DIR="/opt/geeks-radio"
LOG_FILE="$INSTALL_DIR/logs/monitor.log"

mkdir -p "$INSTALL_DIR/logs"

log_monitor() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_monitor "Iniciando monitoreo de streams..."

# Verificar Icecast
if systemctl is-active --quiet icecast2; then
    log_monitor "✅ Icecast2 está corriendo"
    
    # Obtener estadísticas de Icecast
    ICECAST_STATS=$(curl -s http://localhost:8000/status-json.xsl 2>/dev/null || echo "Error")
    if [ "$ICECAST_STATS" != "Error" ]; then
        log_monitor "📊 Estadísticas Icecast obtenidas"
    else
        log_monitor "⚠️  Error al obtener estadísticas de Icecast"
    fi
else
    log_monitor "❌ Icecast2 no está corriendo"
fi

# Verificar puertos de streaming
for port in {8000..8020}; do
    if netstat -tuln | grep -q ":$port "; then
        log_monitor "🎵 Puerto $port en uso (stream activo)"
    fi
done

log_monitor "Monitoreo completado"
MONITOR_EOF
    
    # Script de backup
    tee "$INSTALL_DIR/backup-system.sh" > /dev/null << 'BACKUP_EOF'
#!/bin/bash

# Geeks Radio - Sistema de Backup
# Crea backup completo de configuraciones y base de datos

INSTALL_DIR="/opt/geeks-radio"
BACKUP_DIR="$INSTALL_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="geeks-radio-backup-$DATE.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "Creando backup del sistema Geeks Radio..."

# Crear directorio temporal
TEMP_DIR=$(mktemp -d)

# Copiar archivos importantes
cp -r "$INSTALL_DIR/backend" "$TEMP_DIR/"
cp -r "$INSTALL_DIR/streams" "$TEMP_DIR/" 2>/dev/null || true
cp /etc/icecast2/icecast.xml "$TEMP_DIR/" 2>/dev/null || true
cp /etc/nginx/sites-available/geeks-radio "$TEMP_DIR/" 2>/dev/null || true

# Crear archivo comprimido
cd "$TEMP_DIR"
tar -czf "$BACKUP_DIR/$BACKUP_FILE" *

# Limpiar
rm -rf "$TEMP_DIR"

echo "✅ Backup creado: $BACKUP_DIR/$BACKUP_FILE"

# Mantener solo los últimos 7 backups
cd "$BACKUP_DIR"
ls -t geeks-radio-backup-*.tar.gz | tail -n +8 | xargs rm -f 2>/dev/null || true

echo "📦 Backups mantenidos en: $BACKUP_DIR"
BACKUP_EOF
    
    # Script de instalación de AutoDJ
    tee "$INSTALL_DIR/install-autodj.sh" > /dev/null << 'AUTODJ_EOF'
#!/bin/bash

# Geeks Radio - Instalador de AutoDJ con Liquidsoap
# Instala y configura Liquidsoap para AutoDJ

set -e

echo "🎵 Instalando AutoDJ con Liquidsoap..."

# Detectar sistema
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y liquidsoap liquidsoap-plugin-all
elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y liquidsoap
elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y liquidsoap
else
    echo "❌ Sistema no soportado para AutoDJ"
    exit 1
fi

# Crear directorio de música
MUSIC_DIR="/opt/geeks-radio/music"
sudo mkdir -p "$MUSIC_DIR"

# Crear configuración básica de Liquidsoap
sudo tee /opt/geeks-radio/autodj.liq > /dev/null << 'LIQ_EOF'
#!/usr/bin/liquidsoap

# Configuración básica de AutoDJ para Geeks Radio

# Configurar log
set("log.file.path", "/var/log/liquidsoap.log")
set("log.stdout", true)

# Fuente de música (directorio)
music = playlist("/opt/geeks-radio/music")

# Agregar silencio entre canciones
music = fallback([music, blank()])

# Configurar salida a Icecast
output.icecast(
  %mp3(bitrate=128),
  host="localhost",
  port=8000,
  password="geeksradio2024",
  mount="autodj",
  music
)

# Log de inicio
log("AutoDJ iniciado para Geeks Radio")
LIQ_EOF

sudo chmod +x /opt/geeks-radio/autodj.liq

# Crear servicio systemd para AutoDJ
sudo tee /etc/systemd/system/geeks-autodj.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=Geeks Radio AutoDJ
After=network.target icecast2.service

[Service]
Type=simple
User=liquidsoap
ExecStart=/usr/bin/liquidsoap /opt/geeks-radio/autodj.liq
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Crear usuario para liquidsoap si no existe
if ! id "liquidsoap" &>/dev/null; then
    sudo useradd -r -s /bin/false liquidsoap
fi

sudo chown -R liquidsoap:liquidsoap /opt/geeks-radio/music
sudo chown liquidsoap:liquidsoap /opt/geeks-radio/autodj.liq

# Habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable geeks-autodj

echo "✅ AutoDJ instalado correctamente"
echo "📁 Coloca tu música en: $MUSIC_DIR"
echo "🎵 Inicia AutoDJ con: sudo systemctl start geeks-autodj"
echo "📊 Stream disponible en: http://localhost:8000/autodj"
AUTODJ_EOF
    
    # Hacer ejecutables todos los scripts
    chmod +x "$INSTALL_DIR/monitor-streams.sh"
    chmod +x "$INSTALL_DIR/backup-system.sh" 
    chmod +x "$INSTALL_DIR/install-autodj.sh"
    
    log_success "Scripts adicionales creados"
}

# Mostrar resumen de instalación
show_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                INSTALACIÓN COMPLETADA                       ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_success "¡Geeks Radio Panel instalado exitosamente!"
    echo ""
    
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    
    echo -e "${BLUE}🌐 ACCESOS:${NC}"
    echo -e "   • Panel Principal: ${GREEN}http://$LOCAL_IP${NC}"
    echo -e "   • Panel Principal (local): ${GREEN}http://localhost${NC}"
    echo -e "   • Admin Icecast: ${GREEN}http://$LOCAL_IP:8000/admin${NC}"
    echo ""
    
    echo -e "${BLUE}🔑 CREDENCIALES POR DEFECTO:${NC}"
    echo -e "   • Usuario Panel: ${YELLOW}admin${NC}"
    echo -e "   • Contraseña Panel: ${YELLOW}geeksradio2024${NC}"
    echo -e "   • Usuario Icecast: ${YELLOW}admin${NC}"
    echo -e "   • Contraseña Icecast: ${YELLOW}geeksradio2024${NC}"
    echo -e "   • Contraseña Fuente Stream: ${YELLOW}geeksradio2024${NC}"
    echo ""
    
    echo -e "${BLUE}📡 PUERTOS CONFIGURADOS:${NC}"
    echo -e "   • Panel Web: ${YELLOW}80${NC}"
    echo -e "   • Icecast: ${YELLOW}8000${NC}"
    echo -e "   • API Backend: ${YELLOW}3001${NC}"
    echo -e "   • SHOUTcast: ${YELLOW}8001+${NC}"
    echo ""
    
    echo -e "${BLUE}🔧 COMANDOS ÚTILES:${NC}"
    echo -e "   • Ver logs: ${YELLOW}journalctl -u $SERVICE_NAME -f${NC}"
    echo -e "   • Reiniciar: ${YELLOW}systemctl restart $SERVICE_NAME${NC}"
    echo -e "   • Actualizar: ${YELLOW}$INSTALL_DIR/update.sh${NC}"
    echo -e "   • Monitor streams: ${YELLOW}$INSTALL_DIR/monitor-streams.sh${NC}"
    echo -e "   • Backup: ${YELLOW}$INSTALL_DIR/backup-system.sh${NC}"
    echo ""
    
    echo -e "${BLUE}📁 ARCHIVOS IMPORTANTES:${NC}"
    echo -e "   • Instalación: ${YELLOW}$INSTALL_DIR${NC}"
    echo -e "   • Base de datos: ${YELLOW}$INSTALL_DIR/backend/geeksradio.db${NC}"
    echo -e "   • Config Icecast: ${YELLOW}$ICECAST_CONFIG_DIR/icecast.xml${NC}"
    echo -e "   • Config Nginx: ${YELLOW}/etc/nginx/sites-available/geeks-radio${NC}"
    echo -e "   • Logs: ${YELLOW}$LOG_FILE${NC}"
    echo ""
    
    echo -e "${YELLOW}⚠️  IMPORTANTE - CAMBIAR CREDENCIALES:${NC}"
    echo -e "   • ${RED}Cambia TODAS las contraseñas por defecto inmediatamente${NC}"
    echo -e "   • ${RED}Configura tu firewall para producción${NC}"
    echo -e "   • ${RED}Realiza backups regulares de la configuración${NC}"
    echo ""
    
    echo -e "${GREEN}✅ Sistema listo para usar en: http://$LOCAL_IP${NC}"
}

# Manejo de errores
handle_error() {
    log_error "Error en línea $1"
    log_error "La instalación ha fallado"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Función principal
main() {
    show_banner
    
    log_info "Iniciando instalación DESATENDIDA de Geeks Radio Panel..."
    log_info "Log de instalación: $LOG_FILE"
    
    check_root
    detect_system
    install_system_dependencies
    install_nodejs
    install_streaming_servers
    create_app_user
    download_application
    install_app_dependencies
    build_application
    create_backend_api
    create_additional_scripts
    configure_systemd_service
    configure_nginx
    configure_firewall
    start_services
    create_update_script
    
    show_summary
}

# Ejecutar instalación
main "$@"
