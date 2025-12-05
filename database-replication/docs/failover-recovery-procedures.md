# PostgreSQL Replication Failover and Recovery Procedures

This document outlines the comprehensive procedures for handling failover and recovery scenarios in the 4G3N7 PostgreSQL replication system.

## Table of Contents

1. [Overview](#overview)
2. [Failover Scenarios](#failover-scenarios)
3. [Manual Failover Procedures](#manual-failover-procedures)
4. [Automatic Failover](#automatic-failover)
5. [Recovery Procedures](#recovery-procedures)
6. [Disaster Recovery](#disaster-recovery)
7. [Testing and Validation](#testing-and-validation)
8. [Runbooks](#runbooks)

## Overview

The 4G3N7 PostgreSQL replication system provides high availability through a primary-replica architecture with automatic failover capabilities. The system is designed to minimize downtime and ensure data consistency during failover events.

### Key Components

- **Primary Database**: Handles all write operations and serves read operations when replicas are unavailable
- **Replica Databases**: Provide read scalability and serve as failover candidates
- **Health Monitor**: Continuously monitors replication status and triggers alerts
- **Failover Manager**: Handles automatic failover when enabled
- **Connection Pooling**: PgBouncer manages connections and provides load balancing

### RPO/RTO Targets

- **Recovery Point Objective (RPO)**: < 5 seconds (maximum data loss)
- **Recovery Time Objective (RTO)**: < 30 seconds (failover time)
- **Availability Target**: 99.9% uptime

## Failover Scenarios

### 1. Primary Database Failure

**Symptoms:**
- Primary database becomes unreachable
- Applications cannot perform write operations
- Health monitor alerts for primary down

**Impact:**
- Write operations fail
- Read operations continue from replicas
- Automatic failover may trigger (if enabled)

### 2. Network Partition

**Symptoms:**
- Primary is accessible to some replicas but not others
- Split-brain scenario possible
- Inconsistent replication states

**Impact:**
- Some replicas may lag significantly
- Potential data inconsistency
- Requires manual intervention

### 3. Replica Failure

**Symptoms:**
- One or more replicas become unreachable
- Reduced read capacity
- Monitoring alerts for replica down

**Impact:**
- Read performance degrades
- Reduced failover options
- No impact on write operations

## Manual Failover Procedures

### Prerequisites

Before performing manual failover, verify the following:

```bash
# Check current replication status
./scripts/health-monitor.sh status

# Check failover manager status
./scripts/failover-manager.sh status

# Verify replica health
./scripts/health-monitor.sh check
```

### Step-by-Step Manual Failover

1. **Prepare for Failover**
   ```bash
   # Disable auto-failover to prevent conflicts
   export AUTO_FAILOVER=false

   # Notify stakeholders
   echo "PostgreSQL failover initiated at $(date)" | send-alert
   ```

2. **Verify Primary is Actually Down**
   ```bash
   # Test connectivity to primary
   pg_isready -h $PRIMARY_HOST -p $PRIMARY_PORT

   # Check if other replicas can see the primary
   psql -h $REPLICA_HOST -p $REPLICA_PORT -c "
     SELECT * FROM pg_stat_replication;
   "
   ```

3. **Select Best Replica for Promotion**
   ```bash
   # Find replica with minimum lag
   ./scripts/failover-manager.sh check
   ```

4. **Execute Failover**
   ```bash
   # Trigger manual failover
   ./scripts/failover-manager.sh failover
   ```

5. **Verify Failover Success**
   ```bash
   # Check new primary status
   pg_isready -h $NEW_PRIMARY_HOST -p $NEW_PRIMARY_PORT

   # Verify application connectivity
   psql -h $NEW_PRIMARY_HOST -p $NEW_PRIMARY_PORT -c "
     SELECT pg_is_in_recovery();
   "  # Should return 'f'
   ```

6. **Update Application Configuration**
   ```bash
   # Update connection strings
   export DATABASE_PRIMARY_URL="postgresql://user:pass@$NEW_PRIMARY_HOST:5432/db"

   # Restart application services
   systemctl restart 4g3n7-agent
   systemctl restart 4g3n7-ui
   ```

7. **Post-Failover Validation**
   ```bash
   # Test write operations
   psql -h $NEW_PRIMARY_HOST -p $NEW_PRIMARY_PORT -c "
     INSERT INTO test_table (id, data) VALUES (1, 'test');
   "

   # Verify replication to remaining replicas
   psql -h $OTHER_REPLICA_HOST -p $OTHER_REPLICA_PORT -c "
     SELECT * FROM test_table WHERE id = 1;
   "
   ```

## Automatic Failover

### Configuration

Automatic failover is controlled by these environment variables:

```bash
# Enable automatic failover (DANGEROUS - use with caution)
AUTO_FAILOVER=false  # Default: false

# Failover check intervals
FAILOVER_CHECK_INTERVAL=30  # seconds
FAILOVER_TIMEOUT=10         # seconds

# Replication lag threshold
MAX_REPLICATION_LAG=10      # seconds
```

### Automatic Failover Process

1. **Health Monitoring**
   - Continuous health checks every 30 seconds
   - Monitors primary connectivity and replica lag
   - Tracks replication status

2. **Failure Detection**
   - Primary unreachable for 2 consecutive checks
   - No replication activity detected
   - Replicas are healthy and accessible

3. **Failover Decision**
   - Selects best replica (lowest lag, highest availability)
   - Verifies replica is ready for promotion
   - Initiates failover sequence

4. **Failover Execution**
   - Promotes selected replica to primary
   - Updates remaining replica configurations
   - Sends notifications and alerts

5. **Post-Failover**
   - Monitors new primary health
   - Attempts to recover failed primary
   - Updates monitoring dashboards

## Recovery Procedures

### Primary Recovery

1. **Assess Failed Primary**
   ```bash
   # Check system logs
   journalctl -u postgresql -f

   # Check disk space
   df -h /var/lib/postgresql/data

   # Check memory usage
   free -h
   ```

2. **Attempt Recovery**
   ```bash
   # Restart PostgreSQL service
   systemctl restart postgresql

   # Check if service starts successfully
   systemctl status postgresql
   ```

3. **Verify Data Integrity**
   ```bash
   # Check for database corruption
   pg_verifydump /var/lib/postgresql/data/base/1

   # Run consistency check
   psql -c "SELECT pg_database_size('4g3n7db');"
   ```

4. **Reconfigure as Replica**
   ```bash
   # Stop PostgreSQL
   systemctl stop postgresql

   # Create backup of data directory
   mv /var/lib/postgresql/data /var/lib/postgresql/data.backup

   # Create base backup from new primary
   pg_basebackup -h $NEW_PRIMARY_HOST -D /var/lib/postgresql/data -U replicator -v -P -W -R

   # Update recovery configuration
   echo "standby_mode = 'on'" >> /var/lib/postgresql/data/recovery.conf
   echo "primary_conninfo = 'host=$NEW_PRIMARY_HOST port=5432 user=replicator'" >> /var/lib/postgresql/data/recovery.conf

   # Start PostgreSQL as replica
   systemctl start postgresql
   ```

### Replica Recovery

1. **Identify Failed Replica**
   ```bash
   # Check replication status
   ./scripts/health-monitor.sh status

   # Identify which replica is down
   docker ps | grep postgres-replica
   ```

2. **Rebuild Replica**
   ```bash
   # Stop failed replica
   docker stop postgres-replica-1

   # Remove data directory
   rm -rf /var/lib/postgresql/data/replica1

   # Recreate from primary
   ./scripts/setup-replication.sh setup
   ```

3. **Verify Recovery**
   ```bash
   # Check replication lag
   psql -h localhost -p 5433 -c "
     SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int;
   "

   # Verify data consistency
   psql -h localhost -p 5433 -c "SELECT COUNT(*) FROM tasks;"
   ```

## Disaster Recovery

### Total System Outage

In case of complete system failure (all databases down):

1. **Restore from Latest Backup**
   ```bash
   # Identify latest backup
   ls -la /backups/postgres/

   # Restore primary database
   pg_restore -h localhost -p 5432 -U postgres -d 4g3n7db /backups/postgres/latest.dump
   ```

2. **Rebuild Replication System**
   ```bash
   # Complete system rebuild
   ./scripts/setup-replication.sh cleanup
   ./scripts/setup-replication.sh setup
   ```

3. **Verify System Health**
   ```bash
   # Full health check
   ./scripts/health-monitor.sh check

   # Test application connectivity
   ./scripts/test-application-connectivity.sh
   ```

### Point-in-Time Recovery

If you need to recover to a specific point in time:

1. **Stop All Services**
   ```bash
   docker-compose -f docker-compose.replication.yml down
   ```

2. **Identify Recovery Point**
   ```bash
   # List available backup points
   pgbackrest info

   # Select target time
   TARGET_TIME="2024-01-15 14:30:00"
   ```

3. **Execute Recovery**
   ```bash
   # Perform point-in-time recovery
   pgbackrest --stanza=db restore --target-time "$TARGET_TIME"
   ```

4. **Restart Services**
   ```bash
   docker-compose -f docker-compose.replication.yml up -d
   ```

## Testing and Validation

### Failover Testing

Regular testing of failover procedures is essential:

1. **Scheduled Failover Tests**
   ```bash
   # Monthly automated test
   0 2 1 * * /path/to/scripts/scheduled-failover-test.sh
   ```

2. **Manual Test Procedure**
   ```bash
   # Create test environment
   docker-compose -f docker-compose.test.yml up -d

   # Simulate primary failure
   docker stop postgres-primary

   # Monitor failover
   ./scripts/health-monitor.sh monitor

   # Validate results
   ./scripts/validate-failover.sh
   ```

3. **Load Testing During Failover**
   ```bash
   # Generate load during failover
   pgbench -h localhost -p 5432 -U postgres -d 4g3n7db -c 10 -j 2 -t 1000

   # Monitor performance
   ./scripts/monitor-performance.sh
   ```

### Recovery Time Testing

Measure actual RTO/RPO:

1. **RTO Measurement**
   ```bash
   # Start timer
   START_TIME=$(date +%s)

   # Trigger failover
   ./scripts/failover-manager.sh failover

   # Record completion time
   END_TIME=$(date +%s)
   RTO=$((END_TIME - START_TIME))
   echo "Recovery Time Objective: ${RTO} seconds"
   ```

2. **RPO Measurement**
   ```bash
   # Measure data loss during failover
   ./scripts/measure-data-loss.sh
   ```

## Runbooks

### Primary Database Down Runbook

**Alert Level:** Critical
**Escalation:** Immediate

#### Initial Response (0-5 minutes)
1. Acknowledge alert
2. Check health monitor dashboard
3. Verify primary connectivity
4. Assess impact on applications

#### Triage (5-15 minutes)
1. Determine failure cause:
   - Network issue
   - Service crash
   - Hardware failure
   - Resource exhaustion

2. Check system resources:
   ```bash
   # CPU and memory
   top
   htop

   # Disk space
   df -h

   # Service status
   systemctl status postgresql
   ```

#### Resolution (15-30 minutes)
1. If auto-failover is enabled:
   - Monitor failover progress
   - Verify new primary is accepting writes
   - Update application connections if needed

2. If manual failover required:
   - Follow manual failover procedure
   - Document the incident
   - Notify stakeholders

#### Recovery (30-60 minutes)
1. Restore failed primary
2. Configure as replica
3. Verify replication is working
4. Update monitoring

### High Replication Lag Runbook

**Alert Level:** Warning
**Escalation:** 30 minutes

#### Initial Response (0-5 minutes)
1. Check current lag values
2. Identify affected replicas
3. Assess performance impact

#### Investigation (5-15 minutes)
1. Check network bandwidth
2. Monitor replica resource usage
3. Review recent large transactions

#### Resolution (15-30 minutes)
1. If resource constrained:
   - Scale replica resources
   - Optimize queries
   - Reduce batch sizes

2. If network issue:
   - Check network configuration
   - Monitor bandwidth usage
   - Contact network team

#### Prevention (30+ minutes)
1. Implement query optimization
2. Adjust replication parameters
3. Consider adding more replicas

### Network Partition Runbook

**Alert Level:** Critical
**Escalation:** Immediate

#### Initial Response (0-5 minutes)
1. Identify partition scope
2. Check cross-database connectivity
3. Assess split-brain risk

#### Triage (5-15 minutes)
1. Determine partition boundaries
2. Identify which nodes can communicate
3. Check for multiple primaries

#### Resolution (15-30 minutes)
1. Isolate partitioned segments
2. Designate single primary
3. Route traffic appropriately

#### Recovery (30-60 minutes)
1. Restore network connectivity
2. Re-establish replication
3. Resynchronize data if needed

## Emergency Contacts

| Role | Contact | Escalation Time |
|------|---------|----------------|
| Database Administrator | dba@4g3n7.dev | Immediate |
| Site Reliability Engineer | sre@4g3n7.dev | 5 minutes |
| Engineering Manager | eng-manager@4g3n7.dev | 15 minutes |
| On-call Engineer | +1-555-DB-ERROR | Immediate |

## Communication Procedures

### Incident Communication

1. **Initial Alert** (0-5 minutes)
   - Alert monitoring team
   - Update status page
   - Send Slack notification

2. **Status Updates** (Every 15 minutes)
   - Post progress updates
   - Update ETAs
   - Communicate impact

3. **Resolution** (After recovery)
   - Post-mortem analysis
   - Preventive measures
   - Schedule improvements

### Stakeholder Notifications

- **Development Team**: API availability, schema changes
- **Product Team**: Feature availability, data access
- **Support Team**: Customer impact, workarounds
- **Management**: Business impact, financial impact

This comprehensive failover and recovery documentation ensures that the 4G3N7 PostgreSQL replication system can handle failures gracefully and maintain high availability for critical applications.