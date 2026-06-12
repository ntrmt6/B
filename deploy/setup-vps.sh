#!/bin/bash
# =============================================================================
# VPS Deployment Script — Multi-Tenant SaaS
# Server: 159.198.47.126
# Domains: *.allinbangla.com, *.cartnget.shop, *.systemnextit.website
#
# Usage: ssh root@159.198.47.126 'bash -s' < deploy/setup-vps.sh
# Or:    scp -r deploy/ root@159.198.47.126:/tmp/ && ssh root@159.198.47.126 'bash /tmp/deploy/setup-vps.sh'
# =============================================================================
set -euo pipefail

APP_DIR="/var/www/app"
REPO_URL="https://github.com/snitauthority-design/admin-mainbeta.git"  # ← UPDATE THIS
DOMAIN="allinbangla.com"
ADDITIONAL_DOMAINS=("cartnget.shop" "systemnextit.website")
EMAIL="admin@allinbangla.com"
NODE_VERSION="20"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ═════════════════════════════════════════════════════════════════════════════
# STEP 1: System Setup
# ═════════════════════════════════════════════════════════════════════════════
step_system() {
    log "Updating system packages..."
    apt update && apt upgrade -y

    log "Installing essential packages..."
    apt install -y \
        curl wget git build-essential \
        nginx certbot python3-certbot-nginx \
        ufw fail2ban \
        htop ncdu

    # ── Node.js 20 via NodeSource ──
    if ! command -v node &>/dev/null || [[ "$(node -v)" != v${NODE_VERSION}* ]]; then
        log "Installing Node.js ${NODE_VERSION}..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
        apt install -y nodejs
    fi
    log "Node: $(node -v) | npm: $(npm -v)"

    # ── PM2 (optional process manager, we use systemd but useful for logs) ──
    # npm install -g pm2

    # ── Redis ──
    if ! command -v redis-server &>/dev/null; then
        log "Installing Redis..."
        apt install -y redis-server
        systemctl enable redis-server
        systemctl start redis-server
    fi
    log "Redis: $(redis-server --version | head -c 30)"
}

# ═════════════════════════════════════════════════════════════════════════════
# STEP 2: Firewall
# ═════════════════════════════════════════════════════════════════════════════
step_firewall() {
    log "Configuring UFW firewall..."
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw --force enable
    ufw status
}

# ═════════════════════════════════════════════════════════════════════════════
# STEP 3: Clone / Pull Application Code
# ═════════════════════════════════════════════════════════════════════════════
step_code() {
    log "Setting up application directory..."
    mkdir -p "$APP_DIR"

    if [ -d "$APP_DIR/.git" ]; then
        log "Pulling latest code..."
        cd "$APP_DIR"
        git pull origin main
    else
        log "Cloning repository..."
        git clone "$REPO_URL" "$APP_DIR"
        cd "$APP_DIR"
    fi
}

# ═════════════════════════════════════════════════════════════════════════════
# STEP 4: Install Dependencies & Build
# ═════════════════════════════════════════════════════════════════════════════
step_build() {
    cd "$APP_DIR"

    # ── Backend ──
    log "Building backend-next..."
    cd "$APP_DIR/backend-next"
    npm ci --omit=dev
    npm run build

    # ── Admin Next.js ──
    log "Building admin-next..."
    cd "$APP_DIR/admin-next"
    npm ci
    NODE_OPTIONS="--max-old-space-size=4096" npx next build

    # ── Storefront Next.js ──
    log "Building storefront-next..."
    cd "$APP_DIR/storefront-next"
    npm ci
    NODE_OPTIONS="--max-old-space-size=4096" npx next build --webpack

    # ── Hishabee ──
    log "Building hishabee..."
    cd "$APP_DIR/hishabee"
    npm ci
    npx next build

    # ── Fix ownership ──
    chown -R www-data:www-data "$APP_DIR"
}

# ═════════════════════════════════════════════════════════════════════════════
# STEP 5: Nginx Configuration
# ═════════════════════════════════════════════════════════════════════════════
step_nginx() {
    log "Configuring Nginx..."

    # Generate DH parameters if missing
    if [ ! -f /etc/nginx/dhparam.pem ]; then
        log "Generating DH parameters (this takes a minute)..."
        openssl dhparam -out /etc/nginx/dhparam.pem 2048
    fi

    # Create directories
    mkdir -p /etc/nginx/snippets
    mkdir -p /etc/nginx/sites-available
    mkdir -p /etc/nginx/sites-enabled
    mkdir -p /etc/nginx/custom-domains
    mkdir -p /var/www/certbot

    # Copy configs from deploy/ directory
    DEPLOY_DIR="$APP_DIR/deploy"

    # Main nginx.conf
    cp "$DEPLOY_DIR/nginx/nginx.conf" /etc/nginx/nginx.conf

    # SSL snippet
    cp "$DEPLOY_DIR/nginx/snippets/ssl-params.conf" /etc/nginx/snippets/ssl-params.conf

    # Site configs
    cp "$DEPLOY_DIR/nginx/sites-available/"*.conf /etc/nginx/sites-available/

    # Enable sites (symlink)
    rm -f /etc/nginx/sites-enabled/default
    for conf in /etc/nginx/sites-available/*.conf; do
        ln -sf "$conf" /etc/nginx/sites-enabled/
    done

    # Test config
    nginx -t || err "Nginx config test failed!"
    log "Nginx config test passed."
}

# ═════════════════════════════════════════════════════════════════════════════
# STEP 6: SSL Certificates (Wildcard via DNS challenge)
# ═════════════════════════════════════════════════════════════════════════════
step_ssl() {
    log "Setting up SSL certificates..."

    # For wildcard certs, you MUST use DNS challenge.
    # If using Cloudflare DNS, install the plugin:
    #   apt install python3-certbot-dns-cloudflare
    #   Create /etc/letsencrypt/cloudflare.ini with:
    #     dns_cloudflare_api_token = YOUR_CF_API_TOKEN
    #   chmod 600 /etc/letsencrypt/cloudflare.ini

    # ── Primary domain wildcard ──
    if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        log "Obtaining wildcard certificate for *.$DOMAIN..."
        echo ""
        echo "============================================================"
        echo "  WILDCARD SSL CERTIFICATE SETUP"
        echo "============================================================"
        echo ""
        echo "  Option A — Cloudflare DNS (automated):"
        echo "    apt install python3-certbot-dns-cloudflare"
        echo "    certbot certonly --dns-cloudflare \\"
        echo "      --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \\"
        echo "      -d '$DOMAIN' -d '*.$DOMAIN' \\"
        echo "      --email $EMAIL --agree-tos --non-interactive"
        echo ""
        echo "  Option B — Manual DNS TXT record:"
        echo "    certbot certonly --manual --preferred-challenges dns \\"
        echo "      -d '$DOMAIN' -d '*.$DOMAIN' \\"
        echo "      --email $EMAIL --agree-tos"
        echo "    (Follow prompts to add _acme-challenge TXT record)"
        echo ""
        echo "============================================================"

        # Attempt Cloudflare method if credentials exist
        if [ -f /etc/letsencrypt/cloudflare.ini ]; then
            certbot certonly --dns-cloudflare \
                --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
                -d "$DOMAIN" -d "*.$DOMAIN" \
                --email "$EMAIL" --agree-tos --non-interactive
        else
            warn "No Cloudflare credentials found. Run the manual command above."
            warn "After obtaining the cert, re-run this script or restart nginx."
        fi
    else
        log "Wildcard cert for $DOMAIN already exists."
    fi

    # ── Additional domains ──
    for extra_domain in "${ADDITIONAL_DOMAINS[@]}"; do
        if [ ! -d "/etc/letsencrypt/live/$extra_domain" ]; then
            log "Obtaining wildcard certificate for *.$extra_domain..."
            if [ -f /etc/letsencrypt/cloudflare.ini ]; then
                certbot certonly --dns-cloudflare \
                    --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
                    -d "$extra_domain" -d "*.$extra_domain" \
                    --email "$EMAIL" --agree-tos --non-interactive
            else
                warn "Obtain wildcard cert for $extra_domain manually."
            fi
        fi
    done

    # Auto-renewal cron
    systemctl enable certbot.timer
    systemctl start certbot.timer

    log "SSL setup complete."
}

# ═════════════════════════════════════════════════════════════════════════════
# STEP 7: Systemd Services
# ═════════════════════════════════════════════════════════════════════════════
step_services() {
    log "Installing systemd services..."

    DEPLOY_DIR="$APP_DIR/deploy"

    cp "$DEPLOY_DIR/systemd/backend-api.service" /etc/systemd/system/
    cp "$DEPLOY_DIR/systemd/admin-next.service" /etc/systemd/system/
    cp "$DEPLOY_DIR/systemd/storefront-next.service" /etc/systemd/system/
    cp "$DEPLOY_DIR/systemd/hishabee-app.service" /etc/systemd/system/

    systemctl daemon-reload

    # Enable all services to start on boot
    systemctl enable backend-api admin-next storefront-next hishabee-app

    # Start services (backend first, then frontends)
    log "Starting backend-api..."
    systemctl restart backend-api
    sleep 3

    log "Starting frontend services..."
    systemctl restart admin-next
    systemctl restart storefront-next
    systemctl restart hishabee-app

    # Restart nginx
    systemctl restart nginx

    log "All services started."
}

# ═════════════════════════════════════════════════════════════════════════════
# STEP 8: Verify
# ═════════════════════════════════════════════════════════════════════════════
step_verify() {
    log "Verifying services..."
    echo ""
    echo "Service Status:"
    echo "─────────────────────────────────────────"
    for svc in backend-api admin-next storefront-next hishabee-app nginx; do
        status=$(systemctl is-active "$svc" 2>/dev/null || echo "inactive")
        if [ "$status" = "active" ]; then
            echo -e "  ${GREEN}●${NC} $svc: $status"
        else
            echo -e "  ${RED}●${NC} $svc: $status"
        fi
    done
    echo ""

    # Health check
    if curl -sf http://127.0.0.1:5001/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}●${NC} Backend health check: OK"
    else
        echo -e "  ${RED}●${NC} Backend health check: FAILED"
    fi

    echo ""
    echo "═══════════════════════════════════════════"
    echo "  Deployment Complete!"
    echo ""
    echo "  API:        https://api.$DOMAIN"
    echo "  Admin:      https://admin.$DOMAIN"
    echo "  Admin:      https://systemnextit.website"
    echo "  Storefront: https://<tenant>.$DOMAIN"
    echo "  Hishabee:   https://hishabee.$DOMAIN"
    echo ""
    echo "  Logs:"
    echo "    journalctl -u backend-api -f"
    echo "    journalctl -u admin-next -f"
    echo "    journalctl -u storefront-next -f"
    echo "    tail -f /var/log/nginx/access.log"
    echo "═══════════════════════════════════════════"
}

# ═════════════════════════════════════════════════════════════════════════════
# Main
# ═════════════════════════════════════════════════════════════════════════════
main() {
    log "Starting VPS deployment..."
    echo ""

    step_system
    step_firewall
    step_code
    step_build
    step_nginx
    step_ssl
    step_services
    step_verify
}

# Allow running individual steps: ./setup-vps.sh nginx
if [ $# -gt 0 ]; then
    case "$1" in
        system)   step_system ;;
        firewall) step_firewall ;;
        code)     step_code ;;
        build)    step_build ;;
        nginx)    step_nginx ;;
        ssl)      step_ssl ;;
        services) step_services ;;
        verify)   step_verify ;;
        *)        err "Unknown step: $1. Use: system|firewall|code|build|nginx|ssl|services|verify" ;;
    esac
else
    main
fi
