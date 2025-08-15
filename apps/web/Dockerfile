# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

# Copy the production environment file to both root and app directory
# This ensures it's available during the workspace build
COPY .env.production ./.env.production
COPY .env.production ./apps/web/.env.production

# Install all dependencies at root level (monorepo)
RUN npm ci

# Build shared package first
RUN npm run build:shared

# Build web app (from root, using workspace)
# Next.js will read .env.production during build
RUN cd apps/web && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages ./packages

# Copy web app files
COPY --from=builder /app/apps/web/package*.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy node_modules from root (monorepo structure)
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/apps/web

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start the application
CMD ["npm", "start"]