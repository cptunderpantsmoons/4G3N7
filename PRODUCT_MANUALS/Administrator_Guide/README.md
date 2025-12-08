# Administrator Guide

This guide provides comprehensive information for system administrators responsible for deploying, configuring, and maintaining 4G3N7 systems.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation and Deployment](#installation-and-deployment)
3. [Configuration Management](#configuration-management)
4. [User Management](#user-management)
5. [Security Configuration](#security-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Performance Tuning](#performance-tuning)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)
10. [Updates and Upgrades](#updates-and-upgrades)

---

## System Requirements

### Hardware Requirements

#### Minimum Requirements
- **CPU**: 4 cores (x86_64)
- **Memory**: 8GB RAM
- **Storage**: 50GB available disk space
- **Network**: 100 Mbps network connection

#### Recommended Requirements
- **CPU**: 8+ cores (x86_64)
- **Memory**: 16GB+ RAM
- **Storage**: 100GB+ SSD
- **Network**: 1 Gbps network connection

### Software Requirements

#### Operating Systems
- **Linux**: Ubuntu 20.04 LTS, Ubuntu 22.04 LTS, CentOS 8+, Rocky Linux 8+
- **macOS**: 11.0+ (Big Sur)
- **Windows**: 10+ (with WSL2 for full functionality)

#### Required Software
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (for development)
- **Git**: 2.30+

### Network Requirements

#### Ports
- **9990**: Desktop daemon (VNC/WebSocket)
- **9991**: Agent API
- **9992**: UI interface
- **3000**: Document processor (if separate)
- **6379**: Redis (if external)
- **5432**: PostgreSQL (if external)

#### Firewall Configuration
```bash
# Example for UFW (Ubuntu)
sudo ufw allow 9990/tcp
sudo ufw allow 9991/tcp
sudo ufw allow 9992/tcp
```

---

## Installation and Deployment

### Docker Deployment (Recommended)

#### Quick Start
```bash
# Clone the repository
git clone https://github.com/4g3n7/4g3n7.git
cd 4g3n7

# Configure environment
cp docker/.env.example docker/.env
# Edit docker/.env with your settings

# Start the system
docker-compose -f docker/docker-compose.yml up -d

# Verify installation
docker-compose -f docker/docker-compose.yml ps
```

#### Production Deployment
```bash
# Use production configuration
docker-compose -f docker/docker-compose.prod.yml up -d

# Enable monitoring
docker-compose -f docker/docker-compose.monitoring.yml up -d
```

### Kubernetes Deployment

#### Prerequisites
- Kubernetes 1.20+
- Helm 3.8+
- Persistent storage configured

#### Installation
```bash
# Add Helm repository
helm repo add 4g3n7 https://4g3n7.github.io/helm-charts
helm repo update

# Install with custom values
helm install 4g3n7 4g3n7/4g3n7 -f values-production.yaml
```

### Manual Installation

#### Build from Source
```bash
# Clone and build
git clone https://github.com/4g3n7/4g3n7.git
cd 4g3n7

# Install dependencies
npm install

# Build all packages
npm run build

# Start services
npm run start:all
```

---

## Configuration Management

### Environment Variables

#### Core Configuration
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/4g3n7"

# Redis
REDIS_URL="redis://localhost:6379"

# AI Providers
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="..."

# Security
JWT_SECRET="your-secret-key"
ENCRYPTION_KEY="your-encryption-key"
```

#### Advanced Configuration
```bash
# Performance
MAX_CONCURRENT_TASKS=10
TASK_TIMEOUT=300000
MEMORY_LIMIT=2048

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/4g3n7/app.log

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30
ALERT_WEBHOOK_URL=https://hooks.slack.com/...
```

### Configuration Files

#### Agent Configuration
```yaml
# packages/4g3n7-agent/config/agent.yaml
agent:
  name: "4G3N7-Agent"
  version: "2.0.0"
  debug: false
  
ai:
  provider: "anthropic"
  model: "claude-3-5-sonnet"
  timeout: 300000
  
desktop:
  resolution: "1920x1080"
  scale: 1.0
  locale: "en-US"
```

#### UI Configuration
```yaml
# packages/4g3n7-ui/config/ui.yaml
ui:
  theme: "dark"
  language: "en"
  refreshInterval: 5000
  
features:
  gooseBridge: true
  fileUpload: true
  desktopControl: true
```

---

## User Management

### Authentication Setup

#### JWT Authentication
```bash
# Generate JWT secret
openssl rand -base64 32

# Configure in .env
JWT_SECRET="your-generated-secret"
JWT_EXPIRES_IN="24h"
```

#### OAuth Integration
```yaml
# OAuth providers
oauth:
  google:
    clientId: "your-client-id"
    clientSecret: "your-client-secret"
    callbackUrl: "https://your-domain/auth/google/callback"
  
  github:
    clientId: "your-github-client-id"
    clientSecret: "your-github-client-secret"
```

### User Roles and Permissions

#### Built-in Roles
- **Admin**: Full system access
- **User**: Standard user access
- **Guest**: Limited access
- **Developer**: Development and debugging access

#### Custom Roles
```yaml
roles:
  analyst:
    permissions:
      - tasks.read
      - tasks.create
      - files.read
      - desktop.view
  
  operator:
    permissions:
      - tasks.read
      - tasks.create
      - tasks.update
      - desktop.control
```

### User Management Commands

#### Create User
```bash
# Using CLI
npx 4g3n7-cli user create --email user@example.com --role user

# Using API
curl -X POST http://localhost:9991/auth/users \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "role": "user"}'
```

#### Manage Users
```bash
# List users
npx 4g3n7-cli user list

# Update user
npx 4g3n7-cli user update --id user-id --role admin

# Delete user
npx 4g3n7-cli user delete --id user-id
```

---

## Security Configuration

### Network Security

#### TLS/SSL Configuration
```bash
# Generate certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem

# Configure in .env
HTTPS_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

#### Firewall Rules
```bash
# Block unnecessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow specific services
sudo ufw allow ssh
sudo ufw allow 9990:9992/tcp
```

### Application Security

#### Security Headers
```yaml
security:
  headers:
    xFrameOptions: "DENY"
    xContentTypeOptions: "nosniff"
    xXssProtection: "1; mode=block"
    hsts: "max-age=31536000; includeSubDomains"
```

#### Rate Limiting
```yaml
rateLimiting:
  enabled: true
  windowMs: 900000  # 15 minutes
  max: 100          # limit each IP to 100 requests per windowMs
  skipSuccessfulRequests: false
```

### Data Security

#### Encryption
```bash
# Database encryption
DB_ENCRYPTION_KEY="your-encryption-key"

# File encryption
FILE_ENCRYPTION_ENABLED=true
FILE_ENCRYPTION_KEY="your-file-encryption-key"
```

#### Access Control
```yaml
accessControl:
  enabled: true
  ipWhitelist:
    - "127.0.0.1"
    - "10.0.0.0/8"
    - "192.168.0.0/16"
```

---

## Monitoring and Maintenance

### Health Monitoring

#### Health Check Endpoints
```bash
# System health
curl http://localhost:9991/health

# Component health
curl http://localhost:9991/health/components

# Detailed health
curl http://localhost:9991/health/detailed
```

#### Metrics Collection
```bash
# Prometheus metrics
curl http://localhost:9991/metrics

# Custom metrics
curl http://localhost:9991/metrics/custom
```

### Log Management

#### Log Levels
```yaml
logging:
  level: "info"
  levels:
    error: true
    warn: true
    info: true
    http: true
    verbose: false
    debug: false
    silly: false
```

#### Log Rotation
```bash
# Configure logrotate
sudo cp docs/logrotate/4g3n7 /etc/logrotate.d/4g3n7
sudo systemctl restart logrotate
```

### Performance Monitoring

#### Key Metrics
- **CPU Usage**: Monitor agent and desktop CPU usage
- **Memory Usage**: Track memory consumption
- **Disk Usage**: Monitor storage utilization
- **Network I/O**: Track network traffic
- **Task Performance**: Monitor task completion times

#### Monitoring Tools
```bash
# Docker stats
docker stats

# System monitoring
htop
iotop
nethogs

# Custom monitoring
npx 4g3n7-cli monitor system
```

---

## Performance Tuning

### System Optimization

#### Docker Optimization
```yaml
# docker-compose.yml
services:
  agent:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
        reservations:
          cpus: '2.0'
          memory: 2G
```

#### Database Optimization
```sql
-- Index optimization
CREATE INDEX CONCURRENTLY idx_tasks_status_created 
ON tasks(status, created_at);

-- Query optimization
VACUUM ANALYZE tasks;
```

### Application Tuning

#### Agent Configuration
```yaml
performance:
  maxConcurrentTasks: 10
  taskTimeout: 300000
  memoryLimit: 2048
  cacheSize: 512
  
  database:
    poolSize: 20
    idleTimeout: 30000
    maxConnections: 100
```

#### Desktop Optimization
```yaml
desktop:
  performance:
    enableHardwareAcceleration: true
    maxFrameRate: 30
    compressionQuality: 80
    enableVSync: false
```

---

## Backup and Recovery

### Backup Strategy

#### Automated Backups
```bash
# Database backup
pg_dump -h localhost -U 4g3n7 -d 4g3n7 > backup_$(date +%Y%m%d_%H%M%S).sql

# File backup
tar -czf files_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/files

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/config
```

#### Backup Automation
```yaml
# Using cron
0 2 * * * /usr/local/bin/4g3n7-backup.sh

# Using Docker
docker run --rm \
  -v 4g3n7_data:/data \
  -v /backup:/backup \
  alpine tar czf /backup/4g3n7_$(date +%Y%m%d).tar.gz /data
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore database
psql -h localhost -U 4g3n7 -d 4g3n7 < backup_file.sql

# Verify recovery
psql -h localhost -U 4g3n7 -d 4g3n7 -c "SELECT COUNT(*) FROM tasks;"
```

#### File Recovery
```bash
# Restore files
tar -xzf files_backup.tar.gz -C /path/to/restore

# Set permissions
chown -R 4g3n7:4g3n7 /path/to/restore
```

---

## Troubleshooting

### Common Issues

#### Service Not Starting
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs agent
docker-compose logs ui
docker-compose logs desktop

# Check resource usage
docker stats
```

#### Performance Issues
```bash
# Check system resources
top
free -h
df -h

# Check application metrics
curl http://localhost:9991/metrics

# Check database performance
psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

#### Network Issues
```bash
# Test connectivity
curl -v http://localhost:9991/health

# Check firewall
sudo ufw status
sudo netstat -tlnp

# Test DNS
nslookup your-domain.com
```

### Diagnostic Tools

#### System Diagnostics
```bash
# Run diagnostics
npx 4g3n7-cli system diagnose

# Check configuration
npx 4g3n7-cli config validate

# Test connectivity
npx 4g3n7-cli network test
```

#### Log Analysis
```bash
# View recent logs
tail -f /var/log/4g3n7/app.log

# Search logs
grep "ERROR" /var/log/4g3n7/app.log

# Analyze patterns
npx 4g3n7-cli logs analyze
```

---

## Updates and Upgrades

### Update Process

#### Docker Updates
```bash
# Pull latest images
docker-compose pull

# Update services
docker-compose up -d

# Verify update
docker-compose ps
```

#### Source Updates
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build and restart
npm run build
npm run start:all
```

### Version Management

#### Version Checking
```bash
# Check current version
npx 4g3n7-cli version

# Check for updates
npx 4g3n7-cli update check
```

#### Rollback Procedures
```bash
# Docker rollback
docker-compose down
docker-compose up -d --force-recreate

# Source rollback
git checkout previous-version
npm run build
npm run start:all
```

---

## Additional Resources

### Documentation
- [📖 User Guide](../User_Guide/README.md)
- [💻 Developer Guide](../Developer_Guide/README.md)
- [📚 API Reference](../API_Reference/README.md)
- [🔗 Integration Guide](../Integration_Guide/README.md)
- [📝 Brand Update Changes](Brand_Update_Changes.md)

### Support
- [Online Documentation](https://docs.4g3n7.io)
- [GitHub Issues](https://github.com/4g3n7/4g3n7/issues)
- [Community Forum](https://community.4g3n7.io)

### Tools
- [4G3N7 CLI](https://github.com/4g3n7/cli)
- [Monitoring Dashboard](https://github.com/4g3n7/monitoring)
- [Backup Scripts](https://github.com/4g3n7/backup)

---

**Next Steps:**
- [User Guide](../User_Guide/README.md) - For end-users
- [Developer Guide](../Developer_Guide/README.md) - For developers
- [API Reference](../API_Reference/README.md) - Complete API documentation
- [Integration Guide](../Integration_Guide/README.md) - Integration documentation