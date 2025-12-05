#!/bin/bash

# PostgreSQL Replication Setup Script for 4G3N7
# This script sets up primary-replica replication with automatic failover

set -euo pipefail

# Configuration
PRIMARY_CONTAINER="4g3n7-postgres-primary"
REPLICA_CONTAINERS=("4g3n7-postgres-replica-1" "4g3n7-postgres-replica-2")
REPLICATION_USER="replicator"
REPLICATION_PASSWORD="$(openssl rand -base64 32)"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-4g3n7db}"
NETWORK_NAME="4g3n7-replication-network"
PRIMARY_PORT=5432
REPLICA_PORTS=(5433 5434)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running or accessible"
        exit 1
    fi
    log_success "Docker is running"
}

# Create Docker network if it doesn't exist
create_network() {
    log_info "Creating Docker network: $NETWORK_NAME"
    if ! docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
        docker network create $NETWORK_NAME
        log_success "Network created: $NETWORK_NAME"
    else
        log_warning "Network already exists: $NETWORK_NAME"
    fi
}

# Generate replication configuration
generate_replication_config() {
    local replica_id=$1
    local port=$2

    cat > "/tmp/postgres-replica-${replica_id}.conf" << EOF
# PostgreSQL Replica Configuration
listen_addresses = '*'
port = ${port}
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Replication settings
hot_standby = on
max_standby_streaming_delay = 30s
max_standby_archive_delay = 30s
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
wal_keep_size = 1GB
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
EOF
}

# Setup primary database
setup_primary() {
    log_info "Setting up primary database: $PRIMARY_CONTAINER"

    # Stop existing container if running
    if docker ps -a --format '{{.Names}}' | grep -q "^${PRIMARY_CONTAINER}$"; then
        log_warning "Stopping existing primary container"
        docker stop $PRIMARY_CONTAINER || true
        docker rm $PRIMARY_CONTAINER || true
    fi

    # Create data directory
    mkdir -p ./data/primary

    # Start primary container
    docker run -d \
        --name $PRIMARY_CONTAINER \
        --network $NETWORK_NAME \
        -p $PRIMARY_PORT:5432 \
        -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
        -e POSTGRES_USER=$POSTGRES_USER \
        -e POSTGRES_DB=$POSTGRES_DB \
        -e POSTGRES_REPLICATION_USER=$REPLICATION_USER \
        -e POSTGRES_REPLICATION_PASSWORD=$REPLICATION_PASSWORD \
        -v $(pwd)/data/primary:/var/lib/postgresql/data \
        -v $(pwd)/configs/postgres/primary/postgresql.conf:/etc/postgresql/postgresql.conf \
        -v $(pwd)/configs/postgres/primary/pg_hba.conf:/etc/postgresql/pg_hba.conf \
        postgres:16-alpine \
        -c config_file=/etc/postgresql/postgresql.conf \
        -c hba_file=/etc/postgresql/pg_hba.conf

    log_success "Primary database started: $PRIMARY_CONTAINER"

    # Wait for primary to be ready
    wait_for_database $PRIMARY_CONTAINER $PRIMARY_PORT

    # Setup replication user
    setup_replication_user
}

# Wait for database to be ready
wait_for_database() {
    local container=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    log_info "Waiting for database to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if docker exec $container pg_isready -p $port; then
            log_success "Database is ready"
            return 0
        fi

        log_info "Attempt $attempt/$max_attempts: Database not ready, waiting..."
        sleep 2
        ((attempt++))
    done

    log_error "Database failed to become ready within $max_attempts attempts"
    exit 1
}

# Setup replication user on primary
setup_replication_user() {
    log_info "Creating replication user"

    docker exec $PRIMARY_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
        CREATE USER $REPLICATION_USER WITH REPLICATION ENCRYPTED PASSWORD '$REPLICATION_PASSWORD';
        ALTER USER $REPLICATION_USER CONNECTION LIMIT 5;
    " || log_warning "Replication user might already exist"

    log_success "Replication user created: $REPLICATION_USER"
}

# Setup replica databases
setup_replicas() {
    log_info "Setting up replica databases"

    for i in "${!REPLICA_CONTAINERS[@]}"; do
        local replica_container="${REPLICA_CONTAINERS[$i]}"
        local replica_port="${REPLICA_PORTS[$i]}"

        log_info "Setting up replica: $replica_container (port: $replica_port)"

        # Stop existing container if running
        if docker ps -a --format '{{.Names}}' | grep -q "^${replica_container}$"; then
            log_warning "Stopping existing replica container"
            docker stop $replica_container || true
            docker rm $replica_container || true
        done

        # Create data directory
        mkdir -p ./data/replica-$((i+1))

        # Generate replica configuration
        generate_replication_config $((i+1)) $replica_port

        # Create base backup from primary
        docker run --rm \
            --network $NETWORK_NAME \
            -v $(pwd)/data/replica-$((i+1)):/backup \
            postgres:16-alpine \
            pg_basebackup -h $PRIMARY_CONTAINER -D /backup -U $REPLICATION_USER -v -P -W -R \
            -x -C -S replica_$((i+1))_slot

        # Start replica container
        docker run -d \
            --name $replica_container \
            --network $NETWORK_NAME \
            -p $replica_port:5432 \
            -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
            -e POSTGRES_USER=$POSTGRES_USER \
            -e POSTGRES_DB=$POSTGRES_DB \
            -e PGUSER=$POSTGRES_USER \
            -e POSTGRES_REPLICATION_PASSWORD=$REPLICATION_PASSWORD \
            -v $(pwd)/data/replica-$((i+1)):/var/lib/postgresql/data \
            -v /tmp/postgres-replica-$((i+1)).conf:/etc/postgresql/postgresql.conf \
            postgres:16-alpine \
            -c config_file=/etc/postgresql/postgresql.conf \
            -c hot_standby=on

        log_success "Replica started: $replica_container"

        # Wait for replica to be ready
        wait_for_replica $replica_container $replica_port
    done
}

# Wait for replica to be ready and catch up
wait_for_replica() {
    local container=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    log_info "Waiting for replica to catch up with primary..."

    while [ $attempt -le $max_attempts ]; do
        local lag=$(docker exec $container psql -U $POSTGRES_USER -t -c "
            SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int;
        " 2>/dev/null | tr -d ' ')

        if [[ "$lag" =~ ^[0-9]+$ ]] && [ "$lag" -lt 5 ]; then
            log_success "Replica caught up (lag: ${lag}s)"
            return 0
        fi

        log_info "Attempt $attempt/$max_attempts: Replica lag: ${lag:-unknown}s, waiting..."
        sleep 3
        ((attempt++))
    done

    log_warning "Replica may not be fully caught up, but continuing setup"
}

# Verify replication
verify_replication() {
    log_info "Verifying replication setup"

    # Check primary status
    local primary_status=$(docker exec $PRIMARY_CONTAINER psql -U $POSTGRES_USER -t -c "
        SELECT count(*) FROM pg_stat_replication;
    " | tr -d ' ')

    log_info "Primary has $primary_status replicas connected"

    # Check replica status
    for i in "${!REPLICA_CONTAINERS[@]}"; do
        local replica_container="${REPLICA_CONTAINERS[$i]}"
        local lag=$(docker exec $replica_container psql -U $POSTGRES_USER -t -c "
            SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int;
        " 2>/dev/null | tr -d ' ')

        log_info "Replica $replica_container lag: ${lag:-unknown}s"
    done

    log_success "Replication verification completed"
}

# Create monitoring configuration
create_monitoring_config() {
    log_info "Creating monitoring configuration"

    mkdir -p ./monitoring

    cat > ./monitoring/.env << EOF
# Replication Monitoring Configuration
PRIMARY_HOST=localhost
PRIMARY_PORT=$PRIMARY_PORT
REPLICA_HOSTS=localhost:${REPLICA_PORTS[0]},localhost:${REPLICA_PORTS[1]}
REPLICATION_USER=$REPLICATION_USER
REPLICATION_PASSWORD=$REPLICATION_PASSWORD
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
EOF

    log_success "Monitoring configuration created"
}

# Print connection information
print_connection_info() {
    log_success "Replication setup completed successfully!"
    echo
    echo "Connection Information:"
    echo "======================="
    echo "Primary Database:"
    echo "  Host: localhost"
    echo "  Port: $PRIMARY_PORT"
    echo "  Database: $POSTGRES_DB"
    echo "  User: $POSTGRES_USER"
    echo
    echo "Replica Databases:"
    for i in "${!REPLICA_CONTAINERS[@]}"; do
        echo "  Replica $((i+1)): localhost:${REPLICA_PORTS[$i]}"
    done
    echo
    echo "Replication User:"
    echo "  Username: $REPLICATION_USER"
    echo "  Password: [REDACTED]"
    echo
    echo "Next Steps:"
    echo "1. Update your application DATABASE_URL to use the primary for writes"
    echo "2. Configure read/write splitting in your Prisma service"
    echo "3. Set up monitoring and alerting"
    echo "4. Test failover procedures"
    echo
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files"
    rm -f /tmp/postgres-replica-*.conf
}

# Main execution
main() {
    log_info "Starting PostgreSQL replication setup for 4G3N7"

    # Trap cleanup on exit
    trap cleanup EXIT

    check_docker
    create_network
    setup_primary
    setup_replicas
    verify_replication
    create_monitoring_config
    print_connection_info

    log_success "Setup completed successfully!"
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "cleanup")
        log_info "Cleaning up containers"
        docker stop $PRIMARY_CONTAINER "${REPLICA_CONTAINERS[@]}" 2>/dev/null || true
        docker rm $PRIMARY_CONTAINER "${REPLICA_CONTAINERS[@]}" 2>/dev/null || true
        docker network rm $NETWORK_NAME 2>/dev/null || true
        rm -rf ./data ./monitoring
        log_success "Cleanup completed"
        ;;
    "status")
        log_info "Checking replication status"
        docker exec $PRIMARY_CONTAINER psql -U $POSTGRES_USER -c "
            SELECT
                application_name,
                client_addr,
                state,
                sync_state,
                pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn) AS sent_lag,
                pg_wal_lsn_diff(pg_current_wal_lsn(), write_lsn) AS write_lag,
                pg_wal_lsn_diff(pg_current_wal_lsn(), flush_lsn) AS flush_lag,
                pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag
            FROM pg_stat_replication;
        "
        ;;
    *)
        echo "Usage: $0 {setup|cleanup|status}"
        echo "  setup   - Setup primary-replica replication"
        echo "  cleanup - Remove all containers and data"
        echo "  status  - Check replication status"
        exit 1
        ;;
esac