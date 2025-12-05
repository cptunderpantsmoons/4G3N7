# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

4G3N7 is an open-source AI Desktop Agent system that gives AI its own virtual computer to complete tasks. The system consists of a NestJS backend agent, Next.js web UI, desktop daemon for GUI automation, and shared TypeScript library.

## Architecture

This is a **monorepo** with five main packages:

- `packages/4g3n7-agent/` - Standard NestJS backend service that coordinates AI and desktop actions
- `packages/4g3n7-agent-cc/` - Claude Code variant of the agent with enhanced Claude integration
- `packages/4g3n7-ui/` - Next.js web interface for task management and desktop viewing
- `packages/4g3n7d/` - Desktop daemon for screen control and GUI automation
- `packages/shared/` - Shared TypeScript types and utilities

The system uses:
- **Backend**: NestJS with Prisma ORM and PostgreSQL
- **Frontend**: Next.js 15 with App Router, Tailwind CSS, Radix UI
- **Desktop**: TypeScript with Nut.js for GUI automation, Sharp for image processing
- **Real-time**: Socket.IO for WebSocket communication
- **AI Providers**: Anthropic Claude, OpenAI, Google Gemini

## Development Commands

### Agent Service (4g3n7-agent)
```bash
cd packages/4g3n7-agent

# Database setup and migrations
npm run prisma:dev      # Run migrations + generate Prisma client
npm run prisma:prod     # Production migrations

# Build and run
npm run build          # Build agent + shared dependencies
npm run start:dev      # Development with watch mode
npm run start:prod     # Production with migrations

# Testing and quality
npm test               # Run Jest tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # End-to-end tests
npm run lint           # ESLint with auto-fix
npm run format         # Prettier formatting
```

### Claude Code Agent (4g3n7-agent-cc)
Enhanced variant with Claude Code integration:
```bash
cd packages/4g3n7-agent-cc

# Same commands as standard agent
npm run build          # Build agent + shared dependencies
npm run start:dev      # Development with watch mode

# Key difference: Includes @anthropic-ai/claude-code dependency
# Use this variant for enhanced Claude Code capabilities
```

### Web UI (4g3n7-ui)
```bash
cd packages/4g3n7-ui

# Development and production
npm run dev            # Development server (builds shared deps)
npm run build          # Production build
npm run start          # Production server
npm run lint           # Next.js linting
```

### Desktop Daemon (4g3n7d)
```bash
cd packages/4g3n7d

npm run build          # Build daemon + shared dependencies
npm run start:dev      # Development with watch
```

### Shared Library
```bash
cd packages/shared

npm run build          # TypeScript compilation
npm run lint           # ESLint
npm run format         # Prettier
```

## Key Development Patterns

### Build Dependencies
Always build shared library first:
```bash
npm run build --prefix ../shared
```
Most package scripts handle this automatically.

### Database Development
Use `prisma:dev` for development workflow (migrate + generate).
Database schema is in `packages/4g3n7-agent/prisma/`.

### Real-time Communication
Socket.IO handles real-time updates between agent and UI.
Socket events are defined in shared library.

### Environment Variables

Required for agent service:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` or `GEMINI_API_KEY` - AI provider key

Optional environment variables:
- `G3N7_DESKTOP_BASE_URL` - Desktop daemon URL (default: http://localhost:9990)
- `G3N7_ANALYTICS_ENDPOINT` - Analytics collection endpoint
- `G3N7_AGENT_BASE_URL` - Agent service URL for UI
- `G3N7_DESKTOP_VNC_URL` - VNC WebSocket URL for UI
- `NODE_ENV` - Environment mode (development/production)

## Docker Development

### Full System Deployment (Recommended)

```bash
# Set AI provider key
echo "ANTHROPIC_API_KEY=sk-ant-..." > docker/.env
# Alternative providers:
# echo "OPENAI_API_KEY=sk-..." > docker/.env
# echo "GEMINI_API_KEY=..." > docker/.env

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Services exposed on:
# - UI: http://localhost:9992
# - Agent API: http://localhost:9991
# - Desktop control: http://localhost:9990
# - PostgreSQL: localhost:5432
```

### Claude Code Variant Deployment

For enhanced Claude Code integration:
```bash
docker-compose -f docker/docker-compose-claude-code.yml up -d
```

### Development-Only Deployment

Core services without UI:
```bash
docker-compose -f docker/docker-compose.core.yml up -d
```

### Services Architecture

- `4g3n7-desktop` (port 9990) - Ubuntu desktop with VNC and noVNC access
- `4g3n7-agent` (port 9991) - Standard NestJS API and AI coordination
- `4g3n7-agent-cc` (port 9991) - Claude Code variant with enhanced integration
- `4g3n7-ui` (port 9992) - Next.js web interface
- `postgres` (port 5432) - PostgreSQL database with persistent data

## Testing Strategy

- **Unit Tests**: Jest with ts-jest for TypeScript
- **E2E Tests**: Jest with separate configuration
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier with consistent config

## Node.js Requirements

All packages require **exactly Node.js 20** (specified in package.json engines):
- `4g3n7-agent`: Node.js 20
- `4g3n7-agent-cc`: Node.js 20
- `4g3n7d`: No explicit requirement (follows project standard)
- `4g3n7-ui`: No explicit requirement (uses Next.js compatible versions)
- `shared`: No explicit requirement (TypeScript compilation only)

## Port Configuration

Default development ports:
- 9990: Desktop daemon & noVNC
- 9991: Agent service API
- 9992: Web UI
- 5432: PostgreSQL (when using Docker Compose)

## Troubleshooting

### Common Issues

**Port Conflicts**: If ports 9990-9992 are occupied, modify the docker-compose.yml port mappings.

**Database Connection Issues**: Ensure PostgreSQL container is running before starting the agent service.

**Build Failures**: Always build shared library first with `npm run build --prefix ../shared`.

**Permission Errors**: Docker containers may need privileged access for desktop automation features.

### Service Dependencies

The services must start in this order:
1. `postgres` (database)
2. `4g3n7-desktop` (desktop environment)
3. `4g3n7-agent` or `4g3n7-agent-cc` (AI coordination)
4. `4g3n7-ui` (web interface)

Docker Compose handles this automatically with `depends_on` declarations.

### Development vs Production

- Use `docker-compose.yml` for full system deployment
- Use `docker-compose.core.yml` for development without UI
- Use `docker-compose-claude-code.yml` for Claude Code enhanced features
- Local development requires manual service startup following the dependency order above