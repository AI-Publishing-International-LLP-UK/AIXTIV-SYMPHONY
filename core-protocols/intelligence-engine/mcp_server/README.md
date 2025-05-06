# Model Context Protocol (MCP) Server

## Overview

The MCP Server is a core component of the Aixtiv Symphony Orchestrating Operating System (ASOOS), providing context management services for the agent orchestration layer. It allows agents to store, retrieve, and manage contextual information needed for their operations.

## Features

- Agent context creation and retrieval
- Context type categorization
- Status monitoring and health checks
- CORS support for frontend integration
- Containerized deployment to GCP

## Project Structure

```
mcp_server/
├── main.py               # Main application entry point
├── requirements.txt      # Python dependencies
├── Dockerfile            # Container configuration
├── cloudbuild.yaml       # GCP Cloud Build configuration
└── README.md             # Documentation
```

## Local Development

### Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the server:
   ```
   python main.py
   ```

4. Access the API at `http://localhost:8000` and documentation at `http://localhost:8000/docs`

## Deployment

The MCP Server is configured to deploy to Google Cloud Run in the `us-west1` region:

```
gcloud builds submit --config cloudbuild.yaml
```

## Integration Points

- **Wing Agents**: Consume context information
- **FMS (Flight Memory System)**: Long-term storage integration
- **Gateway**: Authentication and authorization

## API Endpoints

- `GET /`: Basic server information
- `GET /status`: Server status and metrics
- `POST /agents/{agent_id}/contexts`: Create agent context
- `GET /agents/{agent_id}/contexts`: Retrieve agent contexts
- `DELETE /agents/{agent_id}/contexts`: Clear agent contexts
- `GET /agents/{agent_id}/contexts/{context_type}`: Get contexts by type

## Environment Variables

- `ENVIRONMENT`: Deployment environment (development, staging, production)
- `REGION`: GCP region (default: us-west1)
- `ZONE`: GCP zone (default: us-west1-b)

