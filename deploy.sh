#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script for syncing the current local project to an EC2 server
# and rebuilding the Docker stack there.
#
# Example:
#   DEPLOY_HOST=13.203.186.88 \
#   DEPLOY_USER=ubuntu \
#   SSH_KEY=./algonoteKey.pem \
#   ./deploy.sh

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/algonote}"
SSH_KEY="${SSH_KEY:-}"
SKIP_FRONTEND_BUILD="${SKIP_FRONTEND_BUILD:-false}"
SYNC_ENV="${SYNC_ENV:-false}"
MIN_FREE_MB="${MIN_FREE_MB:-1200}"

if [[ -z "$DEPLOY_HOST" ]]; then
  echo "Error: DEPLOY_HOST is required."
  exit 1
fi

for cmd in ssh tar; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required command '$cmd' not found in PATH."
    exit 1
  fi
done

if [[ "$SKIP_FRONTEND_BUILD" != "true" ]] && ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required unless SKIP_FRONTEND_BUILD=true."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"
SSH_OPTS=("-p" "$DEPLOY_PORT" "-o" "StrictHostKeyChecking=accept-new")

if [[ -n "$SSH_KEY" ]]; then
  SSH_OPTS+=("-i" "$SSH_KEY")
fi

TAR_EXCLUDES=(
  "--exclude=.git"
  "--exclude=.github"
  "--exclude=node_modules"
  "--exclude=**/node_modules"
  "--exclude=.DS_Store"
  "--exclude=*.log"
  "--exclude=client/node_modules"
  "--exclude=backend/node_modules"
)

if [[ "$SYNC_ENV" != "true" ]]; then
  TAR_EXCLUDES+=("--exclude=.env")
fi

echo "==> Deploy target: ${REMOTE}:${DEPLOY_PATH}"

if [[ "$SKIP_FRONTEND_BUILD" != "true" ]]; then
  echo "==> Building frontend..."
  npm --prefix "$ROOT_DIR/client" run build
else
  echo "==> Skipping frontend build"
fi

echo "==> Ensuring remote directory exists..."
ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p '$DEPLOY_PATH'"

echo "==> Syncing files..."
tar -C "$ROOT_DIR" -czf - "${TAR_EXCLUDES[@]}" . | \
  ssh "${SSH_OPTS[@]}" "$REMOTE" "tar -xzf - -C '$DEPLOY_PATH'"

echo "==> Running remote Docker deploy..."
ssh "${SSH_OPTS[@]}" "$REMOTE" DEPLOY_PATH="$DEPLOY_PATH" MIN_FREE_MB="$MIN_FREE_MB" 'bash -s' <<'EOF'
set -euo pipefail

cd "$DEPLOY_PATH"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Error: docker compose is not installed on the server."
  exit 1
fi

echo "==> Disk usage before cleanup"
df -h

echo "==> Docker cleanup before rebuild"
docker builder prune -af || true
docker image prune -af || true
docker container prune -f || true
docker volume prune -f || true
docker system prune -af || true

FREE_MB="$(df -Pm . | awk 'NR==2 {print $4}')"
if [[ "$FREE_MB" -lt "$MIN_FREE_MB" ]]; then
  echo "Error: only ${FREE_MB} MB free. Need at least ${MIN_FREE_MB} MB."
  exit 1
fi

echo "==> Stopping existing containers"
$COMPOSE_CMD down --remove-orphans || true

echo "==> Rebuilding containers"
$COMPOSE_CMD up -d --build --remove-orphans

echo "==> Final cleanup"
docker system prune -af || true

echo "==> Container status"
$COMPOSE_CMD ps

echo "==> Recent logs"
$COMPOSE_CMD logs --tail=50
EOF

echo "==> Deploy completed successfully"
