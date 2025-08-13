#!/usr/bin/env bash
set -euo pipefail

# Build Docker image with integrated WebUI for LightRAG
# This creates a complete container with both the API server and WebUI

cd "$(dirname "$0")/.."

echo "🏗️  Building LightRAG Docker image with integrated WebUI..."
echo "📊 This image includes:"
echo "   - LightRAG API server with multimodal support"
echo "   - Built-in WebUI accessible at /webui/"
echo "   - Support for images, PDFs, Office documents"
echo "   - Azure OpenAI GPT-4o vision processing"
echo "   - PostgreSQL and Neo4j connectivity"
echo ""

# First, build the WebUI locally
echo "🔨 Building WebUI locally..."
cd lightrag_webui
npm run build-no-bun
cd ..

# Build the Docker image
echo "🐳 Building Docker image..."
docker build -f Dockerfile.webui -t lightrag:webui .

echo ""
echo "✅ Docker image built successfully!"
echo ""
echo "🚀 To run the container:"
echo "   docker run -p 9621:9621 -v \$(pwd)/data:/app/data lightrag:webui"
echo ""
echo "🌐 Access points:"
echo "   📊 API: http://localhost:9621"
echo "   🖥️  WebUI: http://localhost:9621/webui/"
echo "   📋 Health: http://localhost:9621/health"
echo ""
echo "💡 For production with PostgreSQL & Neo4j:"
echo "   docker compose up -d  # Start databases first"
echo "   docker run -p 9621:9621 --network rag_default lightrag:webui"
echo ""
