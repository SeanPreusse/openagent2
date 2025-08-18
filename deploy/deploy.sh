#!/bin/bash

# OpenAgent Platform Production Deployment Script
# Usage: ./deploy.sh [options]
# Options:
#   --production    Deploy with nginx reverse proxy
#   --rebuild       Force rebuild all Docker images
#   --stop          Stop all services
#   --logs          Show logs for all services
#   --status        Show status of all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
    
    # Use 'docker compose' if available, fallback to 'docker-compose'
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create data directories
    mkdir -p data/rag_storage
    mkdir -p data/inputs
    mkdir -p data/multimodal_output
    mkdir -p data/tiktoken
    
    # Create SSL directory for nginx (if needed)
    mkdir -p ssl
    
    print_success "Directories created successfully"
}

# Function to setup environment files
setup_env_files() {
    print_status "Setting up environment files..."
    
    # Main deploy environment file for docker-compose
    if [ ! -f ".env" ]; then
        cat > ".env" << EOF
# OpenAgent Platform - Docker Compose Environment Variables

# =============================================================================
# Database Configuration
# =============================================================================

# PostgreSQL Configuration
POSTGRES_DB=lightrag
POSTGRES_USER=lightrag_user
POSTGRES_PASSWORD=lightrag_password
POSTGRES_HOST_PORT=5433
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DATABASE=lightrag

# Neo4j Configuration
NEO4J_AUTH=neo4j/neo4j_password
NEO4J_dbms_security_auth__enabled=false
NEO4J_server_memory_pagecache_size=512M
NEO4J_server_memory_heap_initial__size=512m
NEO4J_server_memory_heap_max__size=2G
NEO4J_PLUGINS=["apoc"]
NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j_password

# =============================================================================
# RAG Service Configuration
# =============================================================================

TIKTOKEN_CACHE_DIR=/app/data/tiktoken
MULTIMODAL_OUTPUT_DIR=/app/data/multimodal_output

# =============================================================================
# Web Application Configuration
# =============================================================================

# Base URLs
NEXT_PUBLIC_BASE_API_URL=http://localhost:3000
NEXT_PUBLIC_RAG_API_URL=http://localhost:9621

# Supabase Authentication (REQUIRED - Get from your Supabase project)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# LangSmith Configuration (Optional)
NEXT_PUBLIC_USE_LANGSMITH_AUTH=false
LANGSMITH_API_KEY=your_langsmith_api_key_here

# MCP Server Configuration (Optional)
NEXT_PUBLIC_MCP_AUTH_REQUIRED=false
NEXT_PUBLIC_MCP_SERVER_URL=your_mcp_server_url_here

# Deployments Configuration
NEXT_PUBLIC_DEPLOYMENTS=local

# =============================================================================
# Production Configuration (Uncomment for production deployment)
# =============================================================================

# NEXT_PUBLIC_BASE_API_URL=https://yourdomain.com
# NEXT_PUBLIC_RAG_API_URL=https://yourdomain.com/api/rag
EOF
        print_warning "Created deploy .env file. Please edit .env with your Supabase credentials."
    fi
    
    # RAG environment file
    if [ ! -f "../apps/rag/.env" ]; then
        if [ -f "../apps/rag/env.azure-openai.example" ]; then
            cp "../apps/rag/env.azure-openai.example" "../apps/rag/.env"
            print_warning "Created RAG .env file from template. Please edit ../apps/rag/.env with your credentials."
        else
            print_warning "RAG .env template not found. You may need to create ../apps/rag/.env manually."
        fi
    fi
    
    # Web environment file
    if [ ! -f "../apps/web/.env.local" ]; then
        cat > "../apps/web/.env.local" << EOF
# OpenAgent Platform Web Configuration
# Use Docker service names for internal communication
NEXT_PUBLIC_RAG_API_URL=http://rag:9621
NEXT_PUBLIC_RESEARCH_AGENT_URL=http://localhost:2025
NEXT_PUBLIC_TOOLS_AGENT_URL=http://localhost:2026

# Add your other environment variables here
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EOF
        print_warning "Created web .env.local file. Please add your Supabase credentials and other required variables."
    fi
    
    # Agent environment files
    for agent in "open_deep_research" "oap-langgraph-tools-agent"; do
        if [ ! -f "../apps/agents/$agent/.env" ]; then
            cat > "../apps/agents/$agent/.env" << EOF
# $agent Environment Configuration

# Supabase Authentication (Required for custom auth)
# Get these from your Supabase project settings
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_role_key_here

# LLM API Keys (Required - choose one or more)
# OpenAI
# OPENAI_API_KEY=your_openai_key_here

# Azure OpenAI
# AZURE_OPENAI_API_KEY=your_azure_openai_key_here
# AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint_here
# AZURE_OPENAI_API_VERSION=2024-08-01-preview

# Anthropic
# ANTHROPIC_API_KEY=your_anthropic_key_here

# LangSmith (Optional - for tracing)
# LANGSMITH_API_KEY=your_langsmith_key_here
# LANGSMITH_TRACING=true

# Other Configuration
# Add any other environment variables your tools might need
EOF
            print_warning "Created $agent .env file. Please add your Supabase credentials and API keys."
        fi
    done
    
    print_success "Environment files setup completed"
}

# Function to show service status
show_status() {
    print_status "Checking service status..."
    $DOCKER_COMPOSE ps
}

# Function to show logs
show_logs() {
    print_status "Showing logs for all services..."
    $DOCKER_COMPOSE logs -f
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    $DOCKER_COMPOSE down -v
    print_success "All services stopped"
}

# Function to deploy services
deploy_services() {
    local REBUILD=$1
    local PRODUCTION=$2
    
    print_status "Starting OpenAgent Platform deployment..."
    
    # Build arguments
    BUILD_ARGS=""
    if [ "$REBUILD" = true ]; then
        BUILD_ARGS="--build --no-cache"
        print_status "Rebuilding all Docker images..."
    fi
    
    # Compose file arguments
    COMPOSE_FILES="-f docker-compose.yml"
    
    # Deploy based on mode
    if [ "$PRODUCTION" = true ]; then
        print_status "Deploying in production mode with nginx..."
        # Use separate compose file for production with nginx
        COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
        $DOCKER_COMPOSE $COMPOSE_FILES up -d $BUILD_ARGS
    else
        print_status "Deploying in development mode..."
        $DOCKER_COMPOSE $COMPOSE_FILES up -d $BUILD_ARGS
    fi
    
    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check service health
    print_status "Checking service health..."
    
    # Check PostgreSQL
    if $DOCKER_COMPOSE exec -T postgres pg_isready -U lightrag_user -d lightrag >/dev/null 2>&1; then
        print_success "PostgreSQL is ready"
    else
        print_warning "PostgreSQL may not be fully ready yet"
    fi
    
    # Check web service
    if curl -s http://localhost:3000/health >/dev/null 2>&1 || curl -s http://localhost:3000 >/dev/null 2>&1; then
        print_success "Web application is responding"
    else
        print_warning "Web application may not be fully ready yet"
    fi
    
    # Check RAG service
    if curl -s http://localhost:9621/health >/dev/null 2>&1 || curl -s http://localhost:9621 >/dev/null 2>&1; then
        print_success "RAG service is responding"
    else
        print_warning "RAG service may not be fully ready yet"
    fi
    
    print_success "Deployment completed!"
    print_status "Services are available at:"
    echo "  🌐 Web Application: http://localhost:3000"
    echo "  📚 Documentation: http://localhost:3001"
    echo "  🔍 RAG API: http://localhost:9621"
    echo "  🔬 Research Agent: http://localhost:2025"
    echo "  🛠️  Tools Agent: http://localhost:2026"
    echo "  🐘 PostgreSQL: localhost:5432"
    echo "  📊 Neo4j Browser: http://localhost:7474"
    
    if [ "$PRODUCTION" = true ]; then
        echo "  🚀 Production (nginx): http://localhost"
    fi
    
    echo ""
    print_status "Management commands:"
    echo "  📊 Status: ./deploy.sh --status"
    echo "  📝 Logs: ./deploy.sh --logs"
    echo "  🛑 Stop: ./deploy.sh --stop"
}

# Main function
main() {
    local REBUILD=false
    local PRODUCTION=false
    local STOP=false
    local LOGS=false
    local STATUS=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --production)
                PRODUCTION=true
                shift
                ;;
            --rebuild)
                REBUILD=true
                shift
                ;;
            --stop)
                STOP=true
                shift
                ;;
            --logs)
                LOGS=true
                shift
                ;;
            --status)
                STATUS=true
                shift
                ;;
            -h|--help)
                echo "OpenAgent Platform Deployment Script"
                echo ""
                echo "Usage: $0 [options]"
                echo ""
                echo "Options:"
                echo "  --production    Deploy with nginx reverse proxy"
                echo "  --rebuild       Force rebuild all Docker images"
                echo "  --stop          Stop all services"
                echo "  --logs          Show logs for all services"
                echo "  --status        Show status of all services"
                echo "  -h, --help      Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                    # Deploy in development mode"
                echo "  $0 --production       # Deploy in production mode"
                echo "  $0 --rebuild          # Rebuild and deploy"
                echo "  $0 --stop             # Stop all services"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information."
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Execute based on options
    if [ "$STOP" = true ]; then
        stop_services
    elif [ "$LOGS" = true ]; then
        show_logs
    elif [ "$STATUS" = true ]; then
        show_status
    else
        create_directories
        setup_env_files
        deploy_services $REBUILD $PRODUCTION
    fi
}

# Run main function with all arguments
main "$@"
