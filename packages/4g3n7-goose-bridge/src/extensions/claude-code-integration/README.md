# Claude Code Integration for Goose Bridge

This integration brings Claude Code's agent capabilities and skills system into the Goose AI Agent platform, enabling powerful autonomous task execution and skill-based workflows.

## Features

### 🧠 Agent Capabilities
- **Autonomous Task Execution**: Leverage Claude's agent mode for complex, multi-step tasks
- **Tool Integration**: Full support for Claude Code's computer use tools (mouse, keyboard, screenshots)
- **Smart Task Routing**: Automatically route tasks to appropriate skills based on descriptions

### 🛠️ Skills System
- **Skill Registry**: Centralized management of Personal, Project, and Plugin skills
- **Automatic Discovery**: Scan file system for skills in standard Claude Code locations
- **Skill Metadata**: Rich metadata including capabilities, permissions, and dependencies
- **Content Extraction**: Parse SKILL.md files and extract code blocks, sections, and examples

### 🤖 Model Management
- **Multi-Model Support**: Support for Sonnet, Opus, and Haiku models
- **Streaming Responses**: Real-time streaming of Claude's responses
- **Health Monitoring**: Built-in health checks and connection validation
- **Dynamic Configuration**: Runtime model switching and capability detection

## Architecture

```
Claude Code Integration
├── Skills Registry Service
│   ├── File System Scanner
│   ├── YAML Manifest Parser
│   ├── Content Block Extractor
│   └── Skill Lifecycle Management
├── Agent Executor Service
│   ├── Task Queue Management
│   ├── Claude API Integration
│   ├── Tool Usage Handling
│   └── Response Processing
└── Model Service
    ├── Anthropic Client
    ├── Response Streaming
    ├── Health Monitoring
    └── Capability Detection
```

## Quick Start

### 1. Environment Setup

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

### 2. Module Integration

Add the Claude Code Integration module to your Goose Bridge application:

```typescript
import { ClaudeCodeIntegrationModule } from './extensions/claude-code-integration/claude-code-integration.module';

@Module({
  imports: [
    ClaudeCodeIntegrationModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 3. Initialize Skills Registry

```typescript
onModuleInit() {
  await this.skillsRegistry.initialize();
}
```

## API Endpoints

### Skills Management

- `GET /api/v1/claude-code/skills` - List all skills
- `GET /api/v1/claude-code/skills/:skillId` - Get skill details
- `GET /api/v1/claude-code/skills/:skillId/manifest` - Get skill manifest
- `GET /api/v1/claude-code/skills/:skillId/content` - Get skill content
- `POST /api/v1/claude-code/skills` - Register new skill
- `PUT /api/v1/claude-code/skills/:skillId` - Update skill
- `DELETE /api/v1/claude-code/skills/:skillId` - Unregister skill
- `POST /api/v1/claude-code/skills/refresh` - Refresh skills from filesystem

### Agent Execution

- `POST /api/v1/claude-code/tasks` - Execute task
- `GET /api/v1/claude-code/tasks/:taskId` - Get task status
- `POST /api/v1/claude-code/tasks/:taskId/cancel` - Cancel task
- `GET /api/v1/claude-code/tasks/active` - List active tasks

### Model Management

- `GET /api/v1/claude-code/models` - List available models
- `GET /api/v1/claude-code/models/:modelName` - Get model details
- `GET /api/v1/claude-code/models/:modelName/capabilities` - Get model capabilities
- `GET /api/v1/claude-code/models/:modelName/test` - Test model connection

## Skills Structure

### Skill Directory Layout

```
.claude/skills/
└── my-skill/
    ├── SKILL.md          # Skill manifest and content
    ├── script.sh         # Optional supporting script
    ├── template.txt      # Optional template
    └── data.json         # Optional data file
```

### SKILL.md Format

```yaml
---
name: "Web Scraper"
description: "Automatically scrape and extract data from websites"
version: "1.0.0"
author: "Your Name"
capabilities:
  - id: "scrape"
    name: "Scrape Website"
    description: "Extract data from a given URL"
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: "URL to scrape"
        selector:
          type: string
          description: "CSS selector for data extraction"
allowedTools:
  - "computer_type_text"
  - "computer_press_keys"
  - "computer_screenshot"
---
```

## Supported Tools

The integration supports all Claude Code computer use tools:

- **Mouse Tools**: `computer_move_mouse`, `computer_click_mouse`, `computer_drag_mouse`, `computer_scroll`
- **Keyboard Tools**: `computer_type_text`, `computer_press_keys`, `computer_type_keys`
- **System Tools**: `computer_screenshot`, `computer_application`, `computer_wait`
- **Task Tools**: `set_task_status`, `create_task`, `read_file`

## Task Execution

### Basic Task

```typescript
const task: ClaudeAgentTask = {
  skillId: "my-skill-id",
  capabilityId: "scrape",
  input: {
    url: "https://example.com",
    selector: ".data-class"
  },
  priority: "MEDIUM",
  timeout: 300000
};

const result = await agentExecutor.executeTask(task);
```

### Streaming Execution

```typescript
const stream = await modelService.generateResponseStream(
  systemPrompt,
  messages,
  model,
  tools,
  (chunk) => {
    console.log('Received chunk:', chunk);
  }
);
```

## Configuration

### Environment Variables

- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `CLAUDE_SKILLS_PATH_PERSONAL` - Personal skills directory (default: `~/.claude/skills`)
- `CLAUDE_SKILLS_PATH_PROJECT` - Project skills directory (default: `.claude/skills`)
- `CLAUDE_SKILLS_PATH_PLUGIN` - Plugin skills directory (default: `.claude/plugins`)

### Module Configuration

```typescript
const config: ClaudeCodeIntegrationConfig = {
  enabled: true,
  models: [
    {
      name: 'sonnet-4',
      provider: 'anthropic',
      capabilities: ['text', 'code', 'tools'],
      maxTokens: 200000,
      temperature: 0.7,
    }
  ],
  skillsPath: {
    personal: '~/.claude/skills',
    project: '.claude/skills',
    plugin: '.claude/plugins',
  },
  defaultTimeout: 300000,
  maxConcurrentTasks: 10,
  autoUpdateSkills: true,
  verboseLogging: true,
};
```

## Event System

The integration emits events for skill lifecycle and task execution:

- `skill.registered` - When a skill is registered
- `skill.updated` - When a skill is updated
- `skill.executed` - When a skill task completes successfully
- `skill.failed` - When a skill task fails
- `task.cancelled` - When a task is cancelled

## Monitoring and Logging

### Health Checks

```bash
# Check overall integration health
curl GET /api/v1/claude-code/health

# Check specific model health
curl GET /api/v1/claude-code/models/sonnet-4/test
```

### Status Dashboard

```bash
# Get comprehensive status
curl GET /api/v1/claude-code/status
```

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure `ANTHROPIC_API_KEY` is set correctly
2. **Skill Not Found**: Verify skill directory structure and SKILL.md format
3. **Model Timeout**: Increase task timeout or check network connectivity
4. **Tool Permissions**: Check `allowedTools` in skill manifest

### Debug Mode

Enable verbose logging by setting:

```bash
export DEBUG=claude-code-integration:*
```

## Examples

### Creating a Custom Skill

1. Create skill directory:
```bash
mkdir -p .claude/skills/web-scraper
```

2. Create SKILL.md:
```markdown
---
name: "Web Scraper"
description: "Scrape data from websites using CSS selectors"
version: "1.0.0"
author: "Your Name"
capabilities:
  - id: "scrape"
    name: "Scrape Website"
    description: "Extract data from a given URL"
    inputSchema:
      type: object
      properties:
        url:
          type: string
          description: "URL to scrape"
        selector:
          type: string
          description: "CSS selector for data extraction"
allowedTools:
  - "computer_type_text"
  - "computer_screenshot"
---

# Web Scraper Skill

This skill allows Claude to scrape websites and extract data using CSS selectors.

## Usage

1. Provide a URL to scrape
2. Specify a CSS selector for the data you want to extract
3. Claude will navigate to the page and extract the requested data

## Examples

```json
{
  "url": "https://news.ycombinator.com",
  "selector": ".storylink"
}
```
```

3. Refresh skills:
```bash
curl POST /api/v1/claude-code/skills/refresh
```

4. Execute task:
```bash
curl POST /api/v1/claude-code/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "skillId": "web-scraper",
    "capabilityId": "scrape",
    "input": {
      "url": "https://example.com",
      "selector": ".data"
    },
    "priority": "MEDIUM"
  }'
```

## Contributing

1. Implement new tool definitions in `skills.interface.ts`
2. Add tool handlers in `agent-executor.service.ts`
3. Update model service for new API features
4. Add tests for new functionality

## License

This integration is part of the Goose Bridge project and follows the same license terms.
