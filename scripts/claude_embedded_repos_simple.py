#!/usr/bin/env python3
"""
Simplified Claude Embedded Repository Analysis

This script uses the Anthropic API with Claude 3 Haiku to analyze
best practices for managing embedded repositories in software projects.
"""

import os
import sys
import json
import logging
from anthropic import Anthropic, AuthenticationError, APIStatusError, APITimeoutError, APIConnectionError, RateLimitError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_api_key():
    """Verify that the ANTHROPIC_API_KEY environment variable is set."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("ANTHROPIC_API_KEY environment variable is not set!")
        logger.info("Please run: source scripts/set_anthropic_key_from_gcloud.sh")
        return False
        
    # Check if the key appears to be in the correct format (without exposing it)
    if not api_key.startswith("sk-"):
        logger.warning("API key does not start with 'sk-', which is unusual for Anthropic API keys")
        
    logger.info(f"API key found (starts with: {api_key[:4]}..., length: {len(api_key)} characters)")
    return True

def get_embedded_repos_analysis():
    """
    Query Claude to get analysis of embedded repository management strategies.
    Uses a simpler model and provides detailed error reporting.
    """
    if not check_api_key():
        return None
        
    try:
        logger.info("Initializing Anthropic client...")
        client = Anthropic()
        
        logger.info("Sending request to Claude 3 Haiku...")
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=4000,
            temperature=0.2,  # Lower temperature for more consistent, factual responses
            system="You are an expert software architect specializing in repository management and DevOps practices. Provide clear, accurate, and practical advice.",
            messages=[
                {
                    "role": "user", 
                    "content": """Evaluate the best approaches for managing embedded repositories in a complex software project, focusing on:

1. Comparison of techniques including:
   - Git submodules
   - Git subtrees
   - Sparse checkout
   - Git LFS for large files
   - Externalized dependencies management
   - Monorepo tooling (Nx, Turborepo, etc.)
   - Workspace packages (yarn/npm workspaces, pnpm)

2. For each approach, analyze:
   - Pros and cons
   - Setup complexity and maintenance overhead
   - Impact on CI/CD pipelines
   - Team collaboration considerations
   - Versioning strategy
   - Performance with large codebases

3. Specific recommendations for:
   - When an embedded repo contains shared libraries
   - When repos have different release cycles
   - Cross-repo change management
   - How to handle conflicts and dependencies

4. Architectural patterns that work best with each strategy

Include code examples for the most recommended approaches, and migration strategies for projects currently using embedded repositories inefficiently."""
                }
            ]
        )
        
        logger.info("Successfully received response from Claude")
        return response.content[0].text
        
    except AuthenticationError as e:
        logger.error(f"Authentication error: {e}")
        logger.error("Check that your API key is valid and correctly configured")
        logger.error(f"Response details: {e.response.text if hasattr(e, 'response') else 'No response details'}")
        
    except RateLimitError as e:
        logger.error(f"Rate limit exceeded: {e}")
        logger.error("You've exceeded the rate limit for API requests - try again later")
        
    except APITimeoutError as e:
        logger.error(f"API timeout: {e}")
        logger.error("The request timed out. Try again or use a smaller prompt.")
        
    except APIConnectionError as e:
        logger.error(f"API connection error: {e}")
        logger.error("Check your network connection and try again")
        
    except APIStatusError as e:
        logger.error(f"API status error: {e.status_code} - {e}")
        logger.error(f"Full response: {e.response.text if hasattr(e, 'response') else 'No response details'}")
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        
    return None

def main():
    """Main function to run the script."""
    logger.info("Starting Claude analysis of embedded repository strategies")
    
    analysis = get_embedded_repos_analysis()
    
    if analysis:
        print("\n" + "="*80)
        print("CLAUDE ANALYSIS: EMBEDDED REPOSITORY MANAGEMENT STRATEGIES")
        print("="*80 + "\n")
        print(analysis)
        print("\n" + "="*80)
        logger.info("Analysis completed successfully")
    else:
        logger.error("Failed to get analysis from Claude")
        sys.exit(1)
        
if __name__ == "__main__":
    main()

