#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Aixtiv Symphony dependency update across all modules...${NC}"

# Function to update dependencies in a directory
update_deps() {
    local dir=$1
    if [ -f "$dir/package.json" ]; then
        echo -e "${GREEN}Updating dependencies in: $dir${NC}"
        cd "$dir"
        # Remove existing node_modules and lock files for clean slate
        rm -rf node_modules pnpm-lock.yaml package-lock.json
        # Update all dependencies to their latest compatible versions
        pnpm update --latest --recursive
        # Install with frozen lockfile to ensure consistency
        pnpm install --frozen-lockfile
        cd - > /dev/null
    fi
}

# Main modules to update
modules=(
    "academy"
    "wing"
    "vls"
    "e-commerce"
    "backend"
    "core-protocols"
    "integration"
    "data"
    "aixtiv-symphony-opus1.0.1"
)

# Update root dependencies first
pnpm install
pnpm update --latest --recursive

# Update each module
for module in "${modules[@]}"; do
    if [ -d "$module" ]; then
        update_deps "$module"
        # Handle nested modules
        find "$module" -type f -name "package.json" -not -path "*/node_modules/*" -not -path "*/\.*/*" -exec dirname {} \; | while read subdir; do
            update_deps "$subdir"
        done
    fi
done

echo -e "${BLUE}📝 Generating dependency report...${NC}"
# Create dependency report
echo "# Aixtiv Symphony Dependency Report" > dependency-report.md
echo "Generated on: $(date)" >> dependency-report.md
echo "\n## Module Versions\n" >> dependency-report.md

for module in "${modules[@]}"; do
    if [ -f "$module/package.json" ]; then
        echo "### $module" >> dependency-report.md
        echo "\`\`\`" >> dependency-report.md
        cd "$module" && pnpm list --depth 0 >> ../dependency-report.md
        cd - > /dev/null
        echo "\`\`\`\n" >> dependency-report.md
    fi
done

echo -e "${GREEN}✅ Dependency update complete! Check dependency-report.md for details${NC}"
