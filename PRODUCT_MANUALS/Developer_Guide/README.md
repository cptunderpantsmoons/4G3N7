# Developer Guide

This guide provides comprehensive information for developers working with 4G3N7, including extension development, API integration, and custom solutions.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Architecture Overview](#architecture-overview)
3. [Extension Development](#extension-development)
4. [API Integration](#api-integration)
5. [Custom Task Development](#custom-task-development)
6. [Plugin System](#plugin-system)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Best Practices](#best-practices)
10. [Code Examples](#code-examples)

---

## Development Environment Setup

### Prerequisites

#### Required Software
- **Node.js**: 18+ LTS
- **npm**: 8+ or **yarn**: 1.22+
- **Git**: 2.30+
- **Docker**: 20.10+ (for testing)
- **PostgreSQL**: 13+ (for local development)

#### Recommended Tools
- **IDE**: VS Code, WebStorm, or IntelliJ IDEA
- **Extensions**: ESLint, Prettier, TypeScript
- **Git Tools**: GitKraken, SourceTree
- **API Testing**: Postman, Insomnia

### Local Development Setup

#### Clone and Install
```bash
# Clone the repository
git clone https://github.com/4g3n7/4g3n7.git
cd 4g3n7

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your local settings
```

#### Database Setup
```bash
# Start PostgreSQL
docker run -d --name 4g3n7-db \
  -e POSTGRES_DB=4g3n7_dev \
  -e POSTGRES_USER=4g3n7 \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

#### Start Development Services
```bash
# Start all services in development mode
npm run dev

# Or start individual services
npm run dev:agent      # Agent service
npm run dev:ui         # UI service
npm run dev:desktop    # Desktop service
```

### Development Workflow

#### Code Style
```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run typecheck
```

#### Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- filename.spec.ts

# Run integration tests
npm run test:integration
```

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Development Layers                   │
├─────────────────────────────────────────────────────────┤
│  UI Layer        │  Agent Layer        │  Desktop Layer │
│  (Next.js)       │  (NestJS)           │  (Ubuntu)      │
├─────────────────┬─┬───────────────────┬─┬────────────────┤
│  Frontend       │ │  Core Services    │ │  Desktop Env.  │
│  Components     │ │  - Task Manager   │ │  - Firefox     │
│  State Mgmt     │ │  - AI Provider    │ │  - VS Code     │
│  API Client     │ │  - File Storage   │ │  - Terminal    │
├─────────────────┼─┼───────────────────┼─┼────────────────┤
│  Extension      │ │  Extension        │ │  Extensions    │
│  Framework      │ │  Bridge           │ │  (Goose)      │
│  Plugins        │ │  Services         │ │               │
└─────────────────┴─┴───────────────────┴─┴────────────────┘
```

### Package Structure

```
packages/
├── 4g3n7-agent/           # Main agent service
│   ├── src/
│   │   ├── tasks/         # Task management
│   │   ├── ai/            # AI provider integration
│   │   ├── desktop/       # Desktop control
│   │   └── extensions/    # Extension system
│   └── test/              # Unit tests
├── 4g3n7-ui/              # Web interface
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API clients
│   │   └── pages/         # Page components
│   └── test/              # Component tests
├── 4g3n7-goose-bridge/    # Goose integration
│   ├── src/
│   │   ├── extensions/    # Extension implementations
│   │   ├── services/      # Bridge services
│   │   └── interfaces/    # Type definitions
│   └── test/              # Integration tests
├── shared/                # Shared utilities
│   ├── src/
│   │   ├── types/         # Type definitions
│   │   ├── utils/         # Utility functions
│   │   └── constants/     # Shared constants
│   └── test/              # Shared test utilities
└── 4g3n7-cli/             # Command line tools
    ├── src/
    │   ├── commands/      # CLI commands
    │   └── utils/         # CLI utilities
    └── test/              # CLI tests
```

### Key Technologies

#### Backend (Agent)
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Testing**: Jest
- **API**: REST + WebSocket

#### Frontend (UI)
- **Framework**: Next.js
- **Language**: TypeScript + React
- **Styling**: Tailwind CSS
- **State**: React Query + Context API
- **Testing**: React Testing Library

#### Desktop
- **Environment**: Ubuntu 22.04
- **Desktop**: XFCE
- **VNC**: noVNC
- **Browser**: Firefox
- **Editor**: VS Code

---

## Extension Development

### Extension Framework

4G3N7 uses a plugin-based extension system that allows developers to add new capabilities:

#### Extension Types
- **Task Extensions**: Custom task types and processing
- **AI Extensions**: Enhanced AI capabilities
- **Integration Extensions**: Third-party service integration
- **UI Extensions**: Custom UI components
- **Utility Extensions**: Helper functions and tools

### Creating an Extension

#### Extension Structure
```
my-extension/
├── package.json
├── src/
│   ├── index.ts              # Main entry point
│   ├── extension.ts          # Extension definition
│   ├── types.ts              # Type definitions
│   ├── services/             # Extension services
│   └── utils/                # Utility functions
├── test/
│   └── extension.spec.ts     # Extension tests
└── README.md                 # Extension documentation
```

#### Basic Extension Example
```typescript
// src/extension.ts
import { BaseExtension, ExtensionContext, ExtensionResult } from '@4g3n7/shared';

export class MyExtension extends BaseExtension {
  constructor() {
    super({
      id: 'my-extension',
      name: 'My Custom Extension',
      version: '1.0.0',
      description: 'A sample extension for 4G3N7',
      author: 'Your Name',
      configSchema: {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'API key for external service'
          }
        }
      }
    });
  }

  async execute(context: ExtensionContext): Promise<ExtensionResult> {
    try {
      // Your extension logic here
      const result = await this.processData(context.payload);
      
      return {
        success: true,
        data: result,
        metadata: {
          processedAt: new Date().toISOString(),
          itemsProcessed: result.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          errorType: 'extension_error'
        }
      };
    }
  }

  private async processData(payload: any): Promise<any> {
    // Implement your processing logic
    return {
      message: 'Processed successfully',
      payload
    };
  }
}

// src/index.ts
export { MyExtension } from './extension';
```

#### Extension Configuration
```json
{
  "id": "my-extension",
  "name": "My Custom Extension",
  "version": "1.0.0",
  "description": "A sample extension for 4G3N7",
  "author": "Your Name",
  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "API key for external service"
      }
    }
  },
  "dependencies": {
    "@4g3n7/shared": "^2.0.0"
  }
}
```

### Extension Lifecycle

#### Installation
1. **Download**: Extension files are downloaded
2. **Validation**: Configuration and dependencies validated
3. **Installation**: Extension installed in extension directory
4. **Initialization**: Extension initialized with configuration

#### Execution
1. **Trigger**: Extension triggered by task or event
2. **Context**: Extension receives execution context
3. **Processing**: Extension processes the request
4. **Result**: Extension returns result or error

#### Uninstallation
1. **Cleanup**: Extension performs cleanup
2. **Removal**: Extension files removed
3. **Registry**: Extension removed from registry

### Extension APIs

#### Base Extension Class
```typescript
export abstract class BaseExtension {
  constructor(config: ExtensionConfig);
  
  // Called when extension is initialized
  async initialize(config: any): Promise<void>;
  
  // Called when extension is executed
  abstract execute(context: ExtensionContext): Promise<ExtensionResult>;
  
  // Called when extension is cleaned up
  async cleanup(): Promise<void>;
  
  // Get extension metadata
  getMetadata(): ExtensionMetadata;
}
```

#### Extension Context
```typescript
export interface ExtensionContext {
  // Task information
  taskId: string;
  userId: string;
  
  // Extension configuration
  config: any;
  
  // Input data
  payload: any;
  
  // File references
  files: FileReference[];
  
  // Execution metadata
  metadata: {
    startTime: Date;
    timeout: number;
    retries: number;
  };
}
```

#### Extension Result
```typescript
export interface ExtensionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processedAt?: string;
    duration?: number;
    itemsProcessed?: number;
  };
}
```

---

## API Integration

### REST API

#### Authentication
All API requests require authentication using JWT tokens:

```typescript
// Get JWT token
const token = await getAuthToken();

// Make authenticated request
const response = await fetch('/api/v1/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(taskData)
});
```

#### Task Management API
```typescript
// Create task
const createTask = async (task: CreateTaskDto): Promise<Task> => {
  const response = await fetch('/api/v1/tasks', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(task)
  });
  return response.json();
};

// Get task status
const getTask = async (taskId: string): Promise<Task> => {
  const response = await fetch(`/api/v1/tasks/${taskId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Get task results
const getTaskResults = async (taskId: string): Promise<TaskResult> => {
  const response = await fetch(`/api/v1/tasks/${taskId}/results`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

#### Desktop Control API
```typescript
// Take screenshot
const takeScreenshot = async (): Promise<string> => {
  const response = await fetch('/api/v1/desktop/screenshot', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Send keyboard input
const sendKeyboardInput = async (keys: string[]): Promise<void> => {
  await fetch('/api/v1/desktop/keyboard', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ keys })
  });
};

// Send mouse click
const sendMouseClick = async (x: number, y: number): Promise<void> => {
  await fetch('/api/v1/desktop/mouse/click', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ x, y })
  });
};
```

### WebSocket API

#### Connection Setup
```typescript
// Connect to WebSocket
const socket = new WebSocket(`ws://localhost:9991/ws?token=${token}`);

// Handle connection events
socket.addEventListener('open', () => {
  console.log('Connected to 4G3N7 WebSocket');
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  handleWebSocketMessage(message);
});
```

#### Event Types
```typescript
interface WebSocketMessage {
  type: 'task_update' | 'desktop_event' | 'system_event' | 'error';
  timestamp: string;
  data: any;
}

// Task update events
interface TaskUpdateEvent {
  type: 'task_update';
  data: {
    taskId: string;
    status: TaskStatus;
    progress: number;
    message: string;
  };
}

// Desktop events
interface DesktopEvent {
  type: 'desktop_event';
  data: {
    action: 'screenshot' | 'mouse_move' | 'keyboard_input';
    payload: any;
  };
}
```

#### Sending Commands
```typescript
// Send task command
const sendTaskCommand = (command: TaskCommand) => {
  socket.send(JSON.stringify({
    type: 'task_command',
    data: command
  }));
};

// Send desktop command
const sendDesktopCommand = (command: DesktopCommand) => {
  socket.send(JSON.stringify({
    type: 'desktop_command',
    data: command
  }));
};
```

---

## Custom Task Development

### Task Structure

#### Task Definition
```typescript
interface Task {
  id: string;
  type: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  payload: any;
  userId: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  results?: TaskResult;
  error?: string;
}

enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}
```

#### Task Handler
```typescript
@Injectable()
export class CustomTaskHandler implements TaskHandler {
  constructor(
    private readonly aiService: AIService,
    private readonly desktopService: DesktopService
  ) {}

  async handle(task: Task): Promise<TaskResult> {
    try {
      // Process task
      const result = await this.processTask(task);
      
      return {
        success: true,
        data: result,
        metadata: {
          processedAt: new Date().toISOString(),
          duration: Date.now() - task.createdAt.getTime()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          errorType: 'task_error'
        }
      };
    }
  }

  private async processTask(task: Task): Promise<any> {
    // Implement task processing logic
    switch (task.type) {
      case 'web_scraping':
        return this.handleWebScraping(task);
      case 'document_processing':
        return this.handleDocumentProcessing(task);
      case 'data_analysis':
        return this.handleDataAnalysis(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }
}
```

### Task Registration

#### Register Task Handler
```typescript
// In your module
@Module({
  providers: [
    {
      provide: TASK_HANDLER_TOKEN,
      useExisting: CustomTaskHandler,
      multi: true
    }
  ]
})
export class CustomTaskModule {}
```

#### Task Factory
```typescript
@Injectable()
export class TaskFactory {
  constructor(
    @Inject(TASK_HANDLERS_TOKEN)
    private readonly handlers: TaskHandler[]
  ) {}

  createHandler(taskType: string): TaskHandler {
    const handler = this.handlers.find(h => h.canHandle(taskType));
    if (!handler) {
      throw new Error(`No handler found for task type: ${taskType}`);
    }
    return handler;
  }
}
```

---

## Plugin System

### Plugin Architecture

4G3N7 supports a plugin system for extending functionality:

#### Plugin Types
- **Core Plugins**: Built-in functionality
- **User Plugins**: User-installed extensions
- **System Plugins**: System-level enhancements

#### Plugin Loading
```typescript
@Injectable()
export class PluginManager {
  async loadPlugin(pluginPath: string): Promise<Plugin> {
    const plugin = await import(pluginPath);
    return new Plugin(plugin);
  }

  async initializePlugin(plugin: Plugin): Promise<void> {
    await plugin.initialize();
  }

  async executePlugin(plugin: Plugin, context: any): Promise<any> {
    return plugin.execute(context);
  }
}
```

---

## Testing

### Unit Testing

#### Test Structure
```typescript
describe('MyExtension', () => {
  let extension: MyExtension;
  let mockContext: ExtensionContext;

  beforeEach(() => {
    extension = new MyExtension();
    mockContext = {
      taskId: 'test-task-123',
      userId: 'user-123',
      config: { apiKey: 'test-key' },
      payload: { data: 'test' },
      files: [],
      metadata: {
        startTime: new Date(),
        timeout: 30000,
        retries: 0
      }
    };
  });

  describe('execute', () => {
    it('should process data successfully', async () => {
      const result = await extension.execute(mockContext);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockContext.payload = null;
      
      const result = await extension.execute(mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### Integration Testing

#### Test Database
```typescript
describe('Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  describe('Task API', () => {
    it('should create and retrieve task', async () => {
      const taskData = {
        type: 'test',
        description: 'Test task',
        payload: { test: true }
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toMatchObject(taskData);
    });
  });
});
```

---

## Deployment

### Build Process

#### Build Configuration
```json
{
  "scripts": {
    "build": "nest build",
    "build:watch": "nest build --watch",
    "start:prod": "node dist/main"
  }
}
```

#### Docker Build
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 9991
CMD ["npm", "start:prod"]
```

### Environment Configuration

#### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true
```

#### Production
```bash
NODE_ENV=production
LOG_LEVEL=info
DEBUG=false
```

---

## Best Practices

### Code Organization
- Use feature-based module organization
- Follow TypeScript best practices
- Implement proper error handling
- Use dependency injection

### Performance
- Optimize database queries
- Use caching where appropriate
- Implement proper resource cleanup
- Monitor memory usage

### Security
- Validate all inputs
- Use proper authentication
- Implement authorization checks
- Sanitize user data

### Testing
- Write comprehensive unit tests
- Include integration tests
- Test error conditions
- Use test fixtures and mocks

---

## Code Examples

### Complete Extension Example
See [`Goose Bridge Integration`](../Integration_Guide/Goose_Bridge_Integration.md) for a complete extension example.

### API Client Example
```typescript
class TaskApiClient {
  constructor(private baseUrl: string, private token: string) {}

  async createTask(task: CreateTaskDto): Promise<Task> {
    const response = await fetch(`${this.baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(task)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### Desktop Automation Example
```typescript
class DesktopAutomation {
  constructor(private desktopApi: DesktopApi) {}

  async automateBrowserTask(url: string, selectors: string[]): Promise<any> {
    // Navigate to URL
    await this.desktopApi.navigate(url);
    
    // Wait for page load
    await this.desktopApi.waitForElement('body');
    
    // Extract data
    const results = {};
    for (const selector of selectors) {
      const elements = await this.desktopApi.findElements(selector);
      results[selector] = await Promise.all(
        elements.map(el => el.getText())
      );
    }
    
    return results;
  }
}
```

---

## Additional Resources

### Documentation
- [📖 User Guide](../User_Guide/README.md)
- [🔧 Administrator Guide](../Administrator_Guide/README.md)
- [📚 API Reference](../API_Reference/README.md)
- [🔗 Integration Guide](../Integration_Guide/README.md)

### Development Tools
- [VS Code Extensions](https://marketplace.visualstudio.com/)
- [4G3N7 CLI](https://github.com/4g3n7/cli)
- [Development Docker Images](https://hub.docker.com/r/4g3n7/)

### Community
- [GitHub Repository](https://github.com/4g3n7/4g3n7)
- [Developer Forum](https://community.4g3n7.io/developers)
- [Issue Tracker](https://github.com/4g3n7/4g3n7/issues)

---

**Next Steps:**
- [User Guide](../User_Guide/README.md) - For end-users
- [Administrator Guide](../Administrator_Guide/README.md) - For system administrators
- [API Reference](../API_Reference/README.md) - Complete API documentation
- [Integration Guide](../Integration_Guide/README.md) - Integration documentation