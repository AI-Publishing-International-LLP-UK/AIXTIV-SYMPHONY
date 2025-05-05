#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test configuration
COLLECTION_FILE="api-tests.postman_collection.json"
ENVIRONMENT_FILE="api-environment.postman_environment.json"
REPORT_DIR="newman-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_NAME="api-test-report_${TIMESTAMP}"

# Authentication environment variables
export API_KEY="${API_KEY:-dummy-api-key}"
export API_SECRET="${API_SECRET:-dummy-api-secret}"
export AUTH_TOKEN="${AUTH_TOKEN:-dummy-auth-token}"
export TEST_ENV="${TEST_ENV:-development}"

# Create reports directory
mkdir -p "${REPORT_DIR}"

echo -e "${YELLOW}Starting API tests...${NC}"

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo -e "${YELLOW}Installing Newman and required reporters...${NC}"
    npm install -g newman newman-reporter-htmlextra
fi

# Run Newman tests with SSL verification disabled and detailed reporting
TEST_EXIT_CODE=0
newman run "${COLLECTION_FILE}" \
    --environment "${ENVIRONMENT_FILE}" \
    --insecure \
    --reporters cli,htmlextra,json \
    --reporter-htmlextra-title "Day1 API Test Report" \
    --reporter-htmlextra-export "${REPORT_DIR}/${REPORT_NAME}.html" \
    --reporter-json-export "${REPORT_DIR}/${REPORT_NAME}.json" \
    --timeout-request 60000 \
    --timeout-script 60000 \
    --suppress-exit-code \
    --env-var "apiKey=${API_KEY}" \
    --env-var "apiSecret=${API_SECRET}" \
    --env-var "authToken=${AUTH_TOKEN}" \
    --env-var "environment=${TEST_ENV}" || TEST_EXIT_CODE=$?

# Process test results
if [ -f "${REPORT_DIR}/${REPORT_NAME}.json" ]; then
    TOTAL_TESTS=$(jq '.run.stats.tests' "${REPORT_DIR}/${REPORT_NAME}.json")
    FAILED_TESTS=$(jq '.run.stats.failures' "${REPORT_DIR}/${REPORT_NAME}.json")
    SKIPPED_TESTS=$(jq '.run.stats.skipped' "${REPORT_DIR}/${REPORT_NAME}.json")
    
    echo -e "\n${YELLOW}Test Summary:${NC}"
    echo -e "Total Tests: ${TOTAL_TESTS}"
    echo -e "Failed Tests: ${FAILED_TESTS}"
    echo -e "Skipped Tests: ${SKIPPED_TESTS}"
    
    if [ "${TEST_EXIT_CODE}" -eq 0 ] && [ "${FAILED_TESTS}" -eq 0 ]; then
        echo -e "\n${GREEN}✓ All tests passed successfully!${NC}"
        echo -e "Detailed report available at: ${REPORT_DIR}/${REPORT_NAME}.html"
    else
        echo -e "\n${RED}✗ Tests failed! Check the detailed report for more information.${NC}"
        echo -e "Detailed report available at: ${REPORT_DIR}/${REPORT_NAME}.html"
        
        # Extract failed test names
        echo -e "\n${RED}Failed Tests:${NC}"
        jq -r '.run.executions[] | select(.assertions[] .error) | "- " + .item.name + ": " + (.assertions[] | select(.error) | .error.message)' "${REPORT_DIR}/${REPORT_NAME}.json"
        
        exit 1
    fi
else
    echo -e "\n${RED}Error: Test result file not found!${NC}"
    exit 1
fi

#!/bin/bash

# Exit on any error
set -e

# Configuration
COLLECTION_FILE="api-tests.postman_collection.json"
ENVIRONMENT_FILE="api-environment.postman_environment.json"
REPORT_DIR="newman-reports"
DATE_SUFFIX=$(date +%Y%m%d_%H%M%S)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print error messages
error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

# Function to print success messages
success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Function to print info messages
info() {
    echo -e "${YELLOW}INFO: $1${NC}"
}

# Check if newman is installed
check_newman() {
    if ! command -v newman &> /dev/null; then
        info "Newman is not installed. Installing now..."
        if ! command -v npm &> /dev/null; then
            error "npm is not installed. Please install Node.js and npm first."
            exit 1
        fi
        npm install -g newman newman-reporter-html newman-reporter-htmlextra
        if [ $? -ne 0 ]; then
            error "Failed to install Newman"
            exit 1
        fi
        success "Newman installed successfully"
    else
        info "Newman is already installed"
    fi
}

# Create reports directory
setup_reports_dir() {
    mkdir -p "${REPORT_DIR}"
    if [ $? -ne 0 ]; then
        error "Failed to create reports directory"
        exit 1
    fi
}

# Validate input files
validate_files() {
    if [ ! -f "${COLLECTION_FILE}" ]; then
        error "Collection file not found: ${COLLECTION_FILE}"
        exit 1
    fi

    if [ ! -f "${ENVIRONMENT_FILE}" ]; then
        error "Environment file not found: ${ENVIRONMENT_FILE}"
        exit 1
    fi
}

# Run tests and generate reports
run_tests() {
    info "Starting API tests..."
    
    newman run "${COLLECTION_FILE}" \
        --environment "${ENVIRONMENT_FILE}" \
        --reporters cli,htmlextra,json \
        --reporter-htmlextra-export "${REPORT_DIR}/report_${DATE_SUFFIX}.html" \
        --reporter-json-export "${REPORT_DIR}/report_${DATE_SUFFIX}.json" \
        --suppress-exit-code

    TEST_EXIT_CODE=$?
    
    if [ ${TEST_EXIT_CODE} -eq 0 ]; then
        success "All tests passed successfully"
    else
        error "Some tests failed. Check the reports for details"
        info "HTML Report: ${REPORT_DIR}/report_${DATE_SUFFIX}.html"
        info "JSON Report: ${REPORT_DIR}/report_${DATE_SUFFIX}.json"
    fi

    return ${TEST_EXIT_CODE}
}

# Main execution
main() {
    info "=== Starting API Test Suite ==="
    
    check_newman
    setup_reports_dir
    validate_files
    run_tests
    
    TEST_RESULT=$?
    
    info "=== Test Suite Completed ==="
    info "Reports generated in: ${REPORT_DIR}"
    
    return ${TEST_RESULT}
}

# Execute main function
main "$@"
