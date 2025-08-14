# OpenAgent Platform - Production Deployment

This document provides instructions for deploying the complete OpenAgent Platform in production using Docker.

## 🚀 Quick Start

### One Command Production Deployment

```bash
./deploy.sh --production
```

This single command will:
- Set up all necessary directories
- Create environment file templates
- Build and deploy all services with Docker
- Set up nginx reverse proxy for production routing
- Display service URLs and management commands

## 📋 Prerequisites

1. **Docker & Docker Compose**: Ensure Docker and Docker Compose are installed and running
2. **Environment Variables**: Configure your API keys and service credentials (see [Configuration](#-configuration))
3. **System Resources**: At least 4GB RAM and 10GB disk space recommended

## 🏗️ Architecture

The platform consists of the following services:

- **Web Application** (Next.js) - Main user interface
- **Documentation** (Mint) - Platform documentation
- **RAG Service** (LightRAG) - Retrieval-Augmented Generation API
- **Research Agent** (LangGraph) - Deep research and report generation
- **Tools Agent** (LangGraph) - Multi-tool agent with MCP support
- **PostgreSQL** - Primary database with pgvector extension
- **Neo4j** - Graph database for knowledge graphs
- **nginx** - Reverse proxy and load balancer (production mode)

## 🔧 Configuration

### Required Environment Files

The deployment script will create template environment files. You need to edit these with your actual credentials:

#### 1. RAG Service (`openagent/apps/rag/.env`)
```bash
# Azure OpenAI (or OpenAI)
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=your_endpoint_here
AZURE_OPENAI_API_VERSION=2024-02-01

# Or OpenAI
OPENAI_API_KEY=your_openai_key_here

# Database (automatically configured for Docker)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=lightrag_user
POSTGRES_PASSWORD=lightrag_password
POSTGRES_DATABASE=lightrag
```

#### 2. Web Application (`openagent/apps/web/.env.local`)
```bash
# API URLs (automatically configured for Docker)
NEXT_PUBLIC_RAG_API_URL=http://localhost:9621
NEXT_PUBLIC_RESEARCH_AGENT_URL=http://localhost:2025
NEXT_PUBLIC_TOOLS_AGENT_URL=http://localhost:2026

# Supabase (if using authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 3. Agent Services
- `openagent/apps/agents/open_deep_research/.env`
- `openagent/apps/agents/oap-langgraph-tools-agent/.env`

```bash
# LLM API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
LANGSMITH_API_KEY=your_langsmith_key

# Other service-specific configurations
```

## 📦 Deployment Commands

### Basic Deployment
```bash
# Development mode (no nginx proxy)
./deploy.sh

# Production mode (with nginx proxy)
./deploy.sh --production

# Force rebuild all images
./deploy.sh --rebuild
```

### Management Commands
```bash
# Check service status
./deploy.sh --status

# View logs from all services
./deploy.sh --logs

# Stop all services
./deploy.sh --stop
```

### Manual Docker Compose Commands
```bash
# Start services
docker compose up -d

# Start with production profile (nginx)
docker compose --profile production up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild and start
docker compose up -d --build
```

## 🌐 Service URLs

After deployment, services will be available at:

| Service | Development Mode | Production Mode |
|---------|------------------|-----------------|
| Web Application | http://localhost:3000 | http://localhost/ |
| Documentation | http://localhost:3001 | http://localhost/docs |
| RAG API | http://localhost:9621 | http://localhost/api/rag |
| Research Agent | http://localhost:2025 | http://localhost/api/agents/research |
| Tools Agent | http://localhost:2026 | http://localhost/api/agents/tools |
| PostgreSQL | localhost:5432 | localhost:5432 |
| Neo4j Browser | http://localhost:7474 | http://localhost:7474 |

## 🔍 Monitoring & Troubleshooting

### Health Checks
```bash
# Check overall system health
curl http://localhost/health

# Check individual services
curl http://localhost:3000/health    # Web app
curl http://localhost:9621/health    # RAG service
```

### Common Issues

1. **Port Conflicts**: Ensure ports 3000, 3001, 9621, 2025, 2026, 5432, 7474, 7687 are available
2. **Memory Issues**: Increase Docker memory limit to at least 4GB
3. **Environment Variables**: Verify all required API keys are set correctly
4. **Database Connection**: Check PostgreSQL and Neo4j are running and accessible

### Viewing Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f web
docker compose logs -f rag
docker compose logs -f research-agent
docker compose logs -f tools-agent
```

## 🔒 Production Security

For production deployments, consider:

1. **SSL/HTTPS**: Configure SSL certificates in the `ssl/` directory
2. **Environment Security**: Use Docker secrets or external secret management
3. **Network Security**: Configure firewalls and network policies
4. **Database Security**: Change default passwords and restrict access
5. **API Rate Limiting**: nginx configuration includes basic rate limiting

### SSL Configuration

To enable HTTPS in production:

1. Place SSL certificates in the `ssl/` directory:
   - `ssl/cert.pem`
   - `ssl/key.pem`

2. Update `nginx.conf` to include SSL configuration:
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
       # ... rest of configuration
   }
   ```

## 📊 Performance Tuning

### Resource Allocation
- **PostgreSQL**: Adjust memory settings in docker-compose.yml
- **Neo4j**: Configure heap size based on available memory
- **Web Services**: Scale using Docker Compose's `scale` option

### Scaling Services
```bash
# Scale web application instances
docker compose up -d --scale web=3

# Scale agent services
docker compose up -d --scale research-agent=2 --scale tools-agent=2
```

## 🔄 Updates and Maintenance

### Updating Services
```bash
# Pull latest images and restart
docker compose pull
./deploy.sh --rebuild

# Update specific service
docker compose build web
docker compose up -d web
```

### Backup and Restore
```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U lightrag_user lightrag > backup.sql

# Backup Neo4j
docker compose exec neo4j neo4j-admin database dump neo4j

# Backup RAG data
tar -czf rag_backup.tar.gz data/
```

## 💡 Tips

1. **Development**: Use development mode for local testing and debugging
2. **Production**: Always use production mode for live deployments
3. **Monitoring**: Set up external monitoring for production systems
4. **Logs**: Implement log aggregation for multi-service deployments
5. **Backups**: Schedule regular backups of databases and data volumes

## 🆘 Support

If you encounter issues:

1. Check the logs: `./deploy.sh --logs`
2. Verify service status: `./deploy.sh --status`
3. Review environment configuration
4. Check Docker resources and disk space
5. Consult the main project documentation

For additional help, refer to the individual service documentation in their respective directories.

