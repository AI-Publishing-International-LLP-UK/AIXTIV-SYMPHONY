#!/bin/bash
# update-tools-config.sh - Add configuration for integration tools
# Path: /Users/as/asoos/integration-gateway/update-tools-config.sh

# Set output colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

GATEWAY_DIR="/Users/as/asoos/integration-gateway"
PROJECT_ID="859242575175"
TOOLS_DIR="${GATEWAY_DIR}/tools"
CONFIG_FILE="${GATEWAY_DIR}/integration-gateway.json"

# Create directories
mkdir -p "${TOOLS_DIR}/github" "${TOOLS_DIR}/atlassian" "${TOOLS_DIR}/openai" "${TOOLS_DIR}/anthropic" "${TOOLS_DIR}/gitlab" "${TOOLS_DIR}/jenkins"

# Create master configuration file
echo -e "${BLUE}Creating master configuration file...${NC}"
cat > "${CONFIG_FILE}" << CONFIG
{
  "project": "${PROJECT_ID}",
  "region": "us-west1",
  "zone": "us-west1-b",
  "updated": "$(date)",
  "tools": {
    "source_control": {
      "primary": "github",
      "secondary": ["gitlab", "bitbucket"]
    },
    "project_management": {
      "primary": "jira",
      "secondary": ["confluence"]
    },
    "ci_cd": {
      "primary": "github_actions",
      "secondary": ["jenkins"]
    },
    "ai": {
      "primary": "anthropic",
      "secondary": ["openai"]
    },
    "git_tools": {
      "primary": "gitkraken",
      "secondary": ["gitlens"]
    }
  },
  "repositories": {
    "primary_source": "github",
    "urls": [
      "https://github.com/C2100-PR/api-for-warp-drive",
      "https://github.com/C2100-PR/aixtiv-symphony"
    ]
  },
  "secret_files": {
    "github": [
      "github-personal-access-token",
      "github-oauth-warp-drive",
      "github-actions-token"
    ],
    "atlassian": [
      "atlassian-cicd",
      "jira-api",
      "confluence-api" 
    ],
    "ai": [
      "anthropic-admin",
      "new-admin-anthropic",
      "openai-api-key",
      "lucy-claude-01"
    ],
    "gitlab": [
      "gitlab-access-token"
    ],
    "git_tools": [
      "gitkraken-token",
      "gitlens-token"
    ],
    "jenkins": [
      "jenkins-api-token"
    ]
  },
  "workflow_templates": [
    "nodejs-ci-cd.yml",
    "python-ci-cd.yml",
    "firebase-deployment.yml",
    "gcp-functions-deploy.yml"
  ]
}
CONFIG

echo -e "${GREEN}✅ Created integration gateway configuration${NC}"

# Create GitHub configuration
echo -e "${BLUE}Creating GitHub configuration...${NC}"
cat > "${TOOLS_DIR}/github/config.json" << GITHUB
{
  "name": "GitHub",
  "primary": true,
  "organization": "C2100-PR",
  "repositories": [
    "api-for-warp-drive",
    "aixtiv-symphony",
    "ai-deployment"
  ],
  "api_endpoint": "https://api.github.com",
  "auth_type": "token",
  "secret_file": "github-personal-access-token",
  "connections": {
    "jira": {
      "enabled": true,
      "issue_key_pattern": "[A-Z]+-\\d+"
    },
    "jenkins": {
      "enabled": true
    }
  }
}
GITHUB

echo -e "${GREEN}✅ Created GitHub configuration${NC}"

# Create Atlassian configuration
echo -e "${BLUE}Creating Atlassian configuration...${NC}"
cat > "${TOOLS_DIR}/atlassian/config.json" << ATLASSIAN
{
  "name": "Atlassian",
  "site": "https://aixtiv.atlassian.net",
  "products": {
    "jira": {
      "enabled": true,
      "project_keys": ["AIXTIV", "SYM", "DEV"]
    },
    "confluence": {
      "enabled": true,
      "spaces": ["AIXTIV", "DEV", "DOCS"]
    },
    "bitbucket": {
      "enabled": true,
      "workspace": "aixtiv"
    }
  },
  "auth_type": "api_token",
  "secret_file": "atlassian-cicd"
}
ATLASSIAN

echo -e "${GREEN}✅ Created Atlassian configuration${NC}"

# Create Anthropic configuration
echo -e "${BLUE}Creating Anthropic configuration...${NC}"
cat > "${TOOLS_DIR}/anthropic/config.json" << ANTHROPIC
{
  "name": "Anthropic",
  "primary": true,
  "api_endpoint": "https://api.anthropic.com/v1",
  "models": [
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307"
  ],
  "auth_type": "api_key",
  "secret_file": "new-admin-anthropic",
  "fallback_secret": "anthropic-admin"
}
ANTHROPIC

echo -e "${GREEN}✅ Created Anthropic configuration${NC}"

# Create OpenAI configuration
echo -e "${BLUE}Creating OpenAI configuration...${NC}"
cat > "${TOOLS_DIR}/openai/config.json" << OPENAI
{
  "name": "OpenAI",
  "primary": false,
  "api_endpoint": "https://api.openai.com/v1",
  "models": [
    "gpt-4",
    "gpt-4-turbo",
    "gpt-3.5-turbo"
  ],
  "auth_type": "api_key",
  "secret_file": "openai-api-key"
}
OPENAI

echo -e "${GREEN}✅ Created OpenAI configuration${NC}"

# Create GitLab configuration
echo -e "${BLUE}Creating GitLab configuration...${NC}"
cat > "${TOOLS_DIR}/gitlab/config.json" << GITLAB
{
  "name": "GitLab",
  "primary": false,
  "auth_type": "token",
  "secret_file": "gitlab-access-token",
  "api_endpoint": "https://gitlab.com/api/v4"
}
GITLAB

echo -e "${GREEN}✅ Created GitLab configuration${NC}"

# Create Jenkins configuration
echo -e "${BLUE}Creating Jenkins configuration...${NC}"
cat > "${TOOLS_DIR}/jenkins/config.json" << JENKINS
{
  "name": "Jenkins",
  "primary": false,
  "auth_type": "api_token",
  "secret_file": "jenkins-api-token",
  "server_url": "https://jenkins.aixtiv.dev"
}
JENKINS

echo -e "${GREEN}✅ Created Jenkins configuration${NC}"

# Create workflow templates directory
echo -e "${BLUE}Creating workflow templates...${NC}"
mkdir -p "${GATEWAY_DIR}/workflows"

# Create Node.js CI/CD workflow template
cat > "${GATEWAY_DIR}/workflows/nodejs-ci-cd.yml" << NODECI
name: Node.js CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
NODECI

# Create Python CI/CD workflow template
cat > "${GATEWAY_DIR}/workflows/python-ci-cd.yml" << PYCI
name: Python CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt
      - run: pytest
PYCI

echo -e "${GREEN}✅ Created workflow templates${NC}"

# Create README
echo -e "${BLUE}Updating README...${NC}"
cat >> "${GATEWAY_DIR}/README.md" << README

## 🔄 Tool Integrations

This integration gateway now includes configurations for:

- **Source Control**: GitHub (primary), GitLab, Bitbucket
- **Project Management**: Jira (primary), Confluence
- **CI/CD**: GitHub Actions (primary), Jenkins
- **AI Services**: Anthropic Claude (primary), OpenAI
- **Git Tools**: GitKraken, GitLens

### Configuration Files

- Master configuration: \`integration-gateway.json\`
- Tool-specific configurations in \`tools/[tool-name]/config.json\`
- Workflow templates in \`workflows/\`

### Secret Management

The following secret types are configured:
- GitHub secrets (PAT, OAuth)
- Atlassian API tokens
- AI service API keys
- Jenkins and GitLab tokens
README

echo -e "${GREEN}✅ Updated README${NC}"
echo -e "${GREEN}✅ All tool configurations have been created${NC}"
chmod +x "${GATEWAY_DIR}/update-tools-config.sh"
