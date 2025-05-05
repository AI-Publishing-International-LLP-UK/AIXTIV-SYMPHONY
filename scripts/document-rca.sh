#!/bin/bash
# document-rca.sh - Script to document Root Cause Analysis
# Usage: ./document-rca.sh <failure-id> "<failure-description>"

set -e

# Check if logs directory exists, create if not
LOGS_DIR="./logs/rca"
mkdir -p "$LOGS_DIR"

# Get timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Check if required arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <failure-id> \"<failure-description>\""
    exit 1
fi

FAILURE_ID=$1
FAILURE_DESC=$2
RCA_FILE="${LOGS_DIR}/rca_${FAILURE_ID}_${TIMESTAMP}.md"

# Get user input for RCA documentation
echo "Documenting RCA for Failure ID: $FAILURE_ID"
echo "Description: $FAILURE_DESC"

read -p "Affected Components (comma separated): " AFFECTED_COMPONENTS
read -p "Impact Level (Critical/High/Medium/Low): " IMPACT
read -p "Root Cause: " ROOT_CAUSE
read -p "Resolution Steps: " RESOLUTION
read -p "Preventive Measures: " PREVENTION

# Create RCA document
cat > "$RCA_FILE" << EOF
# Root Cause Analysis: $FAILURE_ID

## Overview
- **Date/Time:** $(date)
- **Failure ID:** $FAILURE_ID
- **Description:** $FAILURE_DESC

## Details
- **Affected Components:** $AFFECTED_COMPONENTS
- **Impact Level:** $IMPACT

## Analysis
### Root Cause
$ROOT_CAUSE

### Resolution
$RESOLUTION

### Preventive Measures
$PREVENTION

## Metadata
- **Documented By:** $(whoami)
- **RCA Timestamp:** $TIMESTAMP
EOF

echo "RCA document created at $RCA_FILE"

# For CI environments, support non-interactive mode
if [ -n "$CI" ]; then
    echo "Running in CI environment, using defaults for non-interactive mode"
    # In CI, we might parse from environment variables or use defaults
fi

