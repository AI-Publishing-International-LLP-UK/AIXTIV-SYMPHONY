#!/bin/bash

# Kubernetes Command Wrapper with Automated Error Handling
# Usage: ./kubectl-with-error-handling.sh [kubectl arguments]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONNECTION_HANDLER="$SCRIPT_DIR/k8s-connection-handler.sh"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${YELLOW}[KUBECTL-WRAPPER]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[KUBECTL-WRAPPER]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[KUBECTL-WRAPPER]${NC} $1" >&2
}

# Test if kubectl connection is working
test_kubectl_connection() {
    if timeout 5 kubectl cluster-info &>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    # If no arguments provided, show help
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 [kubectl arguments]"
        echo "Example: $0 get pods"
        echo "Example: $0 get deployments --all-namespaces"
        exit 1
    fi
    
    # Test connection first
    if ! test_kubectl_connection; then
        log_info "Kubernetes connection failed, running automated error handler..."
        
        if [[ -x "$CONNECTION_HANDLER" ]]; then
            "$CONNECTION_HANDLER"
            handler_exit_code=$?
            
            if [[ $handler_exit_code -eq 0 ]]; then
                log_success "Connection restored, proceeding with kubectl command"
            else
                log_error "Connection handler failed, cannot execute kubectl command"
                exit $handler_exit_code
            fi
        else
            log_error "Connection handler not found or not executable: $CONNECTION_HANDLER"
            exit 1
        fi
    fi
    
    # Execute the kubectl command
    log_info "Executing: kubectl $*"
    kubectl "$@"
    kubectl_exit_code=$?
    
    if [[ $kubectl_exit_code -eq 0 ]]; then
        log_success "Command completed successfully"
    else
        log_error "Command failed with exit code: $kubectl_exit_code"
    fi
    
    exit $kubectl_exit_code
}

main "$@"
