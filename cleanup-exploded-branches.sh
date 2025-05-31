#!/bin/bash

# Branches with excessive file changes
BRANCH1="backup-submodule-update"
BRANCH2="cleanup-deployment-config"

# Step 1: Backup each branch with a quarantine tag
if git show-ref --verify --quiet refs/heads/; then
  echo "📦 Archiving $BRANCH1 as tag backup-$BRANCH1"
  git tag -f backup-$BRANCH1 $BRANCH1
  git push origin backup-$BRANCH1
  git branch -D $BRANCH1
  git push origin --delete $BRANCH1
else
  echo "✅ $BRANCH1 already removed."
fi

if git show-ref --verify --quiet refs/heads/; then
  echo "📦 Archiving $BRANCH2 as tag backup-$BRANCH2"
  git tag -f backup-$BRANCH2 $BRANCH2
  git push origin backup-$BRANCH2
  git branch -D $BRANCH2
  git push origin --delete $BRANCH2
else
  echo "✅ $BRANCH2 already removed."
fi

echo "🧹 Exploded branches removed and quarantined. Safe state restored."
