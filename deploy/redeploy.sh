#!/bin/bash
# =============================================================================
# Quick Redeploy Script — Pull latest code, rebuild, restart
# Usage: ssh root@159.198.47.126 'bash /var/www/app/deploy/redeploy.sh'
#   Or:  ./redeploy.sh backend    (only rebuild backend)
#   Or:  ./redeploy.sh admin      (only rebuild admin-next)
#   Or:  ./redeploy.sh storefront (only rebuild storefront-next)
#   Or:  ./redeploy.sh hishabee   (only rebuild hishabee)
# =============================================================================
set -euo pipefail

APP_DIR="/var/www/html/multi-vendor/B"
cd "$APP_DIR"

log() { echo "[$(date '+%H:%M:%S')] $1"; }

# Pull latest
#log 
#git pull origin main

build_backend() {
    log "Building backend..."
    cd "$APP_DIR/backend-next"
    # Install ALL deps (including devDependencies) so tsc is available for build
    npm ci
    npx tsc --project tsconfig.json
    # Prune devDependencies after build to keep production image lean
    npm prune --omit=dev
    chown -R www-data:www-data "$APP_DIR/backend-next"
    systemctl restart backend-api
    log "Backend restarted."
}

build_admin() {
    log "Building admin-next..."
    cd "$APP_DIR/admin-next"
    npm ci
    NODE_OPTIONS="--max-old-space-size=4096" npx next build
    chown -R www-data:www-data "$APP_DIR/admin-next"
    systemctl restart admin-next
    log "Admin-next restarted."
}

build_storefront() {
    log "Building storefront-next..."
    cd "$APP_DIR/storefront-next"
    npm ci
    # --no-turbopack: codebase uses import.meta.env.VITE_* which needs webpack DefinePlugin
    NODE_OPTIONS="--max-old-space-size=4096" npx next build 
    chown -R www-data:www-data "$APP_DIR/storefront-next"
    systemctl restart storefront-next
    log "Storefront restarted."
}

build_hishabee() {
    log "Building hishabee..."
    cd "$APP_DIR/hishabee"
    npm ci
    npx next build
    chown -R www-data:www-data "$APP_DIR/hishabee"
    systemctl restart hishabee-app
    log "Hishabee restarted."
}

case "${1:-all}" in
    backend)    build_backend ;;
    admin)      build_admin ;;
    storefront) build_storefront ;;
    hishabee)   build_hishabee ;;
    all)
        build_backend
        build_admin
        build_storefront
        build_hishabee
        systemctl reload nginx
        log "Full redeploy complete."
        ;;
    *)
        echo "Usage: $0 {backend|admin|storefront|hishabee|all}"
        exit 1
        ;;
esac
