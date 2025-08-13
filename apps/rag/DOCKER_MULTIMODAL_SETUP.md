# 🐳 LightRAG Docker Multimodal Setup with Azure OpenAI

Complete guide for deploying LightRAG with multimodal capabilities using Docker and Azure OpenAI.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Azure OpenAI resource with GPT-4o and text-embedding-3-large deployments
- Git (to clone the repository)

### One-Command Setup

```bash
# Clone, configure, and start with automated setup
git clone https://github.com/HKUDS/LightRAG.git
cd LightRAG
chmod +x scripts/start_docker_multimodal.sh
./scripts/start_docker_multimodal.sh
```

This script will:
1. ✅ Check Docker availability
2. ✅ Create .env from Azure OpenAI example
3. ✅ Set up data directories
4. ✅ Build containers with multimodal support
5. ✅ Start services (PostgreSQL + LightRAG)
6. ✅ Run functionality tests
7. ✅ Display access information

## 📋 What's Included

### 🔧 Docker Enhancements
- **Updated Dockerfile**: Includes RAG-Anything and multimodal dependencies
- **Enhanced docker compose.yml**: Multimodal volume mappings and environment
- **Automated scripts**: Setup, testing, and validation tools
- **Health checks**: Built-in monitoring and troubleshooting

### 🎯 Multimodal Support
- **Excel Processing**: `.xlsx`, `.xls` files with table and chart extraction
- **PowerPoint Processing**: `.pptx`, `.ppt` files with slide content and images
- **Word Processing**: `.docx`, `.doc` files with text, tables, and images
- **Image Analysis**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff`, `.svg` with OCR and chart analysis
- **Enhanced PDF**: Better text, image, and table extraction

### ☁️ Azure OpenAI Integration
- **Multiple model support**: GPT-4o for text and vision, text-embedding-3-large for embeddings
- **Complete configuration**: LLM, embedding, and vision models all configured
- **Environment templates**: Pre-configured .env examples
- **Error handling**: Graceful fallback and comprehensive troubleshooting

## 📁 Project Structure

```
openagent2/openagent/apps/rag/
├── Dockerfile                          # Enhanced with multimodal dependencies
├── docker compose.yml                  # Updated with multimodal volumes
├── env.azure-openai.example           # Azure OpenAI configuration template
├── env.example                        # Updated with multimodal options
├── lightrag/
│   ├── multimodal.py                  # Core multimodal integration
│   └── __init__.py                    # Exports multimodal components
├── examples/
│   ├── multimodal_example.py          # Complete usage examples
│   └── install_multimodal.py          # Installation verification
├── scripts/
│   ├── start_docker_multimodal.sh     # Automated setup script
│   ├── test_docker_multimodal.py      # Docker functionality tests
│   └── validate_multimodal_integration.py  # Integration validation
├── docs/
│   └── DockerDeployment.md           # Enhanced Docker documentation
├── MULTIMODAL_INTEGRATION.md         # Comprehensive multimodal guide
└── DOCKER_MULTIMODAL_SETUP.md        # This file
```

## ⚙️ Configuration

### Azure OpenAI Setup

1. **Create Azure OpenAI resource** in Azure Portal
2. **Deploy required models**:
   - `gpt-4o` (for LLM and vision)
   - `text-embedding-3-large` (for embeddings)
3. **Get credentials**:
   - API key
   - Endpoint URL
   - Deployment names

### Environment Configuration

Copy the Azure OpenAI template and configure:

```bash
cp env.azure-openai.example .env
```

Edit `.env` with your credentials:

```env
# Azure OpenAI LLM Configuration
LLM_BINDING=azure_openai
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Azure OpenAI Embedding Configuration
EMBEDDING_BINDING=azure_openai
AZURE_EMBEDDING_API_KEY=your_azure_openai_api_key_here
AZURE_EMBEDDING_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-large

# Multimodal Configuration
ENABLE_MULTIMODAL=true
VISION_MODEL=gpt-4o
AZURE_VISION_DEPLOYMENT=gpt-4o
```

## 🧪 Testing and Validation

### Automated Testing

```bash
# Test Docker functionality
python3 scripts/test_docker_multimodal.py

# Validate complete integration
python3 scripts/validate_multimodal_integration.py

# Check installation
python3 examples/install_multimodal.py
```

### Manual Testing

1. **Access Web UI**: http://localhost:9621
2. **Upload test files**:
   - Excel spreadsheet with data
   - PowerPoint presentation
   - Images with charts or text
3. **Query multimodal content**:
   - "What data is in the uploaded Excel file?"
   - "Summarize the PowerPoint presentation"
   - "What does the chart show?"

### API Testing

```bash
# Health check
curl http://localhost:9621/health

# Upload multimodal document
curl -X POST "http://localhost:9621/api/upload" \
     -H "Authorization: Bearer your-api-key" \
     -F "file=@your-document.xlsx"

# Query multimodal content
curl -X POST "http://localhost:9621/api/query" \
     -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"query": "What financial trends are shown?", "mode": "hybrid"}'
```

## 🔧 Management Commands

### Container Operations
```bash
# View logs
docker compose logs -f lightrag

# Restart services
docker compose restart

# Stop everything
docker compose down

# Full rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Data Management
```bash
# Backup data
docker compose exec lightrag tar -czf /tmp/backup.tar.gz /app/data
docker cp $(docker compose ps -q lightrag):/tmp/backup.tar.gz ./

# Check storage usage
docker compose exec lightrag du -sh /app/data/*

# Clear cache (if needed)
docker compose exec lightrag rm -rf /app/data/tiktoken/*
```

## 🐛 Troubleshooting

### Common Issues

**1. Container won't start**
```bash
# Check status
docker compose ps

# View logs
docker compose logs lightrag

# Common causes: Invalid Azure credentials, port conflicts
```

**2. Azure OpenAI connection errors**
```bash
# Test connectivity
docker compose exec lightrag curl -I https://your-resource-name.openai.azure.com

# Verify configuration
grep AZURE .env

# Common issues: Wrong endpoint, invalid API key, quota exceeded
```

**3. Multimodal processing failures**
```bash
# Check RAG-Anything installation
docker compose exec lightrag python -c "import raganything; print('OK')"

# Check permissions
docker compose exec lightrag ls -la /app/data/multimodal_output

# Common issues: Vision model not configured, file format not supported
```

**4. Performance issues**
```bash
# Monitor resources
docker stats

# Adjust concurrency in .env
MAX_ASYNC=8
MAX_PARALLEL_INSERT=4

# Check PostgreSQL performance
docker compose exec postgres psql -U lightrag_user -d lightrag -c "SELECT * FROM pg_stat_activity;"
```

## 📊 Performance Optimization

### Resource Allocation
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

### Environment Tuning
```env
# Concurrency settings
MAX_ASYNC=8
MAX_PARALLEL_INSERT=4
EMBEDDING_FUNC_MAX_ASYNC=16

# Caching
ENABLE_LLM_CACHE=true
ENABLE_LLM_CACHE_FOR_EXTRACT=true

# Chunk optimization
CHUNK_SIZE=1500
CHUNK_OVERLAP_SIZE=200
```

## 🔒 Security

### Production Settings
```env
# Strong authentication
AUTH_ACCOUNTS='admin:strong_password_here'
TOKEN_SECRET=very-long-random-secret-key-here
LIGHTRAG_API_KEY=secure-api-key-for-external-access

# SSL (recommended)
SSL=true
SSL_CERTFILE=/path/to/cert.pem
SSL_KEYFILE=/path/to/key.pem

# CORS restrictions
CORS_ORIGINS=https://yourdomain.com
```

### Network Security
```yaml
# Production docker compose.yml additions
networks:
  lightrag_network:
    driver: bridge

services:
  lightrag:
    networks:
      - lightrag_network
    ports:
      - "127.0.0.1:9621:9621"  # Localhost only
```

## 📚 Documentation Links

- **Comprehensive Multimodal Guide**: [MULTIMODAL_INTEGRATION.md](./MULTIMODAL_INTEGRATION.md)
- **Docker Deployment Details**: [docs/DockerDeployment.md](./docs/DockerDeployment.md)
- **Main LightRAG Documentation**: [README.md](./README.md)
- **RAG-Anything Repository**: [github.com/HKUDS/RAG-Anything](https://github.com/HKUDS/RAG-Anything)
- **Azure OpenAI Documentation**: [docs.microsoft.com/azure/cognitive-services/openai/](https://docs.microsoft.com/azure/cognitive-services/openai/)

## 🎯 Next Steps

1. **Deploy to production**:
   - Configure SSL certificates
   - Set up monitoring and alerting
   - Implement backup strategy

2. **Scale the deployment**:
   - Add load balancer
   - Scale PostgreSQL
   - Implement caching layer

3. **Advanced features**:
   - Custom vision models
   - Specialized document processors
   - Integration with external systems

## 🆘 Support

If you encounter issues:

1. **Check logs**: `docker compose logs -f`
2. **Run validation**: `python3 scripts/validate_multimodal_integration.py`
3. **Review documentation**: See links above
4. **Community support**: [Discord](https://discord.gg/yF2MmDJyGJ)

---

**🎉 You now have a complete LightRAG deployment with multimodal capabilities and Azure OpenAI integration!**

Start by uploading Excel files, PowerPoint presentations, or images, then query your enhanced knowledge base with natural language.
