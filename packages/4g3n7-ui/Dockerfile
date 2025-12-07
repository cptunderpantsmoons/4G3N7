# =============================================================================
# Multi-stage Dockerfile for 4G3N7 UI Service
# Optimized for production deployment on Railway
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build stage - includes all build tools and dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Declare build arguments
ARG G3N7_AGENT_BASE_URL
ARG G3N7_DESKTOP_VNC_URL

# Set environment variables for the build process
ENV G3N7_AGENT_BASE_URL=${G3N7_AGENT_BASE_URL}
ENV G3N7_DESKTOP_VNC_URL=${G3N7_DESKTOP_VNC_URL}
ENV NEXT_TELEMETRY_DISABLED=1

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

# Copy UI package files
COPY ./4g3n7-ui/package*.json /app/4g3n7-ui/
WORKDIR /app/4g3n7-ui

# Install UI dependencies
RUN npm ci

# Copy source code
COPY ./4g3n7-ui/ .

# Build the Next.js application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production stage - minimal runtime image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

# Declare runtime arguments
ARG G3N7_AGENT_BASE_URL=http://4g3n7-agent:9991
ARG G3N7_DESKTOP_VNC_URL=http://4g3n7-desktop:9990/websockify

# Set environment variables for runtime
ENV G3N7_AGENT_BASE_URL=${G3N7_AGENT_BASE_URL}
ENV G3N7_DESKTOP_VNC_URL=${G3N7_DESKTOP_VNC_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=9992

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

# Copy built UI application
COPY --from=builder --chown=nextjs:nodejs /app/4g3n7-ui/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/4g3n7-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/4g3n7-ui/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/4g3n7-ui/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 9992

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:9992/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Run the application
CMD ["node", "server.js"] 


