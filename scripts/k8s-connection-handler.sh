#!/bin/bash

# Kubernetes Connection Error Handler
# Handles common connection issues and provides automated recovery

set -e

# Configuration
PROJECT_ID="api-for-warp-drive"
REGION="us-west1"
CLUSTER_NAME="private-cluster-auto"
BACKUP_CLUSTER="autopilot-cluster-1"
TIMEOUT=30
RETRY_COUNT=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        return 1
    fi
    
    local client_version=$(kubectl version --client -o json 2>/dev/null | jq -r '.clientVersion.gitVersion' 2>/dev/null || echo "unknown")
    log_info "kubectl client version: $client_version"
    return 0
}

# Check gcloud authentication and project
check_gcloud_auth() {
    log_info "Checking gcloud authentication..."
    
    local active_account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
    if [[ -z "$active_account" ]]; then
        log_error "No active gcloud authentication found"
        log_info "Run: gcloud auth login"
        return 1
    fi
    
    local current_project=$(gcloud config get-value project 2>/dev/null)
    if [[ "$current_project" != "$PROJECT_ID" ]]; then
        log_warning "Current project: $current_project, expected: $PROJECT_ID"
        log_info "Setting project to $PROJECT_ID"
        gcloud config set project "$PROJECT_ID"
    fi
    
    log_success "Authentication OK - Account: $active_account, Project: $PROJECT_ID"
    return 0
}

# Test cluster connectivity with timeout
test_cluster_connection() {
    local cluster_context="$1"
    local timeout="${2:-$TIMEOUT}"
    
    log_info "Testing connection to cluster: $cluster_context (timeout: ${timeout}s)"
    
    # Switch context
    if ! kubectl config use-context "$cluster_context" &>/dev/null; then
        log_error "Failed to switch to context: $cluster_context"
        return 1
    fi
    
    # Test connection with timeout
    if timeout "$timeout" kubectl cluster-info &>/dev/null; then
        log_success "Connection to $cluster_context successful"
        return 0
    else
        log_error "Connection to $cluster_context failed (timeout: ${timeout}s)"
        return 1
    fi
}

# Get fresh cluster credentials
refresh_cluster_credentials() {
    local cluster_name="$1"
    local retry_count="${2:-$RETRY_COUNT}"
    
    log_info "Refreshing credentials for cluster: $cluster_name"
    
    for i in $(seq 1 $retry_count); do
        log_info "Attempt $i/$retry_count: Getting cluster credentials..."
        
        if gcloud container clusters get-credentials "$cluster_name" \
           --region="$REGION" \
           --project="$PROJECT_ID" \
           --internal-ip 2>/dev/null; then
            log_success "Successfully refreshed credentials for $cluster_name"
            return 0
        else
            log_warning "Attempt $i failed, retrying in 5 seconds..."
            sleep 5
        fi
    done
    
    log_error "Failed to refresh credentials after $retry_count attempts"
    return 1
}

# Check if cluster is private and suggest solutions
check_private_cluster_access() {
    local cluster_name="$1"
    
    log_info "Checking cluster access configuration..."
    
    local cluster_info=$(gcloud container clusters describe "$cluster_name" \
                        --region="$REGION" \
                        --format="value(privateClusterConfig.enablePrivateNodes,privateClusterConfig.masterIpv4CidrBlock,status)" 2>/dev/null)
    
    if [[ -z "$cluster_info" ]]; then
        log_error "Cannot access cluster information"
        return 1
    fi
    
    IFS=$'\t' read -r private_nodes master_cidr status <<< "$cluster_info"
    
    log_info "Cluster Status: $status"
    log_info "Private Nodes: $private_nodes"
    log_info "Master CIDR: ${master_cidr:-N/A}"
    
    if [[ "$private_nodes" == "True" ]]; then
        log_warning "This is a private cluster - network connectivity required"
        log_info "Solutions:"
        log_info "  1. Use Cloud Shell or VM in same VPC"
        log_info "  2. Setup VPN or private connectivity"
        log_info "  3. Use authorized networks configuration"
        log_info "  4. Switch to public cluster for development"
        return 2
    fi
    
    return 0
}

# Main connection handler
handle_connection_error() {
    log_info "Starting Kubernetes connection error handler..."
    
    # Step 1: Basic checks
    check_kubectl || return 1
    check_gcloud_auth || return 1
    
    # Step 2: Test primary cluster
    local primary_context="gke_${PROJECT_ID}_${REGION}_${CLUSTER_NAME}"
    if test_cluster_connection "$primary_context" 10; then
        log_success "Primary cluster connection is working"
        kubectl get nodes --no-headers 2>/dev/null | wc -l | xargs -I {} log_info "Cluster has {} nodes"
        return 0
    fi
    
    # Step 3: Try refreshing credentials
    log_info "Primary cluster connection failed, refreshing credentials..."
    if refresh_cluster_credentials "$CLUSTER_NAME"; then
        if test_cluster_connection "$primary_context" 15; then
            log_success "Connection restored after credential refresh"
            return 0
        fi
    fi
    
    # Step 4: Check if it's a private cluster issue
    local private_check_result
    check_private_cluster_access "$CLUSTER_NAME"
    private_check_result=$?
    
    if [[ $private_check_result -eq 2 ]]; then
        log_warning "Private cluster detected - trying backup cluster..."
        
        # Try backup cluster
        local backup_context="gke_${PROJECT_ID}_${REGION}_${BACKUP_CLUSTER}"
        if refresh_cluster_credentials "$BACKUP_CLUSTER" && test_cluster_connection "$backup_context" 15; then
            log_success "Connected to backup cluster: $BACKUP_CLUSTER"
            return 0
        fi
    fi
    
    # Step 5: Fallback to Docker Desktop
    log_warning "GKE clusters unavailable, falling back to Docker Desktop"
    if test_cluster_connection "docker-desktop" 10; then
        log_success "Using Docker Desktop Kubernetes cluster"
        return 0
    fi
    
    # Step 6: Final error state
    log_error "All connection attempts failed"
    log_info "Manual troubleshooting required:"
    log_info "  1. Check network connectivity"
    log_info "  2. Verify cluster status in GCP Console"
    log_info "  3. Check firewall rules for private clusters"
    log_info "  4. Ensure Docker Desktop Kubernetes is enabled"
    
    return 1
}

# Run the handler
handle_connection_error
exit_code=$?

if [[ $exit_code -eq 0 ]]; then
    log_success "Kubernetes connection established successfully"
    kubectl config current-context
    kubectl version --short 2>/dev/null || kubectl version
else
    log_error "Failed to establish Kubernetes connection"
fi

exit $exit_code
