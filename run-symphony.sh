#!/bin/bash
# Simple script to run the Symphony environment

echo "Starting Symphony environment..."
nohup bash -c "cd /Users/as/symphony_local && ./start.sh" > /Users/as/asoos/symphony.log 2>&1 &
echo "Started Symphony environment in background."
echo "Check logs at: /Users/as/asoos/symphony.log"
echo ""
echo "Access at: http://localhost:3000 and http://localhost:3030"