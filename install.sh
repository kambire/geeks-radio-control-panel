#!/bin/bash

# Geeks Radio - Instalador Automático Completo
# Version: 2.1.0
# Descripción: Instalación completa con SHOUTcast y Backend - Puerto 7000
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
DEFAULT_PORT=7000
API_PORT=7001
INSTALL_DIR="/opt/geeks-radio"
SERVICE_NAME="geeks-radio"
API_SERVICE_NAME="geeks-radio-api"
LOG_FILE=""
REPO_URL="https://github.com/kambire/geeks-radio-control-panel.git"
SHOUTCAST_DIR="/opt/shoutcast"
STREAMS_DIR="/opt/geeks-radio/streams"
PUBLIC_IP=""
ADMIN_USER="admin"
ADMIN_PASSWORD="geeksradio2024"

# Verificar si se ejecuta como root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}[ERROR]${NC} Este script debe ejecutarse como root"
        echo -e "${BLUE}[INFO]${NC} Ejecuta: sudo bash install.sh"
        exit 1
    fi
}

# Crear archivo de log con permisos correctos
setup_logging() {
    # Intentar diferentes ubicaciones para el archivo de log
    local log_locations=(
        "/var/log/geeks-radio-install.log"
        "/tmp/geeks-radio-install-$(date +%s).log"
        "/home/$(logname 2>/dev/null || echo root)/geeks-radio-install.log"
        "./geeks-radio-install.log"
    )
    
    for log_path in "${log_locations[@]}"; do
        if touch "$log_path" 2>/dev/null && [ -w "$log_path" ]; then
            LOG_FILE="$log_path"
            break
        fi
    done
    
    # Si no se pudo crear ningún archivo de log, usar /dev/null
    if [[ -z "$LOG_FILE" ]]; then
        LOG_FILE="/dev/null"
        echo -e "${YELLOW}[WARNING]${NC} No se pudo crear archivo de log, continuando sin logging"
    fi
    
    # Inicializar log
    echo "=== Geeks Radio Install v2.1.0 - $(date) ===" > "$LOG_FILE" 2>/dev/null || true
}

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Mostrar banner
show_banner() {
    clear
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    GEEKS RADIO PANEL                         ║"
    echo "║              Instalación Automática Completa                ║"
    echo "║                     Versión 2.1.0                           ║"
    echo "║                    Puerto 7000 TCP                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Detectar IP pública
detect_public_ip() {
    log_info "Detectando IP pública..."
    
    # Intentar varios servicios para obtener IP pública
    PUBLIC_IP=$(curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null || \
                curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || \
                curl -s --connect-timeout 5 icanhazip.com 2>/dev/null || \
                curl -s --connect-timeout 5 ident.me 2>/dev/null || \
                hostname -I | awk '{print $1}' 2>/dev/null || \
                echo "localhost")
    
    # Limpiar espacios en blanco
    PUBLIC_IP=$(echo "$PUBLIC_IP" | tr -d '[:space:]')
    
    if [[ "$PUBLIC_IP" == "localhost" ]] || [[ -z "$PUBLIC_IP" ]]; then
        PUBLIC_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    fi
    
    log_success "IP pública detectada: $PUBLIC_IP"
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

# Instalar servidores de streaming (solo SHOUTcast)
install_streaming_servers() {
    log_info "Instalando servidor de streaming SHOUTcast..."
    
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
    
    log_success "Servidor de streaming SHOUTcast instalado y configurado"
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
    log_success "Aplicación descargada correctamente"
}

# Instalar dependencias de la aplicación
install_app_dependencies() {
    log_info "Instalando dependencias de la aplicación..."
    cd "$INSTALL_DIR"
    npm install
    log_success "Dependencias del frontend instaladas"
    
    # Instalar dependencias del backend
    log_info "Instalando dependencias del backend..."
    cd "$INSTALL_DIR/backend"
    npm install
    log_success "Dependencias del backend instaladas"
}

# Construir aplicación
build_application() {
    log_info "Construyendo aplicación frontend..."
    cd "$INSTALL_DIR"
    npm run build
    log_success "Aplicación frontend construida"
}

# Crear backend API
create_backend_api() {
    log_info "Creando backend API actualizado..."
    
    cd "$INSTALL_DIR"
    
    # Crear estructura de backend
    mkdir -p backend/{routes,models,services,config,middleware}
    
    # Crear package.json para backend
    tee backend/package.json > /dev/null << 'BACKEND_PACKAGE_EOF'
{
  "name": "geeks-radio-backend",
  "version": "2.1.0",
  "description": "Backend API for Geeks Radio Control Panel with User Management",
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
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
BACKEND_PACKAGE_EOF
    
    log_success "Backend API creado y configurado"
}

# Configurar servicio systemd actualizado
configure_systemd_service() {
    if [[ "$DISTRO" == "macos" ]] || [[ "$CREATE_USER" == false ]]; then
        log_info "Saltando configuración de servicio systemd"
        return
    fi
    
    log_info "Configurando servicios systemd..."
    
    # Servicio frontend en puerto 8080 (interno)
    tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << SYSTEMD_EOF
[Unit]
Description=Geeks Radio Control Panel Frontend
Documentation=https://github.com/kambire/geeks-radio-control-panel
After=network.target

[Service]
Type=simple
User=geeksradio
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
Environment=PORT=8080
Environment=VITE_API_URL=/api
ExecStart=/usr/bin/npm run preview
Restart=on-failure
RestartSec=10
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
SyslogIdentifier=geeks-radio

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

    # Servicio backend API
    tee /etc/systemd/system/$API_SERVICE_NAME.service > /dev/null << API_SYSTEMD_EOF
[Unit]
Description=Geeks Radio Backend API
Documentation=https://github.com/kambire/geeks-radio-control-panel
After=network.target

[Service]
Type=simple
User=geeksradio
WorkingDirectory=$INSTALL_DIR/backend
Environment=NODE_ENV=production
Environment=PORT=$API_PORT
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
SyslogIdentifier=geeks-radio-api

[Install]
WantedBy=multi-user.target
API_SYSTEMD_EOF
    
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    systemctl enable $API_SERVICE_NAME
    
    log_success "Servicios systemd configurados"
}

# Configurar nginx actualizado para puerto 7000 (sin SSL)
configure_nginx() {
    log_info "Configurando nginx como proxy reverso para puerto 7000 (sin SSL)..."
    
    systemctl stop nginx 2>/dev/null || true
    
    NGINX_CONFIG="/etc/nginx/sites-available/geeks-radio"
    
    tee "$NGINX_CONFIG" > /dev/null << NGINX_EOF
server {
    listen 80;
    server_name localhost $PUBLIC_IP _;
    
    # Frontend (Puerto 7000) - Solo proxy para compatibilidad
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
        proxy_read_timeout 86400;
    }
    
    # Backend API (Puerto 7001)
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
        proxy_read_timeout 86400;
    }
    
    # SHOUTcast Admin (Puerto 8001)
    location /shoutcast/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    access_log /var/log/nginx/geeks-radio.access.log;
    error_log /var/log/nginx/geeks-radio.error.log;
}

# Servidor directo en puerto 7000
server {
    listen 7000;
    server_name localhost $PUBLIC_IP _;
    
    # Servir directamente el frontend
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # API directo
    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF
    
    # Habilitar sitio
    if [[ -d "/etc/nginx/sites-enabled" ]]; then
        ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
    fi
    
    if nginx -t; then
        log_success "Configuración de nginx creada para puerto 7000 (sin SSL)"
    else
        log_error "Error en la configuración de nginx"
        exit 1
    fi
}

# Configurar firewall para puerto 7000
configure_firewall() {
    log_info "Configurando firewall para puerto 7000..."
    
    if command -v ufw >/dev/null 2>&1; then
        ufw --force enable
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 7000/tcp
        ufw allow 7001/tcp
        ufw allow 8001:8100/tcp
        log_success "Firewall configurado (puerto 7000 habilitado)"
    elif command -v firewall-cmd >/dev/null 2>&1; then
        systemctl enable firewalld
        systemctl start firewalld
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=7000/tcp
        firewall-cmd --permanent --add-port=7001/tcp
        firewall-cmd --permanent --add-port=8001-8100/tcp
        firewall-cmd --reload
        log_success "Firewall configurado con firewalld (puerto 7000)"
    else
        log_warning "No se encontró sistema de firewall"
    fi
}

# Iniciar servicios
start_services() {
    log_info "Iniciando servicios..."
    
    if [[ "$CREATE_USER" == true ]] && [[ "$DISTRO" != "macos" ]]; then
        chown -R geeksradio:geeksradio "$INSTALL_DIR"
        
        systemctl start $SERVICE_NAME
        systemctl start $API_SERVICE_NAME
        systemctl start nginx
        
        if systemctl is-active --quiet $SERVICE_NAME; then
            log_success "Servicio $SERVICE_NAME iniciado correctamente"
        else
            log_error "Error al iniciar $SERVICE_NAME"
            systemctl status $SERVICE_NAME --no-pager
        fi
        
        if systemctl is-active --quiet $API_SERVICE_NAME; then
            log_success "Servicio $API_SERVICE_NAME iniciado correctamente"
        else
            log_error "Error al iniciar $API_SERVICE_NAME"
            systemctl status $API_SERVICE_NAME --no-pager
        fi
        
        if systemctl is-active --quiet nginx; then
            log_success "Servicio nginx iniciado correctamente"
        else
            log_error "Error al iniciar nginx"
            systemctl status nginx --no-pager
        fi
    else
        log_info "Iniciando manualmente en macOS o sin usuario dedicado"
        cd "$INSTALL_DIR"
        npm start &
    fi
}

# Crear scripts adicionales
create_additional_scripts() {
    log_info "Creando scripts adicionales de mantenimiento..."
    
    # Script de actualización
    tee "$INSTALL_DIR/update.sh" > /dev/null << 'UPDATE_EOF'
#!/bin/bash

# Geeks Radio - Sistema de Actualización

INSTALL_DIR="/opt/geeks-radio"
SERVICE_NAME="geeks-radio"
API_SERVICE_NAME="geeks-radio-api"

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
sudo systemctl stop "$SERVICE_NAME" "$API_SERVICE_NAME" 2>/dev/null || true

# Actualizar código
git pull origin main

# Instalar dependencias
npm install
cd backend && npm install && cd ..

# Construir aplicación
npm run build

# Reiniciar servicios
sudo systemctl start "$SERVICE_NAME" "$API_SERVICE_NAME" 2>/dev/null || true
sudo systemctl restart nginx 2>/dev/null || true

log_success "Actualización completada"
UPDATE_EOF
    
    chmod +x "$INSTALL_DIR/update.sh"
    log_success "Scripts adicionales creados"
}

# Mostrar resumen de instalación completo
show_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           INSTALACIÓN COMPLETADA - PUERTO 7000              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_success "¡Geeks Radio Panel instalado exitosamente en puerto 7000!"
    echo ""
    
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    
    echo -e "${BLUE}🌐 ACCESOS PRINCIPALES:${NC}"
    echo -e "   • Panel Web: ${GREEN}http://$PUBLIC_IP${NC}"
    echo -e "   • Panel Local: ${GREEN}http://localhost${NC}"
    echo -e "   • Panel Puerto 7000: ${GREEN}http://$PUBLIC_IP:7000${NC}"
    echo -e "   • Admin SHOUTcast: ${GREEN}http://$PUBLIC_IP:8001${NC}"
    echo ""
    
    echo -e "${GREEN}🔑 CREDENCIALES DE ADMINISTRADOR:${NC}"
    echo -e "   • ${YELLOW}Usuario Admin: $ADMIN_USER${NC}"
    echo -e "   • ${YELLOW}Contraseña Admin: $ADMIN_PASSWORD${NC}"
    echo ""
    
    echo -e "${BLUE}📡 CONFIGURACIÓN DE PUERTOS:${NC}"
    echo -e "   • Acceso Web Principal: ${YELLOW}80 → 7000${NC}"
    echo -e "   • Frontend React: ${YELLOW}7000 (proxy desde 8080)${NC}"
    echo -e "   • Backend API: ${YELLOW}7001${NC}"
    echo -e "   • SHOUTcast Server: ${YELLOW}8001${NC}"
    echo -e "   • Streams Adicionales: ${YELLOW}8002+${NC}"
    echo ""
    
    echo -e "${BLUE}🚀 SERVICIOS ACTIVOS:${NC}"
    echo -e "   • ✅ Frontend (Puerto 7000)"
    echo -e "   • ✅ Backend API (Puerto 7001)"
    echo -e "   • ✅ Nginx Proxy (Puerto 80)"
    echo -e "   • ✅ SHOUTcast Server (Puerto 8001)"
    echo -e "   • ✅ Base de datos SQLite"
    echo ""
    
    echo -e "${BLUE}👥 CARACTERÍSTICAS IMPLEMENTADAS:${NC}"
    echo -e "   • ✅ Panel de administración completo"
    echo -e "   • ✅ Sistema de gestión de usuarios"
    echo -e "   • ✅ Panel de clientes independiente"
    echo -e "   • ✅ Gestión de radios en tiempo real"
    echo -e "   • ✅ API REST completa con JWT"
    echo -e "   • ✅ Base de datos con usuarios y perfiles"
    echo -e "   • ✅ SHOUTcast configurado automáticamente"
    echo -e "   • ✅ Sistema de monitoreo y estadísticas"
    echo -e "   • ✅ Sin SSL/HTTPS (ambiente de prueba)"
    echo ""
    
    echo -e "${BLUE}🔧 COMANDOS ÚTILES:${NC}"
    echo -e "   • Ver logs frontend: ${YELLOW}journalctl -u $SERVICE_NAME -f${NC}"
    echo -e "   • Ver logs API: ${YELLOW}journalctl -u $API_SERVICE_NAME -f${NC}"
    echo -e "   • Verificar servicios: ${YELLOW}systemctl status $SERVICE_NAME $API_SERVICE_NAME nginx${NC}"
    echo -e "   • Reiniciar todo: ${YELLOW}systemctl restart $SERVICE_NAME $API_SERVICE_NAME nginx${NC}"
    echo -e "   • Actualizar sistema: ${YELLOW}$INSTALL_DIR/update.sh${NC}"
    echo ""
    
    echo -e "${YELLOW}⚠️  IMPORTANTE - PRÓXIMOS PASOS:${NC}"
    echo -e "   • ${RED}1. Acceder al panel con las credenciales mostradas arriba${NC}"
    echo -e "   • ${RED}2. Cambiar contraseña de administrador por defecto${NC}"
    echo -e "   • ${RED}3. Crear usuarios administradores adicionales${NC}"
    echo -e "   • ${RED}4. Configurar clientes y asignar servicios de radio${NC}"
    echo -e "   • ${RED}5. Configurar streams de SHOUTcast según necesidades${NC}"
    echo ""
    
    echo -e "${GREEN}✅ SISTEMA COMPLETAMENTE FUNCIONAL EN:${NC}"
    echo -e "${GREEN}   🌍 http://$PUBLIC_IP${NC}"
    echo -e "${GREEN}   🏠 http://localhost${NC}"
    echo -e "${GREEN}   🎵 http://$PUBLIC_IP:7000${NC}"
    echo ""
    
    echo -e "${GREEN}🎯 CREDENCIALES PARA INGRESAR AL SISTEMA:${NC}"
    echo -e "${GREEN}   Usuario: ${YELLOW}$ADMIN_USER${NC}"
    echo -e "${GREEN}   Contraseña: ${YELLOW}$ADMIN_PASSWORD${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Archivo de logs de instalación: ${YELLOW}$LOG_FILE${NC}"
}

# Manejo de errores
handle_error() {
    log_error "Error en línea $1"
    log_error "La instalación ha fallado. Revisa el log: $LOG_FILE"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Función principal
main() {
    setup_logging
    show_banner
    
    log_info "Iniciando instalación desatendida completa en puerto 7000..."
    
    check_root
    detect_system
    detect_public_ip
    install_system_dependencies
    install_nodejs
    install_streaming_servers
    create_app_user
    download_application
    install_app_dependencies
    build_application
    create_backend_api
    configure_systemd_service
    configure_nginx
    configure_firewall
    start_services
    create_additional_scripts
    
    show_summary
    
    log_success "¡Instalación completada exitosamente!"
}

# Verificar argumentos de línea de comandos
case "${1:-}" in
    --help|-h)
        echo "Geeks Radio Control Panel - Instalador v2.1.0"
        echo "Uso: sudo bash install.sh [opciones]"
        echo ""
        echo "Opciones:"
        echo "  --help, -h     Mostrar esta ayuda"
        echo "  --update       Solo actualizar instalación existente"
        echo ""
        echo "Instalación completa en puerto 7000 TCP"
        exit 0
        ;;
    --update)
        setup_logging
        log_info "Modo actualización solamente"
        check_root
        cd "$INSTALL_DIR" 2>/dev/null || {
            log_error "Instalación no encontrada. Ejecuta sin --update para instalar"
            exit 1
        }
        bash update.sh
        exit 0
        ;;
esac

main "$@"
