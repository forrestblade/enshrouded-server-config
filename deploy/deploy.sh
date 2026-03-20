#!/bin/bash
set -euo pipefail

# Enshrouded Config Hub — Production deployment script
# Run on the VPS as root

APP_DIR="/opt/enshrouded-config"
APP_USER="enshrouded"
DOMAIN="enshroudedserverconfig.com"
REPO="https://github.com/forrestblade/enshrouded-server-config.git"

echo "=== Enshrouded Config Hub — Deploy ==="

# Create app user if not exists
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --create-home --shell /bin/bash "$APP_USER"
    echo "Created user: $APP_USER"
fi

# Clone or pull
if [ ! -d "$APP_DIR" ]; then
    git clone "$REPO" "$APP_DIR"
    echo "Cloned repository"
else
    cd "$APP_DIR"
    git pull origin main
    echo "Pulled latest"
fi

cd "$APP_DIR"

# Create .env if not exists
if [ ! -f .env ]; then
    cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enshrouded_config
DB_USER=enshrouded
DB_PASSWORD=EnshroudedProd2026!
PORT=3000
NODE_ENV=production
CMS_SECRET=CHANGE_ME_TO_RANDOM_64_CHAR_STRING
ENVEOF
    # Generate a real CMS secret
    SECRET=$(openssl rand -base64 48)
    sed -i "s|CHANGE_ME_TO_RANDOM_64_CHAR_STRING|$SECRET|" .env
    echo "Created .env with generated CMS_SECRET"
fi

# Install dependencies
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo "Dependencies installed"

# Allow argon2 native build
pnpm approve-builds 2>/dev/null || true
pnpm rebuild argon2 2>/dev/null || true

# Run migrations
pnpm migrate
echo "Migrations applied"

# Fix ownership
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Install systemd service
cp deploy/enshrouded-config.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable enshrouded-config
systemctl restart enshrouded-config
echo "Service started"

# Configure nginx
cp deploy/nginx.conf /etc/nginx/sites-available/enshrouded-config
ln -sf /etc/nginx/sites-available/enshrouded-config /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config before reload
nginx -t && systemctl reload nginx
echo "Nginx configured"

echo ""
echo "=== Deployment complete ==="
echo "App running at http://$DOMAIN"
echo ""
echo "Next: Set up SSL with:"
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "Don't forget to point DNS:"
echo "  A record: $DOMAIN -> $(curl -s ifconfig.me)"
echo "  A record: www.$DOMAIN -> $(curl -s ifconfig.me)"
