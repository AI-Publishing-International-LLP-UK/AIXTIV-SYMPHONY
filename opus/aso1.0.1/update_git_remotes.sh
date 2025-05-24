#!/bin/bash

# Script to update git remote URLs for all repositories
# to point to the C2100-AIPI organization

# Find all git repositories in the current directory and subdirectories
find . -name ".git" -type d -prune | while read gitdir; do
    # Change to the repository directory
    repo_dir=$(dirname "$gitdir")
    echo "Processing repository in $repo_dir"
    
    # Change to the repository directory
    cd "$repo_dir" || continue
    
    # Get the current remote URL
    old_url=$(git config --get remote.origin.url)
    
    # Skip if no remote URL is configured
    if [ -z "$old_url" ]; then
        echo "  No remote URL found, skipping."
        cd - > /dev/null
        continue
    fi
    
    # Extract the repository name from the URL
    repo_name=$(basename -s .git "$old_url")
    
    # Create the new URL with the C2100-AIPI organization
    new_url="https://github.com/C2100-AIPI/$repo_name.git"
    
    # Print the old and new URLs
    echo "  Old URL: $old_url"
    echo "  New URL: $new_url"
    
    # Update the remote URL
    git remote set-url origin "$new_url"
    echo "  Remote URL updated successfully."
    
    # Return to the original directory
    cd - > /dev/null
done

echo "All git repositories have been updated to point to the C2100-AIPI organization."

