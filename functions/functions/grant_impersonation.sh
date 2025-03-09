#!/bin/bash
# This script grants impersonation rights to all doctor service accounts and Professor Lee's service account
# to impersonate Dr. Lucy's automation service account.

# Target service account to be impersonated
TARGET_SA="drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com"

# List of service accounts that need impersonation rights
# This includes all doctor service accounts and Professor Lee's service account
ACCOUNTS=(
  "dr-match@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-lucy-auto@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-lucy-tensorboard@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-burby-sa@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-memoria-01-service-account@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-memoria-02-service-account@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-memoria-03-service-account@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-memoria-pub-sa@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-sabina-sa@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-grant-sa@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-cypriot-sa@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-maria-sa@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-match-sa@api-for-warp-drive.iam.gserviceaccount.com"
  "dr-roark-sa@api-for-warp-drive.iam.gserviceaccount.com"
  "professor-lee-sa@api-for-warp-drive.iam.gserviceaccount.com"
)

echo "Granting impersonation rights to all doctor service accounts and Professor Lee's service account..."
echo "Target service account: $TARGET_SA"
echo "-----------------------------------------------------------------"

for account in "${ACCOUNTS[@]}"; do
  echo "Granting impersonation rights to $account..."
  gcloud iam service-accounts add-iam-policy-binding \
    $TARGET_SA \
    --member="serviceAccount:$account" \
    --role="roles/iam.serviceAccountTokenCreator"
  
  # Check if the command was successful
  if [ $? -eq 0 ]; then
    echo "✅ Successfully granted impersonation rights to $account"
  else
    echo "❌ Failed to grant impersonation rights to $account"
  fi
  echo "-----------------------------------------------------------------"
done

echo "All impersonation rights have been granted!"
echo "These service accounts can now impersonate $TARGET_SA"

