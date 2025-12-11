# Claude Code Integration Guide for Goose Bridge

This guide provides comprehensive instructions for integrating Claude Code's agent capabilities and skills system into your Goose AI Agent platform.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [API Reference](#api-reference)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [Migration Guide](#migration-guide)

## Overview

The Claude Code Integration for Goose Bridge brings together the power of Claude Code's autonomous agent capabilities with Goose's flexible task management system. This integration enables:

- **Autonomous Task Execution**: Leverage Claude's agent mode for complex, multi-step tasks
- **Skill-Based Workflows**: Use Claude Code Skills for specialized capabilities
- **Advanced Tool Integration**: Access Claude's computer use tools (mouse, keyboard, screenshots)
- **Real-time Monitoring**: Track task progress and system health
- **Scalable Architecture**: Handle multiple concurrent tasks and workflows

## Prerequisites

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **Goose Bridge**: Version 1.0.0 or higher
- **Anthropic API Key**: Required for Claude model access

### Environment Setup

1. **Install Node.js** (if not already installed):
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **Set up Anthropic API Key**:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```

3. **Install required dependencies**:
   ```bash
   npm install @anthropic-ai/sdk js-yaml
   ```

## Installation

### 1. Add Claude Code Integration Module

Add the Claude Code Integration module to your Goose Bridge application:

```typescript
// app.module.ts
import { ClaudeCodeIntegrationModule } from './extensions/claude-code-integration/claude-code-integration.module';

@Module({
  imports: [
    ClaudeCodeIntegrationModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 2. Initialize Services

In your application bootstrap or module initialization:

```typescript
// app.service.ts or app.module.ts
import { ClaudeSkillsRegistryService } from './extensions/claude-code-integration/skills-registry.service';

@Injectable()
export class AppService {
  constructor(
    private readonly skillsRegistry: ClaudeSkillsRegistryService,
  ) {}

  async onModuleInit() {
    await this.skillsRegistry.initialize();
  }
}
```

### 3. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Required
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional
CLAUDE_SKILLS_PATH_PERSONAL=~/.claude/skills
CLAUDE_SKILLS_PATH_PROJECT=.claude/skills
CLAUDE_SKILLS_PATH_PLUGIN=.claude/plugins
CLAUDE_DEFAULT_TIMEOUT=300000
CLAUDE_MAX_CONCURRENT_TASKS=10
CLAUDE_AUTO_UPDATE_SKILLS=true
CLAUDE_VERBOSE_LOGGING=true
```

## Configuration

### Integration Configuration

Configure the integration in your application:

```typescript
import { ClaudeCodeIntegrationConfig } from './extensions/claude-code-integration/skills.interface';

const config: ClaudeCodeIntegrationConfig = {
  enabled: true,
  models: [
    {
      name: 'sonnet-4',
      provider: 'anthropic',
      capabilities: ['text', 'code', 'tools'],
      maxTokens: 200000,
      temperature: 0.7,
    },
    {
      name: 'opus-4',
      provider: 'anthropic',
      capabilities: ['text', 'code', 'tools', 'vision'],
      maxTokens: 200000,
      temperature: 0.7,
    },
  ],
  skillsPath: {
    personal: process.env.CLAUDE_SKILLS_PATH_PERSONAL || '~/.claude/skills',
    project: process.env.CLAUDE_SKILLS_PATH_PROJECT || '.claude/skills',
    plugin: process.env.CLAUDE_SKILLS_PATH_PLUGIN || '.claude/plugins',
  },
  defaultTimeout: parseInt(process.env.CLAUDE_DEFAULT_TIMEOUT || '300000'),
  maxConcurrentTasks: parseInt(process.env.CLAUDE_MAX_CONCURRENT_TASKS || '10'),
  autoUpdateSkills: process.env.CLAUDE_AUTO_UPDATE_SKILLS === 'true',
  verboseLogging: process.env.CLAUDE_VERBOSE_LOGGING === 'true',
};
```

### Skill Directory Structure

Organize your skills in the appropriate directories:

```
your-project/
├── .claude/
│   └── skills/
│       ├── web-scraper/
│       │   └── SKILL.md
│       ├── file-processor/
│       │   └── SKILL.md
│       └── data-analyzer/
│           └── SKILL.md
└── src/
    └── extensions/
        └── claude-code-integration/
```

## Usage

### Basic Skill Execution

Execute a skill directly:

```typescript
import { ClaudeAgentTask } from './extensions/claude-code-integration/skills.interface';

const task: ClaudeAgentTask = {
  skillId: 'web-scraper-123',
  capabilityId: 'scrape',
  input: {
    url: 'https://example.com',
    selector: '.data-class',
    extractText: true,
  },
  priority: 'MEDIUM',
  timeout: 300000,
};

const result = await agentExecutor.executeTask(task);
console.log('Task result:', result);
```

### Monitoring Task Progress

Track task execution in real-time:

```typescript
// Start monitoring
const taskId = await agentExecutor.executeTask(task);

// Check status periodically
setInterval(async () => {
  const status = await agentExecutor.getTaskStatus(taskId);
  if (status) {
    console.log(`Task ${taskId}: ${status.status} (${status.progress?.percentage}%)`);
    
    if (status.status === 'COMPLETED' || status.status === 'FAILED') {
      clearInterval(this);
    }
  }
}, 5000);
```

### Managing Skills

Register and manage skills programmatically:

```typescript
// Register a new skill
const skill: ClaudeSkillMetadata = {
  id: 'my-custom-skill',
  name: 'Custom Skill',
  description: 'A custom skill for specific tasks',
  version: '1.0.0',
  author: 'Your Name',
  type: 'project',
  path: '/path/to/skill',
  source: 'local',
  installedAt: new Date(),
  updatedAt: new Date(),
  capabilities: [
    {
      id: 'custom_task',
      name: 'Custom Task',
      description: 'Performs custom operations',
      inputSchema: { /* schema */ },
      permissions: ['read', 'write'],
    },
  ],
};

await skillsRegistry.registerSkill(skill);
```

### Using the REST API

Interact with the integration via HTTP endpoints:

```bash
# List all skills
curl GET http://localhost:3000/api/v1/claude-code/skills

# Get skill details
curl GET http://localhost:3000/api/v1/claude-code/skills/web-scraper-123

# Execute a task
curl POST http://localhost:3000/api/v1/claude-code/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "skillId": "web-scraper-123",
    "capabilityId": "scrape",
    "input": {
      "url": "https://example.com",
      "selector": ".data"
    },
    "priority": "MEDIUM"
  }'

# Monitor task status
curl GET http://localhost:3000/api/v1/claude-code/tasks/task-123

# Get system status
curl GET http://localhost:3000/api/v1/claude-code/status
```

## API Reference

### Skills Registry API

#### `listSkills(filter?: { type?: string; capability?: string })`
Lists all available skills with optional filtering.

**Parameters:**
- `filter.type`: Filter by skill type ('personal' | 'project' | 'plugin')
- `filter.capability`: Filter by capability ID

**Returns:** `Promise<ClaudeSkillMetadata[]>`

#### `getSkill(skillId: string)`
Retrieves a specific skill by ID.

**Parameters:**
- `skillId`: The ID of the skill to retrieve

**Returns:** `Promise<ClaudeSkillMetadata | null>`

#### `registerSkill(skill: ClaudeSkillMetadata)`
Registers a new skill.

**Parameters:**
- `skill`: Skill metadata object

**Returns:** `Promise<void>`

#### `updateSkill(skillId: string, updates: Partial<ClaudeSkillMetadata>)`
Updates an existing skill.

**Parameters:**
- `skillId`: The ID of the skill to update
- `updates`: Partial skill metadata to update

**Returns:** `Promise<void>`

#### `unregisterSkill(skillId: string)`
Unregisters a skill.

**Parameters:**
- `skillId`: The ID of the skill to unregister

**Returns:** `Promise<void>`

### Agent Executor API

#### `executeTask(task: ClaudeAgentTask)`
Executes a Claude Code agent task.

**Parameters:**
- `task`: Task definition object

**Returns:** `Promise<ClaudeTaskResult>`

#### `getTaskStatus(taskId: string)`
Retrieves the status of a running task.

**Parameters:**
- `taskId`: The ID of the task to check

**Returns:** `Promise<ClaudeAgentTask | null>`

#### `cancelTask(taskId: string)`
Cancels a running task.

**Parameters:**
- `taskId`: The ID of the task to cancel

**Returns:** `Promise<boolean>`

#### `listActiveTasks()`
Lists all currently active tasks.

**Returns:** `Promise<ClaudeAgentTask[]>`

### Model Service API

#### `getModel(modelName: string)`
Retrieves a specific model configuration.

**Parameters:**
- `modelName`: The name of the model

**Returns:** `Promise<ClaudeAgentModel>`

#### `listAvailableModels()`
Lists all available models.

**Returns:** `Promise<ClaudeAgentModel[]>`

#### `generateResponse(systemPrompt: string, messages: MessageContentBlock[], model: ClaudeAgentModel, tools?: ClaudeToolDefinition[])`
Generates a response using Claude.

**Parameters:**
- `systemPrompt`: System prompt for the model
- `messages`: Array of message content blocks
- `model`: Model configuration
- `tools`: Optional array of tool definitions

**Returns:** `Promise<MessageContentBlock[]>`

#### `generateResponseStream(systemPrompt: string, messages: MessageContentBlock[], model: ClaudeAgentModel, tools?: ClaudeToolDefinition[], onChunk?: (chunk: MessageContentBlock) => void)`
Generates a streaming response from Claude.

**Parameters:**
- `systemPrompt`: System prompt for the model
- `messages`: Array of message content blocks
- `model`: Model configuration
- `tools`: Optional array of tool definitions
- `onChunk`: Callback function for each response chunk

**Returns:** `Promise<MessageContentBlock[]>`

## Examples

### Example 1: Web Scraping Workflow

```typescript
import { ClaudeAgentTask, ClaudeAgentExecutorService } from './extensions/claude-code-integration';

@Injectable()
export class WebScrapingService {
  constructor(
    private readonly agentExecutor: ClaudeAgentExecutorService,
  ) {}

  async scrapeWebsite(url: string, selector: string): Promise<any> {
    const task: ClaudeAgentTask = {
      skillId: 'web-scraper',
      capabilityId: 'scrape',
      input: {
        url,
        selector,
        extractText: true,
        extractLinks: true,
      },
      priority: 'MEDIUM',
      timeout: 300000,
    };

    const result = await this.agentExecutor.executeTask(task);
    
    if (result.success) {
      return result.output;
    } else {
      throw new Error(`Scraping failed: ${result.error?.message}`);
    }
  }
}

// Usage
const scrapingService = new WebScrapingService(agentExecutor);
const data = await scrapingService.scrapeWebsite(
  'https://news.ycombinator.com',
  '.storylink'
);
console.log('Scraped data:', data);
```

### Example 2: File Processing Pipeline

```typescript
@Injectable()
export class FileProcessingService {
  constructor(
    private readonly agentExecutor: ClaudeAgentExecutorService,
    private readonly skillsRegistry: ClaudeSkillsRegistryService,
  ) {}

  async processFile(filePath: string, operation: 'read' | 'write' | 'analyze'): Promise<any> {
    const task: ClaudeAgentTask = {
      skillId: 'file-processor',
      capabilityId: operation,
      input: {
        path: filePath,
        format: this.detectFormat(filePath),
        ...(operation === 'write' && {
          content: 'New file content',
          mode: 'append',
        }),
      },
      priority: 'LOW',
      timeout: 600000,
    };

    return await this.agentExecutor.executeTask(task);
  }

  private detectFormat(filePath: string): string {
    const ext = filePath.split('.').pop();
    return ext === 'json' ? 'json' : ext === 'csv' ? 'csv' : 'text';
  }
}
```

### Example 3: Data Analysis Workflow

```typescript
@Injectable()
export class DataAnalysisService {
  constructor(
    private readonly agentExecutor: ClaudeAgentExecutorService,
  ) {}

  async analyzeDataset(
    datasetPath: string,
    analysisType: 'statistical' | 'trend' | 'correlation'
  ): Promise<any> {
    const task: ClaudeAgentTask = {
      skillId: 'data-analyzer',
      capabilityId: 'analyze_dataset',
      input: {
        datasetPath,
        analysisType,
        columns: ['revenue', 'profit', 'units_sold'],
      },
      priority: 'HIGH',
      timeout: 900000,
    };

    const result = await this.agentExecutor.executeTask(task);
    
    if (result.success) {
      // Generate report
      const reportTask: ClaudeAgentTask = {
        skillId: 'data-analyzer',
        capabilityId: 'generate_report',
        input: {
          analysisData: result.output,
          format: 'pdf',
          includeVisuals: true,
        },
        priority: 'MEDIUM',
      };

      const reportResult = await this.agentExecutor.executeTask(reportTask);
      return { analysis: result.output, report: reportResult.output };
    }
  }
}
```

### Example 4: Custom Skill Creation

```typescript
// Create a custom skill
const customSkill: ClaudeSkillMetadata = {
  id: 'custom-automation',
  name: 'Custom Automation',
  description: 'Automates custom business processes',
  version: '1.0.0',
  author: 'Your Name',
  type: 'project',
  path: './skills/custom-automation',
  source: 'local',
  installedAt: new Date(),
  updatedAt: new Date(),
  capabilities: [
    {
      id: 'process_order',
      name: 'Process Order',
      description: 'Processes customer orders automatically',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          action: { type: 'string', enum: ['approve', 'reject', 'hold'] },
        },
        required: ['orderId', 'action'],
      },
      permissions: ['read', 'write'],
    },
  ],
};

// Register the skill
await skillsRegistry.registerSkill(customSkill);

// Execute custom skill
const task: ClaudeAgentTask = {
  skillId: 'custom-automation',
  capabilityId: 'process_order',
  input: {
    orderId: 'ORD-12345',
    action: 'approve',
  },
  priority: 'HIGH',
};

const result = await agentExecutor.executeTask(task);
```

## Troubleshooting

### Common Issues

#### 1. API Key Errors

**Problem**: `ANTHROPIC_API_KEY not found`

**Solution**: 
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
# Or add to .env file
echo "ANTHROPIC_API_KEY=your-api-key-here" >> .env
```

#### 2. Skill Not Found

**Problem**: `Skill not found: web-scraper`

**Solution**:
- Verify skill directory structure
- Check SKILL.md file format
- Ensure skills registry is initialized
- Refresh skills: `POST /api/v1/claude-code/skills/refresh`

#### 3. Model Timeout

**Problem**: Task execution times out

**Solution**:
- Increase task timeout
- Check network connectivity
- Verify model availability
- Monitor system resources

#### 4. Tool Permission Errors

**Problem**: `Tool not allowed: computer_move_mouse`

**Solution**:
- Check `allowedTools` in skill manifest
- Verify tool permissions in Claude Code
- Update skill manifest with required tools

#### 5. File System Access

**Problem**: Cannot read/write files

**Solution**:
- Check file permissions
- Verify file paths are absolute
- Ensure directories exist
- Check disk space

### Debug Mode

Enable debug logging:

```typescript
const config: ClaudeCodeIntegrationConfig = {
  // ... other config
  verboseLogging: true,
};
```

Monitor logs:
```bash
# View application logs
tail -f logs/application.log

# View debug logs
DEBUG=claude-code-integration:* npm run start:dev
```

### Health Checks

Check system health:

```bash
# Check overall health
curl GET http://localhost:3000/api/v1/claude-code/health

# Check model health
curl GET http://localhost:3000/api/v1/claude-code/models/sonnet-4/test

# Get detailed status
curl GET http://localhost:3000/api/v1/claude-code/status
```

### Performance Issues

**Slow Task Execution**:
- Increase timeout values
- Check network latency
- Monitor CPU and memory usage
- Optimize skill implementation

**High Resource Usage**:
- Limit concurrent tasks
- Implement resource quotas
- Monitor memory leaks
- Use streaming responses

**API Rate Limiting**:
- Implement retry logic
- Add exponential backoff
- Monitor API usage
- Contact Anthropic for higher limits

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `SKILL_NOT_FOUND` | Skill ID not registered | Check skill registry |
| `MODEL_NOT_FOUND` | Model name invalid | Verify model configuration |
| `TASK_EXECUTION_ERROR` | Task failed to execute | Check logs and retry |
| `TIMEOUT_ERROR` | Task exceeded timeout | Increase timeout |
| `PERMISSION_DENIED` | Insufficient permissions | Check tool permissions |
| `API_KEY_INVALID` | Invalid Anthropic API key | Verify API key |

## Best Practices

### 1. Skill Design

- **Focused Capabilities**: Each skill should have a specific, focused purpose
- **Clear Documentation**: Provide comprehensive SKILL.md files
- **Input Validation**: Validate inputs in skill manifests
- **Error Handling**: Implement robust error handling
- **Version Control**: Version skills properly for updates

### 2. Task Management

- **Appropriate Priorities**: Set task priorities based on importance
- **Timeout Configuration**: Set reasonable timeouts for different task types
- **Progress Monitoring**: Implement progress tracking for long-running tasks
- **Resource Management**: Monitor and limit resource usage

### 3. Error Handling

- **Graceful Degradation**: Handle failures gracefully
- **Retry Logic**: Implement exponential backoff for retries
- **Circuit Breakers**: Prevent cascading failures
- **Detailed Logging**: Log errors with context for debugging

### 4. Security

- **API Key Management**: Store API keys securely
- **Input Sanitization**: Sanitize all user inputs
- **Access Control**: Implement proper access controls
- **Audit Logging**: Track all operations for security

### 5. Performance

- **Parallel Execution**: Execute independent tasks in parallel
- **Caching**: Cache results when appropriate
- **Resource Optimization**: Optimize memory and CPU usage
- **Monitoring**: Monitor performance metrics

### 6. Monitoring and Observability

- **Health Checks**: Implement comprehensive health checks
- **Metrics Collection**: Collect performance and usage metrics
- **Alerting**: Set up alerts for critical issues
- **Logging**: Implement structured logging

### 7. Configuration Management

- **Environment Variables**: Use environment variables for configuration
- **Configuration Validation**: Validate configuration at startup
- **Hot Reloading**: Support configuration changes without restart
- **Secrets Management**: Use secure secrets management

## Migration Guide

### From Previous Versions

If you're migrating from an older version of the Claude Code integration:

#### Version 0.x to 1.x

**Breaking Changes**:
- API endpoint changes
- Skill manifest format updates
- Task execution interface changes

**Migration Steps**:

1. **Update Dependencies**:
   ```bash
   npm update @anthropic-ai/sdk js-yaml
   ```

2. **Update API Endpoints**:
   ```typescript
   // Old
   const result = await api.executeSkill(task);
   
   // New
   const result = await agentExecutor.executeTask(task);
   ```

3. **Update Skill Manifests**:
   ```yaml
   # Old format
   - name: web-scraper
     capabilities: [scrape]
   
   # New format
   ---
   name: "Web Scraper"
   description: "Scrape data from websites"
   version: "1.0.0"
   author: "Your Name"
   capabilities:
     - id: "scrape"
       name: "Scrape Website"
       description: "Extract data from URLs"
   ---
   ```

4. **Update Configuration**:
   ```typescript
   // Old
   const config = {
     apiKey: process.env.ANTHROPIC_API_KEY,
     model: 'sonnet-4',
   };
   
   // New
   const config: ClaudeCodeIntegrationConfig = {
     enabled: true,
     models: [{ name: 'sonnet-4', provider: 'anthropic', capabilities: ['text', 'code', 'tools'] }],
     skillsPath: { /* paths */ },
     // ... other config
   };
   ```

### From Other Integrations

If migrating from other Claude Code integrations:

#### From Claude CLI

**Steps**:
1. Export skills from Claude CLI
2. Convert to SKILL.md format
3. Register with skills registry
4. Update task execution code

#### From Direct API Usage

**Steps**:
1. Wrap API calls in skill definitions
2. Implement skill registry
3. Update to use agent executor
4. Add monitoring and management

### Data Migration

**Skill Data**:
```bash
# Export existing skills
cp -r ~/.claude/skills ./backup/

# Import to new structure
mkdir -p .claude/skills
cp -r ./backup/* .claude/skills/
```

**Task Data**:
```typescript
// Migrate task history
const oldTasks = await loadOldTasks();
for (const task of oldTasks) {
  await saveNewTaskFormat(task);
}
```

## Support and Contributing

### Getting Help

- **Documentation**: Check this guide and API documentation
- **Issues**: Report bugs on GitHub
- **Community**: Join our Discord/Slack community
- **Support**: Contact support for enterprise customers

### Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Implement your changes**
4. **Add tests**
5. **Update documentation**
6. **Submit a pull request**

### Code Style

- Follow TypeScript/JavaScript best practices
- Use meaningful variable names
- Add comprehensive comments
- Write unit tests
- Follow existing code patterns

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run all tests
npm run test:all
```

## License

This integration is licensed under the same license as the Goose Bridge project. See LICENSE file for details.

## Changelog

### v1.0.0 (Current)
- Initial release
- Skills registry and management
- Agent execution engine
- Model service with streaming
- REST API endpoints
- Example skills and documentation

### Future Versions
- Enhanced monitoring and analytics
- Advanced skill discovery
- Machine learning integration
- Performance optimizations
- Additional model providers

## Contact

For questions, support, or enterprise licensing:

- **Email**: support@goose.ai
- **Website**: https://goose.ai
- **GitHub**: https://github.com/goose-ai/goose-bridge
- **Discord**: https://discord.gg/goose-ai
