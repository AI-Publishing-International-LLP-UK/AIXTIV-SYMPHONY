# Deployment Directory - Single Source of Truth

## Purpose

This directory serves as the **single source of truth** for all deployment-related files in the AIXTIV-SYMPHONY project. All deployment configurations, scripts, and resources are centralized here to ensure consistency and eliminate confusion.

## Why Centralization Was Necessary

Prior to this centralization, deployment files were scattered across multiple directories in various repositories, leading to:

1. Confusion about which files were authoritative
2. Time wasted searching for the correct deployment resources
3. Inconsistent deployments using outdated configurations
4. Duplication of effort when recreating files that already existed elsewhere
5. Difficulty in maintaining and updating deployment processes

By centralizing all deployment resources in this single location, we've created a more efficient, reliable, and maintainable system.

## Contents

This directory contains:

- **Deployment Scripts** - Shell scripts for executing deployments
- **Cloud Build Configurations** - YAML files for Google Cloud Build
- **Docker Configurations** - Dockerfile and related resources
- **Network Configuration** - DNS and networking setup files
- **Pre-flight Checklists** - Verification steps before deployment
- **Interface Definitions** - API and service interface specifications

## How to Use This Directory

### For Agents

1. **All deployment operations should reference only files in this directory**
2. **Do not create or use deployment files in other locations**
3. **If you need to modify a deployment file:**
   - Make changes directly to the files in this directory
   - Document your changes in commit messages
   - Update this README if the structure changes significantly

### For CI/CD

All automated deployment processes should be configured to use the files in this directory as their source of configuration.

## Best Practices

1. Keep the directory structure flat to minimize complexity
2. Use descriptive filenames that clearly indicate purpose
3. Maintain backwards compatibility when possible
4. Document any breaking changes thoroughly

## Contact

For questions about deployment processes or this directory structure, please contact the DevOps team.

