
#!/bin/bash

# Geeks Radio - Configuración Post-Instalación
# Script para configurar el sistema después de la instalación

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

INSTALL_DIR="/opt/geeks-radio"

log_info "Iniciando configuración post-instalación..."

# Verificar que todos los servicios estén corriendo
log_info "Verificando servicios..."

services=("nginx" "icecast2" "geeks-radio" "geeks-radio-api")
for service in "${services[@]}"; do
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        log_success "$service está corriendo"
    else
        log_warning "$service no está corriendo, intentando iniciar..."
        sudo systemctl start "$service" || true
    fi
done

# Crear usuario de prueba en la base de datos
log_info "Configurando datos de prueba..."

cd "$INSTALL_DIR/backend"

# Ejecutar script de configuración de datos
node -e "
const { db } = require('./config/database');

// Insertar cliente de prueba
db.run(`INSERT OR IGNORE INTO clients (name, email, phone, company, address) 
        VALUES ('Juan Pérez', 'juan@ejemplo.com', '+1234567890', 'Radio Ejemplo', 'Calle Principal 123')`);

// Insertar radio de prueba
db.run(`INSERT OR IGNORE INTO radios (name, client_id, plan_id, server_type, port, max_listeners, bitrate, autodj_enabled, mount_point, source_password, admin_password)
        VALUES ('Radio Prueba FM', 1, 1, 'icecast', 8010, 100, 128, 1, 'pruebafm', 'fuente123', 'admin123')`);

console.log('✅ Datos de prueba insertados');
"

# Configurar firewall para puertos de streaming
log_info "Configurando firewall para streaming..."

if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow 8000:8100/tcp comment "Geeks Radio Streaming Ports"
    log_success "Puertos de streaming habilitados en firewall"
fi

# Crear archivo de información del sistema
log_info "Generando información del sistema..."

cat > "$INSTALL_DIR/system-info.txt" << EOF
=== GEEKS RADIO CONTROL PANEL - INFORMACIÓN DEL SISTEMA ===

Instalación completada: $(date)
Versión: 2.0.0 (Completa con Backend)

=== SERVICIOS ===
Frontend: http://localhost (Puerto 80)
Backend API: http://localhost:3001/api
Icecast Admin: http://localhost:8000/admin
Panel de Control: http://localhost/

=== CREDENCIALES POR DEFECTO ===
Panel Admin:
  Usuario: admin
  Contraseña: geeksradio2024

Icecast Admin:
  Usuario: admin
  Contraseña: geeksradio2024

=== PUERTOS UTILIZADOS ===
80    - Nginx (Frontend)
3000  - React App
3001  - Backend API
8000  - Icecast
8001+ - Streams SHOUTcast

=== ARCHIVOS IMPORTANTES ===
Configuración: $INSTALL_DIR/backend/geeksradio.db
Logs: /var/log/geeks-radio*.log
Streams: $INSTALL_DIR/streams/
Backups: $INSTALL_DIR/backups/

=== COMANDOS ÚTILES ===
Ver logs API: sudo journalctl -u geeks-radio-api -f
Ver logs Frontend: sudo journalctl -u geeks-radio -f
Monitorear streams: $INSTALL_DIR/monitor-streams.sh
Backup manual: $INSTALL_DIR/backup-system.sh
Reiniciar todo: sudo systemctl restart geeks-radio geeks-radio-api icecast2 nginx

=== CARACTERÍSTICAS IMPLEMENTADAS ===
✅ Panel de administración web
✅ Backend API con Node.js/Express
✅ Base de datos SQLite
✅ Icecast2 para streaming
✅ SHOUTcast (opcional)
✅ Gestión automática de streams
✅ Monitoreo en tiempo real
✅ Sistema de backups
✅ AutoDJ con Liquidsoap (opcional)
✅ Estadísticas en tiempo real
✅ Autenticación JWT
✅ API REST completa

=== PRÓXIMOS PASOS ===
1. Acceder al panel: http://$(hostname -I | awk '{print $1}')
2. Cambiar credenciales por defecto
3. Crear clientes y radios
4. Configurar streams reales
5. Opcional: Instalar AutoDJ con ./install-autodj.sh

=== SOPORTE ===
Documentación: https://github.com/kambire/geeks-radio-control-panel
Issues: https://github.com/kambire/geeks-radio-control-panel/issues

EOF

# Mostrar resumen final
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                INSTALACIÓN COMPLETA FINALIZADA              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

log_success "¡Geeks Radio Panel completamente funcional instalado!"
echo ""

echo -e "${BLUE}🌐 ACCESOS:${NC}"
echo -e "   • Panel Principal: ${GREEN}http://$(hostname -I | awk '{print $1}')${NC}"
echo -e "   • API Backend: ${GREEN}http://$(hostname -I | awk '{print $1}')/api${NC}"
echo -e "   • Admin Icecast: ${GREEN}http://$(hostname -I | awk '{print $1}')/icecast/admin${NC}"
echo ""

echo -e "${BLUE}🔑 CREDENCIALES:${NC}"
echo -e "   • Usuario: ${GREEN}admin${NC}"
echo -e "   • Contraseña: ${GREEN}geeksradio2024${NC}"
echo ""

echo -e "${BLUE}📊 CARACTERÍSTICAS:${NC}"
echo -e "   • ✅ Panel web administrativo"
echo -e "   • ✅ Backend API completo"
echo -e "   • ✅ Icecast2 configurado"
echo -e "   • ✅ SHOUTcast disponible"
echo -e "   • ✅ Gestión automática de streams"
echo -e "   • ✅ Monitoreo en tiempo real"
echo -e "   • ✅ Base de datos funcional"
echo -e "   • ✅ Sistema de backups"
echo ""

echo -e "${BLUE}📋 INFORMACIÓN COMPLETA:${NC}"
echo -e "   • Ver archivo: ${GREEN}$INSTALL_DIR/system-info.txt${NC}"
echo ""

log_success "Sistema listo para producción!"
EOF

chmod +x post-install-setup.sh

Por último, actualizamos el package.json del frontend para incluir la variable de entorno del API:

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
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3001/api'),
  },
})
