#!/bin/bash
# ============================================================
# HRMS Narwasthu Group - Automated MySQL Backup to Nextcloud
# ============================================================
set -euo pipefail

# ── Configuration ────────────────────────────────────────────
CONTAINER_NAME="hrms-mysql-master"
DB_NAME="hrm_saas"
DB_USER="hrms_user"
DB_PASS="OnTimeNarwastugo2026"

# Nextcloud WebDAV Configuration
NEXTCLOUD_URL="https://cloud.jelantik.com/remote.php/dav/files/casaos/BACKUP%20SQL%20DATA%20BASE%20ONTIME-HRMS"
NEXTCLOUD_USER="casaos"
NEXTCLOUD_PASS="casaos"

# Local backup directory
BACKUP_DIR="/home/hrms/backups/mysql"
LOCAL_RETENTION_DAYS=7

# ── Derived Variables ────────────────────────────────────────
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="hrms_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# ── Functions ────────────────────────────────────────────────
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# ── Main Script ──────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
log "--- Backup Started ---"

# Step 1: Dump MySQL database
log "[1/3] Dumping database '${DB_NAME}'..."
if docker exec "$CONTAINER_NAME" mysqldump \
    -u"$DB_USER" \
    -p"$DB_PASS" \
    --no-tablespaces \
    --skip-lock-tables \
    --set-gtid-purged=OFF \
    --quick \
    "$DB_NAME" 2>/dev/null | gzip > "${BACKUP_DIR}/${FILENAME}"; then
    
    FILESIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
    log "    ✓ Dump successful: ${FILENAME} (${FILESIZE})"
else
    log "    ✗ ERROR: MySQL dump failed!"
    exit 1
fi

# Step 2: Upload to Nextcloud via WebDAV
log "[2/3] Uploading to Nextcloud..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -u "${NEXTCLOUD_USER}:${NEXTCLOUD_PASS}" \
    -T "${BACKUP_DIR}/${FILENAME}" \
    "${NEXTCLOUD_URL}/${FILENAME}" \
    --connect-timeout 30 \
    --max-time 300)

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 204 ]; then
    log "    ✓ Upload successful (HTTP ${HTTP_CODE})"
else
    log "    ✗ Upload failed (HTTP ${HTTP_CODE})"
fi

# Step 3: Cleanup local backups
log "[3/3] Cleaning up local backups older than ${LOCAL_RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "hrms_backup_*.sql.gz" -mtime +${LOCAL_RETENTION_DAYS} -delete
log "--- Backup Complete ✅ ---"
log ""
