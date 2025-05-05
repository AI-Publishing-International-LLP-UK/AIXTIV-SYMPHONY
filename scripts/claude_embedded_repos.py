import os
from anthropic import Anthropic

# Initialize the Anthropic client
# The API key can be set as an environment variable ANTHROPIC_API_KEY
# or directly provided here (but environment variables are preferred for security)
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Make a request to Claude
response = client.messages.create(
    model="claude-3-opus-20240229",
    system="You are an expert in software architecture, DevOps, and repository management with specialized knowledge on monorepo strategies and embedded repository patterns. Provide comprehensive, technically accurate evaluations with practical implementation guidance.",
    max_tokens=4000,
    messages=[
        {
            "role": "user", 
            "content": [
                {
                    "type": "text",
                    "text": """Evaluate the best approaches for managing embedded repositories in a complex software project, focusing on:

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
        }
    ]
)

# Print the response
print("Claude's Analysis of Embedded Repository Management:")
print("="*80)
print(response.content[0].text)  # Access first content block's text
