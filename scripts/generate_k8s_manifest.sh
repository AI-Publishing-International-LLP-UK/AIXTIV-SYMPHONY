#!/bin/bash

# generate_k8s_manifest.sh
# Script to generate Kubernetes manifests for VLS solutions

# Check if required arguments are provided
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
  echo "Usage: ./generate_k8s_manifest.sh <vls_name> <project_id> <version>"
  echo "  vls_name: Name of the VLS solution (e.g., dr-lucy-flight-memory)"
  echo "  project_id: Google Cloud project ID"
  echo "  version: Version tag for the container image (e.g., latest, v1.0.0)"
  exit 1
fi

VLS_NAME="$1"
PROJECT_ID="$2"
VERSION="$3"
REPO_ROOT="/Users/as/asoos/opus/opus1.0.1"
TEMPLATE_PATH="$REPO_ROOT/manifests/deployment-template.yaml"
OUTPUT_PATH="$REPO_ROOT/manifests/$VLS_NAME-deployment.yaml"

# Check if template exists
if [ ! -f "$TEMPLATE_PATH" ]; then
  echo "Error: Template file not found at $TEMPLATE_PATH"
  exit 1
fi

# Generate manifest from template
echo "Generating Kubernetes manifest for $VLS_NAME..."
sed -e "s/{{VLS_NAME}}/$VLS_NAME/g" \
    -e "s/{{PROJECT_ID}}/$PROJECT_ID/g" \
    -e "s/{{VERSION}}/$VERSION/g" \
    "$TEMPLATE_PATH" > "$OUTPUT_PATH"

echo "Manifest generated successfully at $OUTPUT_PATH"
echo ""
echo "To deploy this manifest to Kubernetes, run:"
echo "kubectl apply -f $OUTPUT_PATH"
echo ""
echo "To view the status of the deployment, run:"
echo "kubectl get deployment $VLS_NAME"
echo ""
echo "To view the logs of the deployment, run:"
echo "kubectl logs -l app=$VLS_NAME"

exit 0
