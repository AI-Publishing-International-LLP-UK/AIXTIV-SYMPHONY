#!/bin/bash

# MCP Universal Template Promise Infrastructure Test Runner
# This script runs Newman tests locally for Promise infrastructure validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
TEST_SUITE="all"
STRESS_TESTS=false
VERBOSE=false
BAIL_ON_FAILURE=true
OUTPUT_DIR="test-results"
TIMEOUT_REQUEST=120000
TIMEOUT_SCRIPT=60000

# Function to print usage
print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  -e, --environment ENV    Test environment (staging|production) [default: staging]"
    echo "  -s, --suite SUITE        Test suite to run (all|health-checks|dr-memoria-anthology|"
    echo "                          dr-lucy|civilization-ai|settlements|auto-discovery|stress-tests)"
    echo "                          [default: all]"
    echo "  --stress                Include stress tests [default: false]"
    echo "  -v, --verbose           Enable verbose output [default: false]"
    echo "  --no-bail              Continue on test failures [default: bail on failure]"
    echo "  -o, --output DIR        Output directory for test results [default: test-results]"
    echo "  --timeout-request MS    Request timeout in milliseconds [default: 120000]"
    echo "  --timeout-script MS     Script timeout in milliseconds [default: 60000]"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0                                          # Run all tests on staging"
    echo "  $0 -e production -s health-checks          # Run health checks on production"
    echo "  $0 -e production --stress -v               # Run all tests including stress tests with verbose output"
    echo "  $0 -s dr-lucy --no-bail                    # Run Dr. Lucy tests without bailing on failure"
}

# Function to log messages
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[$timestamp INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[$timestamp SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[$timestamp WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[$timestamp ERROR]${NC} $message"
            ;;
    esac
}

# Function to check dependencies
check_dependencies() {
    log "INFO" "Checking dependencies..."
    
    # Check Newman
    if ! command -v newman &> /dev/null; then
        log "ERROR" "Newman is not installed. Please install with: npm install -g newman"
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log "ERROR" "jq is not installed. Please install jq for JSON parsing."
        exit 1
    fi
    
    # Check gcloud if production environment
    if [[ "$ENVIRONMENT" == "production" ]] && ! command -v gcloud &> /dev/null; then
        log "ERROR" "gcloud CLI is not installed. Required for production testing."
        exit 1
    fi
    
    log "SUCCESS" "All dependencies are available"
}

# Function to setup OAuth credentials
setup_oauth() {
    log "INFO" "Setting up OAuth credentials..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Fetch from Google Secret Manager
        if command -v gcloud &> /dev/null; then
            log "INFO" "Fetching OAuth credentials from Google Secret Manager..."
            
            OAUTH_CLIENT_ID=$(gcloud secrets versions access latest --secret="oauth-client-id" --project="api-for-warp-drive" 2>/dev/null || echo "")
            OAUTH_CLIENT_SECRET=$(gcloud secrets versions access latest --secret="oauth-client-secret" --project="api-for-warp-drive" 2>/dev/null || echo "")
            
            if [[ -z "$OAUTH_CLIENT_ID" || -z "$OAUTH_CLIENT_SECRET" ]]; then
                log "WARNING" "Could not fetch OAuth credentials from Secret Manager. Using environment variables."
            else
                export OAUTH_CLIENT_ID
                export OAUTH_CLIENT_SECRET
                log "SUCCESS" "OAuth credentials fetched from Secret Manager"
            fi
        fi
    fi
    
    # Check environment variables
    if [[ -z "$OAUTH_CLIENT_ID" || -z "$OAUTH_CLIENT_SECRET" ]]; then
        log "WARNING" "OAuth credentials not found. Tests requiring authentication may fail."
        log "INFO" "Set OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET environment variables or ensure Secret Manager access."
    fi
}

# Function to get test suite folders
get_test_folders() {
    local suite=$1
    local folders=()
    
    case $suite in
        "all")
            folders+=(
                "Promise Infrastructure Health Checks"
                "Dr. Memoria Anthology Promise Tests"
                "Dr. Lucy Promise Tests"
                "Civilization AI Promise Tests"
                "Settlement Promise Tests"
                "Auto-Discovery Promise Tests"
            )
            if [[ "$STRESS_TESTS" == "true" ]]; then
                folders+=("Stress Tests")
            fi
            ;;
        "health-checks")
            folders+=("Promise Infrastructure Health Checks")
            ;;
        "dr-memoria-anthology")
            folders+=("Dr. Memoria Anthology Promise Tests")
            ;;
        "dr-lucy")
            folders+=("Dr. Lucy Promise Tests")
            ;;
        "civilization-ai")
            folders+=("Civilization AI Promise Tests")
            ;;
        "settlements")
            folders+=("Settlement Promise Tests")
            ;;
        "auto-discovery")
            folders+=("Auto-Discovery Promise Tests")
            ;;
        "stress-tests")
            folders+=("Stress Tests")
            ;;
        *)
            log "ERROR" "Unknown test suite: $suite"
            exit 1
            ;;
    esac
    
    echo "${folders[@]}"
}

# Function to run Newman tests
run_newman_tests() {
    local folder_name="$1"
    local safe_name=$(echo "$folder_name" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
    
    log "INFO" "Running tests for: $folder_name"
    
    # Build Newman command
    local newman_cmd="newman run tests/newman/mcp-template-promise-tests.postman_collection.json"
    newman_cmd+=" --environment tests/newman/environments/${ENVIRONMENT}.json"
    newman_cmd+=" --folder \"$folder_name\""
    newman_cmd+=" --reporters cli,htmlextra,json-summary"
    newman_cmd+=" --reporter-htmlextra-export ${OUTPUT_DIR}/promise-tests-${safe_name}-report.html"
    newman_cmd+=" --reporter-json-summary-export ${OUTPUT_DIR}/promise-tests-${safe_name}-summary.json"
    newman_cmd+=" --timeout-request $TIMEOUT_REQUEST"
    newman_cmd+=" --timeout-script $TIMEOUT_SCRIPT"
    newman_cmd+=" --color on"
    
    if [[ "$VERBOSE" == "true" ]]; then
        newman_cmd+=" --verbose"
    fi
    
    if [[ "$BAIL_ON_FAILURE" == "true" ]]; then
        newman_cmd+=" --bail"
    fi
    
    # Run Newman
    if eval $newman_cmd; then
        log "SUCCESS" "Tests passed for: $folder_name"
        return 0
    else
        log "ERROR" "Tests failed for: $folder_name"
        return 1
    fi
}

# Function to analyze test results
analyze_results() {
    local safe_name="$1"
    local summary_file="${OUTPUT_DIR}/promise-tests-${safe_name}-summary.json"
    
    if [[ -f "$summary_file" ]]; then
        local total_tests=$(jq -r '.run.stats.tests.total // 0' "$summary_file")
        local passed_tests=$(jq -r '.run.stats.tests.passed // 0' "$summary_file")
        local failed_tests=$(jq -r '.run.stats.tests.failed // 0' "$summary_file")
        local total_requests=$(jq -r '.run.stats.requests.total // 0' "$summary_file")
        local failed_requests=$(jq -r '.run.stats.requests.failed // 0' "$summary_file")
        local duration=$(jq -r '.run.timings.completed // 0' "$summary_file")
        local duration_seconds=$((duration / 1000))
        
        log "INFO" "Test Results Summary:"
        log "INFO" "  Tests: $passed_tests/$total_tests passed"
        log "INFO" "  Requests: $((total_requests - failed_requests))/$total_requests successful"
        log "INFO" "  Duration: ${duration_seconds}s"
        
        if [[ $failed_tests -gt 0 || $failed_requests -gt 0 ]]; then
            log "WARNING" "  Failed Tests: $failed_tests"
            log "WARNING" "  Failed Requests: $failed_requests"
            return 1
        fi
        
        return 0
    else
        log "ERROR" "No test summary found for: $safe_name"
        return 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--suite)
            TEST_SUITE="$2"
            shift 2
            ;;
        --stress)
            STRESS_TESTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-bail)
            BAIL_ON_FAILURE=false
            shift
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --timeout-request)
            TIMEOUT_REQUEST="$2"
            shift 2
            ;;
        --timeout-script)
            TIMEOUT_SCRIPT="$2"
            shift 2
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log "ERROR" "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 1
fi

# Main execution
log "INFO" "Starting MCP Promise Infrastructure Tests"
log "INFO" "Environment: $ENVIRONMENT"
log "INFO" "Test Suite: $TEST_SUITE"
log "INFO" "Include Stress Tests: $STRESS_TESTS"
log "INFO" "Output Directory: $OUTPUT_DIR"

# Check if we're in the right directory
if [[ ! -f "tests/newman/mcp-template-promise-tests.postman_collection.json" ]]; then
    log "ERROR" "Newman collection file not found. Please run from the MCP Universal Template root directory."
    exit 1
fi

# Check dependencies
check_dependencies

# Setup OAuth credentials
setup_oauth

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Get test folders
IFS=' ' read -ra FOLDERS <<< "$(get_test_folders "$TEST_SUITE")"

# Initialize counters
total_suites=${#FOLDERS[@]}
passed_suites=0
failed_suites=0

log "INFO" "Running $total_suites test suite(s)..."

# Run tests for each folder
for folder in "${FOLDERS[@]}"; do
    safe_name=$(echo "$folder" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
    
    if run_newman_tests "$folder"; then
        if analyze_results "$safe_name"; then
            ((passed_suites++))
        else
            ((failed_suites++))
        fi
    else
        ((failed_suites++))
    fi
    
    echo "" # Empty line for readability
done

# Final summary
log "INFO" "=== Test Execution Complete ==="
log "INFO" "Total Test Suites: $total_suites"
log "SUCCESS" "Passed: $passed_suites"
if [[ $failed_suites -gt 0 ]]; then
    log "ERROR" "Failed: $failed_suites"
fi

log "INFO" "Test reports saved to: $OUTPUT_DIR"
log "INFO" "HTML reports: ${OUTPUT_DIR}/*-report.html"
log "INFO" "JSON summaries: ${OUTPUT_DIR}/*-summary.json"

# Exit with appropriate code
if [[ $failed_suites -gt 0 ]]; then
    log "ERROR" "Some test suites failed. Check the reports for details."
    exit 1
else
    log "SUCCESS" "All test suites passed!"
    exit 0
fi