# 📦 Package.json RAG Deployment Updates

## ✅ Updated Root Package.json Scripts

The root `package.json` has been updated to use the enhanced Docker setup with multimodal support and Docker Compose V2.

### 🚀 **Main Deployment Scripts**

#### Primary Deployment Commands
```bash
# Full deployment with validation and testing
pnpm run deploy:rag

# Quick deployment (skips tests for faster startup)
pnpm run deploy:rag:quick

# Development mode with enhanced output
pnpm run dev:rag
```

#### Environment Setup
```bash
# Sets up .env file from Azure OpenAI template
pnpm run deploy:rag:env
```

#### Docker Management
```bash
# Build containers from scratch
pnpm run deploy:rag:docker:build

# Start services
pnpm run deploy:rag:docker:up

# Stop and remove services
pnpm run deploy:rag:docker:down

# View logs
pnpm run deploy:rag:docker:logs

# Restart LightRAG service
pnpm run deploy:rag:docker:restart
```

## 🔧 **Key Improvements**

### Before (Legacy)
```json
{
  "deploy:rag:env": "[ -f apps/rag/.env ] || cp apps/rag/env.example apps/rag/.env",
  "deploy:rag:docker:up": "docker compose -f apps/rag/docker-compose.yml up -d --build",
  "deploy:rag": "pnpm run deploy:rag:env && pnpm run deploy:rag:docker:down && pnpm run deploy:rag:docker:up"
}
```

### After (Enhanced)
```json
{
  "deploy:rag:env": "[ -f apps/rag/.env ] || cp apps/rag/env.azure-openai.example apps/rag/.env && echo '⚠️  Please edit apps/rag/.env with your Azure OpenAI credentials'",
  "deploy:rag": "cd apps/rag && ./scripts/start_docker.sh",
  "deploy:rag:quick": "cd apps/rag && ./scripts/start_docker.sh --skip-tests"
}
```

## 🎯 **What's Changed**

### 1. Azure OpenAI First
- **Environment template**: Now uses `env.azure-openai.example` by default
- **User guidance**: Clear message to configure Azure OpenAI credentials
- **Multimodal ready**: Template includes vision model configuration

### 2. Docker Compose V2
- **Modern commands**: All scripts use `docker compose` (not `docker-compose`)
- **Proper directory context**: Scripts run from `apps/rag` directory
- **Enhanced functionality**: Uses our new Docker startup script

### 3. Enhanced Deployment
- **Main script**: Uses `./scripts/start_docker.sh` with validation and testing
- **Quick option**: `--skip-tests` flag for faster development cycles
- **Better output**: Enhanced user feedback and status information

### 4. Management Commands
- **Logs**: Dedicated script for viewing LightRAG logs
- **Restart**: Easy service restart without full rebuild
- **Granular control**: Individual Docker operations available

## 📋 **Usage Examples**

### Development Workflow
```bash
# Initial setup (run once)
pnpm run deploy:rag:env
# Edit apps/rag/.env with your Azure OpenAI credentials

# Start LightRAG for development
pnpm run dev:rag

# View logs while developing
pnpm run deploy:rag:docker:logs

# Restart after changes
pnpm run deploy:rag:docker:restart

# Stop when done
pnpm run deploy:rag:docker:down
```

### Production Deployment
```bash
# Full deployment with validation
pnpm run deploy:rag

# Or quick deployment for updates
pnpm run deploy:rag:quick
```

### Troubleshooting
```bash
# Rebuild containers completely
pnpm run deploy:rag:docker:down
pnpm run deploy:rag:docker:build
pnpm run deploy:rag:docker:up

# View logs for debugging
pnpm run deploy:rag:docker:logs
```

## 🎉 **Benefits**

### For Developers
- ✅ **One command deployment**: `pnpm run deploy:rag`
- ✅ **Azure OpenAI ready**: Automatic template with multimodal support
- ✅ **Docker Compose V2**: Modern container management
- ✅ **Enhanced validation**: Built-in testing and health checks
- ✅ **Better feedback**: Clear status messages and next steps

### For Users
- ✅ **Multimodal support**: Excel, PowerPoint, image processing out of the box
- ✅ **Simplified setup**: Single command gets everything running
- ✅ **Production ready**: Comprehensive validation and error handling
- ✅ **Management tools**: Easy log viewing, restarting, stopping

## 🔧 **Script Details**

### Environment Setup (`deploy:rag:env`)
- Checks if `.env` exists
- If not, copies `env.azure-openai.example` to `.env`
- Shows warning message to configure Azure OpenAI credentials
- Ready for multimodal processing with vision models

### Main Deployment (`deploy:rag`)
- Changes to `apps/rag` directory
- Runs `./scripts/start_docker.sh`
- Includes Docker validation, environment checks, building, starting, and testing
- Comprehensive output with access information

### Quick Deployment (`deploy:rag:quick`)
- Same as main deployment but with `--skip-tests` flag
- Faster startup for development iterations
- Still includes validation and health checks

### Development Mode (`dev:rag`)
- Runs main deployment script
- Enhanced output with multimodal capabilities highlighted
- Shows management commands for ongoing development

## ✅ **Verification**

All scripts have been tested:
- ✅ **Environment setup**: Creates `.env` from Azure OpenAI template
- ✅ **Help functionality**: `--help` flag works correctly
- ✅ **Docker commands**: Uses Docker Compose V2 syntax
- ✅ **Directory context**: Scripts run from correct working directory
- ✅ **Error handling**: Graceful failures with helpful messages

The package.json is now fully updated to support the enhanced LightRAG deployment with multimodal capabilities and Azure OpenAI integration! 🚀
