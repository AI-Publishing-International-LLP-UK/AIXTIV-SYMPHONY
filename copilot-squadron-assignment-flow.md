# Co-Pilot to Squadron Assignment Workflow via MCP

## Complete End-to-End Process Flow

```
                  +------------------+
                  | Dream Commander  |
                  | or Owner Request |
                  +--------+---------+
                           |
                           v
                  +------------------+
                  |                  |
                  |    Co-Pilot      |
                  |                  |
                  +--------+---------+
                           |
                 S2DO:Project:Create
                           |
          +----------------+---------------+
          |                                |
          v                                v
+-------------------+            +--------------------+
| Documentation     |            | PM/BA Rules &      |
| & Approval Flow   |            | Specifications     |
+--------+----------+            +---------+----------+
          |                                |
          | Approved                       | S2DO:Project:ResourceAssign
          |                                |
          v                                v
+-------------------+            +--------------------+
| Project Setup     |            |                    |
| (Jira/C2100-PCR)  |            |   Dr. Claude 02    |
+--------+----------+            |                    |
          |                      +---------+----------+
          |                                |
          |                   S2DO:Squadron:Assign
          |                                |
          |                                v
          |                      +--------------------+
          |                      | Division of Labor  |
          |                      | Process            |
          |                      +---------+----------+
          |                                |
          |                                v
          |                      +--------------------+
          |                      | Squadron Selection |
          |                      | (1, 2, or 3)       |
          |                      +---------+----------+
          |                                |
          |                                v
          |                      +--------------------+
          |                      | Flight Preparation |
          |                      | by Ground Crew     |
          |                      +---------+----------+
          |                                |
          |                                v
          |                      +--------------------+
          |                      | 2-Hour Production  |
          |                      | Window             |
          |                      +---------+----------+
          |                                |
          |                                v
          |                      +--------------------+
          |                      | QA Verification    |
          |                      |                    |
          |                      +---------+----------+
          |                                |
          |                   S2DO:Project:DeliveryReady
          |                                |
          v                                v
+-------------------+            +--------------------+
|                   |            |                    |
| Co-Pilot          |<-----------+ Completed Work     |
| (Receives Work)   |            | Delivery Package   |
+--------+----------+            +--------------------+
          |
          | S2DO:Project:DeliveryNotification
          |
          v
+-------------------+
| Owner Subscriber  |
| Approval Options  |
+-------------------+
      |      |      |       |
      |      |      |       |
      v      v      v       v
  Approve  Modify  Cancel  Receive
```

## MCP Integration for Squadron Assignment Workflow

### New Resources

#### `copilot/squadron_assignment`
```json
{
  "type": "object",
  "properties": {
    "project_id": {
      "type": "string",
      "description": "Project identifier"
    },
    "assignment_id": {
      "type": "string",
      "description": "Assignment identifier"
    },
    "resource_requirements": {
      "type": "object",
      "properties": {
        "pilot_specialization": {
          "type": "string",
          "enum": ["frontend", "backend", "fullstack", "design", "data", "devops"]
        },
        "skill_level": {
          "type": "string",
          "enum": ["trainee", "junior", "senior", "expert"]
        },
        "estimated_hours": {
          "type": "number",
          "minimum": 1,
          "maximum": 8
        },
        "priority": {
          "type": "string",
          "enum": ["low", "medium", "high", "critical"]
        }
      }
    },
    "specifications": {
      "type": "object",
      "description": "Technical specifications for the assignment"
    },
    "assigned_squadron": {
      "type": "string",
      "enum": ["squadron-1", "squadron-2", "squadron-3"]
    },
    "assigned_pilot": {
      "type": "string",
      "description": "Identifier of the assigned pilot"
    },
    "ground_crew": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Identifiers of ground crew members"
    },
    "time_window": {
      "type": "object",
      "properties": {
        "start_time": {
          "type": "string",
          "format": "date-time"
        },
        "end_time": {
          "type": "string",
          "format": "date-time"
        }
      }
    },
    "status": {
      "type": "string",
      "enum": ["pending", "assigned", "in-progress", "completed", "qa-verified", "delivered", "rejected"]
    }
  },
  "required": ["project_id", "resource_requirements"]
}
```

#### `drClaude02/labor_division_rules`
```json
{
  "squadron_selection_criteria": [
    {
      "squadron": "squadron-1",
      "specializations": ["frontend", "design", "ui-ux"],
      "project_types": ["web-application", "mobile-application", "design-system"],
      "availability_hours": "24/7",
      "min_skill_level": "junior"
    },
    {
      "squadron": "squadron-2",
      "specializations": ["backend", "data", "api-development"],
      "project_types": ["api-service", "data-pipeline", "integration"],
      "availability_hours": "24/7",
      "min_skill_level": "junior"
    },
    {
      "squadron": "squadron-3",
      "specializations": ["fullstack", "devops", "security"],
      "project_types": ["full-solution", "infrastructure", "security-audit"],
      "availability_hours": "24/7",
      "min_skill_level": "senior"
    }
  ],
  "time_window_allocation": {
    "standard_window": 2,
    "expedited_window": 1,
    "extended_window": 4,
    "buffer_percentage": 20
  },
  "ground_crew_assignment": {
    "standard_crew_size": 2,
    "minimum_crew_size": 1,
    "roles": ["environment-setup", "resource-preparation", "documentation-support", "qa-preparation"]
  },
  "qa_verification_requirements": {
    "mandatory_checks": ["functional", "code-quality", "security", "performance"],
    "approval_threshold": 90,
    "automated_tests_required": true
  }
}
```

### New MCP Tools

#### 1. Resource Assignment
- **Tool ID**: `copilot/resource_project`
- **Function**: `executeCoPilotResourceProject(params)`
- **Input Schema**:
  ```json
  {
    "project_id": "string",
    "resource_requirements": {
      "pilot_specialization": "string",
      "skill_level": "string",
      "estimated_hours": "number",
      "priority": "string"
    },
    "specifications": "object",
    "requested_timeline": "string"
  }
  ```
- **Output Schema**:
  ```json
  {
    "assignment_id": "string",
    "project_id": "string",
    "status": "string",
    "next_steps": "string",
    "dr_claude_02_handoff_id": "string"
  }
  ```

#### 2. Dr. Claude 02 Division of Labor
- **Tool ID**: `drClaude02/divide_labor`
- **Function**: `executeDrClaude02DivideLabor(params)`
- **Input Schema**:
  ```json
  {
    "assignment_id": "string", 
    "project_id": "string",
    "resource_requirements": "object",
    "specifications": "object",
    "priority": "string"
  }
  ```
- **Output Schema**:
  ```json
  {
    "squadron_assignment_id": "string",
    "selected_squadron": "string",
    "time_window": {
      "start_time": "string",
      "end_time": "string"
    },
    "ground_crew_size": "number",
    "preparation_instructions": "string",
    "status": "string"
  }
  ```

#### 3. Squadron Flight Assignment
- **Tool ID**: `squadron/assign_flight`
- **Function**: `executeSquadronAssignFlight(params)`
- **Input Schema**:
  ```json
  {
    "squadron_assignment_id": "string",
    "squadron_id": "string",
    "time_window": "object",
    "specifications": "object",
    "project_id": "string"
  }
  ```
- **Output Schema**:
  ```json
  {
    "flight_id": "string",
    "assigned_pilot": "string",
    "ground_crew": ["string"],
    "status": "string",
    "preparation_start_time": "string",
    "production_start_time": "string",
    "estimated_completion_time": "string"
  }
  ```

#### 4. Flight Completion and QA
- **Tool ID**: `squadron/complete_flight`
- **Function**: `executeSquadronCompleteFlight(params)`
- **Input Schema**:
  ```json
  {
    "flight_id": "string",
    "deliverables": ["string"],
    "qa_results": {
      "checks_performed": ["string"],
      "score": "number",
      "issues_found": ["string"],
      "issues_resolved": ["string"]
    },
    "time_spent": "number",
    "notes": "string"
  }
  ```
- **Output Schema**:
  ```json
  {
    "flight_id": "string",
    "completion_status": "string",
    "qa_verification_status": "string",
    "delivery_package_id": "string",
    "jira_updates": ["string"],
    "ready_for_delivery": "boolean"
  }
  ```

#### 5. Co-Pilot Delivery to Owner
- **Tool ID**: `copilot/deliver_work`
- **Function**: `executeCoPilotDeliverWork(params)`
- **Input Schema**:
  ```json
  {
    "project_id": "string",
    "delivery_package_id": "string",
    "delivery_message": "string",
    "delivery_options": {
      "allow_modifications": "boolean",
      "request_feedback": "boolean"
    }
  }
  ```
- **Output Schema**:
  ```json
  {
    "delivery_id": "string",
    "project_id": "string",
    "delivery_timestamp": "string",
    "owner_notification_status": "string",
    "owner_action_url": "string",
    "expiration_time": "string"
  }
  ```

### S2DO Actions for Squadron Assignment Flow

1. **Co-Pilot to Dr. Claude 02 Handoff**
   ```
   S2DO:Project:ResourceAssign
   S2DO:Project:SpecificationTransfer
   ```

2. **Dr. Claude 02 to Squadron Assignment**
   ```
   S2DO:Labor:DivisionComplete
   S2DO:Squadron:Assign
   S2DO:Resources:Allocate
   ```

3. **Squadron Flight Operations**
   ```
   S2DO:Flight:Prepare
   S2DO:Flight:Execute
   S2DO:Flight:Complete
   S2DO:Deliverable:QAVerify
   ```

4. **Delivery Process**
   ```
   S2DO:Project:DeliveryReady
   S2DO:Project:DeliveryNotification
   S2DO:Project:OwnerAction
   ```

## Implementation Details

### Co-Pilot Resource Assignment Process

```javascript
async function executeCoPilotResourceProject(params) {
  console.log('Assigning resources to project:', params);
  
  // Create assignment record
  const assignmentId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // 1. Verify project exists and is in appropriate state
  const projectExists = await verifyProjectExists(params.project_id);
  
  if (!projectExists) {
    throw new Error(`Project not found: ${params.project_id}`);
  }
  
  // 2. Create S2DO action for resource assignment
  const s2doParams = {
    stem: 'Project',
    action: 'ResourceAssign',
    parameters: {
      project_id: params.project_id,
      resource_requirements: params.resource_requirements,
      timestamp
    },
    initiator: 'co-pilot'
  };
  
  // 3. Verify S2DO action
  const s2doResult = await executeS2DOVerify(s2doParams);
  
  // 4. Create assignment record
  const assignmentRecord = {
    id: assignmentId,
    project_id: params.project_id,
    resource_requirements: params.resource_requirements,
    specifications: params.specifications,
    requested_timeline: params.requested_timeline,
    status: 'pending',
    creation_timestamp: timestamp,
    s2do_verification_id: s2doResult.verification_id
  };
  
  // 5. Hand off to Dr. Claude 02
  const drClaudeHandoffId = await handoffToDrClaude02(
    assignmentId, 
    params.project_id,
    params.resource_requirements,
    params.specifications
  );
  
  // 6. Update Jira with resource assignment status
  // In production: updateJiraProject(params.project_id, 'Resource Assignment in Progress');
  
  return {
    assignment_id: assignmentId,
    project_id: params.project_id,
    status: 'pending',
    next_steps: 'Awaiting Dr. Claude 02 labor division',
    dr_claude_02_handoff_id: drClaudeHandoffId
  };
}

// Dr. Claude 02 Division of Labor
async function executeDrClaude02DivideLabor(params) {
  console.log('Dr. Claude 02 dividing labor:', params);
  
  const squadronAssignmentId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // 1. Create S2DO action for labor division
  const s2doParams = {
    stem: 'Labor',
    action: 'DivisionComplete',
    parameters: {
      assignment_id: params.assignment_id,
      project_id: params.project_id,
      timestamp
    },
    initiator: 'dr-claude-02'
  };
  
  // 2. Verify S2DO action
  await executeS2DOVerify(s2doParams);
  
  // 3. Apply squadron selection logic
  // This would be more sophisticated in production
  const specialization = params.resource_requirements.pilot_specialization;
  let selectedSquadron = 'squadron-1'; // Default
  
  if (specialization === 'backend' || specialization === 'data') {
    selectedSquadron = 'squadron-2';
  } else if (specialization === 'fullstack' || specialization === 'devops') {
    selectedSquadron = 'squadron-3';
  }
  
  // 4. Calculate time window
  const estimatedHours = params.resource_requirements.estimated_hours || 2;
  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 1); // Start in 1 hour
  
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + estimatedHours);
  
  // 5. Determine ground crew size based on complexity
  const groundCrewSize = estimatedHours > 2 ? 2 : 1;
  
  // 6. Create S2DO action for squadron assignment
  const squadronS2DOParams = {
    stem: 'Squadron',
    action: 'Assign',
    parameters: {
      squadron_assignment_id: squadronAssignmentId,
      squadron_id: selectedSquadron,
      project_id: params.project_id,
      timestamp
    },
    initiator: 'dr-claude-02'
  };
  
  // 7. Verify S2DO action
  await executeS2DOVerify(squadronS2DOParams);
  
  // 8. Schedule squadron assignment
  // In production: scheduleSquadronAssignment(selectedSquadron, squadronAssignmentId, timeWindow);
  
  return {
    squadron_assignment_id: squadronAssignmentId,
    selected_squadron: selectedSquadron,
    time_window: {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    },
    ground_crew_size: groundCrewSize,
    preparation_instructions: "Prepare environment and resources for development",
    status: "scheduled"
  };
}
```

## Work Delivery and Owner Approval Process

```javascript
async function executeCoPilotDeliverWork(params) {
  console.log('Co-Pilot delivering work to owner:', params);
  
  const deliveryId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // 1. Verify delivery package is ready
  const packageIsReady = await verifyDeliveryPackage(params.delivery_package_id);
  
  if (!packageIsReady) {
    throw new Error(`Delivery package not ready: ${params.delivery_package_id}`);
  }
  
  // 2. Create S2DO action for delivery notification
  const s2doParams = {
    stem: 'Project',
    action: 'DeliveryNotification',
    parameters: {
      project_id: params.project_id,
      delivery_package_id: params.delivery_package_id,
      timestamp
    },
    initiator: 'co-pilot'
  };
  
  // 3. Verify S2DO action
  await executeS2DOVerify(s2doParams);
  
  // 4. Update project status in all systems
  // In production:
  // - updateJiraStatus(params.project_id, 'Delivered')
  // - updateC2100PCRStatus(params.project_id, 'Delivered')
  
  // 5. Notify owner subscriber
  const ownerActionUrl = `https://asoos.com/projects/${params.project_id}/delivery/${deliveryId}`;
  // In production: notifyOwnerSubscriber(project, deliveryId, ownerActionUrl);
  
  // 6. Set expiration time for owner response (7 days)
  const expirationTime = new Date();
  expirationTime.setDate(expirationTime.getDate() + 7);
  
  return {
    delivery_id: deliveryId,
    project_id: params.project_id,
    delivery_timestamp: timestamp,
    owner_notification_status: 'sent',
    owner_action_url: ownerActionUrl,
    expiration_time: expirationTime.toISOString()
  };
}
```

## MCP Prompts for Squadron Assignment

### Squadron Assignment Prompt
- **Prompt ID**: `drClaude02/squadron_selection`
- **Purpose**: Determine optimal squadron for task requirements
- **Content**:
  ```
  You are Dr. Claude 02, responsible for division of labor and squadron assignment.

  Based on the following project requirements, determine the most appropriate
  squadron assignment and resource allocation:

  Project ID: {project_id}
  Specialization Required: {specialization}
  Skill Level: {skill_level}
  Estimated Hours: {estimated_hours}
  Priority: {priority}
  Technical Specifications: {specifications}
  
  Available Squadrons:
  - Squadron 1: Frontend, Design, UI/UX specialists
  - Squadron 2: Backend, Data, API Development specialists
  - Squadron 3: Fullstack, DevOps, Security specialists
  
  Please provide:
  1. Selected squadron with justification
  2. Recommended time window for the assignment
  3. Ground crew requirements
  4. Preparation instructions for the ground crew
  5. Special considerations for the pilot
  ```

### Work Delivery Prompt
- **Prompt ID**: `copilot/work_delivery`
- **Purpose**: Create professional delivery messages to owners
- **Content**:
  ```
  You are a Co-Pilot preparing to deliver completed work to an owner subscriber.

  Project: {project_name}
  Description: {project_description}
  Completed Deliverables: {deliverables}
  QA Score: {qa_score}
  
  Please draft:
  1. A professional delivery message summarizing the completed work
  2. Key highlights of the implementation
  3. Instructions for the owner to review and approve the work
  4. Any areas where feedback would be particularly valuable
  5. Next steps if modifications are needed
  ```