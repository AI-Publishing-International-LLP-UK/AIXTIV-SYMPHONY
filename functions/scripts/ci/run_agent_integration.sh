#!/bin/bash

# Script to run agent-integration.py with the proper Python environment

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Activate virtual environment
echo "Activating Python virtual environment..."
source "${SCRIPT_DIR}/venv/bin/activate"

# Check if requests module is installed, install if not
if ! python -c "import requests" &> /dev/null; then
    echo "Installing requests module..."
    pip install requests
fi

# Run the agent integration script with the configuration file
# Run the agent integration script with the configuration file
echo "Running agent integration script..."
python "${SCRIPT_DIR}/agent-integration.py" --config "${SCRIPT_DIR}/integration-config.json"
# Deactivate the virtual environment
deactivate

echo "Agent integration script completed."

