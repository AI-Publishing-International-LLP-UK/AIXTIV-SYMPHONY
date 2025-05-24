#!/bin/bash
# Quick deployment script for AIXTIV Symphony
# This script manually triggers the Cloud Build job for deployment

# Set GCP project
gcloud config set project api-for-warp-drive

# Trigger the Cloud Build job
gcloud builds triggers run aixtiv-symphony-frequent-deploy --branch=main

echo "Deployment triggered. Check Cloud Build console for progress."
echo "https://console.cloud.google.com/cloud-build/builds?project=api-for-warp-drive"

