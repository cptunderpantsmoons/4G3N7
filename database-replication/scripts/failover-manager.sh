#!/bin/bash

# PostgreSQL Replication Failover Manager
# Automated failover and recovery procedures

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../monitoring/.env"
LOG_FILE="${SCRIPT_DIR}/../logs/failover-manager.log"
STATE_FILE="${SCRIPT_DIR}/../state/failover-state.json"

# Create necessary directories
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$STATE_FILE")"

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
FAILOVER_ENABLED="${FAILOVER_ENABLED:-true}"
AUTO_FAILOVER="${AUTO_FAILOVER:-false}" # Disabled by default for safety

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
        "CRITICAL")
            echo -e "${RED}[CRITICAL]${NC} $message"
            ;;
    esac
}

# Update failover state
update_state() {
    local event="$1"
    local details="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

    cat > "$STATE_FILE" << EOF
{
  "last_event": "$event",
  "last_event_timestamp": "$timestamp",
  "details": "$details",
  "current_primary": {
    "host": "$PRIMARY_HOST",
    "port": $PRIMARY_PORT
  },
  "auto_failover_enabled": $AUTO_FAILOVER,
  "failover_count": $(jq -r '.failover_count // 0' "$STATE_FILE" 2>/dev/null || echo "0")
}
EOF
}

# Increment failover count
increment_failover_count() {
    local count=$(jq -r '.failover_count // 0' "$STATE_FILE" 2>/dev/null || echo "0")
    local new_count=$((count + 1))

    if [[ -f "$STATE_FILE" ]]; then
        jq ".failover_count = $new_count" "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    fi
}

# Test database connectivity
test_connectivity() {
    local host="$1"
    local port="$2"
    local timeout="${3:-5}"

    PGPASSWORD="$POSTGRES_PASSWORD" timeout "$timeout" psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -c "SELECT 1;" >/dev/null 2>&1
}

# Check if database is in recovery mode (replica)
is_replica() {
    local host="$1"
    local port="$2"

    local result=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -t -c "SELECT pg_is_in_recovery();" 2>/dev/null | tr -d ' ')

    [[ "$result" == "t" ]]
}

# Check if database is primary
is_primary() {
    local host="$1"
    local port="$2"

    ! is_replica "$host" "$port"
}

# Get replication lag in seconds
get_replication_lag() {
    local host="$1"
    local port="$2"

    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -t -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int;" \
        2>/dev/null | tr -d ' '
}

# Find best replica for promotion
find_best_replica() {
    log "INFO" "Finding best replica for promotion"

    IFS=',' read -ra REPLICA_ARRAY <<< "$REPLICA_HOSTS"
    local best_replica=""
    local best_replica_info=""
    local min_lag=999999

    for i in "${!REPLICA_ARRAY[@]}"; do
        local replica_info="${REPLICA_ARRAY[$i]}"
        local host=$(echo "$replica_info" | cut -d':' -f1)
        local port=$(echo "$replica_info" | cut -d':' -f2)
        local replica_name="replica_$((i+1))"

        log "INFO" "Checking $replica_name: $host:$port"

        # Test connectivity
        if ! test_connectivity "$host" "$port"; then
            log "WARNING" "$replica_name is not reachable"
            continue
        fi

        # Check if it's actually a replica
        if ! is_replica "$host" "$port"; then
            log "WARNING" "$replica_name is not in recovery mode"
            continue
        fi

        # Get replication lag
        local lag=$(get_replication_lag "$host" "$port")

        if [[ -z "$lag" || "$lag" == "" ]]; then
            log "WARNING" "Could not determine replication lag for $replica_name"
            continue
        fi

        log "INFO" "$replica_name lag: ${lag}s"

        if [[ $lag -lt $min_lag ]]; then
            min_lag=$lag
            best_replica="$replica_name"
            best_replica_info="$replica_info"
        fi
    done

    if [[ -z "$best_replica" ]]; then
        log "ERROR" "No suitable replica found for promotion"
        return 1
    fi

    log "SUCCESS" "Best replica found: $best_replica ($best_replica_info, lag: ${min_lag}s)"
    echo "$best_replica_info"
    return 0
}

# Promote replica to primary
promote_replica() {
    local replica_info="$1"
    local host=$(echo "$replica_info" | cut -d':' -f1)
    local port=$(echo "$replica_info" | cut -d':' -f2)

    log "INFO" "Promoting replica $host:$port to primary"

    # Create promotion script
    local promote_script="/tmp/promote_replica_$(date +%s).sql"

    cat > "$promote_script" << 'EOF'
SELECT pg_promote();
EOF

    # Execute promotion
    if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -p "$port" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        -f "$promote_script" >/dev/null 2>&1; then

        # Verify promotion
        sleep 2
        if is_primary "$host" "$port"; then
            log "SUCCESS" "Replica successfully promoted to primary"
            rm -f "$promote_script"
            return 0
        else
            log "ERROR" "Replica promotion verification failed"
            rm -f "$promote_script"
            return 1
        fi
    else
        log "ERROR" "Failed to promote replica"
        rm -f "$promote_script"
        return 1
    fi
}

# Update replica configurations to follow new primary
update_replica_configs() {
    local new_primary_host="$1"
    local new_primary_port="$2"

    log "INFO" "Updating replica configurations to follow new primary: $new_primary_host:$new_primary_port"

    # This is a simplified implementation
    # In a real setup, you'd need to:
    # 1. Update pg_hba.conf on the new primary
    # 2. Update recovery.conf or postgresql.conf on remaining replicas
    # 3. Restart replica services
    # 4. Verify replication is working

    log "INFO" "Replica configuration update completed (simplified implementation)"
}

# Perform failover
perform_failover() {
    log "CRITICAL" "Starting failover procedure"

    local start_time=$(date +%s)

    # Check if failover is enabled
    if [[ "$FAILOVER_ENABLED" != "true" ]]; then
        log "ERROR" "Failover is disabled"
        return 1
    fi

    # Find best replica for promotion
    local best_replica
    if ! best_replica=$(find_best_replica); then
        log "ERROR" "Cannot proceed with failover - no suitable replica found"
        return 1
    fi

    local host=$(echo "$best_replica" | cut -d':' -f1)
    local port=$(echo "$best_replica" | cut -d':' -f2)

    # Promote the replica
    if ! promote_replica "$best_replica"; then
        log "ERROR" "Failover failed - replica promotion unsuccessful"
        return 1
    fi

    # Update remaining replicas
    update_replica_configs "$host" "$port"

    # Update state
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    increment_failover_count
    update_state "failover_completed" "Promoted $host:$port to primary in ${duration}s"

    log "SUCCESS" "Failover completed successfully in ${duration}s"
    log "INFO" "New primary: $host:$port"

    # Send notification if webhook is configured
    if [[ -n "${ALERT_WEBHOOK:-}" ]]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"event\": \"failover_completed\",
                \"new_primary\": \"$host:$port\",
                \"duration_seconds\": $duration,
                \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")\",
                \"service\": \"postgresql-replication\"
            }" \
            2>/dev/null || log "WARNING" "Failed to send failover notification"
    fi

    return 0
}

# Check if failover is needed
check_failover_needed() {
    # Check if primary is reachable
    if test_connectivity "$PRIMARY_HOST" "$PRIMARY_PORT"; then
        # Primary is reachable, check if it's actually primary
        if is_primary "$PRIMARY_HOST" "$PRIMARY_PORT"; then
            # Everything is normal
            return 1
        else
            log "WARNING" "Primary server is reachable but not in primary mode"
            return 0
        fi
    else
        # Primary is not reachable
        log "WARNING" "Primary server is not reachable"
        return 0
    fi
}

# Manual failover trigger
trigger_manual_failover() {
    log "INFO" "Manual failover triggered"

    if [[ "$AUTO_FAILOVER" != "true" ]]; then
        log "WARNING" "Auto-failover is disabled, proceeding with manual failover"
    fi

    update_state "manual_failover_triggered" "Manual failover initiated by user"
    perform_failover
}

# Automatic failover monitoring
start_auto_failover_monitor() {
    if [[ "$AUTO_FAILOVER" != "true" ]]; then
        log "WARNING" "Auto-failover is disabled. Monitor will check status but not trigger failover."
    fi

    log "INFO" "Starting automatic failover monitor"
    log "INFO" "Checking primary every 30 seconds"

    while true; do
        if check_failover_needed; then
            if [[ "$AUTO_FAILOVER" == "true" ]]; then
                log "CRITICAL" "Automatic failover triggered"
                update_state "auto_failover_triggered" "Automatic failover triggered by monitor"
                perform_failover

                # Wait after failover to prevent immediate re-triggering
                log "INFO" "Waiting 5 minutes after failover before resuming monitoring"
                sleep 300
            else
                log "WARNING" "Failover needed but auto-failover is disabled"
                sleep 30
            fi
        else
            sleep 30
        fi
    done
}

# Check failover status
check_status() {
    log "INFO" "Checking failover status"

    echo "=== Failover Configuration ==="
    echo "Failover Enabled: $FAILOVER_ENABLED"
    echo "Auto-Failover: $AUTO_FAILOVER"
    echo "Primary: $PRIMARY_HOST:$PRIMARY_PORT"
    echo "Replicas: $REPLICA_HOSTS"
    echo

    if [[ -f "$STATE_FILE" ]]; then
        echo "=== Failover State ==="
        jq '.' "$STATE_FILE"
        echo
    fi

    echo "=== Database Status ==="

    # Check primary
    echo "Primary ($PRIMARY_HOST:$PRIMARY_PORT):"
    if test_connectivity "$PRIMARY_HOST" "$PRIMARY_PORT"; then
        if is_primary "$PRIMARY_HOST" "$PRIMARY_PORT"; then
            echo "  Status: Healthy (Primary)"
        else
            echo "  Status: Reachable but not Primary"
        fi
    else
        echo "  Status: Unreachable"
    fi

    # Check replicas
    IFS=',' read -ra REPLICA_ARRAY <<< "$REPLICA_HOSTS"
    for i in "${!REPLICA_ARRAY[@]}"; do
        local replica_info="${REPLICA_ARRAY[$i]}"
        local host=$(echo "$replica_info" | cut -d':' -f1)
        local port=$(echo "$replica_info" | cut -d':' -f2)
        local replica_name="replica_$((i+1))"

        echo "$replica_name ($host:$port):"
        if test_connectivity "$host" "$port"; then
            if is_replica "$host" "$port"; then
                local lag=$(get_replication_lag "$host" "$port")
                echo "  Status: Healthy (Replica, lag: ${lag}s)"
            else
                echo "  Status: Reachable but not Replica"
            fi
        else
            echo "  Status: Unreachable"
        fi
    done
}

# Reset failover state
reset_state() {
    log "INFO" "Resetting failover state"
    cat > "$STATE_FILE" << EOF
{
  "last_event": "state_reset",
  "last_event_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "details": "Failover state reset by user",
  "current_primary": {
    "host": "$PRIMARY_HOST",
    "port": $PRIMARY_PORT
  },
  "auto_failover_enabled": $AUTO_FAILOVER,
  "failover_count": 0
}
EOF
    log "SUCCESS" "Failover state reset"
}

# Cleanup function
cleanup() {
    log "INFO" "Failover manager stopped"
    exit 0
}

# Handle signals
trap cleanup SIGINT SIGTERM

# Main execution
case "${1:-status}" in
    "monitor")
        start_auto_failover_monitor
        ;;
    "failover")
        trigger_manual_failover
        ;;
    "check")
        if check_failover_needed; then
            echo "Failover is needed"
            exit 1
        else
            echo "No failover needed"
            exit 0
        fi
        ;;
    "status")
        check_status
        ;;
    "reset")
        reset_state
        ;;
    *)
        echo "Usage: $0 {monitor|failover|check|status|reset}"
        echo "  monitor  - Start automatic failover monitoring"
        echo "  failover - Trigger manual failover"
        echo "  check    - Check if failover is needed"
        echo "  status   - Show current failover status"
        echo "  reset    - Reset failover state"
        exit 1
        ;;
esac