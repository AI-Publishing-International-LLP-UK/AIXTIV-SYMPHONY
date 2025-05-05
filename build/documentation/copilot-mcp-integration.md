# Co-Pilot MCP Integration for ASOOS

## Overview of Co-Pilot System

Co-Pilots serve as client-facing agents for owner subscribers in the ASOOS ecosystem. Each subscriber receives a personalized Co-Pilot that functions as both Business Analyst and Project Manager for:

1. **Dream Commander Prescribed Work**
   - Co-Pilot seeks approval
   - Begins documentation
   - Manages approval workflows
   - Sets up project infrastructure (Jira/C2100-PCR)

2. **Direct Owner Subscriber Requests**
   - Follows the same process as Dream Commander prescribed work
   - S2DO actions enable the Co-Pilot to perform work on behalf of the owner subscriber

## MCP Integration Architecture for Co-Pilots

```
                           +------------------------+
                           |                        |
                           |  Claude/Claude Code    |
                           |  (MCP Client)          |
                           |                        |
                           +----------+-------------+
                                      |
                                      | WebSocket Connection
                                      |
                       +--------------v--------------+
                       |                             |
                       |  drclaude.live MCP Server   |
                       |                             |
                       +--+-----------+-------------+--+
                          |           |                |
        +----------------+            +----------------+
        |                                              |
+-------v--------+              +------------------+   |
|                |              |                  |   |
|S2DO Integration|              |FMS Integration   |   |
|                |              |                  |   |
+-------+--------+              +--------+---------+   |
        |                                |             |
        |                                |             |
+-------v--------------------------------v-------------v--+
|                                                         |
|                   Co-Pilot System                       |
|                                                         |
+---------+-------------------------+-------------------+-+
          |                         |                   |
          |                         |                   |
+---------v---------+     +---------v--------+  +------v----------+
|                   |     |                  |  |                 |
|Project Management |     |Documentation     |  |Approval         |
|Systems            |     |Systems           |  |Workflows        |
|(Jira/C2100-PCR)   |     |(Templates)       |  |(Decision Tree)  |
+-------------------+     +------------------+  +-----------------+
```

## Additional MCP Resources for Co-Pilots

### Resources

#### `copilot/subscription`
```json
{
  "type": "object",
  "properties": {
    "owner_id": {
      "type": "string",
      "description": "Unique identifier for the owner subscriber"
    },
    "copilot_id": {
      "type": "string",
      "description": "Unique identifier for the assigned Co-Pilot"
    },
    "subscription_level": {
      "type": "string",
      "enum": ["basic", "premium", "enterprise"],
      "description": "Level of subscription determining features and capacity"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["project_creation", "budget_approval", "resource_assignment", "jira_integration"]
      },
      "description": "Permissions granted to the Co-Pilot"
    },
    "preferences": {
      "type": "object",
      "description": "Owner subscriber preferences for interaction, documentation, etc."
    },
    "active_projects": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of active project IDs managed by this Co-Pilot"
    }
  },
  "required": ["owner_id", "copilot_id", "subscription_level", "permissions"]
}
```

#### `copilot/project_template`
```json
{
  "templates": [
    {
      "id": "default",
      "name": "Default Project Template",
      "description": "Standard template for most projects",
      "jira_mapping": {
        "project_key_prefix": "CP",
        "issue_types": ["Story", "Task", "Bug", "Epic"],
        "required_fields": ["Description", "Acceptance Criteria"]
      },
      "documentation_sections": [
        "Executive Summary", 
        "Requirements", 
        "Technical Approach", 
        "Timeline", 
        "Resources", 
        "Budget",
        "Risk Assessment"
      ],
      "approval_workflow": "standard_two_level"
    },
    {
      "id": "expedited",
      "name": "Expedited Project Template",
      "description": "Fast-track template for urgent projects",
      "jira_mapping": {
        "project_key_prefix": "EX",
        "issue_types": ["Story", "Task", "Bug"],
        "required_fields": ["Description"]
      },
      "documentation_sections": [
        "Summary", 
        "Requirements", 
        "Quick Approach", 
        "Timeline"
      ],
      "approval_workflow": "expedited_single_level"
    }
  ]
}
```

#### `copilot/approval_workflow`
```json
{
  "workflows": [
    {
      "id": "standard_two_level",
      "name": "Standard Two-Level Approval",
      "description": "Standard approval process requiring two levels of sign-off",
      "stages": [
        {
          "name": "Documentation Review",
          "approvers": ["technical_lead", "business_analyst"],
          "required_approvals": 2,
          "approval_criteria": ["completeness", "accuracy", "feasibility"]
        },
        {
          "name": "Project Approval",
          "approvers": ["product_owner", "sponsor"],
          "required_approvals": 1,
          "approval_criteria": ["business_value", "budget", "timeline"]
        }
      ]
    },
    {
      "id": "expedited_single_level",
      "name": "Expedited Single-Level Approval",
      "description": "Fast-track approval for urgent projects",
      "stages": [
        {
          "name": "Quick Approval",
          "approvers": ["product_owner", "emergency_approver"],
          "required_approvals": 1,
          "approval_criteria": ["necessity", "basic_feasibility"]
        }
      ]
    }
  ]
}
```

## New MCP Tools for Co-Pilots

### 1. Create Project
- **Tool ID**: `copilot/create_project`
- **Function**: `executeCoPilotCreateProject(params)`
- **Input Schema**:
  ```json
  {
    "owner_id": "string",
    "project_name": "string",
    "project_description": "string",
    "template_id": "string",
    "priority": "string",
    "source": "string",
    "additional_context": "object"
  }
  ```
- **Output Schema**:
  ```json
  {
    "project_id": "string",
    "jira_key": "string",
    "c2100_pcr_id": "string",
    "documentation_url": "string",
    "approval_workflow_id": "string",
    "status": "string",
    "creation_timestamp": "string"
  }
  ```

### 2. Manage Project Documentation
- **Tool ID**: `copilot/manage_documentation`
- **Function**: `executeCoPilotManageDocumentation(params)`
- **Input Schema**:
  ```json
  {
    "project_id": "string",
    "action": "string",
    "section": "string",
    "content": "string",
    "attachments": ["string"]
  }
  ```
- **Output Schema**:
  ```json
  {
    "documentation_id": "string",
    "version": "string",
    "status": "string",
    "url": "string",
    "update_timestamp": "string"
  }
  ```

### 3. Process Approval
- **Tool ID**: `copilot/process_approval`
- **Function**: `executeCoPilotProcessApproval(params)`
- **Input Schema**:
  ```json
  {
    "project_id": "string",
    "stage_id": "string",
    "approver_id": "string",
    "decision": "string",
    "comments": "string",
    "conditions": ["string"]
  }
  ```
- **Output Schema**:
  ```json
  {
    "approval_id": "string",
    "status": "string",
    "next_steps": ["string"],
    "timestamp": "string"
  }
  ```

### 4. Create Project Tasks
- **Tool ID**: `copilot/create_tasks`
- **Function**: `executeCoPilotCreateTasks(params)`
- **Input Schema**:
  ```json
  {
    "project_id": "string",
    "tasks": [
      {
        "title": "string",
        "description": "string",
        "estimate": "string",
        "assignee_role": "string",
        "dependencies": ["string"]
      }
    ]
  }
  ```
- **Output Schema**:
  ```json
  {
    "task_ids": ["string"],
    "jira_keys": ["string"],
    "status": "string"
  }
  ```

## Integration with S2DO for Co-Pilot Operations

The Co-Pilot system leverages S2DO for governance and verification of critical operations:

### Key S2DO Action Types for Co-Pilots

1. **Project Management Actions**
   ```
   S2DO:Project:Create
   S2DO:Project:Update
   S2DO:Project:Close
   S2DO:Project:ApprovalRequest
   S2DO:Project:ApprovalGrant
   ```

2. **Documentation Actions**
   ```
   S2DO:Document:Create
   S2DO:Document:Update
   S2DO:Document:Share
   S2DO:Document:Approve
   ```

3. **Task Management Actions**
   ```
   S2DO:Task:Create
   S2DO:Task:Assign
   S2DO:Task:Complete
   S2DO:Task:Verify
   ```

### Verification Flow for Co-Pilot Actions

1. Co-Pilot initiates action (e.g., create project)
2. Action is recorded as S2DO entry (e.g., `S2DO:Project:Create`)
3. S2DO verification confirms authority and parameters
4. After verification, action is executed in relevant system (Jira/C2100-PCR)
5. Blockchain record is created for audit and compliance

## Co-Pilot MCP Implementation Details

### Server Implementation Additions

```javascript
// Co-Pilot-specific tool implementation examples

async function executeCoPilotCreateProject(params) {
  console.log('Creating project:', params);
  
  // Create project record
  const projectId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // 1. Verify owner subscriber has permission to create projects
  const ownerHasPermission = await verifyOwnerPermission(
    params.owner_id, 
    'project_creation'
  );
  
  if (!ownerHasPermission) {
    throw new Error(`Owner ${params.owner_id} lacks project creation permission`);
  }
  
  // 2. Create S2DO action for project creation
  const s2doParams = {
    stem: 'Project',
    action: 'Create',
    parameters: {
      project_name: params.project_name,
      template_id: params.template_id,
      priority: params.priority
    },
    initiator: params.owner_id
  };
  
  // 3. Verify S2DO action
  const s2doResult = await executeS2DOVerify(s2doParams);
  
  if (s2doResult.status !== 'pending') {
    throw new Error(`S2DO verification failed: ${s2doResult.status}`);
  }
  
  // 4. Create Jira project
  const jiraKey = `CP-${Math.floor(1000 + Math.random() * 9000)}`;
  // In production: call Jira API to create project
  
  // 5. Create C2100-PCR entry
  const c2100PcrId = `PCR-${Math.floor(10000 + Math.random() * 90000)}`;
  // In production: call C2100-PCR API to create entry
  
  // 6. Create documentation structure based on template
  const templateData = getProjectTemplate(params.template_id);
  const documentationUrl = `https://docs.asoos.com/projects/${projectId}`;
  // In production: set up document structures
  
  // 7. Record project in Co-Pilot system
  const projectRecord = {
    id: projectId,
    owner_id: params.owner_id,
    name: params.project_name,
    description: params.project_description,
    template_id: params.template_id,
    jira_key: jiraKey,
    c2100_pcr_id: c2100PcrId,
    documentation_url: documentationUrl,
    approval_workflow_id: templateData.approval_workflow,
    status: 'created',
    s2do_verification_id: s2doResult.verification_id,
    timestamp,
    source: params.source || 'owner_direct',
    additional_context: params.additional_context || {}
  };
  
  // Store project record (in production: database)
  // projectsDatabase.set(projectId, projectRecord);
  
  return {
    project_id: projectId,
    jira_key: jiraKey,
    c2100_pcr_id: c2100PcrId,
    documentation_url: documentationUrl,
    approval_workflow_id: templateData.approval_workflow,
    status: 'created',
    creation_timestamp: timestamp
  };
}

// Helper function to get project template
function getProjectTemplate(templateId) {
  // In production: fetch from template database
  const templates = {
    'default': {
      approval_workflow: 'standard_two_level',
      // other template properties
    },
    'expedited': {
      approval_workflow: 'expedited_single_level',
      // other template properties
    }
  };
  
  return templates[templateId] || templates['default'];
}

// Helper function to verify owner permissions
async function verifyOwnerPermission(ownerId, permission) {
  // In production: check owner subscription database
  // For demonstration, return true
  return true;
}
```

## MCP Prompts for Co-Pilot Operations

### Project Creation Prompt
- **Prompt ID**: `copilot/project_creation`
- **Purpose**: Guide the creation of new projects
- **Content**:
  ```
  You are assisting with creating a new project managed by a Co-Pilot.

  Project creation requires collecting essential information to properly set up
  project infrastructure, documentation, and approval workflows.

  Based on the following context, help draft a project creation request:

  Owner: {owner_name}
  Project Purpose: {purpose}
  Desired Outcome: {outcome}
  Timeline Expectations: {timeline}
  
  Please provide:
  1. A concise project name (5-8 words)
  2. A detailed project description (2-3 paragraphs)
  3. Recommended project template (default or expedited)
  4. Priority level (low, medium, high)
  5. Key stakeholders to involve
  6. Initial resource estimates
  ```

### Approval Request Prompt
- **Prompt ID**: `copilot/approval_request`
- **Purpose**: Generate approval requests for project stages
- **Content**:
  ```
  You are drafting an approval request for a Co-Pilot managed project.

  Effective approval requests must be clear, provide all necessary context,
  and highlight the key decisions needed from approvers.

  Project: {project_name}
  Stage: {stage_name}
  Current Status: {status}
  Key Deliverables: {deliverables}
  
  Please draft:
  1. A summary of the current project state (1 paragraph)
  2. The specific approval being requested (1-2 sentences)
  3. Supporting rationale for the approval (2-3 bullet points)
  4. Any risks or considerations the approver should be aware of
  5. Next steps after approval
  ```

## Integration between Dream Commander and Co-Pilots

The MCP server facilitates integration between Dream Commander prescriptions and Co-Pilot execution by:

1. Exposing Dream Commander directives as resources
2. Providing tools for Co-Pilots to acknowledge and implement directives
3. Creating S2DO verification trails for all actions
4. Maintaining blockchain records of the entire workflow

### Dream Commander to Co-Pilot Flow

```
1. Dream Commander issues directive → S2DO:Directive:Issue
2. MCP server delivers directive to appropriate Co-Pilot
3. Co-Pilot analyzes directive → S2DO:Directive:Analyze
4. Co-Pilot creates project plan → S2DO:Project:Create
5. Co-Pilot seeks owner approval → S2DO:Project:ApprovalRequest
6. Owner approves → S2DO:Project:ApprovalGrant
7. Co-Pilot implements project → Multiple S2DO:Task actions
8. Co-Pilot reports completion → S2DO:Project:Close
```

Each step has blockchain verification via S2DO and appropriate record-keeping in all relevant systems (Jira/C2100-PCR).