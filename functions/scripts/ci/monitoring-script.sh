#!/bin/bash
# monitor.sh - Continuous monitoring during build process

# Configuration
CHECK_INTERVAL=30  # seconds
NOTIFICATION_EMAIL="your-team@example.com"
NOTIFICATION_SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
LOG_FILE="build_monitor.log"
RESOURCE_THRESHOLD_CPU=80  # percentage
RESOURCE_THRESHOLD_MEM=80  # percentage

# Initialize log
echo "=== Build Monitoring Started at $(date) ===" > $LOG_FILE

# Function to send notifications
send_notification() {
  message="$1"
  severity="$2"  # info, warning, error
  
  echo "[$(date)] [$severity] $message" >> $LOG_FILE
  
  # Email notification
  echo "$message" | mail -s "[$severity] Build Monitor Alert" $NOTIFICATION_EMAIL
  
  # Slack notification
  curl -s -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"[$severity] Build Monitor Alert: $message\"}" \
    $NOTIFICATION_SLACK_WEBHOOK
}

# Function to check system resources
check_resources() {
  # CPU usage
  cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
  
  # Memory usage
  mem_usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
  
  # Disk usage
  disk_usage=$(df -h | grep '/dev/sda1' | awk '{print $5}' | tr -d '%')
  
  echo "[$(date)] Resource usage - CPU: ${cpu_usage}%, Memory: ${mem_usage}%, Disk: ${disk_usage}%" >> $LOG_FILE
  
  # Check thresholds
  if (( $(echo "$cpu_usage > $RESOURCE_THRESHOLD_CPU" | bc -l) )); then
    send_notification "High CPU usage: ${cpu_usage}%" "warning"
  fi
  
  if (( $(echo "$mem_usage > $RESOURCE_THRESHOLD_MEM" | bc -l) )); then
    send_notification "High memory usage: ${mem_usage}%" "warning"
  fi
}

# Function to check service health
check_services() {
  # Check database connection
  if ! mysql -u user -ppassword -e "SELECT 1" > /dev/null 2>&1; then
    send_notification "Database connection failed" "error"
  fi
  
  # Check API gateway
  if ! curl -s -o /dev/null -w "%{http_code}" http://your-gateway/health | grep -q "200"; then
    send_notification "API Gateway health check failed" "error"
  fi
  
  # Check message queue
  # Add your specific checks for message queues, cache, etc.
}

# Function to check log files for errors
check_logs() {
  # Check for error patterns in logs
  if grep -i "error\|exception\|fatal" /var/log/application.log | grep -v "expected error"; then
    error_count=$(grep -i "error\|exception\|fatal" /var/log/application.log | grep -v "expected error" | wc -l)
    send_notification "Found $error_count errors in application logs" "warning"
  fi
}

# Main monitoring loop
echo "Monitoring started. Press Ctrl+C to stop."
while true; do
  # Check build process is still running
  if ! pgrep -f "npm run build" > /dev/null; then
    # Check if build completed successfully
    if [ -f "build_success.flag" ]; then
      send_notification "Build process completed successfully" "info"
      break
    else
      send_notification "Build process unexpectedly terminated" "error"
      break
    fi
  fi
  
  # Run checks
  check_resources
  check_services
  check_logs
  
  # Sleep until next check
  sleep $CHECK_INTERVAL
done

echo "=== Build Monitoring Ended at $(date) ===" >> $LOG_FILE
