# 🚀 LightRAG Quick Start Guide

Get LightRAG with multimodal support running in minutes using Docker Compose V2.

## Prerequisites

- Docker Desktop with Docker Compose V2
- Azure OpenAI resource (recommended) or OpenAI API key
- 4GB+ RAM available

## One-Command Setup

```bash
# 1. Clone and navigate
git clone <repository-url>
cd lightrag

# 2. Configure credentials
cp env.azure-openai.example .env
# Edit .env with your Azure OpenAI credentials

# 3. Start everything
./scripts/start_docker.sh
```

That's it! 🎉

## What the Script Does

✅ **Validates Docker setup** (checks for Docker Compose V2)  
✅ **Configures environment** (creates .env from template if needed)  
✅ **Creates directories** (data, storage, multimodal output)  
✅ **Builds containers** (LightRAG + PostgreSQL with multimodal support)  
✅ **Starts services** (health checks and monitoring)  
✅ **Runs tests** (validates everything is working)  
✅ **Shows access info** (URLs and next steps)  

## Access Your LightRAG

After successful startup:

- **Web UI**: http://localhost:9621
- **API**: http://localhost:9621/api
- **Health**: http://localhost:9621/health

## Test Multimodal Upload

1. Open Web UI at http://localhost:9621
2. Upload test files:
   - Excel spreadsheet (`.xlsx`)
   - PowerPoint presentation (`.pptx`)
   - Images with charts (`.png`, `.jpg`)
3. Query: *"What data is shown in the uploaded files?"*

## Configuration Options

### Azure OpenAI (Recommended)
```env
# Core settings
LLM_BINDING=azure_openai
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Embeddings
EMBEDDING_BINDING=azure_openai
AZURE_EMBEDDING_DEPLOYMENT=text-embedding-3-large

# Multimodal
ENABLE_MULTIMODAL=true
VISION_MODEL=gpt-4o
```

### Standard OpenAI
```env
LLM_BINDING=openai
LLM_BINDING_API_KEY=your_openai_api_key
EMBEDDING_BINDING=openai
EMBEDDING_BINDING_API_KEY=your_openai_api_key
ENABLE_MULTIMODAL=true
VISION_MODEL=gpt-4o
```

## Script Options

```bash
# Normal startup
./scripts/start_docker.sh

# Skip functionality tests (faster)
./scripts/start_docker.sh --skip-tests

# Force rebuild images (if you updated code)
./scripts/start_docker.sh --force-rebuild

# Help
./scripts/start_docker.sh --help
```

## Supported File Types

| Type | Formats | Capabilities |
|------|---------|--------------|
| **Images** | PNG, JPG, GIF, WebP, BMP, TIFF, SVG | OCR, chart analysis, diagram understanding |
| **Office** | DOCX, XLSX, PPTX (and legacy DOC, XLS, PPT) | Text, tables, images, formulas, charts |
| **Documents** | PDF, TXT, MD, HTML | Text extraction, structure preservation |

## Management Commands

```bash
# View logs
docker compose logs -f lightrag

# Restart services  
docker compose restart

# Stop everything
docker compose down

# Update and rebuild
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Troubleshooting

### Common Issues

**Container won't start**
```bash
docker compose ps
docker compose logs lightrag
```

**Azure OpenAI connection issues**
```bash
# Test connectivity
curl -I https://your-resource.openai.azure.com

# Check configuration
grep AZURE .env
```

**File upload not working**
- Check supported file types above
- Verify file size (< 100MB recommended)
- Check browser console for errors

### Get Help

- **Logs**: `docker compose logs -f`
- **Health**: http://localhost:9621/health
- **Validation**: `python3 scripts/validate_multimodal_integration.py`

## Advanced Setup

For production deployment, load balancing, or custom configurations, see:

- [Complete Docker Guide](./docs/DockerDeployment.md)
- [Multimodal Integration Guide](./MULTIMODAL_INTEGRATION.md)
- [Azure OpenAI Setup](./env.azure-openai.example)

---

**Ready to explore multimodal RAG? Start uploading Excel files, images, and presentations!** 🎯



