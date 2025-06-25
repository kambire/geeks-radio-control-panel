#!/bin/bash

# Geeks Radio - Script de Actualización Inteligente
# Version: 1.0.0
# Descripción: Sistema avanzado de actualización con respaldo y rollback
# Repositorio: https://github.com/kambire/geeks-radio-control-panel

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variables de configuración
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
SERVICE_NAME="geeks-radio"
LOG_FILE="$PROJECT_DIR/update.log"
REPO_URL="https://github.com/kambire/geeks-radio-control-panel.git"
CURRENT_VERSION=""
NEW_VERSION=""
UPDATE_AVAILABLE=false

# Funciones de logging
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

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1" | tee -a "$LOG_FILE"
}

# Banner de actualización
show_banner() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                     GEEKS RADIO UPDATER                        ║"
    echo "║                Sistema de Actualización v1.0                   ║"
    echo "║          github.com/kambire/geeks-radio-control-panel          ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar prerrequisitos
check_prerequisites() {
    log_step "Verificando prerrequisitos..."
    
    # Verificar que estamos en el directorio correcto
    if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
        log_error "No se encontró package.json. Ejecutar desde el directorio del proyecto."
        exit 1
    fi
    
    # Verificar Git
    if ! command -v git >/dev/null 2>&1; then
        log_error "Git no está instalado"
        exit 1
    fi
    
    # Verificar Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js no está instalado"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm no está instalado"
        exit 1
    fi
    
    log_success "Prerrequisitos verificados"
}

# Obtener versión actual
get_current_version() {
    log_step "Obteniendo versión actual..."
    
    if [[ -f "$PROJECT_DIR/package.json" ]]; then
        CURRENT_VERSION=$(node -p "require('$PROJECT_DIR/package.json').version" 2>/dev/null || echo "unknown")
    else
        CURRENT_VERSION="unknown"
    fi
    
    if [[ -d "$PROJECT_DIR/.git" ]]; then
        CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        log_info "Versión actual: $CURRENT_VERSION (commit: $CURRENT_COMMIT)"
    else
        log_info "Versión actual: $CURRENT_VERSION"
    fi
}

# Verificar actualizaciones disponibles
check_for_updates() {
    log_step "Verificando actualizaciones disponibles desde GitHub..."
    
    if [[ ! -d "$PROJECT_DIR/.git" ]]; then
        log_warning "No es un repositorio Git. Intentando reconectar con GitHub..."
        
        # Intentar inicializar repositorio si no existe
        git init
        git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
        
        if ! git fetch origin main 2>/dev/null; then
            log_error "No se pudo conectar al repositorio de GitHub"
            return 1
        fi
    fi
    
    # Fetch últimos cambios desde GitHub
    if git fetch origin main 2>/dev/null; then
        LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "none")
        REMOTE_COMMIT=$(git rev-parse origin/main)
        
        if [[ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]]; then
            UPDATE_AVAILABLE=true
            NEW_VERSION=$(git show origin/main:package.json 2>/dev/null | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin')).version" 2>/dev/null || echo "unknown")
            
            log_info "¡Actualización disponible desde GitHub!"
            log_info "Repositorio: https://github.com/kambire/geeks-radio-control-panel"
            log_info "Versión nueva: $NEW_VERSION"
            
            # Mostrar cambios
            echo ""
            log_info "Últimos cambios disponibles:"
            git log --oneline HEAD..origin/main | head -10 | while read line; do
                echo -e "${CYAN}  • $line${NC}"
            done
            echo ""
            
            return 0
        else
            log_success "Ya tienes la versión más reciente del repositorio"
            return 1
        fi
    else
        log_error "No se pudo conectar al repositorio de GitHub"
        log_error "Verifica tu conexión a internet y el repositorio: $REPO_URL"
        return 1
    fi
}

# Crear backup completo
create_backup() {
    log_step "Creando backup del sistema..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup del código fuente
    log_info "Respaldando código fuente..."
    cp -r "$PROJECT_DIR/src" "$BACKUP_PATH/" 2>/dev/null || true
    cp -r "$PROJECT_DIR/public" "$BACKUP_PATH/" 2>/dev/null || true
    cp "$PROJECT_DIR/package.json" "$BACKUP_PATH/" 2>/dev/null || true
    cp "$PROJECT_DIR/package-lock.json" "$BACKUP_PATH/" 2>/dev/null || true
    cp "$PROJECT_DIR/vite.config.ts" "$BACKUP_PATH/" 2>/dev/null || true
    cp "$PROJECT_DIR/tailwind.config.ts" "$BACKUP_PATH/" 2>/dev/null || true
    cp "$PROJECT_DIR/tsconfig.json" "$BACKUP_PATH/" 2>/dev/null || true
    
    # Backup de la build actual
    if [[ -d "$PROJECT_DIR/dist" ]]; then
        log_info "Respaldando build actual..."
        cp -r "$PROJECT_DIR/dist" "$BACKUP_PATH/"
    fi
    
    # Backup de configuraciones
    if [[ -f "$PROJECT_DIR/.env" ]]; then
        cp "$PROJECT_DIR/.env" "$BACKUP_PATH/"
    fi
    
    # Crear información del backup
    cat > "$BACKUP_PATH/backup_info.txt" << EOF
Backup creado: $(date)
Versión: $CURRENT_VERSION
Commit: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
Rama: $(git branch --show-current 2>/dev/null || echo "unknown")
Sistema: $(uname -a)
EOF
    
    log_success "Backup creado en: $BACKUP_PATH"
    echo "$BACKUP_PATH" > "$PROJECT_DIR/.last_backup"
}

# Verificar estado del servicio
check_service_status() {
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        return 0  # Servicio activo
    else
        return 1  # Servicio inactivo
    fi
}

# Detener servicios
stop_services() {
    log_step "Deteniendo servicios..."
    
    SERVICE_WAS_RUNNING=false
    
    if check_service_status; then
        SERVICE_WAS_RUNNING=true
        log_info "Deteniendo servicio $SERVICE_NAME..."
        sudo systemctl stop "$SERVICE_NAME" || log_warning "No se pudo detener el servicio"
    fi
    
    # Detener procesos Node.js relacionados (si los hay)
    pkill -f "node.*geeks-radio" 2>/dev/null || true
    
    log_success "Servicios detenidos"
}

# Aplicar actualización
apply_update() {
    log_step "Aplicando actualización desde GitHub..."
    
    # Actualizar código desde GitHub
    log_info "Descargando últimos cambios desde el repositorio..."
    git pull origin main
    
    # Verificar si package.json cambió
    if git diff HEAD~1 HEAD --name-only | grep -q "package.json"; then
        log_info "Detectados cambios en dependencias, instalando..."
        npm install
    fi
    
    # Ejecutar migraciones si existen
    if [[ -f "$PROJECT_DIR/migrations/migrate.sh" ]]; then
        log_info "Ejecutando migraciones..."
        bash "$PROJECT_DIR/migrations/migrate.sh"
    fi
    
    # Construir aplicación
    log_info "Construyendo aplicación actualizada..."
    npm run build
    
    if [[ ! -d "$PROJECT_DIR/dist" ]]; then
        log_error "La construcción falló - no se encontró directorio dist"
        rollback_update
        exit 1
    fi
    
    log_success "Actualización aplicada desde GitHub"
}

# Iniciar servicios
start_services() {
    log_step "Iniciando servicios..."
    
    if [[ "$SERVICE_WAS_RUNNING" == true ]]; then
        log_info "Iniciando servicio $SERVICE_NAME..."
        sudo systemctl start "$SERVICE_NAME"
        
        # Verificar que el servicio inició correctamente
        sleep 3
        if check_service_status; then
            log_success "Servicio $SERVICE_NAME iniciado correctamente"
        else
            log_error "El servicio no pudo iniciarse correctamente"
            show_service_logs
            rollback_update
            exit 1
        fi
    fi
    
    # Recargar nginx si está activo
    if systemctl is-active --quiet nginx 2>/dev/null; then
        log_info "Recargando configuración de nginx..."
        sudo systemctl reload nginx || log_warning "No se pudo recargar nginx"
    fi
    
    log_success "Servicios iniciados"
}

# Mostrar logs del servicio
show_service_logs() {
    log_info "Últimos logs del servicio:"
    sudo journalctl -u "$SERVICE_NAME" --no-pager -n 20 || true
}

# Verificar funcionamiento post-actualización
verify_update() {
    log_step "Verificando funcionamiento..."
    
    # Verificar que el servicio esté corriendo
    if [[ "$SERVICE_WAS_RUNNING" == true ]]; then
        if ! check_service_status; then
            log_error "El servicio no está funcionando después de la actualización"
            return 1
        fi
    fi
    
    # Verificar que los archivos dist existan
    if [[ ! -d "$PROJECT_DIR/dist" ]] || [[ ! -f "$PROJECT_DIR/dist/index.html" ]]; then
        log_error "Los archivos de construcción no son válidos"
        return 1
    fi
    
    # Test HTTP básico si el servicio está corriendo
    if [[ "$SERVICE_WAS_RUNNING" == true ]]; then
        log_info "Probando conectividad HTTP..."
        sleep 5  # Esperar que el servicio esté completamente listo
        
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|30[0-9]"; then
            log_success "Servicio responde correctamente"
        else
            log_warning "El servicio no responde como se esperaba"
            # No fallar aquí, podría ser un problema temporal
        fi
    fi
    
    log_success "Verificación completada"
    return 0
}

# Rollback en caso de error
rollback_update() {
    log_error "Ejecutando rollback..."
    
    if [[ -f "$PROJECT_DIR/.last_backup" ]]; then
        LAST_BACKUP=$(cat "$PROJECT_DIR/.last_backup")
        
        if [[ -d "$LAST_BACKUP" ]]; then
            log_info "Restaurando desde backup: $LAST_BACKUP"
            
            # Restaurar archivos
            cp -r "$LAST_BACKUP"/* "$PROJECT_DIR/" 2>/dev/null || true
            
            # Reinstalar dependencias del backup
            if [[ -f "$LAST_BACKUP/package.json" ]]; then
                npm install
            fi
            
            # Reiniciar servicios
            if [[ "$SERVICE_WAS_RUNNING" == true ]]; then
                sudo systemctl restart "$SERVICE_NAME" || true
            fi
            
            log_success "Rollback completado"
        else
            log_error "No se encontró el backup para rollback"
        fi
    else
        log_error "No hay información de backup disponible"
    fi
}

# Limpiar backups antiguos
cleanup_old_backups() {
    log_step "Limpiando backups antiguos..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        # Mantener solo los últimos 5 backups
        find "$BACKUP_DIR" -name "backup_*" -type d | sort -r | tail -n +6 | while read backup; do
            log_info "Eliminando backup antiguo: $(basename "$backup")"
            rm -rf "$backup"
        done
    fi
    
    log_success "Limpieza de backups completada"
}

# Mostrar resumen de actualización
show_update_summary() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                   ACTUALIZACIÓN COMPLETADA                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    log_success "¡Geeks Radio Panel actualizado exitosamente!"
    echo ""
    
    echo -e "${BLUE}📊 RESUMEN:${NC}"
    echo -e "   • Versión anterior: ${YELLOW}$CURRENT_VERSION${NC}"
    echo -e "   • Versión nueva: ${GREEN}$NEW_VERSION${NC}"
    echo -e "   • Backup creado: ${CYAN}$(basename "$(cat "$PROJECT_DIR/.last_backup" 2>/dev/null || echo "N/A")")${NC}"
    echo ""
    
    echo -e "${BLUE}🔗 INFORMACIÓN:${NC}"
    echo -e "   • Repositorio: ${GREEN}https://github.com/kambire/geeks-radio-control-panel${NC}"
    echo -e "   • Panel: ${GREEN}http://localhost${NC}"
    echo -e "   • Estado: ${GREEN}$(check_service_status && echo "Activo" || echo "Inactivo")${NC}"
    echo ""
    
    echo -e "${BLUE}📝 LOGS:${NC}"
    echo -e "   • Actualización: ${CYAN}$LOG_FILE${NC}"
    echo -e "   • Servicio: ${CYAN}sudo journalctl -u $SERVICE_NAME -f${NC}"
    echo ""
}

# Modo interactivo
interactive_mode() {
    if [[ "$UPDATE_AVAILABLE" == true ]]; then
        echo ""
        echo -e "${YELLOW}¿Deseas proceder con la actualización? [y/N]${NC}"
        read -r response
        
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Actualización cancelada por el usuario"
            exit 0
        fi
    fi
}

# Función principal
main() {
    # Limpiar log anterior
    echo "=== Geeks Radio Update - $(date) ===" > "$LOG_FILE"
    
    show_banner
    
    log_info "Iniciando proceso de actualización..."
    
    check_prerequisites
    get_current_version
    
    if check_for_updates; then
        interactive_mode
        
        create_backup
        stop_services
        
        # Intentar actualización con manejo de errores
        if apply_update && verify_update; then
            start_services
            cleanup_old_backups
            show_update_summary
        else
            log_error "La actualización falló"
            rollback_update
            exit 1
        fi
    else
        log_success "No hay actualizaciones disponibles"
    fi
}

# Manejo de señales
trap 'log_error "Actualización interrumpida"; rollback_update; exit 1' INT TERM

# Opciones de línea de comandos
case "${1:-}" in
    --force)
        log_info "Modo forzado activado"
        UPDATE_AVAILABLE=true
        main
        ;;
    --check)
        check_prerequisites
        get_current_version
        check_for_updates
        ;;
    --rollback)
        rollback_update
        ;;
    --clean)
        cleanup_old_backups
        ;;
    *)
        main
        ;;
esac
