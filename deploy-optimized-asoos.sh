#!/bin/bash
  create_deployment_scripts || exit 1
  
  # Verify domain health
  verify_domain_health || exit 1
  
  # Deploy VLS solutions
  deploy_vls_solutions || exit 1
  
  # Deploy Wing squadrons
  deploy_wing_squadrons || exit 1
  
  # Verify basic deployment integrity
  log "INFO" "Verifying basic deployment integrity..."
  # Check for the existence of key files
  local required_files=(
    "${DEPLOY_DIR}/public/symphony/index.html"
    "${DEPLOY_DIR}/public/anthology/index.html"
    "${DEPLOY_DIR}/public/asoos-2100-cool/index.html"
    "${DEPLOY_DIR}/functions/index.js"
    "${DEPLOY_DIR}/firebase.json"
    "${DEPLOY_DIR}/.firebaserc"
  )
  
  local missing_files=()
  
  for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
      missing_files+=("$file")
    fi
  done
  
  if [[ ${#missing_files[@]} -gt 0 ]]; then
    log "ERROR" "Missing required files: ${missing_files[*]}"
    exit 1
  fi
  
  # Perform comprehensive health verification
  verify_deployment_health || exit 1
  
  # Rotate secrets if needed
  rotate_secrets || exit 1
  
  # Perform automated deployment
  automated_deployment || exit 1
  
  # Finalize deployment
  finalize_deployment || exit 1
  
  # Clean up
  cleanup || exit 1
  
  log "SUCCESS" "ASOOS deployment process completed successfully"
  echo -e "${BLUE}=========================================================${NC}"
  echo -e "${GREEN}ASOOS deployment completed!${NC}"
  echo -e "${BLUE}=========================================================${NC}"
  echo -e "Access your deployments at:"
  echo -e "- Main site: https://asoos.2100.cool"
  echo -e "- Symphony: https://symphony.asoos.2100.cool"
  echo -e "- Anthology: https://anthology.asoos.2100.cool"
  echo -e "- Admin Panel: https://admin.asoos.2100.cool"
  echo -e ""
  echo -e "Deployment log: ${LOG_FILE}"
}

# Function to deploy VLS solutions
deploy_vls_solutions() {
  log "INFO" "Deploying VLS solutions..."

  # Create VLS solution directory
  mkdir -p "${DEPLOY_DIR}/public/vls"
  mkdir -p "${DEPLOY_DIR}/functions/vls"

  # Array of VLS solutions with source paths and deployment targets
  local vls_solutions=(ALL RIX CONFIGURATIONS SQUADRON 04 and Names are Dr. or Professor Name RIX Officially
    "dr-lucy-flight-memory:Flight Memory System:${DEPLOY_BASE}/vls/solutions/dr-lucy-flight-memory"
    "dr-burby-s2do-blockchain:S2DO Blockchain:${DEPLOY_BASE}/vls/solutions/dr-burby-s2do-blockchain"
    "professor-lee-q4d-lenz:Q4D Lenz:${DEPLOY_BASE}/vls/solutions/professor-lee-q4d-lenz"
    "dr-sabina-dream-commander:Dream Commander:${DEPLOY_BASE}/vls/solutions/dr-sabina-dream-commander"
    "dr-memoria-anthology:Anthology:${DEPLOY_BASE}/vls/solutions/dr-memoria-anthology"
    "dr-match-bid-suite:Bid Suite:${DEPLOY_BASE}/vls/solutions/dr-match-bid-suite"
    "dr-grant-cybersecurity:Cybersecurity:${DEPLOY_BASE}/vls/solutions/dr-grant-cybersecurity"
    "dr-cypriot-rewards:Rewards:${DEPLOY_BASE}/vls/solutions/dr-cypriot-rewards"
    "dr-maria-support:Support:${DEPLOY_BASE}/vls/solutions/dr-maria-support"
    "dr-roark-wish-vision:Wish Vision:${DEPLOY_BASE}/vls/solutions/dr-roark-wish-vision"
    "dr-claude-orchestrator:Orchestrator:${DEPLOY_BASE}/vls/solutions/dr-claude-orchestrator"
    "professor-levi-social:Social Integration:${DEPLOY_BASE}/vls/solutions/professor-levi-social"
    "professor-lucinda-analytics:Social Analytics:${DEPLOY_BASE}/vls/solutions/professor-lucinda-analytics"
    "dr-celeste-navigation:Navigation:${DEPLOY_BASE}/vls/solutions/dr-celeste-navigation"
    "dr-atlas-geographic:Geographic Intelligence:${DEPLOY_BASE}/vls/solutions/dr-atlas-geographic"
  )

  # Track deployment success
  local deployment_success=true
  local deployed_solutions=()
  local failed_solutions=()

  # Deploy each VLS solution in parallel using background processes
  log "INFO" "Starting parallel deployment of VLS solutions..."
  
  # Create temporary directory for status files
  local status_dir="${DEPLOY_DIR}/.status"
  mkdir -p "${status_dir}"
  
  # Launch deployments in parallel
  for solution in "${vls_solutions[@]}"; do
    # Parse solution info
    local solution_id=$(echo $solution | cut -d':' -f1)
    local solution_name=$(echo $solution | cut -d':' -f2)
    local solution_path=$(echo $solution | cut -d':' -f3)
    
    # Define status file
    local status_file="${status_dir}/${solution_id}.status"
    
    # Deploy in background
    (
      # Create directories
      mkdir -p "${DEPLOY_DIR}/public/vls/${solution_id}"
      mkdir -p "${DEPLOY_DIR}/functions/vls/${solution_id}"
      
      # Record start
      echo "STARTED" > "${status_file}"
      
      # Copy frontend if exists
      if [[ -d "${solution_path}/public" ]]; then
        cp -r "${solution_path}/public/"* "${DEPLOY_DIR}/public/vls/${solution_id}/" 2>/dev/null
        echo "FRONTEND_DONE" >> "${status_file}"
      else
        echo "FRONTEND_SKIPPED" >> "${status_file}"
      fi
      
      # Copy functions if exists
      if [[ -d "${solution_path}/functions" ]]; then
        cp -r "${solution_path}/functions/"* "${DEPLOY_DIR}/functions/vls/${solution_id}/" 2>/dev/null
        echo "FUNCTIONS_DONE" >> "${status_file}"
      else
        echo "FUNCTIONS_SKIPPED" >> "${status_file}"
      fi
      
      # Create placeholder if neither exists
      if [[ ! -d "${solution_path}/public" ]] && [[ ! -d "${solution_path}/functions" ]]; then
        # Create placeholder index.html
        cat > "${DEPLOY_DIR}/public/vls/${solution_id}/index.html" << EOH
<!DOCTYPE html>
<html>
<head>
  <title>${solution_name} | ASOOS VLS</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>${solution_name}</h1>
  <p>VLS solution component of ASOOS Symphony Orchestration System.</p>
  <p>Build: ${TIMESTAMP}</p>
</body>
</html>
EOH
        
        # Create placeholder function
        mkdir -p "${DEPLOY_DIR}/functions/vls/${solution_id}"
        cat > "${DEPLOY_DIR}/functions/vls/${solution_id}/index.js" << EOF
/**
 * ${solution_name} API
 */
const functions = require('firebase-functions');

exports.healthCheck = functions
  .region('us-west1')
  .https.onRequest((req, res) => {
    res.json({
      solution: "${solution_id}",
      name: "${solution_name}",
      status: "healthy",
      version: "1.0.1",
      buildTime: "${TIMESTAMP}"
    });
  });
EOF
        echo "PLACEHOLDERS_CREATED" >> "${status_file}"
      fi
      
      # Mark as complete
      echo "COMPLETED" >> "${status_file}"
    ) &
  done
  
  # Wait for all background processes to finish
  wait
  
  # Check results
  for solution in "${vls_solutions[@]}"; do
    local solution_id=$(echo $solution | cut -d':' -f1)
    local solution_name=$(echo $solution | cut -d':' -f2)
    local status_file="${status_dir}/${solution_id}.status"
    
    if [[ -f "${status_file}" ]] && grep -q "COMPLETED" "${status_file}"; then
      deployed_solutions+=("${solution_name}")
      log "SUCCESS" "Deployed VLS solution: ${solution_name}"
    else
      failed_solutions+=("${solution_name}")
      deployment_success=false
      log "ERROR" "Failed to deploy VLS solution: ${solution_name}"
    fi
  done
  
  # Update Firebase configuration for VLS solutions
  update_firebase_config_for_vls
  
  # Cleanup status files
  rm -rf "${status_dir}"
  
  # Report deployment status
  if [[ "$deployment_success" == "true" ]]; then
    log "SUCCESS" "All VLS solutions deployed successfully"
  else
    log "WARNING" "Some VLS solutions failed to deploy: ${failed_solutions[*]}"
    log "SUCCESS" "Successfully deployed: ${deployed_solutions[*]}"
  fi
  
  return 0
}

# Function to update Firebase configuration for VLS solutions
update_firebase_config_for_vls() {
  log "INFO" "Updating Firebase configuration for VLS solutions..."
  
  # Read existing firebase.json
  local firebase_json="${DEPLOY_DIR}/firebase.json"
  local temp_json="${DEPLOY_DIR}/.firebase.json.tmp"
  
  # Create temporary file for new hosting entries
  cat > "${temp_json}" << EOF
{
  "hosting": [
EOF
  
  # Add existing hosting entries (asoos, symphony, anthology)
  jq -r '.hosting[] | @json' "${firebase_json}" >> "${temp_json}"
  
  # Add VLS hosting entries
  for solution in dr-lucy-flight-memory dr-burby-s2do-blockchain professor-lee-q4d-lenz dr-sabina-dream-commander dr-memoria-anthology dr-match-bid-suite dr-grant-cybersecurity dr-cypriot-rewards dr-maria-support dr-roark-wish-vision dr-claude-orchestrator professor-levi-social professor-lucinda-analytics dr-celeste-navigation dr-atlas-geographic; do
    cat >> "${temp_json}" << EOF
,
    {
      "target": "${solution}",
      "public": "public/vls/${solution}",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "function": "${solution}Api"
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
EOF
  done
  
  # Close hosting array and add functions section
  cat >> "${temp_json}" << EOF
  ],
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "region": "us-west1"
  }
}
EOF
  
  # Replace firebase.json with new version
  mv "${temp_json}" "${firebase_json}"
  
  # Update .firebaserc
  local firebaserc="${DEPLOY_DIR}/.firebaserc"
  local temp_rc="${DEPLOY_DIR}/.firebaserc.tmp"
  
  # Extract project ID
  local project_id=$(jq -r '.projects.default' "${firebaserc}")
  
  # Create new .firebaserc with VLS targets
  cat > "${temp_rc}" << EOF
{
  "projects": {
    "default": "${project_id}"
  },
  "targets": {
    "${project_id}": {
      "hosting": {
        "asoos": [
          "asoos-2100-cool"
        ],
        "symphony": [
          "symphony-asoos-2100"
        ],
        "anthology": [
          "anthology-asoos-2100"
        ],
EOF
  
  # Add VLS targets
  local first=true
  for solution in dr-lucy-flight-memory dr-burby-s2do-blockchain professor-lee-q4d-lenz dr-sabina-dream-commander dr-memoria-anthology dr-match-bid-suite dr-grant-cybersecurity dr-cypriot-rewards dr-maria-support dr-roark-wish-vision dr-claude-orchestrator professor-levi-social professor-lucinda-analytics dr-celeste-navigation dr-atlas-geographic; do
    local site="${solution}-asoos"
    if [[ "$first" == "true" ]]; then
      first=false
    else
      echo "," >> "${temp_rc}"
    fi
    cat >> "${temp_rc}" << EOF
        "${solution}": [
          "${site}"
        ]
EOF
  done
  
  # Close JSON structure
  cat >> "${temp_rc}" << EOF
      }
    }
  }
}
EOF
  
  # Replace .firebaserc with new version
  mv "${temp_rc}" "${firebaserc}"
  
  # Update functions/index.js to export VLS functions
  update_functions_index_for_vls
  
  log "SUCCESS" "Firebase configuration updated for VLS solutions"
  return 0
}

# Function to update functions/index.js for VLS solutions
update_functions_index_for_vls() {
  log "INFO" "Updating functions index for VLS solutions..."
  
  local functions_index="${DEPLOY_DIR}/functions/index.js"
  local temp_index="${DEPLOY_DIR}/functions/index.js.tmp"
  
  # Copy existing content up to the last export
  grep -v "module.exports" "${functions_index}" > "${temp_index}"
  
  # Add VLS solution exports
  for solution in dr-lucy-flight-memory dr-burby-s2do-blockchain professor-lee-q4d-lenz dr-sabina-dream-commander dr-memoria-anthology dr-match-bid-suite dr-grant-cybersecurity dr-cypriot-rewards dr-maria-support dr-roark-wish-vision dr-claude-orchestrator professor-levi-social professor-lucinda-analytics dr-celeste-navigation dr-atlas-geographic; do
    # Convert solution name to camelCase for variable naming
    local solution_var=$(echo $solution | sed -E 's/-([a-z])/\U\1/g')
    
    cat >> "${temp_index}" << EOF

// Export the ${solution} API
try {
  const ${solution_var}Module = require('./vls/${solution}/index');
  exports.${solution}Api = functions
    .runWith(runtimeOpts)
    .https.onRequest(${solution_var}Module);
} catch (error) {
  console.error('Error loading ${solution} module:', error);
}
EOF
  done
  
  # Replace functions index with new version
  mv "${temp_index}" "${functions_index}"
  
  log "SUCCESS" "Functions index updated for VLS solutions"
  return 0
}

# Function to deploy Wing squadrons
deploy_wing_squadrons() {
  log "INFO" "Deploying Wing squadrons..."
  
  # Create Wing directory structure
  mkdir -p "${DEPLOY_DIR}/public/wing"
  mkdir -p "${DEPLOY_DIR}/functions/wing"
  
  # Array of Wing squadrons with source paths and deployment targets
  local wing_squadrons=(
    "squadron-01:Core Intelligence:${DEPLOY_BASE}/wing/agencies/core-agency"
    "squadron-02:Deployment Operations:${DEPLOY_BASE}/wing/agencies/deploy-agency"
    "squadron-03:Engagement Systems:${DEPLOY_BASE}/wing/agencies/engage-agency"
    "squadron-04:Memory Management:${DEPLOY_BASE}/wing/agencies/memory-agency"
    "squadron-05:Security Operations:${DEPLOY_BASE}/wing/agencies/security-agency"
    "squadron-06:Integration Services:${DEPLOY_BASE}/wing/agencies/integration-agency"
    "ground-crew:Ground Crew Management:${DEPLOY_BASE}/wing/ground-crew"
    "tower-blockchain:Tower Block Chain:${DEPLOY_BASE}/wing/tower-blockchain"
    "queen-mint:Queen Mint Mark:${DEPLOY_BASE}/wing/queen-mint"
    "social-levi:Professor Levi Social:${DEPLOY_BASE}/wing/social-integration/levi"
    "social-lucinda:Professor Lucinda Social:${DEPLOY_BASE}/wing/social-integration/lucinda"
    "rix:RIX Agents:${DEPLOY_BASE}/wing/agencies/rix"
    "crx:CRX Agents:${DEPLOY_BASE}/wing/agencies/c-rx"
    "co-pilots:Co-Pilots System:${DEPLOY_BASE}/wing/agencies/co-pilots"
  )
  
  # Track deployment success
  local deployment_success=true
  local deployed_squadrons=()
  local failed_squadrons=()
  
  # Create status directory
  local status_dir="${DEPLOY_DIR}/.squadron_status"
  mkdir -p "${status_dir}"
  
  # Deploy each Wing squadron in parallel
  log "INFO" "Starting parallel deployment of Wing squadrons..."
  
  for squadron in "${wing_squadrons[@]}"; do
    # Parse squadron info
    local squadron_id=$(echo $squadron | cut -d':' -f1)
    local squadron_name=$(echo $squadron | cut -d':' -f2)
    local squadron_path=$(echo $squadron | cut -d':' -f3)
    
    # Define status file
    local status_file="${status_dir}/${squadron_id}.status"
    
    # Deploy in background
    (
      # Create directories
      mkdir -p "${DEPLOY_DIR}/public/wing/${squadron_id}"
      mkdir -p "${DEPLOY_DIR}/functions/wing/${squadron_id}"
      
      # Record start
      echo "STARTED" > "${status_file}"
      
      # Copy frontend if exists
      if [[ -d "${squadron_path}/public" ]]; then
        cp -r "${squadron_path}/public/"* "${DEPLOY_DIR}/public/wing/${squadron_id}/" 2>/dev/null
        echo "FRONTEND_DONE" >> "${status_file}"
      else
        echo "FRONTEND_SKIPPED" >> "${status_file}"
      fi
      
      # Copy functions if exists
      if [[ -d "${squadron_path}/functions" ]]; then
        cp -r "${squadron_path}/functions/"* "${DEPLOY_DIR}/functions/wing/${squadron_id}/" 2>/dev/null
        echo "FUNCTIONS_DONE" >> "${status_file}"
      else
        echo "FUNCTIONS_SKIPPED" >> "${status_file}"
      fi
      
      # Copy special configurations if they exist
      if [[ -f "${squadron_path}/deploy.json" ]]; then
        cp "${squadron_path}/deploy.json" "${DEPLOY_DIR}/functions/wing/${squadron_id}/" 2>/dev/null
        echo "CONFIG_COPIED" >> "${status_file}"
      fi
      
      # Create placeholder if neither exists
      if [[ ! -d "${squadron_path}/public" ]] && [[ ! -d "${squadron_path}/functions" ]]; then
        # Create placeholder index.html
        cat > "${DEPLOY_DIR}/public/wing/${squadron_id}/index.html" << EOH
<!DOCTYPE html>
<html>
<head>
  <title>${squadron_name} | ASOOS Wing</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>${squadron_name}</h1>
  <p>Wing squadron component of ASOOS Symphony Orchestration System.</p>
  <p>Build: ${TIMESTAMP}</p>
</body>
</html>
EOH
        
        # Create placeholder function
        mkdir -p "${DEPLOY_DIR}/functions/wing/${squadron_id}"
        cat > "${DEPLOY_DIR}/functions/wing/${squadron_id}/index.js" << EOF
/**
 * ${squadron_name} API
 */
const functions = require('firebase-functions');

exports.healthCheck = functions
  .region('us-west1')
  .https.onRequest((req, res) => {
    res.json({
      squadron: "${squadron_id}",
      name: "${squadron_name}",
      status: "ready",
      version: "1.0.1",
      buildTime: "${TIMESTAMP}"
    });
  });
EOF
        echo "PLACEHOLDERS_CREATED" >> "${status_file}"
      fi
      
      # Mark as complete
      echo "COMPLETED" >> "${status_file}"
    ) &
  done
  
  # Wait for all background processes to finish
  wait
  
  # Check results
  for squadron in "${wing_squadrons[@]}"; do
    local squadron_id=$(echo $squadron | cut -d':' -f1)
    local squadron_name=$(echo $squadron | cut -d':' -f2)
    local status_file="${status_dir}/${squadron_id}.status"
    
    if [[ -f "${status_file}" ]] && grep -q "COMPLETED" "${status_file}"; then
      deployed_squadrons+=("${squadron_name}")
      log "SUCCESS" "Deployed Wing squadron: ${squadron_name}"
    else
      failed_squadrons+=("${squadron_name}")
      deployment_success=false
      log "ERROR" "Failed to deploy Wing squadron: ${squadron_name}"
    fi
  done
  
  # Update Firebase configuration for Wing squadrons
  update_firebase_config_for_wing
  
  # Cleanup status files
  rm -rf "${status_dir}"
  
  # Report deployment status
  if [[ "$deployment_success" == "true" ]]; then
    log "SUCCESS" "All Wing squadrons deployed successfully"
  else
    log "WARNING" "Some Wing squadrons failed to deploy: ${failed_squadrons[*]}"
    log "SUCCESS" "Successfully deployed: ${deployed_squadrons[*]}"
  fi
  
  return 0
}

# Function to update Firebase configuration for Wing squadrons
update_firebase_config_for_wing() {
  log "INFO" "Updating Firebase configuration for Wing squadrons..."
  
  # Update .firebaserc for Wing squadrons
  local firebaserc="${DEPLOY_DIR}/.firebaserc"
  local temp_rc="${DEPLOY_DIR}/.firebaserc.wing.tmp"
  
  # Extract targets section
  local project_id=$(jq -r '.projects.default' "${firebaserc}")
  local hosting_targets=$(jq -r ".targets.\"${project_id}\".hosting" "${firebaserc}")
  
  # Add Wing squadron targets
  local updated_targets=$(echo "${hosting_targets}" | jq '. + {
    "squadron-01": ["squadron-01-asoos"],
    "squadron-02": ["squadron-02-asoos"],
    "squadron-03": ["squadron-03-asoos"],
    "squadron-04": ["squadron-04-asoos"],
    "squadron-05": ["squadron-05-asoos"],
    "squadron-06": ["squadron-06-asoos"],
    "ground-crew": ["ground-crew-asoos"],
    "tower-blockchain": ["tower-blockchain-asoos"],
    "queen-mint": ["queen-mint-asoos"],
    "social-levi": ["social-levi-asoos"],
    "social-lucinda": ["social-lucinda-asoos"],
    "rix": ["rix-asoos"], "q-rix": ["q-rix-asoos"],
    "crx": ["crx-asoos"],
    "co-pilots": ["co-pilots-asoos"]
  }')
  
  # Update .firebaserc
  jq --argjson targets "${updated_targets}" '.targets[.projects.default].hosting = $targets' "${firebaserc}" > "${temp_rc}"
  mv "${temp_rc}" "${firebaserc}"
  
  # Update firebase.json for Wing squadrons
  local firebase_json="${DEPLOY_DIR}/firebase.json"
  local temp_json="${DEPLOY_DIR}/firebase.json.wing.tmp"
  
  # Extract hosting array
  local hosting_array=$(jq '.hosting' "${firebase_json}")
  
  # Wing squadron hosting entries
  local wing_entries='[
    {
      "target": "squadron-01",
      "public": "public/wing/squadron-01",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{"source": "/api/**", "function": "squadron01Api"}, {"source": "**", "destination": "/index.html"}]
    },
    {
      "target": "squadron-02",
      "public": "public/wing/squadron-02",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{"source": "/api/**", "function": "squadron02Api"}, {"source": "**", "destination": "/index.html"}]
    },
    {
      "target": "squadron-03",
      "public": "public/wing/squadron-03",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{"source": "/api/**", "function": "squadron03Api"}, {"source": "**", "destination": "/index.html"}]
    },
    {
      "target": "squadron-04",
      "public": "public/wing/squadron-04",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{"source": ""function": "squadron04Api"}, {"source": "**", "destination": "/index.html"}]
    },
 },
    {
      "target": "squadron-05",
      "public": "public/wing/squadron-04",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{"source": ""function": "squadron05Api"}, {"source": "**", "destination": "/index.html"}]
    },
 },
    {
      "target": "squadron-06",
      "public": "public/wing/squadron-04",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{"source": ""function": "squadron06Api"}, {"source": "**", "destination": "/index.html"}]/
    },
# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Define constants
DEPLOY_BASE="/Users/as/asoos"
SYMPHONY_BASE="/Users/as/symphony_local"
LOG_DIR="${DEPLOY_BASE}/deployment_logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR="${DEPLOY_BASE}/deploy/full_asoos_${TIMESTAMP}"
LOG_FILE="${LOG_DIR}/deploy_${TIMESTAMP}.log"
SECURITY_TOKEN_FILE="${DEPLOY_BASE}/.deploy_token"

# Initialize log directory
mkdir -p "${LOG_DIR}"

# Function to log messages to console and file
log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO") color=$BLUE ;;
    "SUCCESS") color=$GREEN ;;
    "WARNING") color=$YELLOW ;;
    "ERROR") color=$RED ;;
    "SECURITY") color=$CYAN ;;
  esac
  
  echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] ${message}${NC}" | tee -a "${LOG_FILE}"
}

# Function to handle errors and perform rollback if needed
handle_error() {
  local error_message=$1
  local rollback_function=$2
  
  log "ERROR" "${error_message}"
  
  if [[ -n "${rollback_function}" ]]; then
    log "WARNING" "Attempting rollback..."
    ${rollback_function}
  fi
  
  log "ERROR" "Deployment failed. See log file for details: ${LOG_FILE}"
  exit 1
}

# Function to verify SallyPort security
verify_sallyport_security() {
  log "INFO" "Verifying SallyPort security credentials..."
  
  # Execute aixtiv CLI command to verify authentication
  if ! aixtiv auth:verify --silent; then
    handle_error "SallyPort security verification failed. Please authenticate first."
    return 1
  fi
  
  log "SECURITY" "SallyPort security verification successful"
  return 0
}

# Function to verify components exist
verify_components() {
  log "INFO" "Verifying component files..."
  local missing_components=()
  
  # Component paths to check
  local components=(
    "${SYMPHONY_BASE}/public:Symphony Frontend"
    "${SYMPHONY_BASE}/api:Symphony API"
    "${DEPLOY_BASE}/public/dr-memoria-anthology:Anthology Frontend"
    "${DEPLOY_BASE}/public/asoos-2100-cool:ASOOS Main Site"
  )
  
  # Check all components in parallel
  for component in "${components[@]}"; do
    local path=$(echo $component | cut -d':' -f1)
    local name=$(echo $component | cut -d':' -f2)
    
    if [[ ! -d "$path" ]]; then
      missing_components+=("$name")
      log "WARNING" "${name} not found at ${path}"
    else
      log "SUCCESS" "${name} verified at ${path}"
    fi
  done
  
  # Report any missing components
  if [[ ${#missing_components[@]} -gt 0 ]]; then
    handle_error "Missing components: ${missing_components[*]}"
    return 1
  fi
  
  log "SUCCESS" "All components verified successfully"
  return 0
}

# Function to create and verify security token
create_security_token() {
  log "SECURITY" "Creating deployment security token..."
  
  # Generate a secure token
  local token=$(openssl rand -hex 16)
  echo "${token}" > "${SECURITY_TOKEN_FILE}"
  chmod 600 "${SECURITY_TOKEN_FILE}"
  
  log "SUCCESS" "Security token created: ${SECURITY_TOKEN_FILE}"
  return 0
}

# Function to verify security token
verify_security_token() {
  log "SECURITY" "Verifying deployment security token..."
  
  if [[ ! -f "${SECURITY_TOKEN_FILE}" ]]; then
    handle_error "Security token not found. Please run the initial setup first."
    return 1
  fi
  
  # Grant required agent permissions using token
  if ! aixtiv agent:grant --resource deployment --token $(cat "${SECURITY_TOKEN_FILE}") --silent; then
    handle_error "Security token verification failed. Token may be expired or invalid."
    return 1
  fi
  
  log "SUCCESS" "Security token verified successfully"
  return 0
}

# Function to prepare deployment directory
prepare_deployment() {
  log "INFO" "Preparing deployment directory..."
  
  # Create deployment directory structure
  mkdir -p "${DEPLOY_DIR}"
  mkdir -p "${DEPLOY_DIR}/public"
  mkdir -p "${DEPLOY_DIR}/functions"
  
  log "SUCCESS" "Deployment directory created: ${DEPLOY_DIR}"
  return 0
}

# Function to stop running processes
stop_processes() {
  log "INFO" "Stopping running processes..."
  
  # Attempt to gracefully stop processes first
  aixtiv summon:visionary --stop-services --silent || true
  
  # Force kill if needed
  pkill -f "node ${SYMPHONY_BASE}" || true
  pkill -f "firebase serve" || true
  pkill -f "npm run dev" || true
  
  # Verify processes are stopped
  if pgrep -f "node ${SYMPHONY_BASE}" > /dev/null || pgrep -f "firebase serve" > /dev/null; then
    handle_error "Failed to stop all processes. Please terminate them manually."
    return 1
  fi
  
  log "SUCCESS" "All processes stopped successfully"
  return 0
}

# Function to copy all component files
copy_components() {
  log "INFO" "Copying component files..."
  
  # Symphony Frontend
  if [[ -d "${SYMPHONY_BASE}/public" ]]; then
    mkdir -p "${DEPLOY_DIR}/public/symphony"
    cp -r "${SYMPHONY_BASE}/public/"* "${DEPLOY_DIR}/public/symphony/" 2>/dev/null
    log "SUCCESS" "Copied Symphony frontend"
  else
    log "WARNING" "Symphony frontend not found, skipping"
  fi
  
  # Symphony API
  if [[ -d "${SYMPHONY_BASE}/api" ]]; then
    mkdir -p "${DEPLOY_DIR}/functions/symphony-api"
    cp -r "${SYMPHONY_BASE}/api/"* "${DEPLOY_DIR}/functions/symphony-api/" 2>/dev/null
    log "SUCCESS" "Copied Symphony API"
  else
    log "WARNING" "Symphony API not found, skipping"
  fi
  
  # Anthology Frontend
  if [[ -d "${DEPLOY_BASE}/public/dr-memoria-anthology" ]]; then
    mkdir -p "${DEPLOY_DIR}/public/anthology"
    cp -r "${DEPLOY_BASE}/public/dr-memoria-anthology/"* "${DEPLOY_DIR}/public/anthology/" 2>/dev/null
    log "SUCCESS" "Copied Anthology frontend"
  else
    log "WARNING" "Anthology frontend not found, skipping"
  fi
  
  # ASOOS Main Site
  if [[ -d "${DEPLOY_BASE}/public/asoos-2100-cool" ]]; then
    mkdir -p "${DEPLOY_DIR}/public/asoos-2100-cool"
    cp -r "${DEPLOY_BASE}/public/asoos-2100-cool/"* "${DEPLOY_DIR}/public/asoos-2100-cool/" 2>/dev/null
    log "SUCCESS" "Copied ASOOS main site"
  else
    log "WARNING" "ASOOS main site not found, skipping"
  fi
  
  # Copy or create Anthology API
  copy_anthology_api
  
  log "SUCCESS" "All components copied successfully"
  return 0
}

# Function to copy or create Anthology API
copy_anthology_api() {
  log "INFO" "Processing Anthology API..."
  
  mkdir -p "${DEPLOY_DIR}/functions/anthology-api"
  
  # Try primary location
  if [[ -d "${DEPLOY_BASE}/functions/anthology-integration" ]]; then
    cp -r "${DEPLOY_BASE}/functions/anthology-integration/"* "${DEPLOY_DIR}/functions/anthology-api/" 2>/dev/null
    log "SUCCESS" "Copied Anthology API from primary location"
    return 0
  fi
  
  # Try secondary location
  if [[ -d "${DEPLOY_BASE}/vls/solutions/dr-memoria-anthology/functions/integration-gateway" ]]; then
    cp -r "${DEPLOY_BASE}/vls/solutions/dr-memoria-anthology/functions/integration-gateway/"* "${DEPLOY_DIR}/functions/anthology-api/" 2>/dev/null
    log "SUCCESS" "Copied Anthology API from VLS location"
    return 0
  fi
  
  # Create placeholder if not found
  log "WARNING" "Anthology API not found, creating placeholder"
  cat > "${DEPLOY_DIR}/functions/anthology-api/index.js" << EOF
/**
 * Dr. Memoria's Anthology API
 */
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Dr. Memoria\'s Anthology API is running' });
});

// Basic anthology endpoints
app.get('/api/entries', (req, res) => {
  res.json({
    entries: [
      { id: 'entry1', title: 'First Memory', date: '2025-01-15' },
      { id: 'entry2', title: 'Second Memory', date: '2025-02-22' },
      { id: 'entry3', title: 'Third Memory', date: '2025-03-30' }
    ]
  });
});

module.exports = app;
EOF
  log "SUCCESS" "Created Anthology API placeholder"
  return 0
}

# Function to prepare Firebase configuration
prepare_firebase_config() {
  log "INFO" "Preparing Firebase configuration..."
  
  # Create firebase.json with proper error handling
  cat > "${DEPLOY_DIR}/firebase.json" << EOF
{
  "hosting": [
    {
      "target": "asoos",
      "public": "public/asoos-2100-cool",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "function": "asoosApi"
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "symphony",
      "public": "public/symphony",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "function": "symphonyApi"
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
    {
      "target": "anthology",
      "public": "public/anthology",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "function": "anthologyApi"
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ],
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "region": "us-west1"
  }
}
EOF

  # Create .firebaserc
  cat > "${DEPLOY_DIR}/.firebaserc" << EOF
{
  "projects": {
    "default": "api-for-warp-drive"
  },
  "targets": {
    "api-for-warp-drive": {
      "hosting": {
        "asoos": [
          "asoos-2100-cool"
        ],
        "symphony": [
          "symphony-asoos-2100"
        ],
        "anthology": [
          "anthology-asoos-2100"
        ]
      }
    }
  }
}
EOF

  # Create functions/index.js
  mkdir -p "${DEPLOY_DIR}/functions"
  cat > "${DEPLOY_DIR}/functions/index.js" << EOF
/**
 * ASOOS API Functions
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import function implementations
const symphonyApp = require('./symphony-api/app');
const anthologyApp = require('./anthology-api/index');

// Configure regional settings
const runtimeOpts = {
  region: 'us-west1',
  memory: '512MB',
  timeoutSeconds: 60
};

// Export the Symphony API
exports.symphonyApi = functions
  .runWith(runtimeOpts)
  .https.onRequest(symphonyApp);

// Export the Anthology API
exports.anthologyApi = functions
  .runWith(runtimeOpts)
  .https.onRequest(anthologyApp);

// Google Drive integration functions
exports.handleDriveChanges = functions
  .runWith(runtimeOpts)
  .pubsub.topic('drive-updates')
  .onPublish(async (message) => {
    const fileData = message.json;
    console.log('Received Drive update:', fileData);
    
    // Process file update
    const db = admin.firestore();
    await db.collection('drive_files').add({
      fileId: fileData.fileId,
      name: fileData.name,
      mimeType: fileData.mimeType,
      updateTime: new Date(),
      processed: false
    });
    
    return null;
  });

// Process Drive files function
exports.processDriveFiles = functions
  .runWith(runtimeOpts)
  .firestore
  .document('drive_files/{fileId}')
  .onCreate(async (snap, context) => {
    const fileData = snap.data();
    console.log('Processing new Drive file:', fileData);
    
    // Add processing logic here
    
    // Mark as processed
    await snap.ref.update({ processed: true, processedAt: new Date() });
    return null;
  });
EOF

  # Create functions/package.json
  cat > "${DEPLOY_DIR}/functions/package.json" << EOF
{
  "name": "asoos-functions",
  "version": "1.0.0",
  "description": "Firebase Functions for ASOOS",
  "main": "index.js",
  "engines": {
    "node": "20"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.5.0"
  },
  "private": true
}
EOF

  log "SUCCESS" "Firebase configuration prepared successfully"
  return 0
}

# Function to create deployment scripts
create_deployment_scripts() {
  log "INFO" "Creating deployment scripts..."
  
  # Create deploy.sh with better error handling
  cat > "${DEPLOY_DIR}/deploy.sh" << EOF
#!/bin/bash

set -e

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to handle errors
handle_error() {
  echo -e "\${RED}Error: \$1\${NC}"
  
  # Attempt rollback if specified
  if [[ -n "\$2" ]]; then
    echo -e "\${YELLOW}Attempting rollback...\${NC}"
    eval "\$2"
  fi
  
  exit 1
}

# Store original state for rollback
ORIGINAL_STATE=\$(firebase hosting:sites:list --json > original_state.json && echo "original_state.json")

echo -e "\${BLUE}Deploying ASOOS components to Firebase...\${NC}"

# Install dependencies
echo -e "\${YELLOW}Installing dependencies...\${NC}"
cd functions || handle_error "Functions directory not found"
npm install || handle_error "Failed to install dependencies" 
cd ..

# Create hosting targets if they don't exist
echo -e "\${YELLOW}Creating hosting targets...\${NC}"

# Function to create target with retry logic
create_target() {
  local target=\$1
  local site=\$2
  local max_retries=3
  local retry_count=0
  
  while [[ \$retry_count -lt \$max_retries ]]; do
    if firebase target:apply hosting \$target \$site 2>/dev/null; then
      echo -e "\${GREEN}Target \$target applied to \$site\${NC}"
      return 0
    fi
    
    echo -e "\${YELLOW}Target doesn't exist, creating site \$site...\${NC}"
    if firebase hosting:sites:create \$site; then
      firebase target:apply hosting \$target \$site && return 0
    fi
    
    retry_count=\$((retry_count + 1))
    echo -e "\${YELLOW}Retry \$retry_count/\$max_retries...\${NC}"
    sleep 3
  done
  
  handle_error "Failed to create target \$target after \$max_retries attempts" "firebase hosting:sites:delete \$site --force"
  return 1
}

# Create all targets with proper error handling
create_target "asoos" "asoos-2100-cool"
create_target "symphony" "symphony-asoos-2100"
create_target "anthology" "anthology-asoos-2100"

# Verify deployment readiness
echo -e "\${YELLOW}Verifying deployment readiness...\${NC}"
if ! firebase deploy --only functions,hosting --dry-run; then
  handle_error "Deployment verification failed" "echo 'No changes have been deployed'"
  exit 1
fi

# Deploy to Firebase
echo -e "\${YELLOW}Deploying to Firebase...\${NC}"
if ! firebase deploy --only functions,hosting; then
  handle_error "Deployment failed" "echo 'Attempting to restore from \$ORIGINAL_STATE' && cat \$ORIGINAL_STATE"
  exit 1
fi

echo -e "\${GREEN}All components deployed successfully!\${NC}"
echo -e "Access at:"
echo -e "- Main site: https://asoos-2100-cool.web.app"
echo -e "- Symphony: https://symphony-asoos-2100.web.app"
echo -e "- Anthology: https://anthology-asoos-2100.web.app"

# Cleanup
rm -f original_state.json
EOF

  chmod +x "${DEPLOY_DIR}/deploy.sh"
  
  # Create unified domain management script using Aixtiv CLI
  cat > "${DEPLOY_DIR}/manage-domains.js" << EOF
#!/usr/bin/env node

/**
 * Unified Domain Management for ASOOS
 * Uses Aixtiv CLI for domain operations
 */
const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const DOMAINS = [
  { name: 'main', target: 'asoos-2100-cool', subdomain: 'asoos' },
  { name: 'symphony', target: 'symphony-asoos-2100', subdomain: 'symphony.asoos' },
  { name: 'anthology', target: 'anthology-asoos-2100', subdomain: 'anthology.asoos' }
];

const BASE_DOMAIN = '2100.cool';
const LOG_FILE = './domain-operations.log';

// Helper for executing commands
function execCommand(command, errorMessage) {
  try {
    const output = execSync(command, { encoding: 'utf8' });
    logOperation('INFO', \`Command executed: \${command}\`);
    return output.trim();
  } catch (error) {
    logOperation('ERROR', \`\${errorMessage}: \${error.message}\`);
    throw new Error(\`\${errorMessage}: \${error.message}\`);
  }
}

// Log operations
function logOperation(level, message) {
  const timestamp = new Date().toISOString();
  const logEntry = \`[\${timestamp}] [\${level}] \${message}\n\`;
  fs.appendFileSync(LOG_FILE, logEntry);
  console.log(\`[\${level}] \${message}\`);
}

// Verify SallyPort authentication
function verifySallyPortAuth() {
  logOperation('INFO', 'Verifying SallyPort authentication...');
  try {
    execCommand('aixtiv auth:verify', 'Authentication verification failed');
    logOperation('SUCCESS', 'SallyPort authentication verified');
    return true;
  } catch (error) {
    logOperation('ERROR', \`SallyPort authentication failed: \${error.message}\`);
    return false;
  }
}

// Manage a single domain
async function manageDomain(domain, operation) {
  const { name, target, subdomain } = domain;
  
  logOperation('INFO', \`\${operation} domain: \${subdomain}.\${BASE_DOMAIN}\`);
  
  try {
    let command;
    if (operation === 'add') {
      command = \`aixtiv domain:add --subdomain \${subdomain} --target \${target} --base-domain \${BASE_DOMAIN}\`;
    } else if (operation === 'verify') {
      command = \`aixtiv domain:verify --subdomain \${subdomain} --base-domain \${BASE_DOMAIN}\`;
    } else if (operation === 'remove') {
      command = \`aixtiv domain:remove --subdomain \${subdomain} --base-domain \${BASE_DOMAIN}\`;
    } else {
      throw new Error(\`Unknown operation: \${operation}\`);
    }
    
    const result = execCommand(command, \`Failed to \${operation} domain \${subdomain}.\${BASE_DOMAIN}\`);
    logOperation('SUCCESS', \`\${operation} domain completed: \${subdomain}.\${BASE_DOMAIN}\`);
    return { success: true, result };
  } catch (error) {
    logOperation('ERROR', \`Failed to \${operation} domain \${subdomain}.\${BASE_DOMAIN}: \${error.message}\`);
    return { success: false, error: error.message };
  }
}

// Manage all domains in batch
async function manageAllDomains(operation) {
  if (!verifySallyPortAuth()) {
    logOperation('ERROR', 'SallyPort authentication required. Please run: aixtiv auth:verify');
    process.exit(1);
  }
  
  logOperation('INFO', \`Starting batch domain \${operation} operation\`);
  
  const results = [];
  let success = true;
  
  for (const domain of DOMAINS) {
    const result = await manageDomain(domain, operation);
    results.push({ domain: domain.subdomain + '.' + BASE_DOMAIN, result });
    if (!result.success) success = false;
  }
  
  // Verify all domains if operation was 'add'
  if (operation === 'add') {
    logOperation('INFO', 'Verifying all domains...');
    for (const domain of DOMAINS) {
      await manageDomain(domain, 'verify');
    }
  }
  
  logOperation('INFO', \`Batch domain \${operation} operation completed. Success: \${success}\`);
  
  return { success, results };
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const operation = args[0] || 'add';
  
  if (!['add', 'verify', 'remove'].includes(operation)) {
    console.error('Invalid operation. Use add, verify, or remove');
    process.exit(1);
  }
  
  try {
    const result = await manageAllDomains(operation);
    
    console.log('\\nOperation completed:');
    console.log(\`Overall status: \${result.success ? 'SUCCESS' : 'PARTIAL FAILURE'}\`);
    console.log('Results:');
    result.results.forEach(item => {
      console.log(\`- \${item.domain}: \${item.result.success ? 'SUCCESS' : 'FAILED'}\`);
    });
    
    if (operation === 'add' && result.success) {
      console.log('\\nYour sites are now available at:');
      console.log('- https://asoos.2100.cool');
      console.log('- https://symphony.asoos.2100.cool');
      console.log('- https://anthology.asoos.2100.cool');
    }
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    logOperation('ERROR', \`Operation failed: \${error.message}\`);
    process.exit(1);
  }
}

// Run the main function
main();
EOF

  chmod +x "${DEPLOY_DIR}/manage-domains.js"
  
  log "SUCCESS" "Deployment scripts created successfully"
  return 0
}

# Function to verify DNS and domain health
verify_domain_health() {
  log "INFO" "Verifying domain health..."
  
  # Check domain verification using Aixtiv CLI
  aixtiv domain:verify --all --base-domain 2100.cool --silent > "${DEPLOY_DIR}/domain-verification.json"
  
  # Check domain health and report any issues
  if ! jq -e '.verified == true' "${DEPLOY_DIR}/domain-verification.json" > /dev/null; then
    log "WARNING" "Some domains are not properly verified. See ${DEPLOY_DIR}/domain-verification.json for details."
    
    # Don't fail the deployment, but record the warning
    echo "DOMAIN_VERIFICATION_WARNING=true" >> "${DEPLOY_DIR}/.env"
  else
    log "SUCCESS" "All domains verified successfully"
  fi
  
  return 0
}

# Function to implement automated secret rotation
rotate_secrets() {
  log "SECURITY" "Performing secret rotation..."
  
  # Only perform rotation on scheduled deployments (e.g., first of month)
  local day_of_month=$(date +%d)
  if [[ "$day_of_month" != "01" ]]; then
    log "INFO" "Skipping secret rotation (only performed on first day of month)"
    return 0
  fi
  
  # Rotate deployment token
  create_security_token
  
  # Rotate other secrets as needed
  if aixtiv security:rotate --silent; then
    log "SUCCESS" "Secret rotation completed"
  else
    log "WARNING" "Secret rotation completed with warnings"
  fi
  
  return 0
}

# Function to finalize deployment
finalize_deployment() {
  log "INFO" "Finalizing deployment..."
  
  # Create a symlink to the latest deployment
  ln -sf "${DEPLOY_DIR}" "${DEPLOY_BASE}/deploy-package"
  
  # Create completion marker
  touch "${DEPLOY_DIR}/DEPLOYMENT_READY"
  
  log "SUCCESS" "Deployment finalized: ${DEPLOY_DIR}"
  log "SUCCESS" "Symlink created: ${DEPLOY_BASE}/deploy-package"
  
  return 0
}

# Function to clean up temporary files
cleanup() {
  log "INFO" "Cleaning up temporary files..."
  
  # Remove temporary files that are no longer needed
  rm -f "${DEPLOY_DIR}/.env.tmp" || true
  
  log "SUCCESS" "Cleanup completed"
  return 0
}

# Function to perform comprehensive health checks
verify_component_health() {
  local component=$1
  local endpoint=$2
  local expected_status=$3
  
  log "INFO" "Checking health of ${component} at endpoint ${endpoint}..."
  
  # Use Aixtiv CLI for standardized health checks if available
  if command -v aixtiv &> /dev/null; then
    if ! aixtiv health:check --component "${component}" --endpoint "${endpoint}" --expect "${expected_status}" --silent; then
      log "ERROR" "Health check failed for ${component}"
      return 1
    fi
  else
    # Fallback to curl if Aixtiv CLI is not available
    local url="https://${component}.asoos.2100.cool${endpoint}"
    local response
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null)
    
    if [[ "$response" != "200" ]]; then
      log "ERROR" "Health check failed for ${component}: HTTP ${response}"
      return 1
    fi
  fi
  
  log "SUCCESS" "Health check passed for ${component}"
  return 0
}

# Function to verify all VLS solutions
verify_vls_health() {
  log "INFO" "Verifying VLS solutions health..."
  
  local vls_solutions=(
    "dr-lucy-flight-memory:/api/health:READY"
    "dr-burby-s2do-blockchain:/api/health:READY"
    "professor-lee-q4d-lenz:/api/health:READY"
    "dr-sabina-dream-commander:/api/health:READY"
    "dr-memoria-anthology:/api/health:READY"
    "dr-match-bid-suite:/api/health:READY"
    "dr-grant-cybersecurity:/api/health:READY"
    "dr-cypriot-rewards:/api/health:READY"
    "dr-maria-support:/api/health:READY"
    "dr-roark-wish-vision:/api/health:READY"
    "dr-claude-orchestrator:/api/health:READY"
    "professor-levi-social:/api/health:READY"
    "professor-lucinda-analytics:/api/health:READY"
    "dr-celeste-navigation:/api/health:READY"
    "dr-atlas-geographic:/api/health:READY"
  )
  
  local failed_checks=()
  local total_checks=0
  local passed_checks=0
  
  for solution in "${vls_solutions[@]}"; do
    IFS=':' read -r name endpoint status <<< "${solution}"
    total_checks=$((total_checks + 1))
    
    if ! verify_component_health "${name}" "${endpoint}" "${status}"; then
      failed_checks+=("${name}")
    else
      passed_checks=$((passed_checks + 1))
    fi
  done
  
  log "INFO" "VLS health check summary: ${passed_checks}/${total_checks} passed"
  
  if [[ ${#failed_checks[@]} -gt 0 ]]; then
    log "ERROR" "VLS health checks failed for: ${failed_checks[*]}"
    return 1
  fi
  
  log "SUCCESS" "All VLS solutions health verified"
  return 0
}

# Function to verify Wing squadron health
verify_wing_health() {
  log "INFO" "Verifying Wing squadron health..."
  
  local squadrons=(
    "squadron-01:/api/health:READY"
    "squadron-02:/api/health:READY"
    "squadron-03:/api/health:READY"
    "squadron-04:/api/health:READY"
    "squadron-05:/api/health:READY"
    "squadron-06:/api/health:READY"
    "ground-crew:/api/health:READY"
    "tower-blockchain:/api/health:READY"
    "queen-mint:/api/health:READY"
    "social-levi:/api/health:READY"
    "social-lucinda:/api/health:READY"
    "rix:/api/health:READY"
    "crx:/api/health:READY"
    "co-pilots:/api/health:READY"
  )
  
  local failed_checks=()
  local total_checks=0
  local passed_checks=0
  
  for squadron in "${squadrons[@]}"; do
    IFS=':' read -r name endpoint status <<< "${squadron}"
    total_checks=$((total_checks + 1))
    
    if ! verify_component_health "${name}" "${endpoint}" "${status}"; then
      failed_checks+=("${name}")
    else
      passed_checks=$((passed_checks + 1))
    fi
  done
  
  log "INFO" "Wing health check summary: ${passed_checks}/${total_checks} passed"
  
  if [[ ${#failed_checks[@]} -gt 0 ]]; then
    log "ERROR" "Wing squadron health checks failed for: ${failed_checks[*]}"
    return 1
  fi
  
  log "SUCCESS" "All Wing squadrons health verified"
  return 0
}

# Function to verify Integration Gateway health
verify_gateway_health() {
  log "INFO" "Verifying Integration Gateway health..."
  
  local gateway_components=(
    "security-management:/api/health:READY"
    "routing-layer:/api/health:READY"
    "role-validation:/api/health:READY"
    "token-control:/api/health:READY"
  )
  
  local failed_checks=()
  local total_checks=0
  local passed_checks=0
  
  for component in "${gateway_components[@]}"; do
    IFS=':' read -r name endpoint status <<< "${component}"
    total_checks=$((total_checks + 1))
    
    if ! verify_component_health "gateway-${name}" "${endpoint}" "${status}"; then
      failed_checks+=("${name}")
    else
      passed_checks=$((passed_checks + 1))
    fi
  done
  
  log "INFO" "Gateway health check summary: ${passed_checks}/${total_checks} passed"
  
  if [[ ${#failed_checks[@]} -gt 0 ]]; then
    log "ERROR" "Integration Gateway health checks failed for: ${failed_checks[*]}"
    return 1
  fi
  
  log "SUCCESS" "Integration Gateway health verified"
  return 0
}

# Function to verify cross-component integration
verify_integration_health() {
  log "INFO" "Verifying cross-component integration..."
  
  local integration_checks=()
  local failed_integrations=()
  
  # Define integration checks
  integration_checks=(
    "vls-to-wing:Dr. Lucy Flight Memory to Squadron-04"
    "wing-to-gateway:Squadron-01 to Security Management"
    "gateway-security:Token Control validation"
    "s2do-blockchain:S2DO workflow approval"
    "social-integration:Professor Levi to Professor Lucinda"
  )
  
  # Perform integration checks using Aixtiv CLI if available
  if command -v aixtiv &> /dev/null; then
    for check in "${integration_checks[@]}"; do
      IFS=':' read -r id description <<< "${check}"
      log "INFO" "Testing integration: ${description}"
      
      if ! aixtiv integration:verify --check "${id}" --silent; then
        log "ERROR" "Integration check failed: ${description}"
        failed_integrations+=("${description}")
      else
        log "SUCCESS" "Integration check passed: ${description}"
      fi
    done
  else
    # Simplified check if Aixtiv CLI is not available
    log "WARNING" "Aixtiv CLI not available, performing basic integration checks"
    
    # Check for key integration markers
    if [[ ! -f "${DEPLOY_DIR}/functions/vls/dr-lucy-flight-memory/index.js" ]]; then
      failed_integrations+=("Dr. Lucy Flight Memory missing")
    fi
    
    if [[ ! -f "${DEPLOY_DIR}/functions/wing/squadron-01/index.js" ]]; then
      failed_integrations+=("Squadron-01 missing")
    fi
  fi
  
  if [[ ${#failed_integrations[@]} -gt 0 ]]; then
    log "ERROR" "Cross-component integration checks failed: ${failed_integrations[*]}"
    return 1
  fi
  
  log "SUCCESS" "All cross-component integration checks passed"
  return 0
}

# Function to generate health report
generate_health_report() {
  local report_file="${DEPLOY_DIR}/health_report.json"
  log "INFO" "Generating deployment health report..."
  
  # Create basic report structure
  cat > "${report_file}" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.1",
  "deployment_id": "${TIMESTAMP}",
  "components": {
    "vls": {
      "status": "checking"
    },
    "wing": {
      "status": "checking"
    },
    "gateway": {
      "status": "checking"
    },
    "integration": {
      "status": "checking"
    }
  }
}
EOF
  
  # Use Aixtiv CLI to collect metrics if available
  if command -v aixtiv &> /dev/null; then
    if aixtiv metrics:collect --all-components --output "${report_file}.metrics.json" --silent; then
      # Merge metrics into report
      if command -v jq &> /dev/null; then
        jq -s '.[0] * .[1]' "${report_file}" "${report_file}.metrics.json" > "${report_file}.tmp" && 
        mv "${report_file}.tmp" "${report_file}"
      else
        log "WARNING" "jq not available, metrics will be kept separate"
      fi
    else
      log "WARNING" "Failed to collect metrics, continuing with basic report"
    fi
  fi
  
  # Update component statuses based on verification results
  local vls_status="passed"
  local wing_status="passed"
  local gateway_status="passed"
  local integration_status="passed"
  
  # VLS verification
  if ! verify_vls_health > /dev/null 2>&1; then
    vls_status="failed"
  fi
  
  # Wing verification
  if ! verify_wing_health > /dev/null 2>&1; then
    wing_status="failed"
  fi
  
  # Gateway verification
  if ! verify_gateway_health > /dev/null 2>&1; then
    gateway_status="failed"
  fi
  
  # Integration verification
  if ! verify_integration_health > /dev/null 2>&1; then
    integration_status="failed"
  fi
  
  # Update report with verification results
  if command -v jq &> /dev/null; then
    jq --arg vls "${vls_status}" \
       --arg wing "${wing_status}" \
       --arg gateway "${gateway_status}" \
       --arg integration "${integration_status}" \
       '.components.vls.status = $vls | 
        .components.wing.status = $wing | 
        .components.gateway.status = $gateway | 
        .components.integration.status = $integration' \
       "${report_file}" > "${report_file}.tmp" && 
    mv "${report_file}.tmp" "${report_file}"
  else
    # Basic update without jq
    sed -i.bak "s/\"vls\": {\n      \"status\": \"checking\"/\"vls\": {\n      \"status\": \"${vls_status}\"/g" "${report_file}"
    sed -i.bak "s/\"wing\": {\n      \"status\": \"checking\"/\"wing\": {\n      \"status\": \"${wing_status}\"/g" "${report_file}"
    sed -i.bak "s/\"gateway\": {\n      \"status\": \"checking\"/\"gateway\": {\n      \"status\": \"${gateway_status}\"/g" "${report_file}"
    sed -i.bak "s/\"integration\": {\n      \"status\": \"checking\"/\"integration\": {\n      \"status\": \"${integration_status}\"/g" "${report_file}"
    rm -f "${report_file}.bak"
  fi
  
  log "SUCCESS" "Health report generated: ${report_file}"
  return 0
}

# Enhanced deployment verification
verify_deployment_health() {
  log "INFO" "Starting comprehensive deployment health verification..."
  
  # First check for the existence of key files
  local required_files=(
    "${DEPLOY_DIR}/public/symphony/index.html"
    "${DEPLOY_DIR}/public/anthology/index.html"
    "${DEPLOY_DIR}/public/asoos-2100-cool/index.html"
    "${DEPLOY_DIR}/functions/index.js"
    "${DEPLOY_DIR}/firebase.json"
    "${DEPLOY_DIR}/.firebaserc"
  )
  
  local missing_files=()
  
  for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
      missing_files+=("$file")
    fi
  done
  
  if [[ ${#missing_files[@]} -gt 0 ]]; then
    log "ERROR" "Missing required files: ${missing_files[*]}"
    return 1
  fi
  
  # Track verification status
  local verification_success=true
  local failed_components=()
  
  # Generate preliminary health report
  generate_health_report
  
  # Verify VLS solutions
  if ! verify_vls_health; then
    verification_success=false
    failed_components+=("VLS Solutions")
  fi
  
  # Verify Wing squadrons
  if ! verify_wing_health; then
    verification_success=false
    failed_components+=("Wing Squadrons")
  fi
  
  # Verify Integration Gateway
  if ! verify_gateway_health; then
    verification_success=false
    failed_components+=("Integration Gateway")
  fi
  
  # Verify cross-component integration
  if ! verify_integration_health; then
    verification_success=false
    failed_components+=("Cross-Component Integration")
  fi
  
  # Update health report with final results
  generate_health_report
  
  if [[ "$verification_success" != "true" ]]; then
    log "ERROR" "Deployment verification failed for: ${failed_components[*]}"
    return 1
  fi
  
  log "SUCCESS" "All deployment health checks passed"
  return 0
}

# Function to perform the automated deployment
automated_deployment() {
  log "INFO" "Starting automated deployment sequence..."
  
  # Push changes to Git if needed
  if [[ "${AUTOMATED_GIT_PUSH}" == "true" ]]; then
    log "INFO" "Pushing changes to Git..."
    
    if git push origin "${GIT_BRANCH}" > /dev/null 2>&1; then
      log "SUCCESS" "Changes pushed to Git successfully"
    else
      log "WARNING" "Failed to push changes to Git"
    fi
  fi
  
  # Deploy to Firebase
  log "INFO" "Deploying to Firebase..."
  
  cd "${DEPLOY_DIR}"
  if ./deploy.sh > "${DEPLOY_DIR}/firebase-deploy.log" 2>&1; then
    log "SUCCESS" "Firebase deployment completed successfully"
  else
    handle_error "Firebase deployment failed. See ${DEPLOY_DIR}/firebase-deploy.log for details." "cleanup"
    return 1
  fi
  
  # Connect domains
  log "INFO" "Connecting domains..."
  
  if node "${DEPLOY_DIR}/manage-domains.js" add > "${DEPLOY_DIR}/domain-connect.log" 2>&1; then
    log "SUCCESS" "Domains connected successfully"
  else
    log "WARNING" "Some domains may not have connected properly. See ${DEPLOY_DIR}/domain-connect.log for details."
  fi
  
  log "SUCCESS" "Automated deployment completed successfully"
  return 0
}

# Main function to orchestrate the deployment process
main() {
  echo -e "${BLUE}=========================================================${NC}"
  echo -e "${BLUE}      OPTIMIZED ASOOS FULL DEPLOYMENT SCRIPT            ${NC}"
  echo -e "${BLUE}=========================================================${NC}"
  
  log "INFO" "Starting ASOOS deployment process (${TIMESTAMP})"
  
  # Initialize by verifying SallyPort security
  verify_sallyport_security || exit 1
  
  # Create security token for automated operations
  create_security_token || exit 1
  
  # Prepare deployment directory
  prepare_deployment || exit 1
  
  # Verify components exist
  verify_components || exit 1
  
  # Stop running processes
  stop_processes || exit 1
  
  # Copy component files
  copy_components || exit 1
  
  # Prepare Firebase configuration
  prepare_firebase_config || exit 1
  
  # Create deployment

