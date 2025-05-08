#!/bin/bash

# This script initializes a git repository and pushes it to GitHub

echo "=== Initializing Git Repository for ASOOS Integration Gateway ==="

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git first."
    exit 1
fi

# Initialize git repository if not already done
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
else
    echo "Git repository already initialized."
fi

# Add all files to git
echo "Adding files to git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Initial commit of ASOOS Integration Gateway with SallyPort verification"

# Prompt for GitHub repository URL
echo ""
echo "Please enter your GitHub repository URL (e.g., https://github.com/username/repo.git):"
read REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "Error: Repository URL cannot be empty."
    exit 1
fi

# Check if remote origin already exists
if git remote | grep -q "^origin$"; then
    echo "Remote 'origin' already exists. Updating URL..."
    git remote set-url origin "$REPO_URL"
else
    echo "Adding remote 'origin'..."
    git remote add origin "$REPO_URL"
fi

# Create main branch if needed
if ! git branch | grep -q "main"; then
    echo "Creating main branch..."
    git branch -M main
fi

# Push to GitHub
echo "Pushing to GitHub..."
echo "You may be prompted for your GitHub credentials."
git push -u origin main

echo ""
echo "=== Repository successfully pushed to GitHub ==="
echo ""
echo "Next steps:"
echo "1. Add GitHub repository secrets:"
echo "   - GCP_SA_KEY: Your Google Cloud service account key"
echo "   - JWT_SECRET: Secret for JWT token signing"
echo "2. Enable GitHub Actions in your repository settings"
echo "3. Verify that the CI/CD workflow has started"
