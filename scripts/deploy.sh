#!/bin/bash
# Rolling update deployment script for FurinaKit
# Usage: ./scripts/deploy.sh [image_tag]
# Example: ./scripts/deploy.sh ghcr.io/jvwangyi/furinakit:latest

set -e

IMAGE=${1:-ghcr.io/jvwangyi/furinakit:latest}
COMPOSE_FILE="docker-compose.yml"
HEALTH_URL="http://localhost:3000/api/health"
MAX_WAIT=60

echo "🚀 Starting rolling update..."
echo "   Image: $IMAGE"

# Step 1: Pull the new image
echo "📦 Pulling new image..."
docker pull "$IMAGE"

# Step 2: Update the image in compose file
echo "🔄 Updating service image..."
export FURINAKIT_IMAGE="$IMAGE"

# Step 3: Start new container alongside old one
echo "🟢 Starting new container..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps --scale furinakit=2 furinakit

# Step 4: Wait for new container to be healthy
echo "⏳ Waiting for new container health check..."
NEW_CONTAINER=$(docker compose -f "$COMPOSE_FILE" ps -q furinakit | tail -1)
echo "   Container: $NEW_CONTAINER"

WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$NEW_CONTAINER" 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "healthy" ]; then
        echo "✅ New container is healthy!"
        break
    fi
    echo "   Status: $STATUS (${WAITED}s/${MAX_WAIT}s)"
    sleep 5
    WAITED=$((WAITED + 5))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "❌ New container failed health check after ${MAX_WAIT}s"
    echo "🔙 Rolling back..."
    docker compose -f "$COMPOSE_FILE" up -d --no-deps --scale furinakit=1 furinakit
    exit 1
fi

# Step 5: Remove old container (keep the new healthy one)
echo "🔴 Stopping old container..."
OLD_CONTAINER=$(docker compose -f "$COMPOSE_FILE" ps -q furinakit | head -1)
if [ "$OLD_CONTAINER" != "$NEW_CONTAINER" ]; then
    docker stop "$OLD_CONTAINER"
    docker rm "$OLD_CONTAINER"
fi

# Step 6: Ensure only 1 instance running
echo "🧹 Cleaning up..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps --scale furinakit=1 furinakit

# Step 7: Reload nginx to pick up any changes
echo "🔄 Reloading nginx..."
docker compose -f "$COMPOSE_FILE" exec -T nginx nginx -s reload 2>/dev/null || true

echo ""
echo "✅ Rolling update complete!"
echo "   Current version: $IMAGE"
