# LightRAG Docker with Integrated WebUI 🐳🌐

This directory contains everything needed to build and run LightRAG as a Docker container with an integrated WebUI for multimodal document processing.

## 🎯 Features

### 📊 **LightRAG API Server**
- Complete RAG (Retrieval-Augmented Generation) system
- RESTful API for document upload and querying
- Support for multiple storage backends (PostgreSQL, Neo4j, etc.)

### 🖥️ **Integrated WebUI** 
- Built-in web interface accessible at `/webui/`
- Document upload and management
- Graph visualization
- Query interface
- Real-time processing status

### 🔍 **Multimodal Document Processing**
- **Images**: JPG, PNG, GIF, WebP, BMP, TIFF, SVG with Azure OpenAI GPT-4o vision analysis
- **Documents**: PDF, TXT, MD, HTML with text extraction
- **Office Files**: 
  - Word (DOC, DOCX) - Text extraction
  - PowerPoint (PPT, PPTX) - Text + image analysis with GPT-4o vision
  - Excel (XLS, XLSX) - Multi-sheet data processing

### 🧠 **AI Processing**
- Azure OpenAI GPT-4o for vision analysis and text processing
- Vector embeddings with text-embedding-3-large
- Graph-based knowledge extraction
- Entity and relationship mining

## 🚀 Quick Start

### 1. Build the Docker Image

```bash
# Build LightRAG with integrated WebUI
./scripts/build_docker_webui.sh
```

### 2. Run Standalone (File-based Storage)

```bash
# Simple standalone container
docker run -p 9621:9621 -v $(pwd)/data:/app/data lightrag:webui
```

**Access Points:**
- 📊 **API**: http://localhost:9621
- 🖥️ **WebUI**: http://localhost:9621/webui/
- 📋 **Health**: http://localhost:9621/health

### 3. Run with Docker Compose (Production)

For production with PostgreSQL and Neo4j:

```bash
# Start databases
docker compose up -d postgres neo4j

# Start LightRAG with WebUI (alternative service)
docker compose --profile webui up -d lightrag-webui
```

**Access Points:**
- 📊 **API**: http://localhost:9622 (different port to avoid conflicts)
- 🖥️ **WebUI**: http://localhost:9622/webui/
- 📋 **Health**: http://localhost:9622/health

## 🔧 Configuration

### Environment Variables

Create `.env` file with your Azure OpenAI credentials:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-instance.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large

# Storage Configuration (for Docker Compose)
LIGHTRAG_KV_STORAGE=PGKVStorage
LIGHTRAG_DOC_STATUS_STORAGE=PGDocStatusStorage
LIGHTRAG_GRAPH_STORAGE=Neo4JStorage
LIGHTRAG_VECTOR_STORAGE=PGVectorStorage

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=lightrag_user
POSTGRES_PASSWORD=lightrag_password
POSTGRES_DATABASE=lightrag

NEO4J_URI=bolt://neo4j:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

### Ports

- **9621**: Default LightRAG port (standalone)
- **9622**: WebUI service port (Docker Compose)
- **5432**: PostgreSQL
- **7474/7687**: Neo4j browser/bolt

## 📁 Data Volumes

The container uses the following directories:

```
/app/data/
├── rag_storage/     # Main LightRAG storage
├── inputs/          # Input documents
├── multimodal_output/ # Processed multimodal content
└── tiktoken/        # Token cache
```

Mount your local data directory:
```bash
-v $(pwd)/data:/app/data
```

## 🧪 Testing

Test the built image:

```bash
./scripts/test_docker_webui.sh
```

This script:
- Starts a test container on port 9623
- Verifies API health endpoint
- Verifies WebUI accessibility  
- Provides access URLs
- Leaves container running for manual testing

## 📊 Usage Examples

### Upload Documents via WebUI

1. Open http://localhost:9621/webui/
2. Go to "Documents" tab
3. Upload your files:
   - Images: Get GPT-4o vision analysis
   - PowerPoint: Text + image analysis
   - Excel: Multi-sheet processing
   - PDFs: Text extraction and chunking

### Upload via API

```bash
# Upload an image
curl -X POST http://localhost:9621/documents/upload \
  -F "file=@image.png"

# Upload PowerPoint
curl -X POST http://localhost:9621/documents/upload \
  -F "file=@presentation.pptx"

# Query documents
curl -X POST http://localhost:9621/documents/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is shown in the images?", "mode": "hybrid"}'
```

## 🔄 Docker Services

### Available Services

1. **lightrag**: Standard LightRAG API (port 9621)
2. **lightrag-webui**: LightRAG + WebUI (port 9622) 
3. **postgres**: PostgreSQL database
4. **neo4j**: Neo4j graph database

### Service Management

```bash
# Start databases only
docker compose up -d postgres neo4j

# Start API only
docker compose up -d lightrag

# Start API + WebUI
docker compose --profile webui up -d lightrag-webui

# View logs
docker compose logs -f lightrag-webui

# Stop services
docker compose down
```

## 🛠️ Development

### Rebuild WebUI

```bash
cd lightrag_webui
npm run build-no-bun
cd ..
./scripts/build_docker_webui.sh
```

### Custom Dockerfile

The `Dockerfile.webui` builds in stages:
1. **Build Python dependencies** with all required libraries
2. **Copy pre-built WebUI** (built locally to avoid Docker Node.js issues)
3. **Create final runtime image** with both API and WebUI

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Use different ports (9622, 9623, etc.)
2. **WebUI not loading**: Ensure WebUI was built successfully before Docker build
3. **Database connections**: Verify PostgreSQL/Neo4j are running first
4. **File uploads failing**: Check Azure OpenAI credentials in `.env`

### Debug Commands

```bash
# Check container logs
docker logs <container-id>

# Connect to running container
docker exec -it <container-id> bash

# Test API directly
curl http://localhost:9621/health

# Test WebUI files
curl http://localhost:9621/webui/index.html
```

## 🎉 Success!

You now have a complete LightRAG system with:
- ✅ Multimodal document processing
- ✅ Integrated WebUI
- ✅ Docker containerization
- ✅ Production database support
- ✅ Azure OpenAI GPT-4o vision
- ✅ Graph-based knowledge extraction

Upload your images, PowerPoint presentations, Excel files, and PDFs to see the advanced multimodal RAG system in action! 🚀



