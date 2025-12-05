# 4G3N7 Goose Bridge

## Overview

The **4G3N7 Goose Bridge** is a comprehensive integration layer that connects Goose AI Agent capabilities with the 4G3N7 Desktop Agent platform. This package provides the foundation for Phase 1 of the Goose integration plan, establishing the core architecture, extension system, and communication protocols.

## Architecture

### Package Structure

```
4g3n7-goose-bridge/
├── src/
│   ├── core/                 # Core bridge functionality
│   │   ├── bridge.module.ts  # Main NestJS module
│   │   ├── bridge.controller.ts  # REST API endpoints
│   │   ├── bridge.service.ts     # Business logic
│   │   └── configuration.service.ts  # Config management
│   ├── extensions/           # Extension management
│   │   ├── base.extension.ts      # Base extension class
│   │   ├── lifecycle.manager.ts   # Extension lifecycle
│   │   └── registry.service.ts    # Extension registry
│   ├── interfaces/           # Shared type definitions
│   │   ├── types.ts              # Core data models
│   │   └── extension.interface.ts  # Extension interfaces
│   └── protocols/            # Communication protocols
├── config/                   # Configuration schemas
└── docs/                     # Integration documentation
```

### Key Components

#### 1. Extension System

**BaseExtension** (`extensions/base.extension.ts`)
- Abstract base class for all Goose extensions
- Implements standardized lifecycle hooks
- Provides helpers for task validation and result creation
- Integrates with logging, metrics, and storage services

**ExtensionLifecycleManager** (`extensions/lifecycle.manager.ts`)
- Manages extension loading, initialization, and unloading
- Coordinates task execution across extensions
- Tracks extension health and statistics
- Handles error recovery and state management

**ExtensionRegistry** (`extensions/registry.service.ts`)
- Discovers and registers extensions
- Maintains capability index for fast lookups
- Supports builtin, marketplace, and custom extensions
- Provides search and filtering capabilities

#### 2. Configuration System

**ConfigurationService** (`core/configuration.service.ts`)
- JSON Schema validation for extension configs
- Multi-level configuration hierarchy (system, extension, task)
- Configuration caching and persistence
- Import/export functionality

#### 3. REST API Bridge

**GooseBridgeController** (`core/bridge.controller.ts`)
- RESTful API endpoints for Goose integration
- OpenAPI/Swagger documentation
- Request validation and error handling

**API Endpoints**:
- `GET /api/v1/goose/extensions` - List extensions
- `GET /api/v1/goose/extensions/:id` - Get extension details
- `POST /api/v1/goose/tasks` - Submit task
- `GET /api/v1/goose/tasks/:id` - Get task status
- `GET /api/v1/goose/tasks/:id/results` - Get task results
- `GET /api/v1/goose/health` - Health check
- `GET /api/v1/goose/metrics` - System metrics

#### 4. Data Models

**Core Interfaces** (`interfaces/types.ts`):
- `GooseTask` - Work unit delegated to Goose
- `GooseResult` - Processing output from Goose
- `ExtensionManifest` - Extension metadata
- `ExtensionCapability` - Capability definitions
- `BridgeMessage` - Cross-system communication wrapper
- `AuditLogEntry` - Security and compliance logging

## Installation

```bash
cd packages/4g3n7-goose-bridge
npm install
```

## Usage

### 1. Creating a Custom Extension

```typescript
import { BaseExtension } from '4g3n7-goose-bridge';
import { GooseTask, GooseResult, ExtensionManifest } from '4g3n7-goose-bridge';

export class MyCustomExtension extends BaseExtension {
  getManifest(): ExtensionManifest {
    return {
      id: 'my-extension',
      name: 'My Custom Extension',
      version: '1.0.0',
      description: 'Custom processing extension',
      author: 'Your Name',
      capabilities: [{
        id: 'process-data',
        name: 'Data Processing',
        description: 'Process custom data',
        operations: ['process'],
        requiredPermissions: ['goose.data.read', 'goose.data.write'],
      }],
      permissions: ['goose.data.read', 'goose.data.write'],
      entryPoint: './index.js',
    };
  }

  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    
    try {
      // Your processing logic here
      const result = {
        processed: true,
        data: task.payload,
      };
      
      const duration = Date.now() - startTime;
      return this.createResult(task, result, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      return this.createErrorResult(task, error as Error, duration);
    }
  }
}
```

### 2. Registering an Extension

```typescript
import { ExtensionRegistry } from '4g3n7-goose-bridge';

const registry = new ExtensionRegistry();
await registry.initialize(['/path/to/extensions']);
```

### 3. Submitting a Task

```typescript
import { GooseBridgeService } from '4g3n7-goose-bridge';

const bridgeService = new GooseBridgeService(registry, lifecycleManager);

const task = await bridgeService.submitTask({
  type: 'process',
  extensionId: 'my-extension',
  payload: {
    data: 'example data',
  },
  priority: 'NORMAL',
});

console.log('Task submitted:', task.taskId);
```

### 4. Checking Task Status

```typescript
const taskStatus = await bridgeService.getTask(taskId);
console.log('Status:', taskStatus.status);

if (taskStatus.status === 'COMPLETED') {
  const result = await bridgeService.getTaskResult(taskId);
  console.log('Result:', result.result);
}
```

## Configuration

### Environment Variables

```env
# Goose Bridge Configuration
GOOSE_BRIDGE_PORT=9992
GOOSE_EXTENSION_PATH=/path/to/extensions
GOOSE_CONFIG_STORE=redis

# Redis Configuration (for config and task queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging
LOG_LEVEL=info
```

### Extension Manifest Example

```json
{
  "id": "document-processor",
  "name": "Document Processor",
  "version": "1.0.0",
  "description": "Process DOCX and PDF documents",
  "author": "4G3N7 Team",
  "homepage": "https://github.com/4g3n7/extensions/document-processor",
  "capabilities": [
    {
      "id": "extract-text",
      "name": "Text Extraction",
      "description": "Extract text from documents",
      "operations": ["extract_text"],
      "requiredPermissions": ["goose.document.read"],
      "inputSchema": {
        "type": "object",
        "properties": {
          "filePath": {
            "type": "string",
            "description": "Path to the document"
          },
          "format": {
            "type": "string",
            "enum": ["docx", "pdf"]
          }
        },
        "required": ["filePath", "format"]
      }
    }
  ],
  "permissions": ["goose.document.read"],
  "dependencies": {
    "mammoth": "^1.6.0",
    "pdf-parse": "^1.1.1"
  },
  "configSchema": {
    "type": "object",
    "properties": {
      "maxFileSize": {
        "type": "number",
        "default": 10485760,
        "description": "Maximum file size in bytes"
      }
    }
  },
  "entryPoint": "./dist/index.js",
  "minBridgeVersion": "0.1.0"
}
```

## Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
```

## Development

```bash
npm run build         # Build TypeScript
npm run build:watch   # Watch mode
npm run start:dev     # Development mode
npm run lint          # Lint code
npm run format        # Format code
```

## API Documentation

When running the service, OpenAPI documentation is available at:
- Swagger UI: `http://localhost:9992/api/docs`
- OpenAPI JSON: `http://localhost:9992/api/docs-json`

## Integration with 4G3N7 Agent

To integrate the Goose Bridge with the main 4G3N7 agent:

```typescript
import { Module } from '@nestjs/common';
import { GooseBridgeModule } from '4g3n7-goose-bridge';

@Module({
  imports: [GooseBridgeModule],
})
export class AppModule {}
```

## Security

### Permission System

The bridge implements capability-based access control (CBAC):

- **Extension Access**: Controls which extensions can be loaded
- **Resource Limits**: Enforces memory, CPU, and timeout constraints
- **Data Access**: Restricts file system and network access

### Audit Logging

All operations are logged for compliance:
- Task submissions
- Extension loads/unloads
- Permission denials
- Configuration changes

## Performance

### Metrics

The bridge collects metrics on:
- Task throughput and latency
- Extension invocation frequency
- Error rates
- Resource utilization

### Health Checks

Health endpoints monitor:
- Extension availability
- Task queue status
- Dependency connectivity (database, Redis, storage)

## Roadmap

### Phase 1 (Current) - Foundation
- ✅ Core architecture
- ✅ Extension system
- ✅ REST API bridge
- ✅ Configuration management
- ⏳ Authentication & authorization
- ⏳ Docker configuration
- ⏳ Unit tests

### Phase 2 - Document Processing
- Document processing extensions (DOCX, PDF, XLSX)
- Workflow integration
- Desktop integration

### Phase 3 - Web Automation
- Web scraping extensions
- API integration
- Workflow automation

## Contributing

See the main [GOOSE_INTEGRATION_PLAN.md](../../GOOSE_INTEGRATION_PLAN.md) for contribution guidelines.

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [4G3N7 Issues](https://github.com/4g3n7/issues)
- Documentation: [Integration Docs](../../docs/)
