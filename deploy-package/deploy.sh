#!/bin/bash

echo "Deploying ASOOS components to Firebase..."

# Install dependencies
cd functions
npm install
cd ..

# Login to Firebase
firebase login --no-localhost

# Create hosting targets if they don't exist
echo "Creating hosting targets..."
firebase use api-for-warp-drive
firebase hosting:sites:create asoos-2100-cool --project api-for-warp-drive || true
firebase hosting:sites:create symphony-asoos-2100 --project api-for-warp-drive || true
firebase hosting:sites:create anthology-asoos-2100 --project api-for-warp-drive || true

firebase target:apply hosting asoos asoos-2100-cool --project api-for-warp-drive
firebase target:apply hosting symphony symphony-asoos-2100 --project api-for-warp-drive
firebase target:apply hosting anthology anthology-asoos-2100 --project api-for-warp-drive

# Deploy to Firebase one component at a time
echo "Deploying functions..."
firebase deploy --only functions --project api-for-warp-drive

echo "Deploying ASOOS main site..."
firebase deploy --only hosting:asoos --project api-for-warp-drive

echo "Deploying Symphony..."
firebase deploy --only hosting:symphony --project api-for-warp-drive

echo "Deploying Anthology..."
firebase deploy --only hosting:anthology --project api-for-warp-drive

echo "All components deployed successfully!"
echo "Access at:"
echo "- Main site: https://asoos-2100-cool.web.app"
echo "- Symphony: https://symphony-asoos-2100.web.app"
echo "- Anthology: https://anthology-asoos-2100.web.app"
