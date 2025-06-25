#!/bin/bash

# Geeks Radio - Instalador Automático
# Version: 1.0.0
# Descripción: Script de instalación desatendida para Geeks Radio Panel
# Repositorio: https://github.com/kambire/geeks-radio-control-panel

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
PROJECT_NAME="geeks-radio-control-panel"
DEFAULT_PORT=3000
INSTALL_DIR="/opt/geeks-radio"
SERVICE_NAME="geeks-radio"
LOG_FILE="/var/log/geeks-radio-install.log"
REPO_URL="https://github.com/kambire/geeks-radio-control-panel.git"

# Función para mostrar mensajes con colores
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Banner de bienvenida
show_banner() {
    echo -e "${GREEN}"
    echo "  ██████╗ ███████╗███████╗██╗  ██╗███████╗    ██████╗  █████╗ ██████╗ ██╗ ██████╗ "
    echo " ██╔════╝ ██╔════╝██╔════╝██║ ██╔╝██╔════╝    ██╔══██╗██╔══██╗██╔══██╗██║██╔═══██╗"
    echo " ██║  ███╗█████╗  █████╗  █████╔╝ ███████╗    ██████╔╝███████║██║  ██║██║██║   ██║"
    echo " ██║   ██║██╔══╝  ██╔══╝  ██╔═██╗ ╚════██║    ██╔══██╗██╔══██║██║  ██║██║██║   ██║"
    echo " ╚██████╔╝███████╗███████╗██║  ██╗███████║    ██║  ██║██║  ██║██████╔╝██║╚██████╔╝"
    echo "  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝ ╚═════╝ "
    echo -e "${NC}"
    echo -e "${BLUE}Panel de Administración para Radios Online${NC}"
    echo -e "${BLUE}Version 1.0.0 - Instalación Automática${NC}"
    echo -e "${BLUE}Repositorio: https://github.com/kambire/geeks-radio-control-panel${NC}"
    echo ""
}

# Verificar si el script se ejecuta como root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "Ejecutándose como root. Se creará un usuario específico para la aplicación."
        CREATE_USER=true
    else
        log_info "Ejecutándose como usuario regular: $(whoami)"
        CREATE_USER=false
        INSTALL_DIR="$HOME/geeks-radio"
    fi
}

# Detectar sistema operativo
detect_system() {
    log_info "Detectando sistema operativo..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get >/dev/null 2>&1; then
            DISTRO="ubuntu"
            PKG_MANAGER="apt-get"
        elif command -v yum >/dev/null 2>&1; then
            DISTRO="centos"
            PKG_MANAGER="yum"
        elif command -v dnf >/dev/null 2>&1; then
            DISTRO="fedora"
            PKG_MANAGER="dnf"
        else
            log_error "Distribución de Linux no soportada"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        DISTRO="macos"
        PKG_MANAGER="brew"
    else
        log_error "Sistema operativo no soportado: $OSTYPE"
        exit 1
    fi
    
    log_success "Sistema detectado: $DISTRO"
}

# Instalar dependencias del sistema
install_system_dependencies() {
    log_info "Instalando dependencias del sistema..."
    
    case $DISTRO in
        "ubuntu")
            sudo apt-get update
            sudo apt-get install -y curl wget git build-essential nginx
            ;;
        "centos"|"fedora")
            sudo $PKG_MANAGER update -y
            sudo $PKG_MANAGER install -y curl wget git gcc-c++ make nginx
            ;;
        "macos")
            if ! command -v brew >/dev/null 2>&1; then
                log_info "Instalando Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install curl wget git nginx
            ;;
    esac
    
    log_success "Dependencias del sistema instaladas"
}

# Instalar Node.js y npm
install_nodejs() {
    log_info "Instalando Node.js..."
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        log_info "Node.js ya está instalado: $NODE_VERSION"
        
        # Verificar versión mínima (v18)
        if [[ ${NODE_VERSION:1:2} -ge 18 ]]; then
            log_success "Versión de Node.js es compatible"
            return
        else
            log_warning "Versión de Node.js es muy antigua, actualizando..."
        fi
    fi
    
    # Instalar Node.js usando NodeSource
    if [[ "$DISTRO" != "macos" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo $PKG_MANAGER install -y nodejs
    else
        brew install node
    fi
    
    # Verificar instalación
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        log_success "Node.js $(node --version) y npm $(npm --version) instalados correctamente"
    else
        log_error "Error al instalar Node.js"
        exit 1
    fi
}

# Crear usuario para la aplicación
create_app_user() {
    if [[ "$CREATE_USER" == true ]]; then
        log_info "Creando usuario para la aplicación..."
        
        if ! id "geeksradio" &>/dev/null; then
            sudo useradd -r -s /bin/bash -d "$INSTALL_DIR" -m geeksradio
            log_success "Usuario 'geeksradio' creado"
        else
            log_info "Usuario 'geeksradio' ya existe"
        fi
    fi
}

# Descargar y configurar la aplicación
download_application() {
    log_info "Descargando aplicación desde GitHub..."
    
    # Crear directorio de instalación
    if [[ "$CREATE_USER" == true ]]; then
        sudo mkdir -p "$INSTALL_DIR"
        sudo chown geeksradio:geeksradio "$INSTALL_DIR"
    else
        mkdir -p "$INSTALL_DIR"
    fi
    
    # Clonar repositorio
    cd "$(dirname "$INSTALL_DIR")"
    
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        log_info "Actualizando repositorio existente..."
        cd "$INSTALL_DIR"
        git pull origin main
    else
        log_info "Clonando repositorio desde GitHub..."
        if git clone "$REPO_URL" "$(basename "$INSTALL_DIR")"; then
            log_success "Repositorio clonado exitosamente"
        else
            log_error "No se pudo clonar el repositorio desde $REPO_URL"
            log_info "Creando estructura básica..."
            mkdir -p "$INSTALL_DIR"
            create_basic_structure
        fi
    fi
    
    cd "$INSTALL_DIR"
    
    # Cambiar propietario si es necesario
    if [[ "$CREATE_USER" == true ]]; then
        sudo chown -R geeksradio:geeksradio "$INSTALL_DIR"
    fi
}

# Crear estructura básica si no existe repositorio
create_basic_structure() {
    log_info "Creando estructura básica del proyecto..."
    
    cd "$INSTALL_DIR"
    
    # Crear package.json básico
    cat > package.json << 'EOF'
{
  "name": "geeks-radio-control-panel",
  "version": "1.0.0",
  "description": "Panel de administración para radios online",
  "repository": {
    "type": "git",
    "url": "https://github.com/kambire/geeks-radio-control-panel.git"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "npm run preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
EOF
    
    # Crear archivo de configuración de Vite
    cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
})
EOF
    
    log_success "Estructura básica creada"
}

# Instalar dependencias de la aplicación
install_app_dependencies() {
    log_info "Instalando dependencias de la aplicación..."
    
    cd "$INSTALL_DIR"
    
    if [[ "$CREATE_USER" == true ]]; then
        sudo -u geeksradio npm install
    else
        npm install
    fi
    
    log_success "Dependencias de la aplicación instaladas"
}

# Construir la aplicación
build_application() {
    log_info "Construyendo aplicación para producción..."
    
    cd "$INSTALL_DIR"
    
    if [[ "$CREATE_USER" == true ]]; then
        sudo -u geeksradio npm run build
    else
        npm run build
    fi
    
    if [[ -d "dist" ]]; then
        log_success "Aplicación construida exitosamente"
    else
        log_error "Error al construir la aplicación"
        exit 1
    fi
}

# Configurar servicio systemd
configure_systemd_service() {
    if [[ "$DISTRO" == "macos" ]] || [[ "$CREATE_USER" == false ]]; then
        log_info "Saltando configuración de servicio systemd"
        return
    fi
    
    log_info "Configurando servicio systemd..."
    
    sudo tee /etc/systemd/system/"$SERVICE_NAME".service > /dev/null << EOF
[Unit]
Description=Geeks Radio Panel
Documentation=https://github.com/tu-usuario/geeks-radio
After=network.target

[Service]
Type=simple
User=geeksradio
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
Environment=PORT=$DEFAULT_PORT
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
SyslogIdentifier=geeks-radio

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
    
    log_success "Servicio systemd configurado"
}

# Configurar nginx como proxy reverso
configure_nginx() {
    log_info "Configurando nginx..."
    
    # Configuración básica de nginx
    NGINX_CONFIG="/etc/nginx/sites-available/geeks-radio"
    
    if [[ "$DISTRO" == "macos" ]]; then
        NGINX_CONFIG="/usr/local/etc/nginx/sites-available/geeks-radio"
        mkdir -p "$(dirname "$NGINX_CONFIG")"
    fi
    
    sudo tee "$NGINX_CONFIG" > /dev/null << EOF
server {
    listen 80;
    server_name localhost $(hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1");
    
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
EOF
    
    # Habilitar sitio
    if [[ "$DISTRO" != "macos" ]]; then
        if [[ ! -d "/etc/nginx/sites-enabled" ]]; then
            sudo mkdir -p /etc/nginx/sites-enabled
        fi
        sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
        
        # Remover configuración por defecto si existe
        sudo rm -f /etc/nginx/sites-enabled/default
    fi
    
    # Verificar configuración
    if sudo nginx -t; then
        log_success "Configuración de nginx es válida"
    else
        log_error "Error en la configuración de nginx"
        exit 1
    fi
}

# Configurar firewall básico
configure_firewall() {
    if [[ "$DISTRO" == "macos" ]] || [[ "$CREATE_USER" == false ]]; then
        log_info "Saltando configuración de firewall"
        return
    fi
    
    log_info "Configurando firewall básico..."
    
    if command -v ufw >/dev/null 2>&1; then
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        log_success "Firewall configurado con ufw"
    elif command -v firewall-cmd >/dev/null 2>&1; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        log_success "Firewall configurado con firewalld"
    else
        log_warning "No se encontró ufw o firewalld. Configurar firewall manualmente si es necesario."
    fi
}

# Iniciar servicios
start_services() {
    log_info "Iniciando servicios..."
    
    # Iniciar nginx
    case $DISTRO in
        "ubuntu")
            sudo systemctl restart nginx
            sudo systemctl enable nginx
            ;;
        "centos"|"fedora")
            sudo systemctl restart nginx
            sudo systemctl enable nginx
            ;;
        "macos")
            sudo brew services restart nginx
            ;;
    esac
    
    # Iniciar aplicación
    if [[ "$CREATE_USER" == true ]] && [[ "$DISTRO" != "macos" ]]; then
        sudo systemctl start "$SERVICE_NAME"
        
        # Verificar estado
        if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
            log_success "Servicio $SERVICE_NAME iniciado correctamente"
        else
            log_error "Error al iniciar el servicio $SERVICE_NAME"
            sudo systemctl status "$SERVICE_NAME" --no-pager
            exit 1
        fi
    else
        log_info "Para iniciar manualmente: cd $INSTALL_DIR && npm run start"
    fi
    
    log_success "Servicios iniciados"
}

# Crear script de actualización
create_update_script() {
    log_info "Creando script de actualización..."
    
    cat > "$INSTALL_DIR/update.sh" << 'EOF'
#!/bin/bash

# Geeks Radio - Script de Actualización
# Version: 1.0.0
# Repositorio: https://github.com/kambire/geeks-radio-control-panel

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si hay actualizaciones
check_updates() {
    log_info "Verificando actualizaciones desde GitHub..."
    
    git fetch origin main
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        log_success "No hay actualizaciones disponibles"
        exit 0
    else
        log_info "Actualización disponible desde repositorio"
        return 0
    fi
}

# Crear backup
create_backup() {
    log_info "Creando backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup del código actual
    cp -r dist "$BACKUP_DIR/" 2>/dev/null || true
    cp package*.json "$BACKUP_DIR/" 2>/dev/null || true
    
    log_success "Backup creado en $BACKUP_DIR"
}

# Aplicar actualización
apply_update() {
    log_info "Aplicando actualización..."
    
    # Detener servicios
    if systemctl is-active --quiet geeks-radio 2>/dev/null; then
        sudo systemctl stop geeks-radio
        log_info "Servicio detenido"
    fi
    
    # Actualizar código
    git pull origin main
    
    # Instalar nuevas dependencias
    npm install
    
    # Construir aplicación
    npm run build
    
    # Reiniciar servicios
    if systemctl is-enabled --quiet geeks-radio 2>/dev/null; then
        sudo systemctl start geeks-radio
        log_success "Servicio reiniciado"
    fi
    
    # Reiniciar nginx
    sudo systemctl reload nginx 2>/dev/null || true
    
    log_success "Actualización aplicada exitosamente"
}

# Función principal
main() {
    echo -e "${GREEN}Geeks Radio - Sistema de Actualización${NC}"
    echo ""
    
    cd "$(dirname "$0")"
    
    check_updates
    create_backup
    apply_update
    
    echo ""
    log_success "¡Actualización completada!"
}

main "$@"
EOF
    
    chmod +x "$INSTALL_DIR/update.sh"
    log_success "Script de actualización creado"
}

# Mostrar resumen de instalación
show_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    INSTALACIÓN COMPLETADA                   ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_success "Geeks Radio Panel ha sido instalado exitosamente!"
    echo ""
    
    echo -e "${BLUE}📍 INFORMACIÓN DE ACCESO:${NC}"
    echo -e "   • URL: ${GREEN}http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")${NC}"
    echo -e "   • Puerto local: ${GREEN}$DEFAULT_PORT${NC}"
    echo -e "   • Usuario admin: ${GREEN}admin${NC}"
    echo -e "   • Contraseña: ${GREEN}geeksradio2024${NC}"
    echo ""
    
    echo -e "${BLUE}📁 UBICACIONES:${NC}"
    echo -e "   • Instalación: ${GREEN}$INSTALL_DIR${NC}"
    echo -e "   • Logs: ${GREEN}/var/log/nginx/geeks-radio.*.log${NC}"
    echo -e "   • Servicio: ${GREEN}$SERVICE_NAME${NC}"
    echo ""
    
    echo -e "${BLUE}🔧 COMANDOS ÚTILES:${NC}"
    if [[ "$CREATE_USER" == true ]] && [[ "$DISTRO" != "macos" ]]; then
        echo -e "   • Estado: ${GREEN}sudo systemctl status $SERVICE_NAME${NC}"
        echo -e "   • Reiniciar: ${GREEN}sudo systemctl restart $SERVICE_NAME${NC}"
        echo -e "   • Logs: ${GREEN}sudo journalctl -u $SERVICE_NAME -f${NC}"
    else
        echo -e "   • Iniciar: ${GREEN}cd $INSTALL_DIR && npm run start${NC}"
        echo -e "   • Desarrollo: ${GREEN}cd $INSTALL_DIR && npm run dev${NC}"
    fi
    echo -e "   • Actualizar: ${GREEN}$INSTALL_DIR/update.sh${NC}"
    echo ""
    
    echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
    echo -e "   • Cambiar credenciales por defecto en producción"
    echo -e "   • Configurar certificado SSL para HTTPS"
    echo -e "   • Configurar backup automático"
    echo ""
    
    echo -e "${BLUE}📚 DOCUMENTACIÓN:${NC}"
    echo -e "   • README: ${GREEN}$INSTALL_DIR/README.md${NC}"
    echo -e "   • GitHub: ${GREEN}https://github.com/kambire/geeks-radio-control-panel${NC}"
    echo ""
    
    log_success "¡Disfruta usando Geeks Radio Panel!"
}

# Función principal
main() {
    # Inicializar log
    touch "$LOG_FILE" 2>/dev/null || LOG_FILE="/tmp/geeks-radio-install.log"
    
    show_banner
    
    log_info "Iniciando instalación de Geeks Radio Panel..."
    log_info "Log de instalación: $LOG_FILE"
    
    check_root
    detect_system
    install_system_dependencies
    install_nodejs
    create_app_user
    download_application
    install_app_dependencies
    build_application
    configure_systemd_service
    configure_nginx
    configure_firewall
    start_services
    create_update_script
    
    show_summary
}

# Capturar errores y mostrar mensaje de ayuda
trap 'log_error "Instalación interrumpida. Revisa el log: $LOG_FILE"' ERR

# Ejecutar instalación
main "$@"
