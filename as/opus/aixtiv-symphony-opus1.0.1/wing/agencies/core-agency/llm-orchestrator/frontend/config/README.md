# LLM Orchestrator Frontend Configuration

This directory contains the frontend JavaScript components for configuring and managing the LLM Model Orchestrator system. These files provide the user interface for interacting with the ModelOrchestrator backend implementation.

## Overview

The Model Orchestrator is designed to intelligently route requests to the most appropriate LLM provider based on content analysis, provider capabilities, and custom routing rules. These frontend components enable users to configure provider settings, define routing rules, and interact with the orchestration system through a structured interface.

## Components

### 1. `config-interface.js`

This file provides the core configuration interface for the LLM Orchestrator. It handles:

- Loading and saving configuration from/to the backend
- Exposing configuration management methods to other components
- Managing the overall configuration state
- Validation of configuration inputs
- Communication with the backend API endpoints

This component corresponds to the backend's `_load_config` and `_save_config` methods in the ModelOrchestrator class, providing a frontend interface for the configuration management functionalities.

### 2. `provider-config.js`

This file implements the comprehensive provider configuration interface that directly maps to the backend ModelOrchestrator's provider registry and selection mechanism. It handles:

- **Provider Registry Management**: Adds, edits, and removes provider configurations from the orchestrator registry
- **Authentication Configuration**: Manages API keys, OAuth tokens, and service account credentials for each provider
- **Endpoint Configuration**: Sets base URLs, API versions, and specific endpoints for different provider capabilities
- **Model Management**: Configures available models for each provider with their specific parameters and constraints
- **Parameter Templates**: Defines default and custom parameter templates (temperature, top_p, etc.) optimized for different use cases
- **Cost Management**: Configures usage tracking, budget limits, and cost optimization strategies
- **Failover Configuration**: Sets up primary/backup provider relationships and fallback conditions
- **Capability Profiling**: Defines provider strengths and specializations for content routing decisions
- **Cache Configuration**: Sets caching policies specific to each provider and model combination
- **Rate Limiting**: Configures request rate limits, throttling rules, and concurrency settings
- **Request Transformation**: Sets up request/response mapping templates for provider-specific formatting

The component directly interfaces with the backend's provider registry by generating the `providers` section of the configuration object consumed by the ModelOrchestrator's `_select_provider` method. It provides robust validation to ensure only valid provider configurations are submitted to the backend.

### 3. `routing-rules-editor.js`

This file provides an interface for defining content-based routing rules which determine:

- How to analyze incoming requests (using classifiers, embeddings, etc.)
- Which provider should handle specific types of content
- Conditional logic for provider selection
- Priority and fallback sequences
- Testing and simulation of routing decisions

This component corresponds to the `content_routing` section of the backend configuration and works with the `_route_content` method in the ModelOrchestrator.

## Google Cloud Integration

The LLM Orchestrator is designed to work seamlessly with Google Cloud's serverless and workflow orchestration services, particularly Cloud Composer 3 (O3).

### Cloud Composer 3 (O3) Integration

Cloud Composer 3 is a fully managed Apache Airflow service that provides the backbone for our orchestration system:

- **DAG Management**: The configuration interface connects to Airflow DAGs (Directed Acyclic Graphs) that define the workflow of requests through different LLM providers
- **Workflow Scheduling**: Set up time-based or event-driven scheduling for model inference, fine-tuning, and data processing
- **Monitoring Integration**: Connect to Airflow's monitoring capabilities to track workflow execution and performance
- **Dynamic Configuration**: Update DAG parameters based on user configurations in the frontend interface
- **Versioning**: Manage and deploy different versions of orchestration workflows

The frontend configuration components interface with Cloud Composer 3 by generating or updating DAG configurations based on user inputs, which are then deployed to the Airflow environment.

### Cloud Functions Integration

The orchestrator leverages Cloud Functions for serverless compute operations:

- **Pre/Post Processing**: Configure serverless functions for request preprocessing and response postprocessing
- **Provider Adapters**: Deploy lightweight adapters for different LLM providers as Cloud Functions
- **Content Analysis**: Use specialized functions for content classification and routing decisions
- **Caching Logic**: Implement caching strategies through dedicated functions
- **Webhook Handlers**: Configure event-based triggering mechanisms

The configuration interface allows defining function triggers, environment variables, and execution parameters that control how these serverless components behave within the orchestration workflow.

### Cloud Run Integration

For containerized components of the orchestration system:

- **Custom Model Servers**: Configure and deploy model servers as Cloud Run services
- **API Gateways**: Manage API gateway configurations for request routing
- **Stateful Processing**: Handle components requiring more resources or state management
- **Custom Inference**: Deploy specialized inference engines with specific dependencies
- **Batch Processing**: Configure high-throughput processing services for batch operations

The frontend components allow setting service configurations, scaling parameters, and network settings for these containerized services.

### Gemini Integration Within the Orchestration Framework

Google Gemini models are integrated as execution nodes within the orchestration workflow:

- **Model Selection**: Configure which Gemini models to use for specific tasks in the workflow
- **Parameter Configuration**: Set inference parameters specific to Gemini models
- **Fallback Chains**: Define fallback paths in DAGs if Gemini encounters errors or limitations
- **Multi-model Pipelines**: Create workflows that combine Gemini with other providers for complex tasks
- **Specialized Endpoints**: Configure custom endpoints for different Gemini capabilities

## Implementation with Existing Infrastructure

To integrate these components with your existing Cloud Composer 3 environment:

1. **DAG Generation**: The configuration components generate Python code for Airflow DAGs based on user inputs
2. **DAG Deployment**: Connect to your Cloud Composer 3 environment to deploy updated DAGs
3. **Service Account Configuration**: Ensure appropriate service accounts and permissions for cross-service communication
4. **Environment Variables**: Synchronize environment variables between the frontend configuration and backend services
5. **Monitoring Hooks**: Connect Airflow's monitoring capabilities to your observability infrastructure

### Connecting to Existing DAGs

To connect to existing DAGs in your Cloud Composer 3 environment:

1. **Import Existing Configurations**: Use the config-interface.js to scan and import existing DAG structures
2. **Map Provider Configurations**: Align provider-config.js settings with existing service connections in your DAGs
3. **Extract Routing Rules**: Use routing-rules-editor.js to visualize and modify existing routing logic in your DAGs
4. **Version Management**: Implement safeguards to prevent conflicting updates to production DAGs
5. **Testing Integration**: Connect to Airflow's testing mechanisms to validate changes before deployment

## Technical Implementation

The integration leverages several technical components:

1. **Airflow REST API**: Communication with the Airflow instance for DAG management
2. **Google Cloud SDK**: Authentication and resource management
3. **DAG Templates**: Parameterized templates for generating Airflow Python code
4. **Service Discovery**: Automatic discovery of available Cloud Functions and Cloud Run services
5. **Configuration Validation**: Schema validation to ensure configurations will work with deployed services

## Dependencies

These components assume:

- Modern JavaScript environment with ES6+ support
- Fetch API or similar for HTTP requests
- A compatible backend implementing the ModelOrchestrator API
- Access to Google Cloud services (Cloud Composer 3, Cloud Functions, Cloud Run)
- Appropriate service accounts and permissions

## Security Considerations

- Secure management of service account credentials
- Proper handling of OAuth tokens and refresh mechanisms
- Role-based access control for DAG modifications
- Validation of all configuration changes before deployment
- Secure storage of provider API keys and credentials
- Audit logging for all configuration changes

