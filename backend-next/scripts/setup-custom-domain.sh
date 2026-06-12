#!/bin/bash
# Updated Custom Domain Setup Script - Handles Cloudflare proxy

set -e

DOMAIN="$1"
TENANT_ID="$2"
ACTION="${3:-setup}"

# Remove http:// or https:// if present
DOMAIN=$(echo "$DOMAIN" | sed -E 's#^https?://##' | sed 's#/$##')

NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
CUSTOM_DOMAINS_DIR="/etc/nginx/custom-domains"
LOG_FILE="/var/log/custom-domain-setup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Validate domain format
validate_domain() {
    local domain="$1"
    if [[ ! "$domain" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        echo "Invalid domain format"
        return 1
    fi
    return 0
}

# Cloudflare IP ranges (simplified check)
is_cloudflare_ip() {
    local ip="$1"
    # Cloudflare IPv4 ranges (partial list of common ones)
    local cf_ranges="103.21.244 103.22.200 103.31.4 104.16 104.17 104.18 104.19 104.20 104.21 104.22 104.23 104.24 104.25 104.26 104.27 108.162 131.0.72 141.101 162.158 172.64 172.65 172.66 172.67 173.245 188.114 190.93 197.234 198.41"
    
    for range in $cf_ranges; do
        if [[ "$ip" == "$range"* ]]; then
            return 0
        fi
    done
    return 1
}

# Check if DNS is properly configured (domain points to our server OR Cloudflare proxy)
verify_dns() {
    local domain="$1"
    local server_ip="159.198.47.126"
    local domain_ip=$(dig +short "$domain" | head -1)
    
    if [ -z "$domain_ip" ]; then
        echo "DNS_NOT_CONFIGURED"
        return 1
    fi
    
    # Direct match - domain points directly to our server
    if [ "$domain_ip" = "$server_ip" ]; then
        echo "DNS_VERIFIED_DIRECT"
        return 0
    fi
    
    # Check if it's a Cloudflare IP (proxied)
    if is_cloudflare_ip "$domain_ip"; then
        echo "DNS_VERIFIED_CLOUDFLARE"
        return 0
    fi
    
    # Try to verify via HTTP request (for Cloudflare proxied domains)
    local http_check=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$domain" 2>/dev/null || echo "000")
    if [ "$http_check" != "000" ]; then
        echo "DNS_VERIFIED_HTTP"
        return 0
    fi
    
    echo "DNS_MISMATCH:expected=$server_ip,got=$domain_ip"
    return 1
}

# Generate Nginx configuration for custom domain
generate_nginx_config() {
    local domain="$1"
    local tenant_id="$2"
    local config_file="$CUSTOM_DOMAINS_DIR/$domain.conf"
    
    mkdir -p "$CUSTOM_DOMAINS_DIR"
    
    cat > "$config_file" << NGINXEOF
# Custom domain configuration for tenant: $tenant_id
# Domain: $domain
# Generated: $(date)

server {
    listen 80;
    server_name $domain www.$domain;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $domain www.$domain;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "ALLOW-FROM https://allinbangla.com";
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Tenant-Id "$tenant_id" always;

    client_max_body_size 10M;

    location /uploads/ {
        alias /var/www/html/main-admin/backend/uploads/;
        expires 30d;
        add_header Cache-Control public;
        add_header Access-Control-Allow-Origin \$http_origin always;
        add_header Access-Control-Allow-Credentials true always;
        try_files \$uri =404;
    }

    location /yolo-api/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Tenant-Id $tenant_id;
        proxy_request_buffering off;
        proxy_read_timeout 300s;
        client_max_body_size 50M;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Tenant-Id $tenant_id;
        proxy_set_header Origin \$http_origin;
        proxy_request_buffering off;
        proxy_read_timeout 300s;

        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin \$http_origin always;
            add_header Access-Control-Allow-Methods 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
            add_header Access-Control-Allow-Headers 'Content-Type, Authorization, X-Tenant-Id' always;
            add_header Access-Control-Allow-Credentials true always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Tenant-Id $tenant_id;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 3600s;
    }

    location /health {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    location /assets/ {
        alias /var/www/html/main-admin/dist/client/assets/;
        expires 1y;
        add_header Cache-Control public;
        add_header Access-Control-Allow-Origin * always;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Tenant-Id $tenant_id;
        proxy_set_header X-Custom-Domain $domain;
        proxy_read_timeout 300s;
    }

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml image/svg+xml;
}
NGINXEOF

    log "Generated Nginx config for $domain -> $config_file"
    echo "$config_file"
}

# Generate temporary HTTP-only config for SSL certificate acquisition
generate_http_only_config() {
    local domain="$1"
    local config_file="$CUSTOM_DOMAINS_DIR/$domain.conf"
    
    mkdir -p "$CUSTOM_DOMAINS_DIR"
    mkdir -p /var/www/certbot
    
    cat > "$config_file" << HTTPEOF
# Temporary HTTP-only config for SSL certificate acquisition
# Domain: $domain

server {
    listen 80;
    server_name $domain www.$domain;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    location / {
        return 200 'Domain setup in progress...';
        add_header Content-Type text/plain;
    }
}
HTTPEOF

    log "Generated HTTP-only config for $domain"
    echo "$config_file"
}

# Obtain SSL certificate using certbot
obtain_ssl_certificate() {
    local domain="$1"
    
    log "Obtaining SSL certificate for $domain"
    
    mkdir -p /var/www/certbot
    
    # Check if certificate already exists
    if [ -d "/etc/letsencrypt/live/$domain" ]; then
        log "SSL certificate already exists for $domain"
        return 0
    fi
    
    # Run certbot
    certbot certonly --webroot \
        -w /var/www/certbot \
        -d "$domain" \
        --non-interactive \
        --agree-tos \
        --email admin@allinbangla.com \
        --expand \
        2>&1 | tee -a "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log "SSL certificate obtained successfully for $domain"
        return 0
    else
        log "Failed to obtain SSL certificate for $domain"
        return 1
    fi
}

# Enable the site
enable_site() {
    local domain="$1"
    
    # Test nginx configuration
    if nginx -t 2>&1; then
        systemctl reload nginx
        log "Site enabled and nginx reloaded for $domain"
        return 0
    else
        log "Nginx configuration test failed for $domain"
        return 1
    fi
}

# Main setup function
setup_domain() {
    local domain="$1"
    local tenant_id="$2"
    
    log "Starting domain setup for $domain (tenant: $tenant_id)"
    
    # Validate domain
    if ! validate_domain "$domain"; then
        echo '{"success": false, "error": "Invalid domain format", "stage": "validation"}'
        return 1
    fi
    
    # Verify DNS
    local dns_status=$(verify_dns "$domain")
    if [[ "$dns_status" != DNS_VERIFIED* ]]; then
        echo "{\"success\": false, \"error\": \"DNS not configured correctly\", \"details\": \"$dns_status\", \"stage\": \"dns_verification\"}"
        return 1
    fi
    
    log "DNS verified: $dns_status"
    
    # Generate HTTP-only config first (for certbot)
    generate_http_only_config "$domain"
    
    # Enable HTTP config and reload nginx
    if ! enable_site "$domain"; then
        echo '{"success": false, "error": "Failed to enable HTTP site", "stage": "http_setup"}'
        return 1
    fi
    
    # Obtain SSL certificate
    if ! obtain_ssl_certificate "$domain"; then
        echo '{"success": false, "error": "Failed to obtain SSL certificate. Domain may already be configured or rate limited.", "stage": "ssl_setup"}'
        return 1
    fi
    
    # Generate full HTTPS config
    generate_nginx_config "$domain" "$tenant_id"
    
    # Enable HTTPS config and reload nginx
    if ! enable_site "$domain"; then
        echo '{"success": false, "error": "Failed to enable HTTPS site", "stage": "https_setup"}'
        return 1
    fi
    
    log "Domain setup completed successfully for $domain"
    echo "{\"success\": true, \"domain\": \"$domain\", \"tenantId\": \"$tenant_id\", \"ssl\": true, \"dnsType\": \"$dns_status\"}"
    return 0
}

# Remove domain configuration
remove_domain() {
    local domain="$1"
    
    log "Removing domain configuration for $domain"
    
    rm -f "$CUSTOM_DOMAINS_DIR/$domain.conf"
    nginx -t && systemctl reload nginx
    
    log "Domain configuration removed for $domain"
    echo "{\"success\": true, \"domain\": \"$domain\", \"action\": \"removed\"}"
}

# Verify DNS only
verify_dns_only() {
    local domain="$1"
    local dns_status=$(verify_dns "$domain")
    
    if [[ "$dns_status" == DNS_VERIFIED* ]]; then
        echo "{\"success\": true, \"domain\": \"$domain\", \"dnsStatus\": \"verified\", \"type\": \"$dns_status\"}"
    else
        echo "{\"success\": false, \"domain\": \"$domain\", \"dnsStatus\": \"$dns_status\"}"
    fi
}

# Main execution
case "$ACTION" in
    setup)
        setup_domain "$DOMAIN" "$TENANT_ID"
        ;;
    verify)
        verify_dns_only "$DOMAIN"
        ;;
    remove)
        remove_domain "$DOMAIN"
        ;;
    *)
        echo "Usage: $0 <domain> <tenant_id> [setup|verify|remove]"
        exit 1
        ;;
esac
