# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files and lock files
COPY package*.json ./
COPY packages/4g3n7-goose-bridge/package*.json ./packages/4g3n7-goose-bridge/
COPY packages/4g3n7-goose-bridge/package-lock.json ./packages/4g3n7-goose-bridge/

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY packages/4g3n7-goose-bridge ./packages/4g3n7-goose-bridge/

# Build the application
WORKDIR /app/packages/4g3n7-goose-bridge
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY packages/4g3n7-goose-bridge/package*.json ./packages/4g3n7-goose-bridge/
COPY packages/4g3n7-goose-bridge/package-lock.json ./packages/4g3n7-goose-bridge/

RUN npm ci --omit=dev --prefer-offline --no-audit

# Copy built application from builder
COPY --from=builder /app/packages/4g3n7-goose-bridge/dist ./packages/4g3n7-goose-bridge/dist

# Set environment variables
ENV NODE_ENV=production \
    LOG_LEVEL=info \
    API_PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "packages/4g3n7-goose-bridge/dist/main.js"]
