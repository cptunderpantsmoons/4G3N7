# Goose-4g3n7 Integration Guide

## Overview

This guide explains how to use Goose's specialized capabilities within the 4g3n7 agent framework. Goose provides advanced document processing, memory management, and specialized AI tools that enhance 4g3n7's automation capabilities.

## Architecture

The integration follows a bridge pattern:
- **4g3n7 Agent**: Main orchestration and task management
- **Goose Bridge**: API client for communicating with Goose services
- **Goose Agent**: Specialized document processing and memory management

## Basic Usage

### In Task Handlers

```typescript
import { GooseIntegration } from '../integrations/goose';

export class MyTaskHandler {
  async processDocument(filePath: string) {
    const goose = GooseIntegration.getInstance();

    // Process document
    const results = await goose.processDocument(
      filePath,
      'extract_data',
      { fields: ['date', 'total', 'vendor'] }
    );

    // Store in memory
    await goose.rememberMemory(
      `Processed ${filePath}: ${JSON.stringify(results)}`,
      'document_processing',
      ['finance', 'automation']
    );

    return results;
  }
}
```

### Document Processing Examples

#### Extract Invoice Data
```typescript
const result = await goose.processDocument(
  "/home/agent/invoices/Q4-2023.pdf",
  "extract_data",
  { fields: ["date", "amount", "vendor", "invoice_number"] }
);
```

#### Generate Document Summary
```typescript
const summary = await goose.processDocument(
  "/home/agent/reports/annual.docx",
  "generate_summary",
  { max_length: 500, include_key_points: true }
);
```

#### Convert Document Format
```typescript
const converted = await goose.processDocument(
  "/home/agent/document.docx",
  "convert_format",
  { target_format: "pdf" }
);
```

## Available Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `processDocument` | `filePath: string`, `action: string`, `params: object` | Process documents (PDF/DOCX/XLSX) |
| `rememberMemory` | `data: string`, `category: string`, `tags: string[]` | Store persistent information |

## Document Processing Actions

- `extract_text`: Full text extraction
- `extract_data`: Structured data extraction with field specification
- `convert_format`: Convert between formats (DOCX→PDF, XLSX→CSV, etc.)
- `generate_summary`: Create document summaries with key points

## Memory Management

### Categories
- `document_processing`: Document-related information
- `workflows`: Process and automation data
- `user_preferences`: User-specific settings
- `system_state`: Agent state information

### Tagging
Tags help organize and retrieve memories:
```typescript
await goose.rememberMemory(
  "Monthly report generation workflow",
  "workflows",
  ["reporting", "automation", "monthly"]
);
```

## Docker Configuration

The Goose service is automatically included in docker-compose.yml:

```yaml
goose-agent:
  image: gooseai/goose-agent:latest
  ports:
    - "9993:9993"
  environment:
    - PRODUCTION=true
    - LITELLM_EXTERNAL_LLM=anthropic
    - LITELLM_EXTERNAL_LLM_API_KEY=${ANTHROPIC_API_KEY}
    - MEMORY_STORE=postgres
    - PG_CONNECTION_STRING=postgresql://postgres:postgres@postgres:5432/4g3n7db
```

## Environment Variables

Set these in your `.env` file:
- `GOOSE_API_URL`: URL of the Goose service (default: http://goose-agent:9993)
- `ANTHROPIC_API_KEY`: Required for Goose's LLM capabilities

## Error Handling

The integration includes comprehensive error handling:

```typescript
try {
  const result = await goose.processDocument(filePath, 'extract_data');
  return { success: true, data: result };
} catch (error) {
  return { success: false, error: error.message };
}
```

## Security Considerations

- All communications use internal Docker networking
- API keys are environment-variable based
- File paths are validated before processing
- Memory operations include category-based access control

## Performance Notes

- Document processing is asynchronous and may take time for large files
- Memory operations are fast and suitable for real-time use
- Consider caching frequently accessed document data
- Large file processing should be queued for background execution

## Troubleshooting

### Common Issues

1. **Goose service not responding**
   - Check docker-compose logs: `docker-compose logs goose-agent`
   - Verify ANTHROPIC_API_KEY is set
   - Ensure PostgreSQL is accessible

2. **Document processing fails**
   - Verify file exists and is readable
   - Check file format is supported
   - Review Goose logs for specific error messages

3. **Memory operations fail**
   - Check PostgreSQL connectivity
   - Verify category names are valid
   - Ensure tags array is properly formatted

### Debug Mode

Enable detailed logging by setting:
```bash
LOG_LEVEL=debug
```

## Example Integration

See `/packages/4g3n7-agent/src/tasks/document-processing.task.ts` for a complete example of how to integrate Goose capabilities into 4g3n7 task workflows.
