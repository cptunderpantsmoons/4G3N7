# Goose Bridge Integration Guide for 4G3N7 Agent

## Quick Start

This guide shows how to integrate the Goose Bridge with the main 4G3N7 agent service.

## Step 1: Add Dependency

Add to `packages/4g3n7-agent/package.json`:

```json
{
  "dependencies": {
    "4g3n7-goose-bridge": "workspace:*"
  }
}
```

## Step 2: Import Module

Update `packages/4g3n7-agent/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { GooseBridgeModule } from '4g3n7-goose-bridge';

@Module({
  imports: [
    // ... existing imports
    GooseBridgeModule,
  ],
})
export class AppModule {}
```

## Step 3: Environment Configuration

Add to `.env`:

```env
# Goose Bridge Configuration
GOOSE_EXTENSION_PATH=./extensions
GOOSE_BRIDGE_ENABLED=true

# Redis for task queue (if not already configured)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Step 4: Verify Integration

Start the agent and check the endpoints:

```bash
# Health check
curl http://localhost:9991/api/v1/goose/health

# List extensions
curl http://localhost:9991/api/v1/goose/extensions
```

## Step 5: Submit Test Task

```bash
curl -X POST http://localhost:9991/api/v1/goose/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "echo",
    "extensionId": "echo-extension",
    "payload": {
      "message": "Hello from 4G3N7!"
    }
  }'
```

## API Integration

### From Other Services

```typescript
import { GooseBridgeService } from '4g3n7-goose-bridge';

@Injectable()
export class MyService {
  constructor(private readonly goose: GooseBridgeService) {}

  async processDocument(file: string) {
    const task = await this.goose.submitTask({
      type: 'extract_text',
      extensionId: 'document-processor',
      payload: { filePath: file },
    });

    // Poll for results
    const result = await this.goose.getTaskResult(task.taskId);
    return result;
  }
}
```

## Next Steps

1. Install dependencies: `npm install`
2. Start the agent: `npm run start:dev`
3. Test the integration
4. Deploy extensions to production

## Troubleshooting

### Extensions Not Loading
- Check `GOOSE_EXTENSION_PATH` environment variable
- Verify extension manifest.json is valid
- Check logs for extension loading errors

### Task Execution Fails
- Verify extension is loaded: `GET /api/v1/goose/extensions`
- Check extension health: `GET /api/v1/goose/health`
- Review task payload matches extension input schema

### API Errors
- Enable debug logging: `LOG_LEVEL=debug`
- Check CORS configuration
- Verify authentication (when implemented)

## Production Checklist

- [ ] Configure authentication and API keys
- [ ] Set up monitoring and alerts
- [ ] Configure resource limits for extensions
- [ ] Enable audit logging
- [ ] Set up backup and disaster recovery
- [ ] Load test the system
- [ ] Security audit
- [ ] Documentation review
