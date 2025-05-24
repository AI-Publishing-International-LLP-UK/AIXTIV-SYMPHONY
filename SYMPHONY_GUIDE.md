# Symphony Local Environment Guide

This guide provides instructions for accessing and using the Symphony Local Environment, which features agents at pilots running on port 3030.

## Accessing the Symphony Environment

The Symphony Local Environment has been set up at `/Users/as/symphony_local`. To access it, follow these steps:

1. Open a terminal
2. Run the following commands:
   ```bash
   cd /Users/as/symphony_local
   ./start.sh
   ```

3. Access the environment in your browser:
   - Frontend: http://localhost:3000
   - API: http://localhost:3030

## Login and Access

- **Login**: You can log in with any username (try using 'roark')
- **Developer Panel**: Press Shift+Ctrl+9 to access the Developer Panel

## Environment Structure

The Symphony Local Environment consists of:

1. **Frontend server** (port 3000):
   - User interface for interacting with the Symphony agents
   - Visualization tools for agent activities

2. **API server** (port 3030):
   - Backend services for agent coordination
   - Integration with the pilots system

## Working with Agents

The environment provides an interface to work with AI agents, including:

- Agent status monitoring
- Task assignment and orchestration
- Performance analytics

## Troubleshooting

If you encounter issues with the environment:

1. Ensure both servers are running by checking http://localhost:3000 and http://localhost:3030
2. Check for any error messages in the terminal where you ran `start.sh`
3. Verify you have the necessary permissions to access the Symphony Local Environment

## Notes

- This is a local development environment for the asoos.2100.cool integration
- The environment features agent-driven orchestration via the pilots interface