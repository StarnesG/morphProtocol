#!/bin/bash

# Process Monitor Script for morphProtocol Server
# Monitors the server and restarts it if it crashes or becomes unresponsive

HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:8080/health}"
CHECK_INTERVAL="${CHECK_INTERVAL:-30}"  # seconds
MAX_FAILURES="${MAX_FAILURES:-3}"
LOG_FILE="${LOG_FILE:-/var/log/morphprotocol/monitor.log}"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

start_server() {
    log "Starting morphProtocol server..."
    cd "$(dirname "$0")/.." || exit 1
    npm run start >> "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    log "Server started with PID: $SERVER_PID"
    echo $SERVER_PID > /tmp/morphprotocol.pid
}

stop_server() {
    if [ -f /tmp/morphprotocol.pid ]; then
        PID=$(cat /tmp/morphprotocol.pid)
        log "Stopping server (PID: $PID)..."
        kill -TERM "$PID" 2>/dev/null || kill -KILL "$PID" 2>/dev/null
        rm -f /tmp/morphprotocol.pid
        sleep 2
    fi
}

check_health() {
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" --max-time 5)
    if [ "$HTTP_CODE" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Trap signals for graceful shutdown
trap 'log "Monitor received SIGTERM, stopping..."; stop_server; exit 0' SIGTERM
trap 'log "Monitor received SIGINT, stopping..."; stop_server; exit 0' SIGINT

log "=== morphProtocol Monitor Started ==="
log "Health check URL: $HEALTH_CHECK_URL"
log "Check interval: ${CHECK_INTERVAL}s"
log "Max failures before restart: $MAX_FAILURES"

# Start server initially
start_server

FAILURE_COUNT=0

# Monitor loop
while true; do
    sleep "$CHECK_INTERVAL"
    
    if check_health; then
        FAILURE_COUNT=0
        log "Health check passed"
    else
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        log "Health check failed (${FAILURE_COUNT}/${MAX_FAILURES})"
        
        if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
            log "ERROR: Server unresponsive after $MAX_FAILURES attempts"
            log "Restarting server..."
            stop_server
            sleep 5
            start_server
            FAILURE_COUNT=0
        fi
    fi
done
