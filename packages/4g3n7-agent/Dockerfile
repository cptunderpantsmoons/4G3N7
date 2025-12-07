# =============================================================================
# Multi-stage Dockerfile for 4G3N7 Agent Service
# Optimized for production deployment on Railway
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build stage - includes all build tools and dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy shared package first (better cache utilization)
COPY ./shared /app/shared
WORKDIR /app/shared
RUN npm ci && npm run build

# Copy agent package files
COPY ./4g3n7-agent/package*.json /app/4g3n7-agent/
WORKDIR /app/4g3n7-agent

# Install agent dependencies
RUN npm ci

# Copy source code
COPY ./4g3n7-agent/ .

# Generate Prisma client and build the application
RUN npx prisma generate && \
    npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production stage - minimal runtime image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache \
    openssl \
    && rm -rf /var/cache/apk/*

# Copy built shared library
COPY --from=builder --chown=nextjs:nodejs /app/shared/dist ./shared/dist
COPY --from=builder --chown=nextjs:nodejs /app/shared/package.json ./shared/

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/4g3n7-agent/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/4g3n7-agent/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/4g3n7-agent/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/4g3n7-agent/prisma ./prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 9991

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:9991/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Run the application
CMD ["npm", "run", "start:prod"] 


