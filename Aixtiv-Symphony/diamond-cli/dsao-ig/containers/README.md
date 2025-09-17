# Aixtiv Symphony Opus Containers

This directory contains Docker containers for the various VLS (Vision Lake Solutions) components of the Aixtiv Symphony Opus project.

## Directory Structure

Each subdirectory represents a containerized VLS solution and includes:
- Dockerfile
- docker-compose.yml
- .env.template (or .env file)
- README.md with specific instructions

## Available Containers

Currently, the following VLS solutions can be containerized:

1. dr-lucy-flight-memory - Flight Memory System
2. dr-burby-s2do-blockchain - S2DO Governance System
3. professor-lee-q4d-lenz - Contextual Understanding
4. dr-sabina-dream-commander - Strategic Intelligence
5. dr-memoria-anthology - Automated Publishing
6. dr-match-bid-suite - Procurement Intelligence
7. dr-grant-cybersecurity - Security Solutions
8. dr-cypriot-rewards - Engagement Systems
9. dr-maria-support - Multilingual Support
10. dr-roark-wish-vision - Wish Fulfillment
11. dr-claude-orchestrator - Agent Coordination

## Creating a New Container

To create a new container for a VLS solution, use the containerize_vls.sh script:

```bash
../scripts/containerize_vls.sh <vls_solution_name> [source_path]
```

Example:
```bash
../scripts/containerize_vls.sh dr-lucy-flight-memory ../vls/solutions/dr-lucy-flight-memory
```

## Building and Running Containers

Each container directory includes a docker-compose.yml file that can be used to build and run the container:

```bash
# Navigate to the container directory
cd <vls_solution_name>

# Build the container
docker-compose build

# Run the container
docker-compose up -d
```

## Deploying to Kubernetes

To deploy a container to Kubernetes, use the generate_k8s_manifest.sh script:

```bash
../scripts/generate_k8s_manifest.sh <vls_solution_name> <project_id> <version>
```

Example:
```bash
../scripts/generate_k8s_manifest.sh dr-lucy-flight-memory my-gcp-project latest
```

This will generate a Kubernetes manifest file in the manifests directory that can be applied to a Kubernetes cluster:

```bash
kubectl apply -f ../manifests/<vls_solution_name>-deployment.yaml
```
