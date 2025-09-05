# Repository Protection Guidelines

## Overview

This document outlines the protection measures implemented in the ASOOS repository to ensure code quality and prevent accidental large-scale changes.

## Protection Measures

### 1. File Count Limits

- Changes affecting more than 500 files require special review
- Automated notifications are created for large changes
- Protection is enforced at both local and CI levels

### 2. Branch Protection

- Direct pushes to production branch are prohibited
- Changes must go through pull requests
- Pull requests require review and CI checks to pass

### 3. Git LFS Prevention

- Git LFS usage is explicitly prevented
- Large binary files should be stored elsewhere
- CI checks verify no LFS objects are present

### 4. Implementation Details

#### Local Hooks

- Pre-commit hook checks file count
- Pre-push hook prevents direct production pushes
- Both hooks can be found in `.git/hooks/`

#### GitHub Actions

- Automated checks on all pushes and PRs
- Issues created for large changes
- Branch protection enforcement

#### Configuration Files

- `.gitattributes`: Prevents LFS confusion
- `.gitignore`: Controls tracked files
- `.github/branch-protection.yml`: Branch rules

## Usage Guidelines

### For Developers

1. Make small, focused changes
2. Use feature branches
3. Create pull requests for production changes
4. Watch for automated notifications

### For Reviewers

1. Pay extra attention to large changes
2. Verify no LFS objects are included
3. Ensure changes follow guidelines

## Maintenance

### Regular Tasks

1. Review and update hook scripts
2. Monitor GitHub Action logs
3. Update protection rules as needed

### Emergency Procedures

1. For urgent fixes, use emergency override procedures
2. Document all protection bypasses
3. Review and adjust rules after incidents

## Contact

For questions or issues with these protections, contact:
- Repository maintainers
- DevOps team

