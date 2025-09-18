#!/bin/bash

# File Audit Tool - Know before you delete
# This tool creates comprehensive records to make cleanup decisions with confidence

AUDIT_DIR="./audit-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$AUDIT_DIR/cleanup_audit_$TIMESTAMP.txt"

mkdir -p "$AUDIT_DIR"

echo "🔍 File Audit Tool - Creating comprehensive records..."
echo "Report will be saved to: $REPORT_FILE"
echo "=================================================================================" > "$REPORT_FILE"
echo "FILE AUDIT REPORT - $(date)" >> "$REPORT_FILE"
echo "Directory: $(pwd)" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"

# 1. Git History Analysis
echo "" >> "$REPORT_FILE"
echo "📋 GIT HISTORY SUMMARY" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
echo "Last 50 commits with file changes:" >> "$REPORT_FILE"
git log --oneline --name-status -50 >> "$REPORT_FILE" 2>/dev/null || echo "No git history found" >> "$REPORT_FILE"

# 2. Current Git Status
echo "" >> "$REPORT_FILE"
echo "📊 CURRENT GIT STATUS" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
git status --porcelain | cut -c1-2 | sort | uniq -c >> "$REPORT_FILE" 2>/dev/null || echo "Not a git repository" >> "$REPORT_FILE"

# 3. File Inventory by Type
echo "" >> "$REPORT_FILE"
echo "📁 FILE INVENTORY BY TYPE" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
find . -type f -name ".*" -prune -o -type f -print | grep -E '\.[a-zA-Z0-9]+$' | sed 's/.*\.//' | sort | uniq -c | sort -nr >> "$REPORT_FILE"

# 4. Large Files Analysis
echo "" >> "$REPORT_FILE"
echo "💾 LARGE FILES (>10MB)" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
find . -type f -size +10M -exec ls -lh {} \; | awk '{print $5, $9}' >> "$REPORT_FILE"

# 5. Recent Activity
echo "" >> "$REPORT_FILE"
echo "🕒 RECENTLY MODIFIED FILES (last 30 days)" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
find . -type f -mtime -30 -exec ls -lt {} \; | head -20 >> "$REPORT_FILE"

# 6. Duplicate Analysis
echo "" >> "$REPORT_FILE"
echo "🔄 POTENTIAL DUPLICATES (by name)" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
find . -type f -printf '%f\n' | sort | uniq -d | head -20 >> "$REPORT_FILE"

# 7. Dependencies Analysis (for code files)
echo "" >> "$REPORT_FILE"
echo "🔗 DEPENDENCY FILES" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
find . -name "package.json" -o -name "requirements.txt" -o -name "Gemfile" -o -name "composer.json" -o -name "go.mod" | head -10 >> "$REPORT_FILE"

# 8. Configuration Files
echo "" >> "$REPORT_FILE"
echo "⚙️  CONFIGURATION FILES" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
find . -name "*.config.*" -o -name "*.conf" -o -name ".env*" -o -name "*.yml" -o -name "*.yaml" -o -name "*.toml" | head -20 >> "$REPORT_FILE"

# 9. Create deletion candidates list
echo "" >> "$REPORT_FILE"
echo "🗑️  SAFE DELETION CANDIDATES" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
echo "Based on common patterns, these might be safe to delete:" >> "$REPORT_FILE"
find . -name "*.log" -o -name "*.tmp" -o -name "*~" -o -name ".DS_Store" -o -name "node_modules" -type d -o -name "__pycache__" -type d | head -20 >> "$REPORT_FILE"

# 10. Git-tracked files that are deleted
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "" >> "$REPORT_FILE"
    echo "🗂️  FILES STAGED FOR DELETION" >> "$REPORT_FILE"
    echo "=================================================================================" >> "$REPORT_FILE"
    git status --porcelain | grep "^D" | wc -l | xargs echo "Number of files staged for deletion:" >> "$REPORT_FILE"
    echo "Sample deleted files:" >> "$REPORT_FILE"
    git status --porcelain | grep "^D" | head -10 >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
echo "🎯 RECOMMENDATIONS" >> "$REPORT_FILE"
echo "=================================================================================" >> "$REPORT_FILE"
echo "1. Review the git history to understand what files were intentionally created" >> "$REPORT_FILE"
echo "2. Check if large files are necessary or can be moved to external storage" >> "$REPORT_FILE"
echo "3. Verify that deleted files aren't referenced by other parts of the system" >> "$REPORT_FILE"
echo "4. Create a backup branch before major deletions: git checkout -b backup-$(date +%Y%m%d)" >> "$REPORT_FILE"
echo "5. Consider using 'git add -A && git commit -m \"Cleanup duplicates\"' to record the cleanup" >> "$REPORT_FILE"

# Summary
echo ""
echo "✅ Audit complete! Report saved to: $REPORT_FILE"
echo ""
echo "🎯 Quick Stats:"
echo "   - Total files: $(find . -type f | wc -l)"
echo "   - Git changes: $(git status --porcelain 2>/dev/null | wc -l || echo 'N/A')"
echo "   - Deletions: $(git status --porcelain 2>/dev/null | grep '^D' | wc -l || echo 'N/A')"
echo ""
echo "💡 Recommendation: Review the report, then run:"
echo "   git add -A && git commit -m 'Clean up duplicate repository files'"