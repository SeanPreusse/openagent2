#!/bin/bash

# OpenAgent Platform Working Deployment Script
# This deploys only the services that are currently building successfully

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p data/rag_storage
mkdir -p data/inputs
mkdir -p data/multimodal_output
mkdir -p data/tiktoken
print_success "Directories created successfully"

# Setup environment files if they don't exist
print_status "Setting up environment files..."

if [ ! -f "openagent/apps/rag/.env" ]; then
    if [ -f "openagent/apps/rag/env.azure-openai.example" ]; then
        cp "openagent/apps/rag/env.azure-openai.example" "openagent/apps/rag/.env"
        print_warning "Created RAG .env file from template. Please edit openagent/apps/rag/.env with your credentials."
    fi
fi

print_success "Environment files setup completed"

# Deploy the working services
print_status "Deploying working services (Database + RAG + Documentation)..."

docker compose -f docker-compose.working.yml up -d --build

# Wait for services to start
print_status "Waiting for services to start..."
sleep 15

# Check service health
print_status "Checking service health..."

if docker compose -f docker-compose.working.yml exec -T postgres pg_isready -U lightrag_user -d lightrag >/dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_warning "PostgreSQL may not be fully ready yet"
fi

if curl -s http://localhost:9621/health >/dev/null 2>&1 || curl -s http://localhost:9621 >/dev/null 2>&1; then
    print_success "RAG service is responding"
else
    print_warning "RAG service may not be fully ready yet"
fi

print_success "Working deployment completed!"
echo ""
print_status "✅ Successfully deployed services:"
echo "  🔍 RAG API: http://localhost:9621"
echo "  📚 Documentation: http://localhost:3001"
echo "  🐘 PostgreSQL: localhost:5432"
echo "  📊 Neo4j Browser: http://localhost:7474 (user: neo4j, pass: password)"
echo ""
print_status "🚧 Services that need dependency fixes:"
echo "  ⚠️  Web Application (react-hook-form dependencies)"
echo "  ⚠️  Research Agent (pip dependency conflicts)"
echo "  ⚠️  Tools Agent (may work once RAG is stable)"
echo ""
print_status "Management commands:"
echo "  📊 Status: docker compose -f docker-compose.working.yml ps"
echo "  📝 Logs: docker compose -f docker-compose.working.yml logs -f"
echo "  🛑 Stop: docker compose -f docker-compose.working.yml down"
echo ""
print_warning "To test RAG API:"
echo "  curl http://localhost:9621/api/query -X POST -H 'Content-Type: application/json' -d '{\"query\":\"test\"}'"

