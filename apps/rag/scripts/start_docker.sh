#!/bin/bash

# LightRAG Docker Startup Script
# Main script to set up and start LightRAG with full multimodal capabilities using Docker Compose V2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Docker is running
check_docker() {
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check for Docker Compose (prefer v2 command)
    if docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose V2 is available"
    elif command_exists docker-compose; then
        print_warning "Using legacy docker-compose command. Consider upgrading to Docker Compose V2"
        # Note: Script already uses 'docker compose' syntax
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        print_error "Install Docker Compose V2 or ensure 'docker compose' command is available"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are available"
}

# Function to check environment configuration
check_env_config() {
    print_status "Checking environment configuration..."
    
    if [[ ! -f ".env" ]]; then
        print_warning ".env file not found"
        
        if [[ -f "env.azure-openai.example" ]]; then
            print_status "Creating .env from Azure OpenAI example..."
            cp env.azure-openai.example .env
            print_warning "Please edit .env file with your Azure OpenAI credentials"
        elif [[ -f "env.example" ]]; then
            print_status "Creating .env from example..."
            cp env.example .env
            print_warning "Please edit .env file with your configuration"
        else
            print_error "No example .env file found"
            exit 1
        fi
    else
        print_success ".env file found"
    fi
    
    # Check for required Azure OpenAI variables
    source .env 2>/dev/null || true
    
    if [[ "$LLM_BINDING" == "azure_openai" ]]; then
        print_status "Checking Azure OpenAI configuration..."
        
        required_vars=(
            "AZURE_OPENAI_API_KEY"
            "AZURE_OPENAI_ENDPOINT"
            "AZURE_OPENAI_DEPLOYMENT"
        )
        
        missing_vars=()
        for var in "${required_vars[@]}"; do
            if [[ -z "${!var}" ]] || [[ "${!var}" == *"your_"* ]] || [[ "${!var}" == *"replace"* ]]; then
                missing_vars+=("$var")
            fi
        done
        
        if [[ ${#missing_vars[@]} -gt 0 ]]; then
            print_error "Missing or placeholder Azure OpenAI configuration:"
            for var in "${missing_vars[@]}"; do
                echo "  - $var"
            done
            print_error "Please update your .env file with actual Azure OpenAI credentials"
            exit 1
        fi
        
        print_success "Azure OpenAI configuration looks good"
    fi
    
    # Check for multimodal configuration
    if [[ "$ENABLE_MULTIMODAL" == "true" ]]; then
        print_success "Multimodal processing is enabled"
    else
        print_warning "Multimodal processing is not explicitly enabled"
        print_status "You can enable it by setting ENABLE_MULTIMODAL=true in .env"
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    directories=(
        "data/rag_storage"
        "data/inputs"
        "data/multimodal_output"
        "data/tiktoken"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            print_status "Created directory: $dir"
        fi
    done
    
    print_success "All directories are ready"
}

# Function to build and start containers
start_containers() {
    print_status "Building and starting containers..."
    
    # Build the image with multimodal support
    print_status "Building LightRAG image with multimodal support..."
    docker compose build --no-cache lightrag
    
    # Start the services
    print_status "Starting services..."
    docker compose --profile api-only up -d
    
    print_success "Containers started successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    timeout=60
    while ! docker compose exec postgres pg_isready -U lightrag_user -d lightrag >/dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [[ $timeout -le 0 ]]; then
            print_error "PostgreSQL failed to start within 60 seconds"
            exit 1
        fi
    done
    print_success "PostgreSQL is ready"
    
    # Wait for LightRAG
    print_status "Waiting for LightRAG server..."
    timeout=120
    while ! curl -s http://localhost:9621/health >/dev/null 2>&1; do
        sleep 5
        timeout=$((timeout - 5))
        if [[ $timeout -le 0 ]]; then
            print_error "LightRAG server failed to start within 120 seconds"
            print_status "Checking logs..."
            docker compose logs lightrag | tail -20
            exit 1
        fi
        print_status "Still waiting for LightRAG server..."
    done
    print_success "LightRAG server is ready"
}

# Function to run tests
run_tests() {
    print_status "Running multimodal functionality tests..."
    
    if [[ -f "scripts/test_docker_multimodal.py" ]]; then
        if command_exists python3; then
            python3 scripts/test_docker_multimodal.py || {
                print_warning "Some tests failed, but the server might still be functional"
            }
        else
            print_warning "Python3 not found, skipping automated tests"
        fi
    else
        print_warning "Test script not found, skipping automated tests"
    fi
}

# Function to show status and next steps
show_status() {
    print_success "LightRAG with multimodal support is now running!"
    echo
    echo "🔗 Access points:"
    echo "  - Web UI: http://localhost:9621"
    echo "  - API: http://localhost:9621/api"
    echo "  - Health: http://localhost:9621/health"
    echo
    echo "📁 Volume mappings:"
    echo "  - Input files: ./data/inputs"
    echo "  - RAG storage: ./data/rag_storage"
    echo "  - Multimodal output: ./data/multimodal_output"
    echo
    echo "🎯 Next steps:"
    echo "  1. Open the Web UI to upload and process documents"
    echo "  2. Try uploading Excel, PowerPoint, or image files"
    echo "  3. Query your multimodal knowledge base"
    echo
    echo "📖 Documentation:"
    echo "  - Multimodal guide: ./MULTIMODAL_INTEGRATION.md"
    echo "  - Docker guide: ./docs/DockerDeployment.md"
    echo
    echo "🛠️  Management commands:"
    echo "  - View logs: docker compose logs -f lightrag"
    echo "  - Stop services: docker compose down"
    echo "  - Restart: docker compose restart"
    echo
    
    if [[ "$LLM_BINDING" == "azure_openai" ]]; then
        echo "☁️  Azure OpenAI configuration detected"
        echo "  - Make sure your Azure OpenAI deployments are active"
        echo "  - Check quota and rate limits if you encounter issues"
        echo
    fi
}

# Main function
main() {
    echo "🚀 LightRAG Docker Startup"
    echo "=========================="
    echo
    
    # Parse command line arguments
    SKIP_TESTS=false
    FORCE_REBUILD=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --force-rebuild)
                FORCE_REBUILD=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-tests      Skip running functionality tests"
                echo "  --force-rebuild   Force rebuild of Docker images"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Run setup steps
    check_docker
    check_env_config
    create_directories
    
    if [[ "$FORCE_REBUILD" == "true" ]]; then
        print_status "Force rebuilding containers..."
        docker compose down --volumes || true
        docker compose build --no-cache
    fi
    
    start_containers
    wait_for_services
    
    if [[ "$SKIP_TESTS" != "true" ]]; then
        run_tests
    fi
    
    show_status
    
    print_success "Setup complete! LightRAG with multimodal support is ready to use."
}

# Run main function
main "$@"
