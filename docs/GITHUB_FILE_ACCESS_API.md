# GitHub File Access API - Integration Gateway

## Overview

The Integration Gateway provides enhanced routing for GitHub file access requests, featuring advanced agent authentication, multi-repository support, and organization-based access control. This system is designed to handle requests from various types of AI agents within the Aixtiv Symphony ecosystem.

## Architecture

### Key Components

1. **GitHub Router** (`/routes/github.js`) - Main API endpoints
2. **Enhanced Middleware** (`/middleware/github-router.js`) - Authentication, rate limiting, and access control
3. **GitHub File Access Service** (`/services/github-file-access.js`) - Core GitHub API integration
4. **Organization Configuration** (`/config/github-organizations.json`) - Multi-organization settings

## API Endpoints

### POST /api/github/files

Performs file operations on one or more GitHub repositories with agent authentication and organization-based access control.

#### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-Agent-ID` | Yes | Unique identifier for the requesting agent |
| `X-Agent-Type` | No | Agent type (RIX, CRX, QRIX, HQRIX, PCP, PILOT) |
| `X-Agent-Organization` | No | Organization affiliation (defaults to 'default') |
| `Content-Type` | Yes | Must be `application/json` |

#### Request Body

```json
{
  "action": "list|get|search",
  "repositories": [
    {
      "owner": "repository-owner",
      "repo": "repository-name",
      "path": "file/or/directory/path",
      "branch": "branch-name",
      "query": "search-query"
    }
  ]
}
```

#### Actions

##### `list` - List Repository Contents
Lists files and directories in a repository path.

**Required fields:** `owner`, `repo`, `path`
**Optional fields:** `branch`

##### `get` - Get File Content
Retrieves the content of a specific file.

**Required fields:** `owner`, `repo`, `path`
**Optional fields:** `branch`

##### `search` - Search Files
Searches for files within a repository using GitHub's search API.

**Required fields:** `owner`, `repo`, `query`
**Optional fields:** None

#### Response Format

```json
[
  {
    "repository": "owner/repo-name",
    "status": "success|error",
    "data": "...",
    "message": "Error message if status is error"
  }
]
```

## Agent Types and Permissions

### Agent Type Hierarchy

1. **PILOT** - Basic access level
2. **RIX** - Refined Intelligence Expert
3. **CRX** - Companion Prescribed Expert
4. **QRIX** - Quantum Refined Intelligence Expert
5. **HQRIX** - High Quantum Refined Intelligence Expert
6. **PCP** - Primary Control Pilot

### Rate Limits by Agent Type

Rate limits vary by organization and agent type. Default limits per minute:

- **PILOT**: 50 requests
- **RIX**: 100-500 requests (org-dependent)
- **CRX**: 200-400 requests (org-dependent)
- **QRIX**: 300-500 requests (org-dependent)
- **HQRIX**: 500-1000 requests (org-dependent)
- **PCP**: 1000+ requests (org-dependent)

## Organization Management

### Supported Organizations

1. **aixtiv** - Main Aixtiv Symphony organization
2. **coaching2100** - Coaching 2100 subsidiary
3. **visionlake** - Vision Lake Solutions
4. **elite11** - Elite 11 Council (high-privilege access)
5. **mastery33** - Mastery 33 Distributed (comprehensive access)
6. **default** - Fallback organization

### Access Control

Each organization has defined:
- **allowedOwners**: GitHub organizations/users the agents can access
- **agentTypes**: Permitted agent types
- **rateLimits**: Custom rate limits per agent type

## Usage Examples

### Basic File Retrieval

```bash
curl -X POST http://localhost:3000/api/github/files \
  -H "Content-Type: application/json" \
  -H "X-Agent-ID: agent-001" \
  -H "X-Agent-Type: RIX" \
  -H "X-Agent-Organization: aixtiv" \
  -d '{
    "action": "get",
    "repositories": [{
      "owner": "aixtiv",
      "repo": "symphony-core",
      "path": "README.md",
      "branch": "main"
    }]
  }'
```

### Multi-Repository Search

```bash
curl -X POST http://localhost:3000/api/github/files \
  -H "Content-Type: application/json" \
  -H "X-Agent-ID: agent-002" \
  -H "X-Agent-Type: CRX" \
  -H "X-Agent-Organization: aixtiv" \
  -d '{
    "action": "search",
    "repositories": [
      {
        "owner": "aixtiv",
        "repo": "integration-gateway",
        "query": "middleware"
      },
      {
        "owner": "coaching2100",
        "repo": "platform",
        "query": "authentication"
      }
    ]
  }'
```

### Directory Listing

```bash
curl -X POST http://localhost:3000/api/github/files \
  -H "Content-Type: application/json" \
  -H "X-Agent-ID: agent-003" \
  -H "X-Agent-Type: PILOT" \
  -d '{
    "action": "list",
    "repositories": [{
      "owner": "visionlake",
      "repo": "solutions",
      "path": "src/components"
    }]
  }'
```

## Error Handling

### Common Error Responses

#### 401 - Unauthorized
```json
{
  "error": "Agent ID is required",
  "message": "Please provide X-Agent-ID header"
}
```

#### 403 - Access Denied
```json
{
  "error": "Access denied",
  "message": "Agent does not have access to the requested repositories",
  "unauthorizedRepositories": ["owner/repo"]
}
```

#### 429 - Rate Limited
```json
{
  "error": "Rate limit exceeded",
  "message": "Agent type RIX is limited to 100 requests per minute",
  "retryAfter": 60
}
```

## Security Features

### Agent Authentication
- Required `X-Agent-ID` header for all requests
- Optional agent type validation
- Organization-based access control

### Rate Limiting
- Per-agent rate limiting with configurable limits
- Organization-specific rate limit overrides
- Automatic cleanup of expired rate limit entries

### Access Control
- Repository access controlled by organization membership
- Special access levels for Elite 11 and Mastery 33 groups
- Configurable repository exceptions for public/restricted access

### Logging and Monitoring
- Comprehensive request logging with agent context
- Performance metrics and duration tracking
- Error logging with stack traces for debugging

## Configuration

### Environment Variables

```bash
GITHUB_TOKEN=your-github-personal-access-token
LOG_LEVEL=info
PORT=3000
```

### Organization Configuration

Edit `/config/github-organizations.json` to:
- Add new organizations
- Modify access permissions
- Adjust rate limits
- Configure repository exceptions

## Batch Processing Optimization

The system automatically optimizes multi-repository requests by:
- Grouping repositories by owner
- Parallel processing where possible
- Intelligent error handling per repository

## Integration with Existing Gateway

The GitHub file access system integrates seamlessly with the existing Integration Gateway infrastructure, using the same:
- Logging system
- Error handling patterns
- Express.js middleware architecture
- Configuration management

## Future Enhancements

Planned improvements include:
- Redis-based rate limiting for horizontal scaling
- Webhook support for real-time repository updates
- Enhanced caching mechanisms
- Integration with GitHub Apps for improved authentication
- Advanced analytics and reporting

## Support

For technical support or questions about the GitHub File Access API, contact the Integration Gateway team or refer to the main Integration Gateway documentation.
