# Build stage
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy all required files
COPY pyproject.toml .
COPY tools_agent/ ./tools_agent/
COPY langgraph.json .

# Install dependencies
RUN pip install --upgrade pip && \
    pip install --user --no-cache-dir . && \
    pip install --user --no-cache-dir "langgraph-cli[inmem]"

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user early
RUN useradd --create-home --shell /bin/bash app

# Copy installed packages into the app user's home and ensure ownership
COPY --from=builder --chown=app:app /root/.local /home/app/.local

# Copy all application files with correct ownership
COPY --chown=app:app tools_agent/ ./tools_agent/
COPY --chown=app:app pyproject.toml .
COPY --chown=app:app langgraph.json .

# Ensure scripts in the app user's .local are in PATH
ENV PATH=/home/app/.local/bin:$PATH

# Ensure workdir ownership
RUN chown -R app:app /app
USER app

# Expose the port
EXPOSE 2026

# Environment variables
ENV PORT=2026
ENV HOST=0.0.0.0

# Start the LangGraph server
CMD ["langgraph", "dev", "--allow-blocking", "--host", "0.0.0.0", "--port", "2026"]
