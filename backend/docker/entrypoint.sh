#!/bin/sh
set -e

echo "========================================="
echo "  HRMS Narwasthu Group - Starting..."  
echo "========================================="

# Wait for MySQL to be ready
echo "[*] Waiting for MySQL..."
# Wait for MySQL (Master) to be fully ready
echo "[*] Waiting for MySQL Master..."
max_retries=60
counter=0
until mysql -h"${DB_HOST:-mysql}" -P"${DB_PORT:-3306}" -u"${DB_USERNAME:-root}" -p"${DB_PASSWORD}" -e "SELECT 1" > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -ge $max_retries ]; then
        echo "[!] MySQL connection failed after ${max_retries} attempts."
        echo "[!] MySQL connection failed after ${max_retries} attempts. Terminating startup."
        exit 1
    fi
    echo "[*] MySQL Master is unavailable - retrying in 2s... ($counter/$max_retries)"
    sleep 2
done
echo "[✓] MySQL Master is ready!"

# Clear any existing caches that might interfere with initialization
echo "[*] Preparing Laravel..."
php artisan config:clear
php artisan cache:clear

# Run migrations and seeders - FORCING MASTER for both read/write to avoid slave lag/sync issues
if [ "${SKIP_MIGRATIONS}" != "true" ]; then
    echo "[*] Running database migrations on Master..."
    DB_READ_HOST="${DB_HOST:-mysql}" php artisan migrate --force --no-interaction
    
    echo "[*] Syncing Roles and Permissions..."
    DB_READ_HOST="${DB_HOST:-mysql}" php artisan db:seed --force --no-interaction
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
