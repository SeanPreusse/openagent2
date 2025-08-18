#!/usr/bin/env bash
set -euo pipefail

# Test the LightRAG Docker image with integrated WebUI

cd "$(dirname "$0")/.."

echo "🧪 Testing LightRAG Docker image with WebUI..."
echo ""

# Create test data directory
mkdir -p ./test_data

# Run the container in detached mode
echo "🚀 Starting LightRAG container..."
CONTAINER_ID=$(docker run -d -p 9623:9621 -v "$(pwd)/test_data:/app/data" lightrag:webui)

echo "📋 Container ID: $CONTAINER_ID"
echo "⏳ Waiting for server to start..."

# Wait for server to be ready
sleep 10

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -s "http://localhost:9623/health" | grep -q "healthy"; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker logs "$CONTAINER_ID"
    docker stop "$CONTAINER_ID"
    exit 1
fi

# Test WebUI endpoint
echo "🌐 Testing WebUI endpoint..."
if curl -s "http://localhost:9623/webui/" | grep -q "<!doctype html>"; then
    echo "✅ WebUI is accessible!"
else
    echo "❌ WebUI not accessible!"
    docker logs "$CONTAINER_ID"
    docker stop "$CONTAINER_ID"
    exit 1
fi

echo ""
echo "🎉 All tests passed!"
echo ""
echo "🌐 Access your LightRAG instance at:"
echo "   📊 API: http://localhost:9623"
echo "   🖥️  WebUI: http://localhost:9623/webui/"
echo "   📋 Health: http://localhost:9623/health"
echo ""
echo "🛑 To stop the container:"
echo "   docker stop $CONTAINER_ID"
echo ""
echo "💡 The container is running in the background. You can now test file uploads!"
echo "   Try uploading images, PDFs, PowerPoint, or Excel files through the WebUI."





