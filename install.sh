#!/bin/bash
# Geeks Radio - Instalador Automático Completo
# Version: 2.0.0
# Descripción: Instalación completa con Icecast, SHOUTcast y Backend
# Repositorio: https://github.com/kambire/geeks-radio-control-panel 
set -e
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

# Funciones auxiliares
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}
log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Detectar sistema operativo
detect_system() {
    log_info "Detectando sistema operativo..."
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        DISTRO=$(echo "$ID" | tr '[:upper:]' '[:lower:]')
        PKG_MANAGER=$(command -v apt || command -v yum || command -v dnf || command -v brew)
    elif [[ "$(uname)" == "Darwin" ]]; then
        DISTRO="macos"
        PKG_MANAGER="brew"
    else
        log_error "Sistema operativo no soportado"
        exit 1
    fi
    log_success "Sistema detectado: $DISTRO"
}

# Instalar dependencias del sistema
install_system_dependencies() {
    log_info "Instalando dependencias del sistema..."
    case $DISTRO in
        "ubuntu"|"debian")
            sudo apt-get update
            sudo apt-get install -y git curl wget build-essential nginx
            ;;
        "centos"|"fedora")
            sudo $PKG_MANAGER install -y git curl wget gcc-c++ make nginx
            ;;
        "macos")
            brew update
            brew install git curl wget nginx
            ;;
    esac
    log_success "Dependencias del sistema instaladas"
}

# Instalar Node.js
install_nodejs() {
    log_info "Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x  | sudo -E bash -
    sudo apt-get install -y nodejs
    log_success "Node.js instalado"
}

# Instalar servidores de streaming
install_streaming_servers() {
    log_info "Instalando servidores de streaming..."
    # Preconfigurar Icecast2 para instalación desatendida
    echo "icecast2 icecast2/hostname string localhost" | sudo debconf-set-selections
    echo "icecast2 icecast2/adminpassword password geeksradio2024" | sudo debconf-set-selections
    echo "icecast2 icecast2/sourcepassword password geeksradio2024" | sudo debconf-set-selections
    echo "icecast2 icecast2/relaypassword password geeksradio2024" | sudo debconf-set-selections
    echo "icecast2 icecast2/setup-instance boolean true" | sudo debconf-set-selections

    # Instalar Icecast2
    case $DISTRO in
        "ubuntu"|"debian")
            sudo apt-get update
            sudo DEBIAN_FRONTEND=noninteractive apt-get install -y icecast2
            ;;
        "centos"|"fedora")
            sudo $PKG_MANAGER install -y icecast
            ;;
        "macos")
            brew install icecast
            ;;
    esac

    # Configurar Icecast2
    log_info "Configurando Icecast2..."
    sudo tee "$ICECAST_CONFIG_DIR/icecast.xml" > /dev/null << 'EOF'
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
EOF

    # Descargar e instalar SHOUTcast (versión gratuita)
    log_info "Instalando SHOUTcast Server..."
    sudo mkdir -p "$SHOUTCAST_DIR"
    cd /tmp
    if [[ "$DISTRO" != "macos" ]]; then
        wget -q http://download.nullsoft.com/shoutcast/tools/sc_serv2_linux_x64-latest.tar.gz
        sudo tar -xzf sc_serv2_linux_x64-latest.tar.gz -C "$SHOUTCAST_DIR"
        sudo chmod +x "$SHOUTCAST_DIR/sc_serv"
    fi

    # Crear configuración básica de SHOUTcast
    sudo tee "$SHOUTCAST_DIR/sc_serv_basic.conf" > /dev/null << 'EOF'
; SHOUTcast server configuration
password=geeksradio2024
adminpassword=geeksradio2024
portbase=8001
logfile=logs/sc_serv.log
realtime=1
screensaver=geeksradio
unique=1
EOF

    # Crear directorios de logs
    sudo mkdir -p "$SHOUTCAST_DIR/logs"
    sudo mkdir -p "$STREAMS_DIR"
    sudo mkdir -p /var/log/icecast2
    log_success "Servidores de streaming instalados"
}

# Crear backend API
create_backend_api() {
    log_info "Creando backend API..."
    cd "$INSTALL_DIR"
    sudo mkdir -p backend/{routes,models,services,config}
    # Crear package.json para backend
    sudo tee backend/package.json > /dev/null << 'EOF'
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
EOF
    # Crear servidor principal
    sudo tee backend/server.js > /dev/null << 'EOF'
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
EOF
    log_success "Backend API creado"
}

# Crear configuración de base de datos
create_database_config() {
    log_info "Configurando base de datos..."
    sudo tee "$INSTALL_DIR/backend/config/database.js" > /dev/null << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'geeksradio.db');
const db = new sqlite3.Database(dbPath);
const init = () => {
  // Tabla de usuarios
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Tabla de clientes
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      company TEXT,
      address TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Tabla de planes
  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      disk_space INTEGER DEFAULT 1000,
      max_listeners INTEGER DEFAULT 100,
      bitrate INTEGER DEFAULT 128,
      price DECIMAL(10,2) DEFAULT 0.00,
      features TEXT,
      is_popular BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Tabla de radios
  db.run(`
    CREATE TABLE IF NOT EXISTS radios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_id INTEGER,
      plan_id INTEGER,
      server_type TEXT DEFAULT 'icecast',
      port INTEGER UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      current_listeners INTEGER DEFAULT 0,
      max_listeners INTEGER DEFAULT 100,
      bitrate INTEGER DEFAULT 128,
      autodj_enabled BOOLEAN DEFAULT 0,
      mount_point TEXT,
      source_password TEXT,
      admin_password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id),
      FOREIGN KEY (plan_id) REFERENCES plans (id)
    )
  `);
  // Tabla de estadísticas
  db.run(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      radio_id INTEGER,
      listeners INTEGER DEFAULT 0,
      bandwidth DECIMAL(10,2) DEFAULT 0,
      uptime INTEGER DEFAULT 0,
      peak_listeners INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (radio_id) REFERENCES radios (id)
    )
  `);
  // Insertar usuario admin por defecto
  db.run(`
    INSERT OR IGNORE INTO users (username, password, role) 
    VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
  `);
  // Insertar planes por defecto
  const plans = [
    ['Básico', 'Plan básico para radios pequeñas', 500, 50, 96, 19.99, 'Soporte básico,Panel web,Estadísticas', 0],
    ['Premium', 'Plan para radios medianas', 2000, 200, 128, 49.99, 'Soporte prioritario,Panel web,Estadísticas,AutoDJ,Apps móviles', 1],
    ['Pro', 'Plan profesional', 5000, 500, 192, 99.99, 'Soporte 24/7,Panel web,Estadísticas,AutoDJ,Apps móviles,API', 0],
    ['Enterprise', 'Plan empresarial', 20000, 2000, 320, 199.99, 'Todo incluido,Soporte dedicado,Múltiples servidores', 0]
  ];
  plans.forEach(plan => {
    db.run(`
      INSERT OR IGNORE INTO plans (name, description, disk_space, max_listeners, bitrate, price, features, is_popular)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, plan);
  });
  console.log('✅ Base de datos inicializada');
};
module.exports = { db, init };
EOF
    log_success "Configuración de base de datos creada"
}


# Crear scripts de automatización
create_automation_scripts() {
    log_info "Creando scripts de automatización..."
    # Script de monitoreo
    sudo tee "$INSTALL_DIR/monitor-streams.sh" > /dev/null << 'EOF'
#!/bin/bash
# Geeks Radio - Monitor de Streams
LOG_FILE="/var/log/geeks-radio-monitor.log"
API_URL="http://localhost:3001/api"
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}
# Verificar que Icecast esté corriendo
check_icecast() {
    if ! systemctl is-active --quiet icecast2; then
        log_message "WARNING: Icecast2 no está corriendo, intentando reiniciar..."
        sudo systemctl restart icecast2
        sleep 5
        if systemctl is-active --quiet icecast2; then
            log_message "INFO: Icecast2 reiniciado exitosamente"
        else
            log_message "ERROR: No se pudo reiniciar Icecast2"
        fi
    fi
}
# Verificar streams activos
check_streams() {
    log_message "INFO: Verificando estado de streams..."
    curl -s "$API_URL/streams/stats" > /tmp/stream_stats.json
    if [ $? -eq 0 ]; then
        log_message "INFO: Estadísticas obtenidas exitosamente"
    else
        log_message "ERROR: No se pudieron obtener estadísticas de streams"
    fi
}
main() {
    log_message "INFO: Iniciando monitoreo de streams"
    check_icecast
    check_streams
    log_message "INFO: Monitoreo completado"
}
main "$@"
EOF

    # Script de backup
    sudo tee "$INSTALL_DIR/backup-system.sh" > /dev/null << 'EOF'
#!/bin/bash
# Geeks Radio - Sistema de Backup Automático
BACKUP_DIR="/opt/geeks-radio/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$DATE"
log_info() {
    echo "[INFO] $1"
}
mkdir -p "$BACKUP_PATH"
# Backup de base de datos
log_info "Respaldando base de datos..."
cp /opt/geeks-radio/backend/geeksradio.db "$BACKUP_PATH/"
# Backup de configuraciones
log_info "Respaldando configuraciones..."
cp -r /etc/icecast2 "$BACKUP_PATH/icecast_config"
cp -r /opt/shoutcast "$BACKUP_PATH/shoutcast_config"
# Backup de logs importantes
log_info "Respaldando logs..."
mkdir -p "$BACKUP_PATH/logs"
cp /var/log/geeks-radio*.log "$BACKUP_PATH/logs/" 2>/dev/null || true
# Comprimir backup
log_info "Comprimiendo backup..."
cd "$BACKUP_DIR"
tar -czf "backup_$DATE.tar.gz" "backup_$DATE"
rm -rf "backup_$DATE"
# Limpiar backups antiguos (mantener solo los últimos 7)
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
log_info "Backup completado: backup_$DATE.tar.gz"
EOF

    # Script de instalación de AutoDJ (opcional)
    sudo tee "$INSTALL_DIR/install-autodj.sh" > /dev/null << 'EOF'
#!/bin/bash
# Geeks Radio - Instalador de AutoDJ (Liquidsoap)
log_info() {
    echo "[INFO] $1"
}
log_info "Instalando AutoDJ (Liquidsoap)..."
case $(lsb_release -si) in
    "Ubuntu"|"Debian")
        sudo apt-get update
        sudo apt-get install -y liquidsoap liquidsoap-plugin-all
        ;;
    "CentOS"|"Fedora")
        sudo yum install -y liquidsoap
        ;;
esac
sudo mkdir -p /opt/geeks-radio/music
sudo mkdir -p /opt/geeks-radio/playlists
sudo mkdir -p /opt/geeks-radio/autodj-configs
cat > /opt/geeks-radio/autodj-configs/basic.liq << 'EOF'
# Configuración básica de AutoDJ para Geeks Radio
set("log.file.path", "/var/log/liquidsoap.log")
set("log.level", 3)
music = playlist("/opt/geeks-radio/music/")
music = crossfade(start_next=2.0, fade_in=2.0, fade_out=2.0, music)
output.icecast(%mp3,
  host="localhost", port=8000,
  password="geeksradio2024",
  mount="/autodj",
  music)
EOF
log_info "AutoDJ (Liquidsoap) instalado y configurado"
EOF

    # Hacer scripts ejecutables
    sudo chmod +x "$INSTALL_DIR"/*.sh
    log_success "Scripts de automatización creados"
}


# Configurar servicios systemd para backend
configure_backend_service() {
    if [[ "$DISTRO" == "macos" ]] || [[ "$CREATE_USER" == false ]]; then
        log_info "Saltando configuración de servicio backend"
        return
    fi
    log_info "Configurando servicio backend..."
    cd "$INSTALL_DIR/backend"
    if [[ "$CREATE_USER" == true ]]; then
        sudo -u geeksradio npm install
    else
        npm install
    fi
    # Servicio para backend API
    sudo tee /etc/systemd/system/geeks-radio-api.service > /dev/null << EOF
[Unit]
Description=Geeks Radio Backend API
Documentation=https://github.com/kambire/geeks-radio-control-panel 
After=network.target
[Service]
Type=simple
User=geeksradio
WorkingDirectory=$INSTALL_DIR/backend
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
KillMode=mixed
KillSignal=SIGINT
TimeoutStopSec=5
SyslogIdentifier=geeks-radio-api
[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable geeks-radio-api
    log_success "Servicio backend configurado"
}

# Configurar cron jobs
configure_cron_jobs() {
    log_info "Configurando tareas programadas..."
    (crontab -l 2>/dev/null; echo "# Geeks Radio - Tareas automáticas") | crontab -
    (crontab -l 2>/dev/null; echo "*/5 * * * * $INSTALL_DIR/monitor-streams.sh") | crontab -
    (crontab -l 2>/dev/null; echo "0 2 * * * $INSTALL_DIR/backup-system.sh") | crontab -
    log_success "Tareas programadas configuradas"
}



# Actualizar configuración de nginx para incluir API
update_nginx_config() {
    log_info "Actualizando configuración de nginx..."
    NGINX_CONFIG="/etc/nginx/sites-available/geeks-radio"
    sudo tee "$NGINX_CONFIG" > /dev/null << EOF
server {
    listen 80;
    server_name localhost $(hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1");
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
    # Estadísticas de Icecast
    location /icecast/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
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
    # Verificar configuración
    if sudo nginx -t; then
        log_success "Configuración de nginx actualizada"
    else
        log_error "Error en la configuración de nginx"
        exit 1
    fi
}



# Función principal
main() {
    log_info "Iniciando instalación completa de Geeks Radio Panel..."
    log_info "Log de instalación: $LOG_FILE"
    detect_system
    install_system_dependencies
    install_nodejs
    install_streaming_servers
    create_backend_api
    create_database_config
    create_stream_services
    create_api_routes
    create_automation_scripts
    configure_backend_service
    configure_cron_jobs
    update_nginx_config
    start_all_services
    show_summary
}

# Mostrar resumen de configuración al final
show_summary() {
    log_info "Resumen de configuración:"
    echo -e "${GREEN}=========================${NC}"
    echo -e "Panel de control: http://$(hostname -I | awk '{print $1}')"
    echo -e "Backend API: http://$(hostname -I | awk '{print $1}'):3001/api"
    echo -e "Icecast2:"
    echo -e "  URL: http://$(hostname -I | awk '{print $1}'):8000"
    echo -e "  Contraseña de fuente: geeksradio2024"
    echo -e "  Contraseña de administrador: geeksradio2024"
    echo -e "SHOUTcast:"
    echo -e "  Puerto base: 8001"
    echo -e "  Contraseña de fuente: geeksradio2024"
    echo -e "  Contraseña de administrador: geeksradio2024"
    echo -e "${GREEN}=========================${NC}"
}

main "$@"
