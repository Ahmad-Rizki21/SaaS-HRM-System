#!/bin/sh
set -e

echo "========================================="
echo "  HRMS Narwasthu Group - Starting..."  
echo "========================================="

# ── Debug: Print connection info ──
echo "[DEBUG] DB_HOST=${DB_HOST:-'(not set, default: mysql-master)'}"
echo "[DEBUG] DB_PORT=${DB_PORT:-'(not set, default: 3306)'}"
echo "[DEBUG] DB_USERNAME=${DB_USERNAME:-'(not set, default: hrms_user)'}"
echo "[DEBUG] DB_DATABASE=${DB_DATABASE:-'(not set)'}"
echo "[DEBUG] DB_CONNECTION=${DB_CONNECTION:-'(not set)'}"
if [ -n "${DB_PASSWORD}" ]; then
    echo "[DEBUG] DB_PASSWORD=******* (is set, length: $(echo -n "${DB_PASSWORD}" | wc -c))"
else
    echo "[DEBUG] DB_PASSWORD=(EMPTY or NOT SET!) <-- THIS IS THE PROBLEM"
fi

# Wait for MySQL to be ready
echo "[*] Waiting for MySQL Master..."
MYSQL_HOST="${DB_HOST:-mysql-master}"
MYSQL_PORT="${DB_PORT:-3306}"
MYSQL_USER="${DB_USERNAME:-hrms_user}"
MYSQL_PASS="${DB_PASSWORD}"

max_retries=90
counter=0

# First attempt: show the actual error for debugging
echo "[DEBUG] Testing connection: mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER} -p*****"
mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASS}" -e "SELECT 1" 2>&1 || echo "[DEBUG] Initial connection test failed (this is expected if MySQL is still starting)"

until mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASS}" -e "SELECT 1" > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -ge $max_retries ]; then
        echo "[!] MySQL connection failed after ${max_retries} attempts."
        # Show the actual error before exiting
        echo "[DEBUG] Last error:"
        mysql -h"${MYSQL_HOST}" -P"${MYSQL_PORT}" -u"${MYSQL_USER}" -p"${MYSQL_PASS}" -e "SELECT 1" 2>&1 || true
        break
    fi
    echo "[*] MySQL Master is unavailable - retrying in 2s... ($counter/$max_retries)"
    sleep 2
done

if [ $counter -ge $max_retries ]; then
    echo "[!] CRITICAL: MySQL Master could not be reached. Exiting."
    exit 1
fi

echo "[✓] MySQL Master is ready!"

# Clear any existing caches that might interfere with initialization
echo "[*] Preparing Laravel..."
php artisan config:clear
# cache:clear after config:clear needs explicit DB_CONNECTION since
# Laravel 11 defaults to sqlite without cached config
php artisan cache:clear 2>/dev/null || echo "[*] Cache clear skipped (first deploy or no cache table yet)"

# Run migrations and seeders - FORCING MASTER for both read/write to avoid slave lag/sync issues
if [ "${SKIP_MIGRATIONS}" != "true" ]; then
    echo "[*] Running database migrations on Master..."
    php artisan migrate --force --no-interaction
    
    echo "[*] Syncing Roles and Permissions..."
    php artisan db:seed --force --no-interaction
else
    echo "[*] Skipping migrations (SKIP_MIGRATIONS=true)..."
fi

# Now that database is ready, we can cache configuration for production performance
echo "[*] Optimizing Laravel for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Storage link
echo "[*] Creating storage link..."
php artisan storage:link 2>/dev/null || true

# Fix permissions
echo "[*] Setting permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "========================================="
echo "  HRMS Narwasthu Group - Ready! 🚀"
echo "========================================="

# Execute CMD
exec "$@"
