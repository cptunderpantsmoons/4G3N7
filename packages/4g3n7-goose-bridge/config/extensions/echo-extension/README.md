# Example Echo Extension

This is a simple example extension that demonstrates how to create a Goose extension for the 4G3N7 platform.

## What it does

The Echo Extension simply returns the input data back to the caller, demonstrating the basic extension lifecycle.

## Installation

1. Copy this directory to your extensions folder
2. The extension will be auto-discovered by the bridge
3. No additional dependencies required

## Usage

Submit a task:

```bash
curl -X POST http://localhost:9992/api/v1/goose/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "echo",
    "extensionId": "echo-extension",
    "payload": {
      "message": "Hello, Goose!"
    }
  }'
```

Get the result:

```bash
curl http://localhost:9992/api/v1/goose/tasks/{taskId}/results
```

## Extension Structure

- `manifest.json` - Extension metadata and capabilities
- `index.ts` - Extension implementation
- `README.md` - This file
