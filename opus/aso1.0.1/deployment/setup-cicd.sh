#!/bin/bash
# AIXTIV Symphony CI/CD Setup Script
# This script helps set up Cloud Build triggers and Cloud Scheduler jobs for CI/CD

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}AIXTIV Symphony CI/CD Setup${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "This script will help you set up CI/CD for the AIXTIV Symphony project."
echo -e "It will guide you through setting up Cloud Build triggers and Cloud Scheduler jobs."
echo

# Set project variables - update these with your specific project details
PROJECT_ID="api-for-warp-drive"
REGION="us-west1"
REPOSITORY="aixtiv-symphony"
TRIGGER_NAME="aixtiv-symphony-frequent-deploy"
BRANCH="main"
SCHEDULER_JOB_NAME="deploy-aixtiv-symphony-frequent"
SCHEDULE="*/10 * * * *" # Every 10 minutes

# Function to check if gcloud is installed
check_gcloud() {
  echo -e "${YELLOW}Checking if gcloud is installed...${NC}"
  if ! command -v gcloud &> /dev/null; then
    echo -e "gcloud CLI not found. Please install Google Cloud SDK:"
    echo -e "https://cloud.google.com/sdk/docs/install"
    exit 1
  else
    echo -e "${GREEN}gcloud CLI found.${NC}"
  fi
}

# Function to confirm project configuration
confirm_project() {
  echo -e "${YELLOW}Setting Google Cloud project...${NC}"
  gcloud config set project ${PROJECT_ID}
  echo -e "${GREEN}Project set to ${PROJECT_ID}${NC}"
  
  echo -e "\n${YELLOW}Current gcloud configuration:${NC}"
  gcloud config list
  
  read -p "Is this the correct project configuration? (y/n): " confirm
  if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "Please update the PROJECT_ID in this script and try again."
    exit 1
  fi
}

# Steps to create a Cloud Build trigger
create_build_trigger() {
  echo -e "\n${YELLOW}Creating Cloud Build trigger...${NC}"
  echo -e "This will create a trigger that builds and deploys your project when you push to ${BRANCH}."
  echo -e "Make sure your repository is connected to Cloud Build."
  
  echo -e "\n${BLUE}To create the trigger manually:${NC}"
  echo -e "1. Go to: https://console.cloud.google.com/cloud-build/triggers"
  echo -e "2. Click '+ CREATE TRIGGER'"
  echo -e "3. Name: ${TRIGGER_NAME}"
  echo -e "4. Event: Push to a branch"
  echo -e "5. Source: Your repository"
  echo -e "6. Branch: ^${BRANCH}$"
  echo -e "7. Build configuration: Cloud Build configuration file (cloudbuild.yaml)"
  echo -e "8. Timeout: 10 minutes"
  
  echo -e "\n${BLUE}To create the trigger via command line (requires repository connection):${NC}"
  echo -e "gcloud builds triggers create github \\"
  echo -e "  --name=${TRIGGER_NAME} \\"
  echo -e "  --repo=YOUR_GITHUB_REPO \\" # Replace with your actual repo
  echo -e "  --branch-pattern=^${BRANCH}$ \\"
  echo -e "  --build-config=cloudbuild.yaml \\"
  echo -e "  --description=\"Trigger for frequent deployments of AIXTIV Symphony\""
  
  read -p "Do you want to continue to the next step? (y/n): " confirm
  if [[ $confirm != "y" && $confirm != "Y" ]]; then
    exit 0
  fi
}

# Steps to create a Cloud Scheduler job
create_scheduler_job() {
  echo -e "\n${YELLOW}Setting up Cloud Scheduler job...${NC}"
  echo -e "This will create a scheduler that triggers your build every 10 minutes."
  
  echo -e "\n${BLUE}First, you need to get your Cloud Build service account:${NC}"
  echo -e "SERVICE_ACCOUNT=\$(gcloud projects get-iam-policy ${PROJECT_ID} \\"
  echo -e "  --filter=\"role:roles/cloudbuild.builds.builder\" \\"
  echo -e "  --format=\"value(bindings.members)\" | sed 's/serviceAccount://')"
  echo -e "echo \$SERVICE_ACCOUNT"
  
  echo -e "\n${BLUE}Then create the Cloud Scheduler job:${NC}"
  echo -e "gcloud scheduler jobs create http ${SCHEDULER_JOB_NAME} \\"
  echo -e "  --schedule=\"${SCHEDULE}\" \\"
  echo -e "  --uri=\"https://cloudbuild.googleapis.com/v1/projects/${PROJECT_ID}/triggers/${TRIGGER_NAME}:run\" \\"
  echo -e "  --message-body='{\"branchName\":\"${BRANCH}\"}' \\"
  echo -e "  --oauth-service-account-email=\$SERVICE_ACCOUNT"
  
  echo -e "\n${BLUE}To create the job manually:${NC}"
  echo -e "1. Go to: https://console.cloud.google.com/cloudscheduler"
  echo -e "2. Click 'CREATE JOB'"
  echo -e "3. Name: ${SCHEDULER_JOB_NAME}"
  echo -e "4. Frequency: ${SCHEDULE}"
  echo -e "5. Timezone: Your preferred timezone"
  echo -e "6. Target: HTTP"
  echo -e "7. URL: https://cloudbuild.googleapis.com/v1/projects/${PROJECT_ID}/triggers/${TRIGGER_NAME}:run"
  echo -e "8. HTTP method: POST"
  echo -e "9. Body: {\"branchName\":\"${BRANCH}\"}"
  echo -e "10. Auth header: Add OAuth token"
  echo -e "11. Service account: Select your Cloud Build service account"
}

# Main execution
check_gcloud
confirm_project
create_build_trigger
create_scheduler_job

echo -e "\n${BLUE}===============================================${NC}"
echo -e "${GREEN}CI/CD Setup Instructions Complete${NC}"
echo -e "${BLUE}===============================================${NC}"
echo -e "Your CI/CD pipeline is now configured for automatic deployment every 10 minutes."
echo -e "You can also trigger deployments manually using the deploy.sh script."
echo -e "\nTo verify your setup:"
echo -e "1. Check Cloud Build triggers: https://console.cloud.google.com/cloud-build/triggers"
echo -e "2. Check Cloud Scheduler jobs: https://console.cloud.google.com/cloudscheduler"
echo -e "3. Run a test deployment: ./deploy.sh"
echo

# Make the deploy script executable if it exists
if [ -f "./deploy.sh" ]; then
  chmod +x ./deploy.sh
  echo -e "${GREEN}Made deploy.sh executable.${NC}"
fi

exit 0

