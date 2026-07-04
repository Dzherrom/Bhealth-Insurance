#!/usr/bin/env bash
# Lumina Insurance — daily PostgreSQL backup
#
# Install:
#   sudo mkdir -p /var/backups/lumina
#   sudo chown deploy:deploy /var/backups/lumina
#   chmod +x deploy/scripts/backup-db.sh
#
# Cron (as deploy): crontab -e
#   0 3 * * * /var/www/Bhealth-Insurance/deploy/scripts/backup-db.sh >> /var/backups/lumina/backup.log 2>&1
#
# Reads DATABASE_URL from backend/.env (postgresql://user:pass@localhost:5432/dbname)

set -o errexit
set -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/backend/.env"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/lumina}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "${BACKUP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found"
  exit 1
fi

DATABASE_URL="$(grep -E '^DATABASE_URL=' "${ENV_FILE}" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
if [[ -z "${DATABASE_URL}" || "${DATABASE_URL}" != postgres* ]]; then
  echo "ERROR: DATABASE_URL not set or not PostgreSQL in ${ENV_FILE}"
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="${BACKUP_DIR}/lumina_db_${STAMP}.sql.gz"

echo "==> Backing up to ${OUT_FILE}"
pg_dump "${DATABASE_URL}" | gzip > "${OUT_FILE}"
echo "==> Done ($(du -h "${OUT_FILE}" | cut -f1))"

echo "==> Removing backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -name 'lumina_db_*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete
