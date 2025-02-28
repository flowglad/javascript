#!/bin/bash
# run-tests.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Error handling
set -e
trap cleanup EXIT

cleanup() {
    echo "Cleaning up..."
    docker-compose -f docker_compose.test.yml down
}

echo "Starting postgres..."
docker-compose -f docker_compose.test.yml up -d

# Wait for postgres to be ready
echo "Waiting for postgres to be ready..."
until docker exec $(docker-compose -f docker_compose.test.yml ps -q postgres) pg_isready -U test; do
  sleep 1
done

echo -e "${GREEN}Database is ready${NC}"

# Set DATABASE_URL for subsequent commands
export DATABASE_URL=postgresql://test:test@localhost:5432/test_db

echo "Running migrations..."
npm run migrations:push

echo -e "${GREEN}Migrations complete${NC}"

echo "Running tests..."
npm test

echo -e "${GREEN}Tests complete${NC}"