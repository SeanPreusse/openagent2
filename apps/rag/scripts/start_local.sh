#!/usr/bin/env bash
set -euo pipefail

# Move to apps/rag root
cd "$(dirname "$0")/.."

PORT="${PORT:-9621}"

# Create venv if missing
if [ ! -d venv ]; then
  python -m venv venv
fi

# shellcheck disable=SC1091
source venv/bin/activate

# Ensure any stray Neo4j OS env vars don't override .env values
unset NEO4J_URI NEO4J_USERNAME NEO4J_PASSWORD || true

# Install package in editable mode (quiet)
pip install -e . > /dev/null 2>&1

echo -e "\n🚀 Starting LightRAG WebUI...\n📊 API: http://localhost:${PORT}\n🌐 WebUI: http://localhost:${PORT}/webui/\n📁 Upload images, Excel, PowerPoint files!\n"

exec ./venv/bin/python -m lightrag.api.lightrag_server --port "${PORT}" --host 0.0.0.0


