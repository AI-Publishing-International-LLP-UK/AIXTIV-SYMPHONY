#!/bin/bash

# Shell Integration for Kubernetes Error Handling
# Add this to your ~/.zshrc or ~/.bashrc

# Path to integration gateway
INTEGRATION_GATEWAY_PATH="/Users/as/asoos/integration-gateway"

# Kubernetes wrapper function
k8s() {
    "$INTEGRATION_GATEWAY_PATH/scripts/kubectl-with-error-handling.sh" "$@"
}

# Alternative alias for kubectl with error handling
alias kubectl-safe="$INTEGRATION_GATEWAY_PATH/scripts/kubectl-with-error-handling.sh"

# Quick cluster status check
k8s-status() {
    echo "🔍 Checking Kubernetes cluster status..."
    "$INTEGRATION_GATEWAY_PATH/scripts/k8s-connection-handler.sh"
}

# Quick cluster switch with error handling
k8s-switch() {
    local context="$1"
    if [[ -z "$context" ]]; then
        echo "Available contexts:"
        kubectl config get-contexts
        return 1
    fi
    
    echo "🔄 Switching to context: $context"
    kubectl config use-context "$context"
    
    # Test the connection
    "$INTEGRATION_GATEWAY_PATH/scripts/k8s-connection-handler.sh"
}

# Integration gateway specific commands
ig-deploy-status() {
    k8s get deployments -l app=integration-gateway
}

ig-pod-status() {
    k8s get pods -l app=integration-gateway
}

ig-logs() {
    local pod_name=$(k8s get pods -l app=integration-gateway -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [[ -n "$pod_name" ]]; then
        k8s logs "$pod_name" "$@"
    else
        echo "❌ No integration gateway pods found"
        return 1
    fi
}

# Health check for integration gateway
ig-health() {
    echo "🏥 Integration Gateway Health Check"
    echo "=================================="
    
    # Check cluster connection
    echo "1. Cluster Connection:"
    if "$INTEGRATION_GATEWAY_PATH/scripts/k8s-connection-handler.sh" >/dev/null 2>&1; then
        echo "   ✅ Connected to cluster: $(kubectl config current-context)"
    else
        echo "   ❌ Cluster connection failed"
        return 1
    fi
    
    # Check deployments
    echo "2. Deployments:"
    local deploy_status=$(k8s get deployments -l app=integration-gateway -o jsonpath='{.items[0].status.readyReplicas}/{.items[0].status.replicas}' 2>/dev/null)
    if [[ -n "$deploy_status" ]]; then
        echo "   ✅ Integration Gateway: $deploy_status replicas ready"
    else
        echo "   ❌ Integration Gateway deployment not found"
    fi
    
    # Check services
    echo "3. Services:"
    local service_count=$(k8s get services -l app=integration-gateway --no-headers 2>/dev/null | wc -l)
    if [[ "$service_count" -gt 0 ]]; then
        echo "   ✅ Found $service_count service(s)"
        k8s get services -l app=integration-gateway
    else
        echo "   ❌ No services found"
    fi
}

# Quick troubleshooting
k8s-troubleshoot() {
    echo "🔧 Kubernetes Troubleshooting"
    echo "=============================="
    
    echo "Current Context: $(kubectl config current-context 2>/dev/null || echo 'None')"
    echo "Available Contexts:"
    kubectl config get-contexts --no-headers | head -5
    
    echo ""
    echo "Testing Connections:"
    "$INTEGRATION_GATEWAY_PATH/scripts/k8s-connection-handler.sh"
}

# Export functions for use in shell
export -f k8s k8s-status k8s-switch ig-deploy-status ig-pod-status ig-logs ig-health k8s-troubleshoot

echo "✅ Kubernetes error handling integration loaded"
echo "Available commands:"
echo "  k8s [kubectl-args]     - kubectl with error handling"
echo "  k8s-status            - Check cluster connection status"
echo "  k8s-switch [context]  - Switch context with verification"
echo "  ig-health             - Integration gateway health check"
echo "  ig-logs               - View integration gateway logs"
echo "  k8s-troubleshoot      - Quick troubleshooting"
