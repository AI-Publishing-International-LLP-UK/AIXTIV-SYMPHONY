# Accessing Google Cloud Secrets for Claude API Integration

This guide explains how to securely retrieve and use the Anthropic API key stored in Google Cloud Secret Manager for the Aixtiv Symphony project.

## Available Scripts

1. `set_anthropic_key_from_gcloud.sh` - Retrieves the Anthropic API key from Google Cloud Secret Manager and sets it as an environment variable
2. `claude_embedded_repos.py` - Uses the Anthropic API to generate best practices for managing embedded repositories

## Prerequisites

- Google Cloud SDK (gcloud) installed and configured
- Authentication with an account that has Secret Manager Accessor role
- Active project set to `api-for-warp-drive`
- Python virtual environment activated (see `README_CLAUDE_API.md`)

## Usage Instructions

### 1. Set up Authentication and Environment

Make sure you're using the correct Google Cloud project:

```bash
gcloud config set project api-for-warp-drive
```

### 2. Retrieve the API Key

Run the script to retrieve the Anthropic API key from Secret Manager:

```bash
source scripts/set_anthropic_key_from_gcloud.sh
```

Important: Use `source` to ensure the environment variable is set in your current shell session.

### 3. Run the Claude Analysis Script

Now you can run the script to analyze embedded repository management approaches:

```bash
python scripts/claude_embedded_repos.py
```

This will generate a comprehensive analysis of various techniques for managing embedded repositories, including Git submodules, subtrees, and monorepo tooling.

## Security Considerations

- The API key is stored only in memory as an environment variable
- The key is not written to disk at any point
- The key is only valid for the duration of your shell session
- The script obscures most of the key when reporting success

## Integrating with Aixtiv Symphony

For integration with Symphony Flight Memory System (FMS) and other components, see the main API integration documentation.

## Troubleshooting

If you encounter issues with secret access:

1. Verify your Google Cloud permissions
2. Ensure you're using the correct project ID
3. Check that the secret name matches exactly: `anthropic-admin`
4. Verify that your gcloud authentication is current: `gcloud auth list`

For additional help, refer to the Google Cloud Secret Manager documentation.
