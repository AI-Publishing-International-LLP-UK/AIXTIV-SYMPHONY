# Aixtiv Symphony Opus Agent Pairs

This directory contains the CRX and RIX agent pairs that form the core of the Aixtiv Symphony's agent orchestration system.

## Directory Structure

The agent-pairs directory is structured as follows:
- `crx/`: Contains CRX (Customer Relationship Experience) agents
- `rix/`: Contains RIX (Reference Intelligence Experience) agents

Each agent subdirectory includes:
- Source code for the agent
- identity.json file with agent metadata
- Configuration files specific to the agent
- Dockerfile for containerization (if applicable)

## Agent Types

### CRX Agents
CRX agents are customer-facing agents responsible for handling interactions with users. They focus on:
- Customer support
- Sales and marketing
- User onboarding
- Educational experiences
- Product recommendations

### RIX Agents
RIX agents are reference intelligence agents that support CRX agents with specialized knowledge. They focus on:
- Data analysis
- Knowledge retrieval
- Decision support
- Content generation
- System integration

## Managing Agents

### Integrating Agent Bundles
To integrate a new agent bundle into the system, use the integrate_bundle.sh script:

```bash
../scripts/integrate_bundle.sh <path_to_bundle.zip> [agent_type]
```

Example:
```bash
../scripts/integrate_bundle.sh ~/Downloads/crx-agent-v1.0.zip crx
```

### Cloning CRX Agents
To clone an existing CRX agent to create a new one, use the crx-clone.sh script:

```bash
../scripts/crx-clone.sh <source_agent> <new_agent_name> [configuration_file]
```

Example:
```bash
../scripts/crx-clone.sh sales-agent-basic premium-sales-agent
```

### Agent Identity Files
Each agent must have an identity.json file that includes:
- agent_name: The name of the agent
- agent_type: Either "crx" or "rix"
- created_at: Timestamp when the agent was created
- Additional metadata specific to the agent

Example identity.json:
```json
{
  "agent_name": "sales-agent-basic",
  "agent_type": "crx",
  "created_at": "2023-04-01T12:00:00Z",
  "created_by": "integration_script",
  "capabilities": ["product_knowledge", "pricing", "basic_support"]
}
```

## Agent Deployment
Agents can be deployed as containers or as serverless functions, depending on the use case. To containerize an agent, use the Dockerfile provided in the agent directory:

```bash
# Navigate to the agent directory
cd crx/agent-name

# Build the Docker image
docker build -t crx-agent-name .

# Run the container
docker run -p 3000:3000 crx-agent-name
```

## Agent Orchestration
Agent orchestration is handled by the Wing system, which coordinates interactions between CRX and RIX agents. For more information, see the Wing documentation.
