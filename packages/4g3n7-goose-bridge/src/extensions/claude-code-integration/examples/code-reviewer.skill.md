---
name: "Code Reviewer"
description: "Perform automated code reviews with static analysis and best practice checks"
version: "1.0.0"
author: "Goose Bridge Team"
capabilities:
  - id: "review_file"
    name: "Review File"
    description: "Review a single code file for issues"
    inputSchema:
      type: object
      properties:
        filePath:
          type: string
          description: "Path to the code file to review"
        language:
          type: string
          enum: ["javascript", "python", "java", "go", "rust", "typescript"]
          description: "Programming language of the file"
        reviewType:
          type: string
          enum: ["security", "performance", "style", "best_practices", "all"]
          default: "all"
          description: "Type of review to perform"
  - id: "review_pull_request"
    name: "Review Pull Request"
    description: "Review multiple files in a pull request"
    inputSchema:
      type: object
      properties:
        baseBranch:
          type: string
          description: "Base branch for comparison"
        headBranch:
          type: string
          description: "Head branch with changes"
        files:
          type: array
          items: { type: string }
          description: "List of files to review"
allowedTools:
  - "computer_read_file"
  - "computer_type_text"
  - "computer_paste_text"
  - "computer_screenshot"
---

# Code Reviewer Skill

This skill automates code review processes, performing static analysis and checking code against best practices, security guidelines, and performance standards across multiple programming languages.

## Capabilities

### Review File

Perform detailed analysis of individual code files:
- **Security Review**: Identify security vulnerabilities and risky patterns
- **Performance Review**: Detect performance bottlenecks and optimization opportunities
- **Style Review**: Check coding style and formatting consistency
- **Best Practices**: Verify adherence to language-specific best practices
- **Comprehensive Review**: Full analysis across all categories

### Review Pull Request

Analyze multiple files in the context of a pull request:
- **Change Impact**: Assess the impact of changes
- **Consistency**: Ensure consistency across modified files
- **Regression Risk**: Identify potential regression risks
- **Merge Readiness**: Evaluate overall readiness for merge

## Usage Examples

### Single File Review

```json
{
  "filePath": "/src/components/UserService.js",
  "language": "javascript",
  "reviewType": "security"
}
```

### Performance Analysis

```json
{
  "filePath": "/src/algorithms/sort.py",
  "language": "python",
  "reviewType": "performance"
}
```

### Pull Request Review

```json
{
  "baseBranch": "main",
  "headBranch": "feature/new-auth-system",
  "files": [
    "/src/auth/login.js",
    "/src/auth/validate.js",
    "/tests/auth.test.js"
  ]
}
```

### Comprehensive Review

```json
{
  "filePath": "/src/main/java/com/app/DatabaseManager.java",
  "language": "java",
  "reviewType": "all"
}
```

## Implementation Details

This skill uses advanced static analysis techniques:

1. **Code Parsing**: Parse source code into AST (Abstract Syntax Tree)
2. **Pattern Matching**: Identify common patterns and anti-patterns
3. **Rule Evaluation**: Apply language-specific rules and best practices
4. **Context Analysis**: Analyze code in broader context
5. **Report Generation**: Create detailed review reports

## Supported Languages

### JavaScript/TypeScript
- **Security Checks**: XSS prevention, SQL injection, dependency vulnerabilities
- **Performance Checks**: Memory leaks, inefficient loops, async patterns
- **Style Checks**: ESLint compliance, naming conventions, formatting
- **Best Practices**: Module patterns, error handling, testing

### Python
- **Security Checks**: Input validation, cryptographic practices, dependency issues
- **Performance Checks**: Algorithmic complexity, memory usage, I/O operations
- **Style Checks**: PEP 8 compliance, docstring conventions
- **Best Practices**: Context managers, generators, type hints

### Java
- **Security Checks**: OWASP Top 10, secure coding practices
- **Performance Checks**: Collection usage, stream operations, concurrency
- **Style Checks**: Code formatting, naming conventions
- **Best Practices**: Exception handling, resource management

### Go
- **Security Checks**: Input validation, cryptographic practices
- **Performance Checks**: Goroutine usage, memory allocation, channel patterns
- **Style Checks**: Go code formatting, naming conventions
- **Best Practices**: Error handling, interface design

### Rust
- **Security Checks**: Memory safety, input validation
- **Performance Checks**: Zero-cost abstractions, memory usage patterns
- **Style Checks**: Rustfmt compliance, idiomatic patterns
- **Best Practices**: Ownership patterns, error handling

## Review Categories

### Security Issues
- **Critical**: SQL injection, XSS, CSRF vulnerabilities
- **High**: Authentication bypass, privilege escalation
- **Medium**: Information disclosure, weak encryption
- **Low**: Security best practice violations

### Performance Issues
- **Critical**: N+1 queries, memory leaks, infinite loops
- **High**: Inefficient algorithms, blocking operations
- **Medium**: Suboptimal data structures, unnecessary computations
- **Low**: Minor optimizations, code readability

### Style Issues
- **Critical**: Code formatting breaks compilation
- **High**: Inconsistent style affecting readability
- **Medium**: Minor style violations
- **Low**: Personal preference items

### Best Practice Issues
- **Critical**: Major architectural problems
- **High**: Significant deviation from best practices
- **Medium**: Minor best practice violations
- **Low**: Suggestions for improvement

## Output Format

### File Review Results

```json
{
  "success": true,
  "filePath": "/src/components/UserService.js",
  "language": "javascript",
  "reviewType": "security",
  "results": {
    "summary": {
      "totalIssues": 15,
      "critical": 2,
      "high": 5,
      "medium": 6,
      "low": 2,
      "score": 7.2
    },
    "issues": [
      {
        "line": 42,
        "column": 15,
        "severity": "critical",
        "category": "security",
        "rule": "SQL_INJECTION",
        "message": "Potential SQL injection vulnerability",
        "code": "const query = `SELECT * FROM users WHERE id = ${userId}`;",
        "suggestion": "Use parameterized queries or prepared statements"
      },
      {
        "line": 128,
        "column": 8,
        "severity": "high",
        "category": "performance",
        "rule": "INFINITE_LOOP",
        "message": "Potential infinite loop detected",
        "code": "while (true) { /* processing logic */ }",
        "suggestion": "Add proper exit conditions or use a timeout"
      }
    ],
    "recommendations": [
      "Implement proper input validation for all user inputs",
      "Use prepared statements for database queries",
      "Add proper error handling for async operations"
    ],
    "files": {
      "modified": 1,
      "reviewed": 1,
      "skipped": 0
    }
  },
  "metadata": {
    "reviewTime": 3500,
    "rulesApplied": 156,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Pull Request Review

```json
{
  "success": true,
  "baseBranch": "main",
  "headBranch": "feature/new-auth-system",
  "summary": {
    "filesChanged": 15,
    "linesAdded": 850,
    "linesRemoved": 120,
    "overallRisk": "medium",
    "mergeReady": false
  },
  "fileReviews": [
    {
      "filePath": "/src/auth/login.js",
      "review": {
        "score": 8.1,
        "issues": 3,
        "critical": 0,
        "high": 1,
        "medium": 2,
        "low": 0
      }
    }
  ],
  "mergeRecommendations": [
    "Fix critical security issues before merging",
    "Add comprehensive test coverage for auth changes",
    "Review performance impact of new database queries"
  ],
  "metadata": {
    "reviewTime": 12000,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## Advanced Features

### Custom Rule Sets

Define organization-specific rules:

```json
{
  "filePath": "/src/enterprise/SecurityModule.java",
  "language": "java",
  "reviewType": "custom",
  "customRules": {
    "companySpecific": [
      {
        "name": "NO_SYSTEM_EXIT",
        "pattern": "System.exit",
        "severity": "critical",
        "message": "System.exit() not allowed in enterprise code"
      }
    ]
  }
}
```

### Integration with CI/CD

Automate reviews in pipeline:

```json
{
  "pullRequest": {
    "id": 123,
    "author": "developer",
    "title": "New authentication system"
  },
  "ciIntegration": {
    "pipeline": "github-actions",
    "stage": "code-review",
    "failOnCritical": true,
    "threshold": 7.0
  }
}
```

### Historical Analysis

Track code quality over time:

```json
{
  "filePath": "/src/core/Engine.js",
  "language": "javascript",
  "reviewType": "all",
  "historical": {
    "enabled": true,
    "baseline": "commit-hash-abc123",
    "trendAnalysis": true
  }
}
```

### Team Analytics

Generate team code quality reports:

```json
{
  "teamReview": {
    "teamSize": 10,
    "reviewPeriod": "last-30-days",
    "metrics": [
      "averageReviewScore",
      "mostCommonIssues",
      "reviewTurnaroundTime",
      "defectDensity"
    ]
  }
}
```

## Error Handling

The skill handles common review scenarios:
- Unsupported file formats
- Malformed code syntax
- Missing dependencies
- Large file processing
- Timeout scenarios

## Best Practices

1. **Early Detection**: Run reviews early in development cycle
2. **Incremental Reviews**: Focus on changes rather than entire files
3. **Context Awareness**: Consider code context and business logic
4. **Constructive Feedback**: Provide actionable suggestions
5. **Performance**: Balance thoroughness with review speed

## Integration with Goose

This skill integrates with Goose's development workflow:

- **Automated Triggers**: Review on file save or commit
- **Batch Processing**: Review multiple files efficiently
- **Result Caching**: Cache results for unchanged code
- **Team Collaboration**: Share review results across team

## Security Considerations

- **Code Privacy**: Handle proprietary code securely
- **Access Control**: Restrict access to sensitive code reviews
- **Audit Trail**: Track all review activities
- **Data Retention**: Manage review data lifecycle

## Performance Optimization

- **Parallel Processing**: Review multiple files concurrently
- **Incremental Analysis**: Only analyze changed code sections
- **Smart Caching**: Cache results for similar code patterns
- **Resource Management**: Handle large files efficiently

## Troubleshooting

### Common Issues

1. **False Positives**: Tune rule sensitivity and thresholds
2. **Slow Performance**: Reduce analysis depth or file scope
3. **Missing Issues**: Update rule sets and analysis patterns
4. **Integration Errors**: Check CI/CD pipeline configuration

### Debug Mode

Enable detailed review logging:

```json
{
  "filePath": "/src/complex/module.js",
  "language": "javascript",
  "reviewType": "all",
  "debug": true,
  "verbose": true,
  "explainDecisions": true
}
```

## Code Review Patterns

### Security-Focused Review

```typescript
// Review for security vulnerabilities
const securityIssues = await reviewSecurity('/src/auth/login.js', {
  checks: ['sql_injection', 'xss', 'csrf', 'auth_bypass'],
  severity: 'high'
});

// Generate security report
await generateSecurityReport(securityIssues, {
  includeRemediation: true,
  priorityOrder: true
});
```

### Performance Analysis

```typescript
// Analyze performance bottlenecks
const performanceIssues = await analyzePerformance('/src/algorithms/sort.js', {
  metrics: ['time_complexity', 'memory_usage', 'cpu_intensive'],
  thresholds: {
    timeComplexity: 'O(n log n)',
    memoryUsage: '100MB'
  }
});

// Suggest optimizations
const optimizations = await suggestOptimizations(performanceIssues);
```

### Team Code Quality

```typescript
// Review team code quality
const qualityReport = await reviewTeamQuality('/src/', {
  team: 'frontend',
  timeRange: 'last-month',
  metrics: ['code_coverage', 'bug_density', 'technical_debt']
});

// Generate improvement plan
const improvementPlan = await generateImprovementPlan(qualityReport);
```

## Future Enhancements

- AI-powered code suggestions
- Automated fix generation
- Real-time collaborative reviewing
- Advanced metrics and analytics
- Integration with development tools
- Machine learning-based pattern recognition
