#!/bin/bash
# Auto-healing script for local development environment

echo "🔄 Auto-healing process initiated..."

# Check if services are running
if ! pgrep -f "node" > /dev/null; then
    echo "⚠️  Node.js processes not detected"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "⚠️  Disk usage high: ${DISK_USAGE}%"
fi

echo "✅ Auto-healing check completed"
