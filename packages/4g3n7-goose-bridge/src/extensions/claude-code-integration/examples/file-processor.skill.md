---
name: "File Processor"
description: "Process and analyze files using various tools and techniques"
version: "1.0.0"
author: "Goose Bridge Team"
capabilities:
  - id: "read_file"
    name: "Read File"
    description: "Read and analyze file contents"
    inputSchema:
      type: object
      properties:
        path:
          type: string
          description: "File path to read"
        format:
          type: string
          enum: ["text", "json", "csv", "xml"]
          description: "Expected file format"
  - id: "write_file"
    name: "Write File"
    description: "Create or update files with new content"
    inputSchema:
      type: object
      properties:
        path:
          type: string
          description: "File path to write"
        content:
          type: string
          description: "Content to write to the file"
        mode:
          type: string
          enum: ["create", "overwrite", "append"]
          default: "create"
          description: "Write mode"
allowedTools:
  - "computer_type_text"
  - "computer_paste_text"
  - "computer_read_file"
---

# File Processor Skill

This skill enables Claude to read, analyze, and manipulate files on the system. It provides powerful file processing capabilities for various formats and operations.

## Capabilities

### Read File

Read and analyze files of different formats:
- **Text files**: Plain text, logs, documentation
- **JSON files**: Configuration files, data files
- **CSV files**: Spreadsheets, data exports
- **XML files**: Structured data, configuration

### Write File

Create and modify files:
- **Create**: New files with initial content
- **Overwrite**: Replace existing file content
- **Append**: Add content to existing files

## Usage Examples

### Read Configuration File

```json
{
  "path": "/app/config/settings.json",
  "format": "json"
}
```

### Process CSV Data

```json
{
  "path": "/data/users.csv",
  "format": "csv"
}
```

### Create Log File

```json
{
  "path": "/logs/process.log",
  "content": "Process started at 2024-01-01 12:00:00\n",
  "mode": "append"
}
```

### Generate Report

```json
{
  "path": "/reports/daily-summary.txt",
  "content": "# Daily Summary Report\n\nGenerated on: 2024-01-01\n\n## Summary\n...",
  "mode": "create"
}
```

## Implementation Details

This skill uses Claude's file system access capabilities to:

1. **Read Operations**:
   - Access files using absolute paths
   - Parse different file formats
   - Extract structured data
   - Handle encoding issues

2. **Write Operations**:
   - Create new files or modify existing ones
   - Handle file permissions
   - Ensure data integrity
   - Support atomic operations

## Supported File Formats

### Text Files (.txt, .log, .md)
- Plain text content
- Log files
- Documentation
- Configuration files

### JSON Files (.json)
- Structured data
- Configuration files
- API responses
- Data exports

### CSV Files (.csv)
- Spreadsheet data
- Database exports
- Contact lists
- Financial data

### XML Files (.xml)
- Structured documents
- Configuration files
- Data interchange format

## Output Formats

### Read File Results

```json
{
  "success": true,
  "path": "/app/config.json",
  "format": "json",
  "content": {
    "name": "MyApp",
    "version": "1.0.0",
    "settings": {
      "debug": true
    }
  },
  "metadata": {
    "size": 1024,
    "lines": 15,
    "encoding": "utf-8"
  }
}
```

### Write File Results

```json
{
  "success": true,
  "path": "/logs/process.log",
  "mode": "append",
  "writtenBytes": 512,
  "metadata": {
    "timestamp": "2024-01-01T12:00:00Z",
    "fileSize": 2048
  }
}
```

## Advanced Features

### File Pattern Matching

Process multiple files matching patterns:

```json
{
  "pattern": "/logs/*.log",
  "operation": "read",
  "format": "text"
}
```

### Batch Operations

Process multiple files in sequence:

```json
{
  "batch": [
    {
      "path": "/data/input1.csv",
      "format": "csv"
    },
    {
      "path": "/data/input2.csv",
      "format": "csv"
    }
  ]
}
```

### Data Transformation

Transform file contents during processing:

```json
{
  "path": "/data/source.json",
  "format": "json",
  "transform": {
    "operation": "filter",
    "condition": "status === 'active'"
  }
}
```

### File Validation

Validate file contents and structure:

```json
{
  "path": "/app/config.json",
  "format": "json",
  "validate": {
    "schema": {
      "required": ["name", "version"]
    }
  }
}
```

## Error Handling

The skill handles common file operations issues:
- File not found errors
- Permission denied errors
- Invalid file formats
- Encoding issues
- Disk space problems
- Network timeouts (for remote files)

## Best Practices

1. **Path Safety**: Always use absolute paths
2. **Backup Strategy**: Backup files before modification
3. **Atomic Operations**: Use append mode for logs
4. **Error Recovery**: Implement retry logic for transient failures
5. **Security**: Validate file paths to prevent directory traversal

## Integration with Goose

This skill integrates with Goose's workflow system:

- **Task Chaining**: Process files as part of larger workflows
- **Error Handling**: Automatic retry on failure
- **Progress Tracking**: Monitor file processing progress
- **Result Caching**: Cache processed file contents

## Security Considerations

- **Path Validation**: Prevent directory traversal attacks
- **Permission Checks**: Ensure proper file access permissions
- **Content Validation**: Validate file contents before processing
- **Sensitive Data**: Handle sensitive information securely

## Performance Optimization

- **Batch Processing**: Process multiple files together
- **Streaming**: Handle large files in chunks
- **Caching**: Cache frequently accessed files
- **Parallel Processing**: Process independent files concurrently

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check file permissions and ownership
2. **File Not Found**: Verify file path and existence
3. **Invalid Format**: Check file encoding and format
4. **Disk Full**: Monitor available disk space
5. **Network Issues**: Check network connectivity for remote files

### Debug Mode

Enable detailed logging:

```json
{
  "path": "/app/config.json",
  "format": "json",
  "debug": true,
  "verbose": true
}
```

## File Processing Patterns

### Configuration Management

Read and update application configuration:

```typescript
// Read config
const config = await readConfig('/app/config.json');

// Update setting
config.settings.debug = false;

// Write back
await writeConfig('/app/config.json', config);
```

### Log Analysis

Process and analyze log files:

```typescript
// Read log file
const logs = await readLogFile('/logs/app.log');

// Filter errors
const errors = logs.filter(entry => entry.level === 'ERROR');

// Generate report
await writeReport('/reports/errors.txt', errors);
```

### Data Migration

Transform and migrate data between formats:

```typescript
// Read CSV
const csvData = await readCSV('/data/users.csv');

// Transform
const jsonData = csvData.map(row => ({
  id: row.id,
  name: row.name,
  email: row.email
}));

// Write JSON
await writeJSON('/data/users.json', jsonData);
```

## Future Enhancements

- Compression support (gzip, zip)
- Encryption/decryption
- Version control integration
- Real-time file monitoring
- Cloud storage integration
- Advanced data validation
