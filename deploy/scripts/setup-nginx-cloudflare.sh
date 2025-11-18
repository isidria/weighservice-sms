#!/usr/bin/env bash
set -euo pipefail

# One-shot VPS helper to place Cloudflare origin certs, enable nginx site and reload nginx.
# Usage:
#   sudo bash setup-nginx-cloudflare.sh [CERT_PATH] [KEY_PATH] [REPO_DIR]
# Defaults:
#   CERT_PATH=/tmp/cert.pem
#   KEY_PATH=/tmp/key.pem
#   REPO_DIR=/home/weighservice/weighservice-sms

CERT_PATH="${1:-/tmp/cert.pem}"
KEY_PATH="${2:-/tmp/key.pem}"
REPO_DIR="${3:-/home/weighservice/weighservice-sms}"

NGINX_SITE_NAME="weighservice-sms"
CF_DIR="/etc/ssl/cloudflare"
AVAILABLE_DIR="/etc/nginx/sites-available"
ENABLED_DIR="/etc/nginx/sites-enabled"

function err() { echo "ERROR: $*" >&2; exit 1; }

if [[ $EUID -ne 0 ]]; then
  echo "This script should be run with sudo/root. Re-running with sudo..."
  exec sudo bash "$0" "$@"
fi

echo "Using cert: ${CERT_PATH}"
echo "Using key:  ${KEY_PATH}"
echo "Repository dir: ${REPO_DIR}"

if [[ ! -f "${CERT_PATH}" ]]; then
  err "Certificate file not found at ${CERT_PATH}. Upload it (e.g. scp) first."
fi
if [[ ! -f "${KEY_PATH}" ]]; then
  err "Key file not found at ${KEY_PATH}. Upload it (e.g. scp) first."
fi

echo "Creating Cloudflare cert directory: ${CF_DIR}"
mkdir -p "${CF_DIR}"
cp -f "${CERT_PATH}" "${CF_DIR}/cert.pem"
cp -f "${KEY_PATH}" "${CF_DIR}/key.pem"
chmod 600 "${CF_DIR}/cert.pem" "${CF_DIR}/key.pem"
chown root:root "${CF_DIR}/cert.pem" "${CF_DIR}/key.pem"

NGINX_CONF_SRC="${REPO_DIR}/deploy/nginx/weighservice-sms.conf"
NGINX_CONF_DST="${AVAILABLE_DIR}/${NGINX_SITE_NAME}"

if [[ ! -f "${NGINX_CONF_SRC}" ]]; then
  err "Nginx config not found in repo at ${NGINX_CONF_SRC}. Please check REPO_DIR or copy the file there." 
fi

echo "Copying nginx config from repo to ${NGINX_CONF_DST}"
cp -f "${NGINX_CONF_SRC}" "${NGINX_CONF_DST}"
ln -sf "${NGINX_CONF_DST}" "${ENABLED_DIR}/${NGINX_SITE_NAME}"

echo "Testing nginx configuration..."
if nginx -t; then
  echo "nginx config OK — reloading nginx"
  systemctl reload nginx
else
  echo "nginx config test failed. Not reloading. See output above." >&2
  exit 2
fi

if command -v ufw >/dev/null 2>&1; then
  echo "Allowing HTTP/HTTPS through ufw"
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

echo "Done. Useful checks:"
echo "  - Visit: https://node44.weighservice.online"
echo "  - Check backend logs: pm2 logs weighservice-backend"
echo "  - Check nginx logs: sudo tail -n 200 /var/log/nginx/error.log"

exit 0
