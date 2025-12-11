---
name: "Task Orchestrator"
description: "Orchestrate complex multi-step workflows and manage task dependencies"
version: "1.0.0"
author: "Goose Bridge Team"
capabilities:
  - id: "execute_workflow"
    name: "Execute Workflow"
    description: "Execute a complex workflow with multiple steps and dependencies"
    inputSchema:
      type: object
      properties:
        workflow:
          type: object
          properties:
            name:
              type: string
              description: "Name of the workflow"
            steps:
              type: array
              items: { type: object }
              description: "List of workflow steps"
            dependencies:
              type: array
              items: { type: object }
              description: "Task dependencies"
            timeout:
              type: integer
              description: "Workflow timeout in milliseconds"
        context:
          type: object
          description: "Execution context and parameters"
  - id: "monitor_workflow"
    name: "Monitor Workflow"
    description: "Monitor and manage running workflows"
    inputSchema:
      type: object
      properties:
        workflowId:
          type: string
          description: "ID of the workflow to monitor"
        action:
          type: string
          enum: ["status", "pause", "resume", "cancel", "restart"]
          description: "Action to perform on the workflow"
allowedTools:
  - "computer_type_text"
  - "computer_press_keys"
  - "computer_screenshot"
  - "create_task"
  - "set_task_status"
---

# Task Orchestrator Skill

This skill enables Claude to manage complex, multi-step workflows with sophisticated dependency management, parallel execution, and real-time monitoring capabilities.

## Capabilities

### Execute Workflow

Orchestrate complex workflows with:
- **Multiple Steps**: Define sequential and parallel task execution
- **Dependencies**: Manage task dependencies and execution order
- **Error Handling**: Automatic retry and failure recovery
- **Resource Management**: Optimize resource allocation
- **Timeout Management**: Handle long-running and time-sensitive tasks

### Monitor Workflow

Real-time workflow management:
- **Status Tracking**: Monitor progress and completion status
- **Dynamic Control**: Pause, resume, or cancel workflows
- **Performance Monitoring**: Track execution metrics and bottlenecks
- **Alert Management**: Handle failures and exceptions

## Usage Examples

### Simple Sequential Workflow

```json
{
  "workflow": {
    "name": "Data Processing Pipeline",
    "steps": [
      {
        "id": "extract",
        "name": "Extract Data",
        "description": "Extract data from source systems",
        "command": "python extract.py",
        "timeout": 300000
      },
      {
        "id": "transform",
        "name": "Transform Data",
        "description": "Transform data for analysis",
        "command": "python transform.py",
        "timeout": 600000
      },
      {
        "id": "load",
        "name": "Load Data",
        "description": "Load data into target system",
        "command": "python load.py",
        "timeout": 300000
      }
    ],
    "dependencies": [
      { "from": "extract", "to": "transform" },
      { "from": "transform", "to": "load" }
    ],
    "timeout": 1200000
  },
  "context": {
    "environment": "production",
    "priority": "high"
  }
}
```

### Parallel Workflow

```json
{
  "workflow": {
    "name": "Website Deployment",
    "steps": [
      {
        "id": "build_frontend",
        "name": "Build Frontend",
        "command": "npm run build",
        "timeout": 300000
      },
      {
        "id": "build_backend",
        "name": "Build Backend",
        "command": "mvn clean package",
        "timeout": 600000
      },
      {
        "id": "deploy",
        "name": "Deploy Application",
        "command": "kubectl apply -f deployment.yaml",
        "timeout": 180000
      }
    ],
    "dependencies": [
      { "from": "build_frontend", "to": "deploy" },
      { "from": "build_backend", "to": "deploy" }
    ]
  }
}
```

### Complex Workflow with Conditions

```json
{
  "workflow": {
    "name": "CI/CD Pipeline",
    "steps": [
      {
        "id": "test",
        "name": "Run Tests",
        "command": "npm test",
        "condition": "always"
      },
      {
        "id": "security_scan",
        "name": "Security Scan",
        "command": "sonar-scanner",
        "condition": "on_success(test)"
      },
      {
        "id": "deploy_staging",
        "name": "Deploy to Staging",
        "command": "kubectl apply -f staging.yaml",
        "condition": "on_success(test, security_scan)"
      },
      {
        "id": "integration_tests",
        "name": "Integration Tests",
        "command": "npm run test:integration",
        "condition": "on_success(deploy_staging)"
      },
      {
        "id": "deploy_production",
        "name": "Deploy to Production",
        "command": "kubectl apply -f production.yaml",
        "condition": "on_success(integration_tests)"
      }
    ]
  }
}
```

## Implementation Details

This skill uses advanced workflow orchestration techniques:

1. **Dependency Resolution**: Build execution graph from dependencies
2. **Parallel Execution**: Execute independent tasks concurrently
3. **Resource Management**: Optimize CPU and memory usage
4. **Error Recovery**: Automatic retry and rollback mechanisms
5. **Progress Tracking**: Real-time status updates and metrics

## Workflow Configuration

### Step Definition

```json
{
  "id": "unique_step_id",
  "name": "Human-readable name",
  "description": "Detailed description",
  "command": "command to execute",
  "timeout": 300000,
  "retries": 3,
  "retryDelay": 5000,
  "environment": {
    "VAR1": "value1",
    "VAR2": "value2"
  },
  "workingDirectory": "/path/to/working/dir",
  "condition": "execution_condition"
}
```

### Dependency Types

```json
{
  "dependencies": [
    {
      "from": "step_id_1",
      "to": "step_id_2",
      "type": "finish_to_start",  // or start_to_start, finish_to_finish, start_to_finish
      "condition": "success"      // or failure, always
    }
  ]
}
```

### Environment Configuration

```json
{
  "context": {
    "environment": "development|staging|production",
    "priority": "low|medium|high|urgent",
    "resources": {
      "cpu": "2",
      "memory": "4Gi",
      "storage": "10Gi"
    },
    "notifications": {
      "on_start": true,
      "on_completion": true,
      "on_failure": true,
      "channels": ["email", "slack"]
    }
  }
}
```

## Execution Modes

### Sequential Execution
Tasks execute one after another in defined order.

### Parallel Execution
Independent tasks execute concurrently to optimize performance.

### Conditional Execution
Tasks execute based on conditions and previous step results.

### Dynamic Execution
Workflow adapts based on runtime conditions and data.

## Output Format

### Workflow Execution Results

```json
{
  "success": true,
  "workflowId": "workflow-12345",
  "name": "Data Processing Pipeline",
  "status": "completed",
  "steps": [
    {
      "id": "extract",
      "name": "Extract Data",
      "status": "completed",
      "startTime": "2024-01-01T12:00:00Z",
      "endTime": "2024-01-01T12:05:00Z",
      "duration": 300000,
      "output": "/data/extracted/data.csv",
      "error": null
    },
    {
      "id": "transform",
      "name": "Transform Data",
      "status": "completed",
      "startTime": "2024-01-01T12:05:00Z",
      "endTime": "2024-01-01T12:15:00Z",
      "duration": 600000,
      "output": "/data/transformed/data.parquet",
      "error": null
    }
  ],
  "metrics": {
    "totalSteps": 3,
    "completedSteps": 3,
    "failedSteps": 0,
    "totalDuration": 900000,
    "parallelEfficiency": 0.85
  },
  "metadata": {
    "startTime": "2024-01-01T12:00:00Z",
    "endTime": "2024-01-01T12:18:00Z",
    "timestamp": "2024-01-01T12:18:00Z"
  }
}
```

### Monitoring Results

```json
{
  "workflowId": "workflow-12345",
  "status": "running",
  "progress": {
    "completed": 2,
    "total": 5,
    "percentage": 40
  },
  "activeSteps": [
    {
      "id": "transform",
      "name": "Transform Data",
      "status": "running",
      "progress": {
        "percentage": 75,
        "currentTask": "Processing batch 3 of 4"
      }
    }
  ],
  "nextSteps": [
    {
      "id": "load",
      "name": "Load Data",
      "estimatedStart": "2024-01-01T12:20:00Z"
    }
  ],
  "metrics": {
    "throughput": "1000 records/second",
    "cpuUsage": "45%",
    "memoryUsage": "60%"
  }
}
```

## Advanced Features

### Error Handling and Recovery

```json
{
  "errorHandling": {
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMultiplier": 2,
      "maxDelay": 300000
    },
    "rollbackStrategy": "automatic",
    "circuitBreaker": {
      "enabled": true,
      "failureThreshold": 5,
      "timeout": 600000
    }
  }
}
```

### Resource Management

```json
{
  "resources": {
    "limits": {
      "cpu": "4",
      "memory": "8Gi",
      "storage": "50Gi"
    },
    "requests": {
      "cpu": "2",
      "memory": "4Gi"
    },
    "autoScaling": {
      "enabled": true,
      "minReplicas": 1,
      "maxReplicas": 10,
      "targetCPU": 70
    }
  }
}
```

### Notifications and Alerts

```json
{
  "notifications": {
    "webhooks": [
      {
        "url": "https://hooks.slack.com/workflows/abc123",
        "events": ["start", "completion", "failure"],
        "payload": {
          "workflow": "{workflow.name}",
          "status": "{workflow.status}",
          "duration": "{workflow.duration}"
        }
      }
    ],
    "alerts": [
      {
        "condition": "step.duration > 600000",
        "severity": "warning",
        "message": "Step {step.name} is taking longer than expected"
      }
    ]
  }
}
```

### Workflow Templates

```json
{
  "template": "ci-cd-pipeline",
  "parameters": {
    "repository": "my-app",
    "branch": "main",
    "environments": ["staging", "production"],
    "testSuites": ["unit", "integration", "e2e"]
  }
}
```

## Error Handling

The skill provides comprehensive error management:
- **Automatic Retry**: Configurable retry policies with exponential backoff
- **Rollback Mechanisms**: Automatic rollback on failure
- **Circuit Breaker**: Prevent cascading failures
- **Graceful Degradation**: Continue with reduced functionality
- **Detailed Error Reporting**: Comprehensive error diagnostics

## Best Practices

1. **Modular Design**: Break complex workflows into smaller steps
2. **Dependency Management**: Clearly define task dependencies
3. **Error Recovery**: Implement robust error handling
4. **Resource Optimization**: Configure appropriate resource limits
5. **Monitoring**: Set up comprehensive monitoring and alerting
6. **Documentation**: Document workflow logic and dependencies

## Integration with Goose

This skill integrates with Goose's orchestration system:

- **Task Coordination**: Coordinate with other Goose tasks
- **Resource Sharing**: Share resources across workflows
- **Event Integration**: Participate in Goose's event system
- **Result Caching**: Cache workflow results for efficiency

## Security Considerations

- **Access Control**: Restrict workflow execution permissions
- **Secret Management**: Secure handling of credentials and secrets
- **Audit Logging**: Track all workflow executions and changes
- **Resource Isolation**: Isolate workflow resources for security

## Performance Optimization

- **Parallel Execution**: Maximize parallel task execution
- **Resource Allocation**: Optimize resource allocation
- **Caching**: Cache intermediate results when possible
- **Load Balancing**: Distribute load across available resources
- **Monitoring**: Monitor performance and optimize bottlenecks

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase step or workflow timeout values
2. **Resource Exhaustion**: Adjust resource limits and requests
3. **Dependency Deadlocks**: Review and fix dependency cycles
4. **Performance Bottlenecks**: Identify and optimize slow steps
5. **Error Propagation**: Configure proper error handling

### Debug Mode

Enable detailed workflow logging:

```json
{
  "workflow": { /* workflow definition */ },
  "debug": {
    "enabled": true,
    "logLevel": "verbose",
    "captureOutputs": true,
    "traceDependencies": true
  }
}
```

## Workflow Patterns

### ETL Pipeline

```typescript
// Define ETL workflow
const etlWorkflow = {
  name: "Customer Data ETL",
  steps: [
    { id: "extract", command: "python extract_customers.py" },
    { id: "validate", command: "python validate_data.py" },
    { id: "transform", command: "python transform_data.py" },
    { id: "load", command: "python load_data.py" }
  ],
  dependencies: [
    { from: "extract", to: "validate" },
    { from: "validate", to: "transform" },
    { from: "transform", to: "load" }
  ]
};

// Execute with monitoring
const result = await executeWorkflow(etlWorkflow, {
  monitor: true,
  notifications: true,
  retryPolicy: { maxRetries: 3 }
});
```

### Machine Learning Pipeline

```typescript
// ML model training pipeline
const mlPipeline = {
  name: "Model Training Pipeline",
  steps: [
    { id: "data_prep", command: "python prepare_data.py", parallel: true },
    { id: "feature_eng", command: "python feature_engineering.py", parallel: true },
    { id: "train", command: "python train_model.py" },
    { id: "evaluate", command: "python evaluate_model.py" },
    { id: "deploy", command: "python deploy_model.py" }
  ],
  dependencies: [
    { from: "data_prep", to: "train" },
    { from: "feature_eng", to: "train" },
    { from: "train", to: "evaluate" },
    { from: "evaluate", to: "deploy" }
  ],
  resources: {
    train: { gpu: true, memory: "16Gi" },
    evaluate: { cpu: "4", memory: "8Gi" }
  }
};
```

### Microservices Deployment

```typescript
// Deploy microservices
const deploymentWorkflow = {
  name: "Microservices Deployment",
  steps: [
    { id: "build_api", command: "docker build -t api-service ." },
    { id: "build_worker", command: "docker build -t worker-service ." },
    { id: "build_queue", command: "docker build -t queue-service ." },
    { id: "deploy_api", command: "kubectl apply -f api-deployment.yaml" },
    { id: "deploy_worker", command: "kubectl apply -f worker-deployment.yaml" },
    { id: "health_check", command: "python health_check.py" }
  ],
  dependencies: [
    { from: "build_api", to: "deploy_api" },
    { from: "build_worker", to: "deploy_worker" },
    { from: "deploy_api", to: "health_check" },
    { from: "deploy_worker", to: "health_check" }
  ],
  parallel: ["build_api", "build_worker"],
  timeout: 1800000
};
```

## Future Enhancements

- Machine learning-based optimization
- Advanced dependency resolution algorithms
- Real-time workflow adaptation
- Predictive failure detection
- Intelligent resource allocation
- Advanced monitoring and analytics
- Integration with external systems
