# Aixtiv CLI - Command-Line Interface

## Overview

The Aixtiv CLI is a powerful command-line tool for interacting with the Aixtiv Symphony ecosystem. It provides a simple and consistent interface for managing domains, agents, and other resources.

## Installation

```bash
npm install -g aixtiv-cli
```

## Configuration

The CLI requires an API token for authentication. You can set the token using the following command:

```bash
aixtiv config set token YOUR_API_TOKEN
```

## Usage

Here are some common commands:

### Authentication

- `aixtiv auth verify`: Verify your authentication token.

### Agents

- `aixtiv agent activate <agent-id>`: Activate a specific AI agent.
- `aixtiv agent delegate <agent-id> <task-name> [payload]`: Delegate a task to an agent.

### Domains

- `aixtiv domain list`: List all managed domains.
- `aixtiv domain add <domain-name>`: Add a new domain.

## Getting Help

For more information on a specific command, use the `--help` flag:

```bash
aixtiv agent delegate --help
```

