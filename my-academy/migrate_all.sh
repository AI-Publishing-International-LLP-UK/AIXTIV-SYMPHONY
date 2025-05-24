#!/bin/bash

echo "==========================================="
echo "ACADEMY PROJECT MIGRATION PROCESS STARTING"
echo "==========================================="

# Create backup of current academy directory
BACKUP_DIR="/Users/as/asoos/academy_backup_$(date +%Y%m%d_%H%M%S)"
echo "Creating backup of current academy directory at $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Run individual migration scripts
echo "Running pilots lounge migration..."
./scripts/migrate_pilots_lounge.sh

echo "Running visualization and gift shop migration..."
./scripts/migrate_visualization.sh

echo "Running Dr. Memoria migration..."
./scripts/migrate_dr_memoria.sh

echo "Running security and integration migration..."
./scripts/migrate_security_integration.sh

echo "Running wing components migration..."
./scripts/migrate_wing.sh

echo "==========================================="
echo "ACADEMY PROJECT MIGRATION PROCESS COMPLETE"
echo "==========================================="
echo "Next steps:"
echo "1. Review migrated files and resolve any conflicts"
echo "2. Update import statements in code files to reflect new paths"
echo "3. Test the integrated application"
echo "4. Update documentation with final structure details"
echo "==========================================="
