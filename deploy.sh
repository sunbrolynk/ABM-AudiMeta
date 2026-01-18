#!/bin/bash
# ===========================================
# AudiMeta Deployment Script
# ===========================================
# Run: chmod +x deploy.sh && ./deploy.sh
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "\n${BLUE}=== $1 ===${NC}\n"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# ===========================================
print_header "Pre-flight Checks"
# ===========================================

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker not installed"
    exit 1
fi
print_success "Docker: $(docker --version | cut -d' ' -f3)"

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose not available"
    exit 1
fi
print_success "Docker Compose: $(docker compose version | cut -d' ' -f4)"

# Check Docker running
if ! docker info &> /dev/null; then
    print_error "Docker daemon not running"
    exit 1
fi
print_success "Docker daemon running"

# ===========================================
print_header "Environment Setup"
# ===========================================

# Check .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    echo "Create it with: cp .env.example .env"
    exit 1
fi
print_success ".env file exists"

# Check APP_KEY
if grep -q "GENERATE_ME" .env || grep -q "APP_KEY=$" .env; then
    print_warning "APP_KEY not set. Generating..."
    NEW_KEY=$(openssl rand -hex 32)
    sed -i "s/APP_KEY=.*/APP_KEY=${NEW_KEY}/" .env
    print_success "Generated APP_KEY: ${NEW_KEY:0:16}..."
fi

# Check DB_PASSWORD
if grep -q "CHANGE_THIS" .env; then
    print_warning "DB_PASSWORD using placeholder!"
    read -p "Enter a secure database password: " DB_PASS
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${DB_PASS}/" .env
    print_success "DB_PASSWORD updated"
fi

# Verify HOST is 0.0.0.0
if grep -q "HOST=localhost" .env; then
    print_warning "Changing HOST from localhost to 0.0.0.0 (required for Docker)"
    sed -i "s/HOST=localhost/HOST=0.0.0.0/" .env
    print_success "HOST updated to 0.0.0.0"
fi

# ===========================================
print_header "Building & Starting Containers"
# ===========================================

# Stop existing
echo "Stopping existing containers..."
docker compose down 2>/dev/null || true

# Build
echo "Building images (this may take 2-5 minutes)..."
docker compose build

# Start
echo "Starting containers..."
docker compose up -d

# ===========================================
print_header "Waiting for Services"
# ===========================================

echo "Waiting for PostgreSQL..."
RETRIES=30
until docker compose exec -T postgres pg_isready -U audimeta > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    printf "."
    RETRIES=$((RETRIES-1))
    sleep 2
done
echo ""

if [ $RETRIES -eq 0 ]; then
    print_error "PostgreSQL failed to start"
    docker compose logs postgres | tail -20
    exit 1
fi
print_success "PostgreSQL ready"

echo "Waiting for Redis..."
RETRIES=15
until docker compose exec -T redis redis-cli ping > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    printf "."
    RETRIES=$((RETRIES-1))
    sleep 1
done
echo ""
print_success "Redis ready"

echo "Waiting for AudiMeta (may take up to 60s for migrations)..."
RETRIES=60
until curl -s http://localhost:3333/ > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
    printf "."
    RETRIES=$((RETRIES-1))
    sleep 2
done
echo ""

if [ $RETRIES -eq 0 ]; then
    print_warning "AudiMeta may still be starting. Check logs:"
    echo "  docker compose logs -f audimeta"
else
    print_success "AudiMeta ready"
fi

# ===========================================
print_header "Status"
# ===========================================

docker compose ps

# ===========================================
print_header "Testing API"
# ===========================================

echo "Testing book lookup..."
RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:3333/us/book/B002V02KPU" 2>/dev/null | tail -1)

if [ "$RESPONSE" == "200" ]; then
    print_success "API responding! Book lookup returned HTTP 200"
elif [ "$RESPONSE" == "000" ]; then
    print_warning "Could not connect to API (may still be starting)"
else
    print_warning "API returned HTTP $RESPONSE"
fi

# ===========================================
print_header "Deployment Complete!"
# ===========================================

HOST_IP=$(hostname -I | awk '{print $1}')

echo -e "${GREEN}AudiMeta is running!${NC}"
echo ""
echo "Access points:"
echo "  Local:   http://localhost:3333"
echo "  Network: http://${HOST_IP}:3333"
echo ""
echo "Test commands:"
echo "  curl 'http://localhost:3333/us/book/B002V02KPU'"
echo "  curl 'http://localhost:3333/us/search?title=Harry%20Potter'"
echo ""
echo "Management:"
echo "  Logs:      docker compose logs -f"
echo "  Stop:      docker compose down"
echo "  Restart:   docker compose restart"
echo "  Shell:     docker compose exec audimeta sh"
echo "  DB Shell:  docker compose exec postgres psql -U audimeta -d audimeta"
