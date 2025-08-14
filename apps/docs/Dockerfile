# Use Node.js Alpine image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy application files
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 docuser

# Change ownership to docuser
RUN chown -R docuser:nodejs /app
USER docuser

# Expose port
EXPOSE 3000

# Start mint development server using npx
CMD ["npx", "mint", "dev", "--host", "0.0.0.0", "--port", "3000"]
