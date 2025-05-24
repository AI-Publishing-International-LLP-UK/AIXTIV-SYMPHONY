#!/bin/bash

echo "Deploying ASOOS components to Firebase..."

# Install dependencies
cd functions
npm install
cd ..

# Create hosting targets if they don't exist
firebase target:apply hosting asoos asoos-2100-cool || firebase hosting:sites:create asoos-2100-cool
firebase target:apply hosting symphony symphony-asoos-2100 || firebase hosting:sites:create symphony-asoos-2100
firebase target:apply hosting anthology anthology-asoos-2100 || firebase hosting:sites:create anthology-asoos-2100

# Deploy to Firebase
firebase deploy --only functions,hosting

echo "All components deployed successfully!"
echo "Access at:"
echo "- Main site: https://asoos-2100-cool.web.app"
echo "- Symphony: https://symphony-asoos-2100.web.app"
echo "- Anthology: https://anthology-asoos-2100.web.app"
