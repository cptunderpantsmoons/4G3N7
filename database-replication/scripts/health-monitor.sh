#!/bin/bash

# PostgreSQL Replication Health Monitor
# Continuously monitors replication health and triggers alerts/failover

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../monitoring/.env"
LOG_FILE="${SCRIPT_DIR}/../logs/health-monitor.log"
METRICS_FILE="${SCRIPT_DIR}/../metrics/replication-metrics.json"
ALERT_LOG="${SCRIPT_DIR}/../logs/alerts.log"

# Create necessary directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$METRICS_FILE")"
mkdir -p "$(dirname "$ALERT_LOG")"

# Load configuration
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
fi

# Default configuration
PRIMARY_HOST="${PRIMARY_HOST:-localhost}"
PRIMARY_PORT="${PRIMARY_PORT:-5432}"
REPLICA_HOSTS="${REPLICA_HOSTS:-localhost:5433,localhost:5434}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-4g3n7db}"

# Monitoring settings
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-30}" # seconds
MAX_REPLICATION_LAG="${MAX_REPLICATION_LAG:-10}" # seconds
MAX_RESPONSE_TIME="${MAX_RESPONSE_TIME:-5000}" # milliseconds
FAILOVER_ENABLED="${FAILOVER_ENABLED:-true}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Write to log file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"

    # Output to console with colors
    case "$level" in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "ALERT")
            echo -e "${RED}[ALERT]${NC} $message"
            ;;
    esac
}

# Send alert
send_alert() {
    local alert_type="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Log alert
    echo "[$timestamp] [$alert_type] $message" >> "$ALERT_LOG"
    log "ALERT" "$alert_type: $message"

    # Send webhook if configured
    if [[ -n "$ALERT_WEBHOOK" ]]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"alert_type\": \"$alert_type\",
                \"message\": \"$message\",
                \"timestamp\": \"$timestamp\",
                \"service\": \"postgresql-replication\"
            }" \
            2>/dev/null || log "WARNING" "Failed to send alert webhook"
    fi
}

# Test database connectivity
test_connectivity() {
    local host="$1"
    local port="$2"
    local instance_name="$3"

    local start_time=$(date +%s%3N)

    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -c "SELECT 1;" >/dev/null 2>&1; then

        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))

        if [[ $response_time -gt $MAX_RESPONSE_TIME ]]; then
            log "WARNING" "$instance_name response time ${response_time}ms exceeds threshold ${MAX_RESPONSE_TIME}ms"
            return 2 # Slow response
        fi

        return 0 # Success
    else
        return 1 # Connection failed
    fi
}

# Check replication lag
check_replication_lag() {
    local host="$1"
    local port="$2"
    local replica_name="$3"

    local lag=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -t -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int;" \
        2>/dev/null | tr -d ' ')

    if [[ ! "$lag" =~ ^[0-9]+$ ]]; then
        log "ERROR" "Failed to get replication lag for $replica_name"
        return 1
    fi

    echo "$lag"

    if [[ $lag -gt $MAX_REPLICATION_LAG ]]; then
        return 2 # Lag too high
    fi

    return 0 # Lag acceptable
}

# Get primary database status
get_primary_status() {
    local host="$1"
    local port="$2"

    # Check if this is actually a primary
    local is_primary=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -t -c "SELECT pg_is_in_recovery();" 2>/dev/null | tr -d ' ')

    if [[ "$is_primary" == "f" ]]; then
        echo "primary"
    else
        echo "replica"
    fi

    # Get replication status
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -c "
        SELECT
            count(*) as replica_count,
            pg_wal_lsn_diff(pg_current_wal_lsn(), pg_last_wal_receive_lsn()) as write_lag_bytes
        FROM pg_stat_replication;
    " 2>/dev/null || echo "0 0"
}

# Check all database instances
perform_health_check() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    local overall_status="healthy"

    # Arrays to store results
    declare -A instance_status
    declare -A instance_response_time
    declare -A instance_lag

    # Check primary
    log "INFO" "Checking primary database: $PRIMARY_HOST:$PRIMARY_PORT"

    if test_connectivity "$PRIMARY_HOST" "$PRIMARY_PORT" "primary"; then
        local primary_status_info=$(get_primary_status "$PRIMARY_HOST" "$PRIMARY_PORT")
        local role=$(echo "$primary_status_info" | head -1)

        if [[ "$role" == "primary" ]]; then
            instance_status["primary"]="healthy"
            log "SUCCESS" "Primary database is healthy"
        else
            instance_status["primary"]="not_primary"
            overall_status="degraded"
            send_alert "CRITICAL" "Primary database is not in primary role (role: $role)"
        fi
    else
        instance_status["primary"]="unhealthy"
        overall_status="critical"
        send_alert "CRITICAL" "Primary database is unreachable"

        if [[ "$FAILOVER_ENABLED" == "true" ]]; then
            log "WARNING" "Failover is enabled - consider triggering failover"
        fi
    fi

    # Check replicas
    IFS=',' read -ra REPLICA_ARRAY <<< "$REPLICA_HOSTS"
    for i in "${!REPLICA_ARRAY[@]}"; do
        local replica_info="${REPLICA_ARRAY[$i]}"
        local host=$(echo "$replica_info" | cut -d':' -f1)
        local port=$(echo "$replica_info" | cut -d':' -f2)
        local replica_name="replica_$((i+1))"

        log "INFO" "Checking replica $replica_name: $host:$port"

        # Test connectivity
        if test_connectivity "$host" "$port" "$replica_name"; then
            # Check replication lag
            local lag=$(check_replication_lag "$host" "$port" "$replica_name")
            local lag_status=$?

            instance_status["$replica_name"]="healthy"
            instance_lag["$replica_name"]=$lag

            if [[ $lag_status -eq 2 ]]; then
                overall_status="degraded"
                send_alert "WARNING" "Replica $replica_name lag is too high: ${lag}s"
            fi

            log "SUCCESS" "Replica $replica_name is healthy (lag: ${lag}s)"
        else
            instance_status["$replica_name"]="unhealthy"
            overall_status="degraded"
            send_alert "WARNING" "Replica $replica_name is unreachable"
        fi
    done

    # Generate metrics
    generate_metrics "$timestamp" "$overall_status"

    return 0
}

# Generate metrics in JSON format
generate_metrics() {
    local timestamp="$1"
    local overall_status="$2"

    local primary_status=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$PRIMARY_HOST" -p "$PRIMARY_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -t -c "SELECT count(*) FROM pg_stat_replication;" 2>/dev/null | tr -d ' ')

    local replica_count=$(echo "$REPLICA_HOSTS" | tr ',' '\n' | wc -l)

    cat > "$METRICS_FILE" << EOF
{
  "timestamp": "$timestamp",
  "overall_status": "$overall_status",
  "primary": {
    "host": "$PRIMARY_HOST",
    "port": $PRIMARY_PORT,
    "connected_replicas": ${primary_status:-0}
  },
  "replicas": {
    "total": $replica_count,
EOF

    # Add replica details
    IFS=',' read -ra REPLICA_ARRAY <<< "$REPLICA_HOSTS"
    for i in "${!REPLICA_ARRAY[@]}"; do
        local replica_info="${REPLICA_ARRAY[$i]}"
        local host=$(echo "$replica_info" | cut -d':' -f1)
        local port=$(echo "$replica_info" | cut -d':' -f2)
        local replica_name="replica_$((i+1))"

        local lag=0
        if [[ "${instance_status[$replica_name]:-}" == "healthy" ]]; then
            lag=$(check_replication_lag "$host" "$port" "$replica_name")
        fi

        local comma=$([[ $i -lt $((${#REPLICA_ARRAY[@]} - 1)) ]] && echo "," || echo "")

        cat >> "$METRICS_FILE" << EOF
    "$replica_name": {
      "host": "$host",
      "port": $port,
      "status": "${instance_status[$replica_name]:-unknown}",
      "replication_lag_seconds": $lag
    }$comma
EOF
    done

    cat >> "$METRICS_FILE" << EOF
  },
  "health_check": {
    "max_response_time_ms": $MAX_RESPONSE_TIME,
    "max_replication_lag_seconds": $MAX_REPLICATION_LAG,
    "failover_enabled": $FAILOVER_ENABLED
  }
}
EOF

    log "INFO" "Metrics updated: $METRICS_FILE"
}

# Continuous monitoring loop
start_monitoring() {
    log "INFO" "Starting PostgreSQL replication health monitor"
    log "INFO" "Health check interval: ${HEALTH_CHECK_INTERVAL}s"
    log "INFO" "Max replication lag: ${MAX_REPLICATION_LAG}s"
    log "INFO" "Max response time: ${MAX_RESPONSE_TIME}ms"
    log "INFO" "Failover enabled: $FAILOVER_ENABLED"

    while true; do
        perform_health_check
        sleep "$HEALTH_CHECK_INTERVAL"
    done
}

# Manual health check
check_once() {
    log "INFO" "Performing one-time health check"
    perform_health_check

    # Display summary
    if [[ -f "$METRICS_FILE" ]]; then
        echo
        echo "=== Replication Status Summary ==="
        jq -r '
            "Overall Status: " + .overall_status + "\n" +
            "Primary: " + .primary.host + ":" + (.primary.port | tostring) + " (connected replicas: " + (.primary.connected_replicas | tostring) + ")\n" +
            "Replicas: " + (.replicas.total | tostring) + " total\n" +
            "Health Check: " + (.health_check.max_response_time_ms | tostring) + "ms max response, " + (.health_check.max_replication_lag_seconds | tostring) + "s max lag"
        ' "$METRICS_FILE"

        echo
        echo "=== Replica Details ==="
        jq -r '.replicas | to_entries[] | "  " + .key + ": " + .value.host + ":" + (.value.port | tostring) + " (" + .value.status + ", lag: " + (.value.replication_lag_seconds | tostring) + "s)"' "$METRICS_FILE"
    fi
}

# Show recent alerts
show_alerts() {
    if [[ -f "$ALERT_LOG" ]]; then
        echo "=== Recent Alerts ==="
        tail -20 "$ALERT_LOG"
    else
        echo "No alerts recorded"
    fi
}

# Cleanup function
cleanup() {
    log "INFO" "Health monitor stopped"
    exit 0
}

# Handle signals
trap cleanup SIGINT SIGTERM

# Main execution
case "${1:-monitor}" in
    "monitor")
        start_monitoring
        ;;
    "check")
        check_once
        ;;
    "alerts")
        show_alerts
        ;;
    "status")
        if [[ -f "$METRICS_FILE" ]]; then
            cat "$METRICS_FILE" | jq '.'
        else
            echo "No metrics available. Run 'check' first."
        fi
        ;;
    *)
        echo "Usage: $0 {monitor|check|alerts|status}"
        echo "  monitor - Start continuous monitoring (default)"
        echo "  check   - Perform one-time health check"
        echo "  alerts  - Show recent alerts"
        echo "  status  - Show current status as JSON"
        exit 1
        ;;
esac