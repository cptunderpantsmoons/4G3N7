# PostgreSQL Replication System Implementation Guide

This guide provides step-by-step instructions for implementing the comprehensive PostgreSQL replication system for 4G3N7.

## Quick Start

### Development Environment

1. **Clone and Setup**
   ```bash
   cd /media/neptune/drv1/4g3n7/4G3N7-main/database-replication
   cp docker/.env.example docker/.env
   ```

2. **Configure Environment**
   ```bash
   # Edit docker/.env with your settings
   nano docker/.env
   ```

3. **Start Replication System**
   ```bash
   cd docker
   docker-compose -f docker-compose.replication.yml up -d
   ```

4. **Verify Replication**
   ```bash
   ../scripts/health-monitor.sh check
   ```

### Production Environment (Kubernetes)

1. **Deploy with Helm**
   ```bash
   cd kubernetes
   helm install 4g3n7-replication . --namespace 4g3n7 --create-namespace
   ```

2. **Monitor Deployment**
   ```bash
   kubectl get pods -n 4g3n7 -l app.kubernetes.io/name=postgresql
   ```

3. **Check Replication Status**
   ```bash
   kubectl port-forward svc/4g3n7-pgbouncer 9999:9999 -n 4g3n7
   psql -h localhost -p 9999 -U postgres -d 4g3n7db -c "SELECT pg_is_in_recovery();"
   ```

## Integration with 4G3N7 Application

### Update Prisma Service

1. **Install Enhanced Prisma Service**
   ```bash
   # Copy the replication service to your 4g3n7-agent package
   cp database-replication/prisma/replication.service.ts packages/bytebot-agent/src/
   cp database-replication/prisma/replication.types.ts packages/bytebot-agent/src/
   cp database-replication/prisma/replicated-prisma.service.ts packages/bytebot-agent/src/
   ```

2. **Update Application Module**
   ```typescript
   // In packages/bytebot-agent/src/app.module.ts
   import { ReplicatedPrismaService } from './replicated-prisma.service';
   import { PrismaReplicationService } from './replication.service';

   @Module({
     providers: [
       ReplicatedPrismaService,
       PrismaReplicationService,
       // ... other providers
     ],
     // ...
   })
   export class AppModule {}
   ```

3. **Update Service Dependencies**
   ```typescript
   // Replace existing PrismaService usage
   constructor(private readonly prisma: ReplicatedPrismaService) {}

   async findTask(id: string) {
     return this.prisma.findTask({ where: { id } });
   }

   async createTask(data: CreateTaskDto) {
     return this.prisma.createTask({ data });
   }
   ```

### Environment Configuration

Add these environment variables to your application:

```bash
# Database Primary (Writes)
DATABASE_PRIMARY_HOST=localhost
DATABASE_PRIMARY_PORT=5432
DATABASE_PRIMARY_URL=postgresql://postgres:postgres@localhost:5432/4g3n7db

# Database Replicas (Reads)
DATABASE_REPLICA_HOSTS=localhost:5433,localhost:5434
DATABASE_REPLICA_URLS=postgresql://postgres:postgres@localhost:5433/4g3n7db,postgresql://postgres:postgres@localhost:5434/4g3n7db

# PgBouncer (Recommended)
DATABASE_PRIMARY_POOLER_URL=postgresql://postgres:postgres@localhost:6432/4g3n7db
DATABASE_REPLICA_POOLER_URL=postgresql://postgres:postgres@localhost:6433/4g3n7db

# Health Monitoring
HEALTH_CHECK_INTERVAL=30000
MAX_REPLICATION_LAG=10
FAILOVER_ENABLED=true
```

## Testing the Implementation

### 1. Basic Connectivity Test

```bash
# Test primary connection
psql -h localhost -p 5432 -U postgres -d 4g3n7db -c "SELECT version();"

# Test replica connections
psql -h localhost -p 5433 -U postgres -d 4g3n7db -c "SELECT pg_is_in_recovery();"
psql -h localhost -p 5434 -U postgres -d 4g3n7db -c "SELECT pg_is_in_recovery();"
```

### 2. Replication Lag Test

```bash
# Create test data on primary
psql -h localhost -p 5432 -U postgres -d 4g3n7db -c "
  CREATE TABLE IF NOT EXISTS replication_test (
    id SERIAL PRIMARY KEY,
    data TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
"

# Insert test record
psql -h localhost -p 5432 -U postgres -d 4g3n7db -c "
  INSERT INTO replication_test (data) VALUES ('test_$(date +%s)');
"

# Check replication lag
./scripts/health-monitor.sh check
```

### 3. Read/Write Splitting Test

```typescript
// Test in your application
import { ReplicatedPrismaService } from './replicated-prisma.service';

async function testReadWriteSplitting() {
  // Write operation (should go to primary)
  const createdTask = await this.prisma.createTask({
    data: {
      description: 'Test task',
      type: 'IMMEDIATE',
      status: 'PENDING'
    }
  });

  // Read operation (should go to replica)
  const tasks = await this.prisma.findTasks({
    where: { status: 'PENDING' }
  });

  console.log('Created task:', createdTask);
  console.log('Found tasks:', tasks.length);
}
```

### 4. Failover Test

```bash
# Simulate primary failure
docker stop 4g3n7-postgres-primary

# Monitor failover (if auto-failover enabled)
./scripts/health-monitor.sh monitor

# Manual failover
./scripts/failover-manager.sh failover

# Verify new primary
./scripts/failover-manager.sh status
```

## Performance Optimization

### 1. Connection Pooling

The system includes PgBouncer for connection pooling. Configure optimal pool sizes:

```bash
# In docker-compose.replication.yml
environment:
  DEFAULT_POOL_SIZE: 20
  MIN_POOL_SIZE: 5
  MAX_CLIENT_CONN: 200
  RESERVE_POOL_SIZE: 5
```

### 2. Query Optimization

Monitor slow queries:

```sql
-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 3. Index Optimization

Ensure proper indexes for the 4G3N7 schema:

```sql
-- Task table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_status_created
ON tasks(status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_priority_created
ON tasks(priority, status, created_at);

-- Message table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_task_created
ON messages(task_id, created_at);

-- File table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_task_type
ON files(task_id, type);
```

## Monitoring and Alerting

### 1. Grafana Dashboard

Access the Grafana dashboard:
- URL: http://localhost:3000 (Docker) or your Grafana URL (Kubernetes)
- Default credentials: admin/admin
- Dashboard: "4G3N7 PostgreSQL Replication"

### 2. Prometheus Metrics

Key metrics to monitor:

- `pg_replication_lag_seconds` - Replication delay
- `pg_up` - Database availability
- `pg_stat_database_numbackends` - Active connections
- `pgbouncer_pools_server_active_connections` - Pool connections

### 3. Alert Configuration

Configure alerts in Prometheus:

```yaml
# Example alert rules
groups:
  - name: postgresql
    rules:
      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 1m

      - alert: ReplicationLagHigh
        expr: pg_replication_lag_seconds > 30
        for: 2m
```

## Backup and Recovery

### 1. Automated Backups

```bash
# Enable backup in docker-compose
docker-compose -f docker-compose.replication.yml --profile backup up -d

# Manual backup
docker exec 4g3n7-postgres-primary pg_dump -U postgres 4g3n7db > backup.sql
```

### 2. Point-in-Time Recovery

```bash
# Restore to specific time
pg_restore -h localhost -p 5432 -U postgres -d 4g3n7db \
  --clean --if-exists --verbose backup.sql
```

## Security Considerations

### 1. Authentication

Use strong passwords and SSL:

```bash
# Generate strong passwords
openssl rand -base64 32

# Enable SSL
DATABASE_SSL_MODE=require
```

### 2. Network Security

- Use firewall rules to restrict database access
- Enable SSL/TLS for all connections
- Monitor access logs

### 3. Data Encryption

Enable data-at-rest encryption:

```bash
# In postgresql.conf
ssl = on
ssl_cert_file = '/var/lib/postgresql/server.crt'
ssl_key_file = '/var/lib/postgresql/server.key'
```

## Troubleshooting

### Common Issues

1. **Replication Lag**
   ```bash
   # Check lag
   psql -h replica-host -U postgres -c "
     SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int;
   "

   # Check network bandwidth
   iperf3 -c primary-host
   ```

2. **Connection Issues**
   ```bash
   # Check PgBouncer logs
   docker logs 4g3n7-pgbouncer-primary

   # Test direct connection
   psql -h postgres-primary -p 5432 -U postgres -d 4g3n7db
   ```

3. **Failover Problems**
   ```bash
   # Check failover logs
   docker logs 4g3n7-failover-manager

   # Reset failover state
   ./scripts/failover-manager.sh reset
   ```

### Log Analysis

```bash
# PostgreSQL logs
docker logs 4g3n7-postgres-primary | tail -100

# Health monitor logs
tail -f ../logs/health-monitor.log

# Failover logs
tail -f ../logs/failover-manager.log
```

## Maintenance Tasks

### 1. Regular Maintenance

```bash
# Weekly vacuum and analyze
psql -h localhost -p 5432 -U postgres -d 4g3n7db -c "VACUUM ANALYZE;"

# Check index usage
psql -h localhost -p 5432 -U postgres -d 4g3n7db -c "
  SELECT schemaname, tablename, attname, n_distinct, correlation
  FROM pg_stats
  WHERE tablename IN ('tasks', 'messages', 'summaries', 'files');
"
```

### 2. Performance Tuning

Monitor and adjust these parameters based on workload:

```sql
-- Check current settings
SELECT name, setting, unit
FROM pg_settings
WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem', 'effective_cache_size');
```

### 3. Capacity Planning

Monitor growth trends:

```sql
-- Database size growth
SELECT pg_size_pretty(pg_database_size('4g3n7db')) as database_size;

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Scaling Considerations

### Horizontal Scaling

- Add more replicas for read-heavy workloads
- Use connection pooling to manage connections
- Implement sharding for very large datasets

### Vertical Scaling

- Increase memory for larger shared_buffers
- Add CPU for better query performance
- Use fast SSD storage for I/O intensive workloads

### Geographic Distribution

- Place replicas in different data centers
- Use async replication for cross-region setups
- Implement CDN for cached data

This implementation provides a robust, scalable PostgreSQL replication system for 4G3N7 with high availability, automatic failover, and comprehensive monitoring capabilities.