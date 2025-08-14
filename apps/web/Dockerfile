# Base stage with pnpm
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Build stage
FROM base AS builder
# Build-time environment needed by Next.js during prerender
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_DEPLOYMENTS
ARG NEXT_PUBLIC_BASE_API_URL
ARG NEXT_PUBLIC_RAG_API_URL
ARG NEXT_PUBLIC_USE_LANGSMITH_AUTH
ARG LANGSMITH_API_KEY
ARG NEXT_PUBLIC_MCP_AUTH_REQUIRED
ARG NEXT_PUBLIC_MCP_SERVER_URL
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_DEPLOYMENTS=${NEXT_PUBLIC_DEPLOYMENTS}
ENV NEXT_PUBLIC_BASE_API_URL=${NEXT_PUBLIC_BASE_API_URL}
ENV NEXT_PUBLIC_RAG_API_URL=${NEXT_PUBLIC_RAG_API_URL}
ENV NEXT_PUBLIC_USE_LANGSMITH_AUTH=${NEXT_PUBLIC_USE_LANGSMITH_AUTH}
ENV LANGSMITH_API_KEY=${LANGSMITH_API_KEY}
ENV NEXT_PUBLIC_MCP_AUTH_REQUIRED=${NEXT_PUBLIC_MCP_AUTH_REQUIRED}
ENV NEXT_PUBLIC_MCP_SERVER_URL=${NEXT_PUBLIC_MCP_SERVER_URL}
COPY package.json pnpm-lock.yaml* ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure public directory exists even if project doesn't have one
RUN mkdir -p public

# Create a minimal .env.local for build if it doesn't exist
RUN touch .env.local

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN pnpm run build:internal

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"]
