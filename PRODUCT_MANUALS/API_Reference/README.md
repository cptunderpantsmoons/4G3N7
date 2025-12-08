# API Reference

This document provides comprehensive API documentation for 4G3N7, including REST endpoints, WebSocket events, and data models.

## Table of Contents

1. [Authentication](#authentication)
2. [REST API](#rest-api)
3. [WebSocket API](#websocket-api)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Authentication

### JWT Authentication

All API requests require JWT authentication. Tokens are obtained through the authentication endpoints.

#### Obtaining a Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### Using the Token

Include the token in the `Authorization` header for all requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## REST API

### Base URL

```
http://localhost:9991/api/v1
```

### Task Management

#### Create Task

```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "web-scraping",
  "description": "Scrape product data from e-commerce sites",
  "priority": "HIGH",
  "payload": {
    "urls": ["https://example.com/products"],
    "selectors": ["h1", ".price", ".description"]
  }
}
```

**Response (201 Created):**
```json
{
  "id": "task-123",
  "type": "web-scraping",
  "description": "Scrape product data from e-commerce sites",
  "status": "PENDING",
  "priority": "HIGH",
  "progress": 0,
  "userId": "user-123",
  "createdAt": "2025-12-07T10:00:00.000Z",
  "payload": {
    "urls": ["https://example.com/products"],
    "selectors": ["h1", ".price", ".description"]
  }
}
```

#### Get Task

```http
GET /tasks/{taskId}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "task-123",
  "type": "web-scraping",
  "description": "Scrape product data from e-commerce sites",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "progress": 75,
  "userId": "user-123",
  "createdAt": "2025-12-07T10:00:00.000Z",
  "startedAt": "2025-12-07T10:01:00.000Z",
  "payload": {
    "urls": ["https://example.com/products"],
    "selectors": ["h1", ".price", ".description"]
  },
  "results": {
    "success": true,
    "data": {
      "products": [
        {
          "title": "Product 1",
          "price": "$99.99",
          "description": "Product description"
        }
      ]
    }
  }
}
```

#### List Tasks

```http
GET /tasks?status=IN_PROGRESS&priority=HIGH&page=1&limit=10
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "tasks": [
    {
      "id": "task-123",
      "type": "web-scraping",
      "description": "Scrape product data from e-commerce sites",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "progress": 75,
      "createdAt": "2025-12-07T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Cancel Task

```http
POST /tasks/{taskId}/cancel
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Task cancelled successfully",
  "taskId": "task-123",
  "status": "CANCELLED"
}
```

#### Get Task Results

```http
GET /tasks/{taskId}/results
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "taskId": "task-123",
  "success": true,
  "data": {
    "products": [
      {
        "title": "Product 1",
        "price": "$99.99",
        "description": "Product description"
      }
    ]
  },
  "metadata": {
    "processedAt": "2025-12-07T10:05:00.000Z",
    "duration": 300000
  }
}
```

### File Management

#### Upload Files

```http
POST /files
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary file data]
taskId: task-123
```

**Response (201 Created):**
```json
{
  "id": "file-123",
  "name": "document.pdf",
  "size": 1024000,
  "type": "application/pdf",
  "taskId": "task-123",
  "createdAt": "2025-12-07T10:00:00.000Z"
}
```

#### List Files

```http
GET /files?taskId=task-123
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "file-123",
    "name": "document.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "taskId": "task-123",
    "createdAt": "2025-12-07T10:00:00.000Z"
  }
]
```

#### Download File

```http
GET /files/{fileId}/download
Authorization: Bearer <token>
```

**Response (200 OK):**
Binary file data with appropriate Content-Type header.

### Desktop Control

#### Take Screenshot

```http
POST /desktop/screenshot
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

#### Send Keyboard Input

```http
POST /desktop/keyboard
Authorization: Bearer <token>
Content-Type: application/json

{
  "keys": ["Ctrl", "C"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Keyboard input sent"
}
```

#### Send Mouse Click

```http
POST /desktop/mouse/click
Authorization: Bearer <token>
Content-Type: application/json

{
  "x": 100,
  "y": 200
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Mouse click sent"
}
```

### Goose Bridge API

#### List Extensions

```http
GET /goose/extensions
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": "web-scraper",
    "name": "Web Scraper",
    "version": "1.0.0",
    "description": "Extract data from websites",
    "status": "ACTIVE"
  }
]
```

#### Execute Extension

```http
POST /goose/extensions/{extensionId}/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "payload": {
    "url": "https://example.com",
    "selectors": ["h1", "p"]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "content": "This domain is established..."
  },
  "metadata": {
    "executionTime": 2000
  }
}
```

### System Monitoring

#### Health Check

```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-07T10:00:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "aiProvider": "healthy"
  }
}
```

#### System Metrics

```http
GET /metrics
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "cpu": {
    "usage": 45.2,
    "cores": 4
  },
  "memory": {
    "used": 2048,
    "total": 8192,
    "percentage": 25.0
  },
  "tasks": {
    "pending": 5,
    "inProgress": 3,
    "completed": 150
  }
}
```

---

## WebSocket API

### Connection

Connect to the WebSocket endpoint:

```
ws://localhost:9991/ws?token=<jwt_token>
```

### Events

#### Task Updates

**Client receives:**
```json
{
  "type": "task_update",
  "timestamp": "2025-12-07T10:00:00.000Z",
  "data": {
    "taskId": "task-123",
    "status": "IN_PROGRESS",
    "progress": 50,
    "message": "Processing data..."
  }
}
```

#### Desktop Events

**Client receives:**
```json
{
  "type": "desktop_event",
  "timestamp": "2025-12-07T10:00:00.000Z",
  "data": {
    "action": "screenshot",
    "payload": {
      "screenshot": "data:image/png;base64,..."
    }
  }
}
```

#### System Events

**Client receives:**
```json
{
  "type": "system_event",
  "timestamp": "2025-12-07T10:00:00.000Z",
  "data": {
    "event": "task_completed",
    "taskId": "task-123",
    "duration": 300000
  }
}
```

#### Sending Commands

**Client sends:**
```json
{
  "type": "task_command",
  "data": {
    "command": "cancel",
    "taskId": "task-123"
  }
}
```

---

## Data Models

### Task

```typescript
interface Task {
  id: string;
  type: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  payload: any;
  userId: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
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

### File

```typescript
interface File {
  id: string;
  name: string;
  size: number;
  type: string;
  taskId: string;
  createdAt: Date;
}
```

### User

```typescript
interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}
```

### Extension

```typescript
interface Extension {
  id: string;
  name: string;
  version: string;
  description: string;
  status: ExtensionStatus;
  config: any;
}

enum ExtensionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR'
}
```

---

## Error Handling

### Error Response Format

All API errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "timestamp": "2025-12-07T10:00:00.000Z",
    "path": "/api/v1/auth/login"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Rate Limiting

### Limits

- **Authentication**: 5 requests per minute per IP
- **Task Operations**: 60 requests per minute per user
- **File Operations**: 30 requests per minute per user
- **Desktop Control**: 100 requests per minute per user

### Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1641072000
```

### Exceeding Limits

When rate limits are exceeded:

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 60,
      "remaining": 0,
      "resetTime": "2025-12-07T10:01:00.000Z"
    }
  }
}
```

---

## Examples

### JavaScript/Node.js

```javascript
class TaskApiClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async createTask(taskData) {
    const response = await fetch(`${this.baseUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getTask(taskId) {
    const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async watchTask(taskId, onUpdate) {
    const socket = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws?token=${this.token}`);

    socket.addEventListener('open', () => {
      console.log('Connected to WebSocket');
    });

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'task_update' && message.data.taskId === taskId) {
        onUpdate(message.data);
      }
    });

    return socket;
  }
}

// Usage
const client = new TaskApiClient('http://localhost:9991', 'your-jwt-token');

const task = await client.createTask({
  type: 'web-scraping',
  description: 'Scrape product data',
  payload: { urls: ['https://example.com'] }
});

const socket = client.watchTask(task.id, (update) => {
  console.log(`Task ${update.status} - ${update.progress}%`);
});
```

### Python

```python
import requests
import websocket
import json

class TaskApiClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def create_task(self, task_data):
        response = requests.post(
            f'{self.base_url}/api/v1/tasks',
            headers=self.headers,
            json=task_data
        )
        response.raise_for_status()
        return response.json()

    def get_task(self, task_id):
        response = requests.get(
            f'{self.base_url}/api/v1/tasks/{task_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

    def watch_task(self, task_id, callback):
        ws_url = f'{self.base_url.replace("http", "ws")}/ws?token={self.token}'
        
        def on_message(ws, message):
            data = json.loads(message)
            if data['type'] == 'task_update' and data['data']['taskId'] == task_id:
                callback(data['data'])

        def on_error(ws, error):
            print(f'WebSocket error: {error}')

        def on_close(ws, close_status_code, close_msg):
            print('WebSocket connection closed')

        ws = websocket.WebSocketApp(ws_url,
                                  on_message=on_message,
                                  on_error=on_error,
                                  on_close=on_close)
        ws.run_forever()
        return ws

# Usage
client = TaskApiClient('http://localhost:9991', 'your-jwt-token')

task = client.create_task({
    'type': 'web-scraping',
    'description': 'Scrape product data',
    'payload': {'urls': ['https://example.com']}
})

def on_update(update):
    print(f"Task {update['status']} - {update['progress']}%")

client.watch_task(task['id'], on_update)
```

### cURL

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:9991/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.token')

# Create task
curl -X POST http://localhost:9991/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web-scraping",
    "description": "Scrape product data",
    "payload": {
      "urls": ["https://example.com"],
      "selectors": ["h1", "p"]
    }
  }'

# Get task status
curl -X GET http://localhost:9991/api/v1/tasks/task-123 \
  -H "Authorization: Bearer $TOKEN"

# Upload file
curl -X POST http://localhost:9991/api/v1/files \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "taskId=task-123"
```

---

## Additional Resources

### Documentation
- [📖 User Guide](../User_Guide/README.md)
- [🔧 Administrator Guide](../Administrator_Guide/README.md)
- [💻 Developer Guide](../Developer_Guide/README.md)
- [🔗 Integration Guide](../Integration_Guide/README.md)

### Tools
- [Postman Collection](https://github.com/4g3n7/postman-collection)
- [OpenAPI Specification](https://github.com/4g3n7/openapi-spec)
- [SDKs](https://github.com/4g3n7/sdks)

### Support
- [API Issues](https://github.com/4g3n7/4g3n7/issues?q=is%3Aissue+label%3Aapi)
- [Developer Forum](https://community.4g3n7.io/developers)

---

**Next Steps:**
- [User Guide](../User_Guide/README.md) - For end-users
- [Administrator Guide](../Administrator_Guide/README.md) - For system administrators
- [Developer Guide](../Developer_Guide/README.md) - For developers
- [Integration Guide](../Integration_Guide/README.md) - Integration documentation