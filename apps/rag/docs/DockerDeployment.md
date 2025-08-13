# LightRAG Docker Deployment

A lightweight Knowledge Graph Retrieval-Augmented Generation system with multimodal support and multiple LLM backend options, including Azure OpenAI integration.

## 🚀 Installation

### Prerequisites
- Python 3.10+
- Git
- Docker (optional for Docker deployment)

### Native Installation

1. Clone the repository:
```bash
# Linux/MacOS
git clone https://github.com/HKUDS/LightRAG.git
cd LightRAG
```
```powershell
# Windows PowerShell
git clone https://github.com/HKUDS/LightRAG.git
cd LightRAG
```

2. Configure your environment:
```bash
# Linux/MacOS
cp .env.example .env
# Edit .env with your preferred configuration
```
```powershell
# Windows PowerShell
Copy-Item .env.example .env
# Edit .env with your preferred configuration
```

3. Create and activate virtual environment:
```bash
# Linux/MacOS
python -m venv venv
source venv/bin/activate
```
```powershell
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate
```

4. Install dependencies:
```bash
# Both platforms
pip install -r requirements.txt
```

## 🐳 Docker Deployment with Multimodal Support

LightRAG now includes enhanced Docker support with multimodal capabilities for processing Excel, PowerPoint, images, and other document types. The deployment supports various LLM backends including Azure OpenAI.

### 🚀 Quick Start

#### Option 1: Automated Setup (Recommended)
Use the automated startup script that configures everything for you:

```bash
# Make the script executable (if not already)
chmod +x scripts/start_docker_multimodal.sh

# Run the setup script
./scripts/start_docker_multimodal.sh
```

This script will:
- Check Docker availability
- Validate configuration 
- Create necessary directories
- Build and start containers
- Run functionality tests
- Display access information

#### Option 2: Manual Setup

1. **Configure environment**:
```bash
# For Azure OpenAI (recommended)
cp env.azure-openai.example .env

# OR for standard OpenAI
cp env.example .env

# Edit .env with your credentials
nano .env
```

2. **Create data directories**:
```bash
mkdir -p data/{rag_storage,inputs,multimodal_output,tiktoken}
```

3. **Build and start containers**:
```bash
docker compose up -d --build
```

### 🔧 Configuration Options

#### Azure OpenAI Configuration (Recommended)

For Azure OpenAI with multimodal support, configure these variables in `.env`:

```env
# LLM Configuration
LLM_BINDING=azure_openai
LLM_MODEL=gpt-4o
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-08-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Embedding Configuration  
EMBEDDING_BINDING=azure_openai
EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_DIM=3072
AZURE_EMBEDDING_API_KEY=your_azure_openai_api_key_here
AZURE_EMBEDDING_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-large
AZURE_EMBEDDING_API_VERSION=2023-05-15

# Multimodal Configuration
ENABLE_MULTIMODAL=true
VISION_MODEL=gpt-4o
AZURE_VISION_DEPLOYMENT=gpt-4o
MULTIMODAL_OUTPUT_DIR=/app/data/multimodal_output
```

#### Standard OpenAI Configuration

```env
# LLM Configuration
LLM_BINDING=openai
LLM_MODEL=gpt-4o
LLM_BINDING_HOST=https://api.openai.com/v1
LLM_BINDING_API_KEY=your_openai_api_key

# Embedding Configuration
EMBEDDING_BINDING=openai
EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_DIM=3072
EMBEDDING_BINDING_API_KEY=your_openai_api_key
EMBEDDING_BINDING_HOST=https://api.openai.com

# Multimodal Configuration
ENABLE_MULTIMODAL=true
VISION_MODEL=gpt-4o
```

#### Ollama Configuration

```env
# LLM Configuration
LLM_BINDING=ollama
LLM_BINDING_HOST=http://host.docker.internal:11434
LLM_MODEL=mistral
EMBEDDING_BINDING=ollama
EMBEDDING_BINDING_HOST=http://host.docker.internal:11434
EMBEDDING_MODEL=bge-m3

# Note: Multimodal features require vision models (OpenAI/Azure OpenAI recommended)
```

#### Server and Security Configuration

```env
# Server Settings
HOST=0.0.0.0
PORT=9621
WEBUI_TITLE='Azure OpenAI Multimodal Graph KB'

# Security
AUTH_ACCOUNTS='admin:admin123,user1:pass456'
LIGHTRAG_API_KEY=your-secure-api-key-here
TOKEN_SECRET=Your-Key-For-LightRAG-API-Server

# Performance
MAX_ASYNC=4
MAX_PARALLEL_INSERT=2
ENABLE_RERANK=true
```

### 📁 Data Storage Paths

The enhanced Docker setup includes multimodal storage:

```
data/
├── rag_storage/         # RAG data persistence
├── inputs/              # Input documents
├── multimodal_output/   # Processed multimodal content
└── tiktoken/           # Token cache
```

### 🎯 Multimodal Document Support

The Docker deployment now supports processing:

| Document Type | Extensions | Processing Features |
|---------------|------------|-------------------|
| **Excel** | `.xlsx`, `.xls` | Table extraction, formula analysis, chart processing |
| **PowerPoint** | `.pptx`, `.ppt` | Slide content, images, speaker notes |
| **Word** | `.docx`, `.doc` | Text, tables, embedded images |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff` | OCR, chart analysis, diagram understanding |
| **PDFs** | `.pdf` | Enhanced text + image + table extraction |

### 🧪 Testing Your Deployment

#### Automated Testing

```bash
# Run comprehensive functionality tests
python3 scripts/test_docker_multimodal.py

# Quick health check
curl http://localhost:9621/health
```

#### Manual Testing

1. **Access the Web UI**: http://localhost:9621
2. **Upload test documents**: 
   - Try Excel files with data tables
   - Upload PowerPoint presentations
   - Test image files with charts/text
3. **Query your multimodal knowledge base**

#### API Testing Examples

**Upload a multimodal document**:
```bash
curl -X POST "http://localhost:9621/api/upload" \
     -H "Authorization: Bearer your-api-key" \
     -F "file=@your-document.xlsx" \
     -F "description=Financial report Q3"
```

**Query with multimodal support**:
```bash
curl -X POST "http://localhost:9621/api/query" \
     -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"query": "What financial trends are shown in the uploaded Excel files?", "mode": "hybrid"}'
```

### 🛠️ Container Management

#### Viewing Logs
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f lightrag
docker compose logs -f postgres

# View recent logs
docker compose logs --tail 100 lightrag
```

#### Restarting Services
```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart lightrag

# Stop and start (full restart)
docker compose down
docker compose up -d
```

#### Updating the Deployment
```bash
# Pull latest changes and rebuild
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

#### Scaling Services
```bash
# Scale LightRAG service (for load balancing)
docker compose up -d --scale lightrag=3
```

### 🐛 Troubleshooting

#### Common Issues

**1. Server not starting**
```bash
# Check container status
docker compose ps

# Check logs for errors
docker compose logs lightrag

# Common causes:
# - Invalid Azure OpenAI credentials
# - Missing .env configuration
# - Port conflicts
```

**2. Azure OpenAI Connection Issues**
```bash
# Verify your configuration
grep AZURE .env

# Test connectivity (from container)
docker compose exec lightrag curl -I https://your-resource-name.openai.azure.com

# Common issues:
# - Wrong endpoint URL
# - Invalid API key
# - Deployment not found
# - Quota exceeded
```

**3. Multimodal Processing Failures**
```bash
# Check if raganything is installed
docker compose exec lightrag python -c "import raganything; print('RAG-Anything available')"

# Check multimodal output directory
docker compose exec lightrag ls -la /app/data/multimodal_output

# Common issues:
# - Vision model not configured
# - Insufficient permissions
# - Unsupported file format
```

**4. Database Connection Issues**
```bash
# Check PostgreSQL status
docker compose exec postgres pg_isready -U lightrag_user -d lightrag

# Connect to database manually
docker compose exec postgres psql -U lightrag_user -d lightrag

# Reset database (WARNING: destroys all data)
docker compose down -v
docker compose up -d
```

#### Performance Optimization

**Memory and CPU Settings**
```yaml
# Add to docker compose.yml under lightrag service
deploy:
  resources:
    limits:
      memory: 4G
      cpus: '2.0'
    reservations:
      memory: 2G
      cpus: '1.0'
```

**Environment Tuning**
```env
# Adjust concurrency for your hardware
MAX_ASYNC=8
MAX_PARALLEL_INSERT=4
EMBEDDING_FUNC_MAX_ASYNC=16

# Optimize chunk processing
CHUNK_SIZE=1500
CHUNK_OVERLAP_SIZE=200

# Enable caching
ENABLE_LLM_CACHE=true
ENABLE_LLM_CACHE_FOR_EXTRACT=true
```

### 🔒 Security Best Practices

#### Production Deployment
```env
# Use strong authentication
AUTH_ACCOUNTS='admin:strong_password_here'
TOKEN_SECRET=very-long-random-secret-key-here
LIGHTRAG_API_KEY=secure-api-key-for-external-access

# Enable SSL (recommended for production)
SSL=true
SSL_CERTFILE=/path/to/cert.pem
SSL_KEYFILE=/path/to/key.pem

# Restrict CORS (if needed)
CORS_ORIGINS=https://yourdomain.com
```

#### Network Security
```yaml
# Add to docker compose.yml for production
networks:
  lightrag_network:
    driver: bridge
    internal: true  # Isolate from external networks

services:
  lightrag:
    networks:
      - lightrag_network
    ports:
      - "127.0.0.1:9621:9621"  # Bind to localhost only
```

### 📊 Monitoring and Maintenance

#### Health Monitoring
```bash
# Set up health check script
#!/bin/bash
if curl -f http://localhost:9621/health > /dev/null 2>&1; then
    echo "LightRAG is healthy"
else
    echo "LightRAG is down - restarting..."
    docker compose restart lightrag
fi
```

#### Backup Strategy
```bash
# Backup RAG data
docker compose exec lightrag tar -czf /tmp/rag_backup.tar.gz /app/data/rag_storage
docker cp $(docker compose ps -q lightrag):/tmp/rag_backup.tar.gz ./backups/

# Backup PostgreSQL database
docker compose exec postgres pg_dump -U lightrag_user lightrag > ./backups/lightrag_db.sql

# Backup multimodal outputs
docker compose exec lightrag tar -czf /tmp/multimodal_backup.tar.gz /app/data/multimodal_output
docker cp $(docker compose ps -q lightrag):/tmp/multimodal_backup.tar.gz ./backups/
```

### 📚 Additional Resources

- **Multimodal Integration Guide**: [MULTIMODAL_INTEGRATION.md](../MULTIMODAL_INTEGRATION.md)
- **Azure OpenAI Documentation**: [Azure OpenAI Service](https://docs.microsoft.com/azure/cognitive-services/openai/)
- **RAG-Anything Repository**: [github.com/HKUDS/RAG-Anything](https://github.com/HKUDS/RAG-Anything)
- **LightRAG Main Documentation**: [README.md](../README.md)

### API Usage

Once deployed, you can interact with the API at `http://localhost:9621`

Example query using PowerShell:
```powershell
$headers = @{
    "X-API-Key" = "your-api-key"
    "Content-Type" = "application/json"
}
$body = @{
    query = "your question here"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9621/query" -Method Post -Headers $headers -Body $body
```

Example query using curl:
```bash
curl -X POST "http://localhost:9621/query" \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"query": "your question here"}'
```

## 🔒 Security

Remember to:
1. Set a strong API key in production
2. Use SSL in production environments
3. Configure proper network security

## 📦 Updates

To update the Docker container:
```bash
docker compose pull
docker compose up -d --build
```

To update native installation:
```bash
# Linux/MacOS
git pull
source venv/bin/activate
pip install -r requirements.txt
```
```powershell
# Windows PowerShell
git pull
.\venv\Scripts\Activate
pip install -r requirements.txt
```
