# Claude API Integration - Palindrome Checker

## Introduction

This integration demonstrates how to leverage Claude via the Anthropic API within the Aixtiv Symphony Orchestrating Operating System (ASOOS). The key components include:

- `claude_palindrome_checker.py`: Script that queries Claude to generate a Python function that checks if a string is a palindrome
- `set_anthropic_key.sh`: Helper script to securely set your Anthropic API key

This integration showcases how Claude can be used to generate high-quality, functional code that can be integrated into larger systems. The palindrome checker is a simple example, but the same approach can be extended to more complex use cases within the Symphony ecosystem.

## Setup

### Prerequisites
- Python 3.7+ (currently using Python 3.13.2)
- A virtual environment (one has been created in `claude-env/`)
- An Anthropic API key (obtain from [Anthropic Console](https://console.anthropic.com/))

### Steps

1. **Activate the virtual environment**:
   ```bash
   source claude-env/bin/activate
   ```

2. **Install the Anthropic SDK** (if not already done):
   ```bash
   pip install anthropic
   ```

3. **Set your API key**:
   - Edit `scripts/set_anthropic_key.sh` to replace the placeholder with your actual API key
   - Run:
     ```bash
     source scripts/set_anthropic_key.sh
     ```

## Running the Palindrome Checker

With your environment set up and API key in place, run:

```bash
python3 scripts/claude_palindrome_checker.py
```

This will:
1. Connect to the Anthropic API using the Claude 3.7 Sonnet model
2. Request Claude to generate a Python function for palindrome checking
3. Print Claude's response, which will include the function code and explanation

## Understanding the Output

The output will show Claude's complete response, including:

1. A Python `is_palindrome()` function that checks if a string is a palindrome
2. Explanation of how the function works
3. Error handling considerations
4. Test cases demonstrating the function in action

You can extract the function from this response and integrate it into your own code, or use it as a reference for implementing similar functionality.

## Integration with Aixtiv Symphony

This example can be extended to integrate with other Symphony components:

- **Dr. Claude Orchestrator**: Managed in the `vls/solutions/dr-claude-orchestrator/` module
- **Wing Delegation**: Can be adapted for the agent orchestration system in `wing/agencies/`
- **Flight Memory System (FMS)**: Events can be logged via `aixtiv copilot:link` for audit trails

For production use, leverage SallyPort Security Management:
```bash
aixtiv agent:grant --resource=anthropic-api --principal=claude-integration
```

## Next Steps

1. **Explore more complex use cases** like data analysis, content generation, or decision support
2. **Integrate with Symphony's APIs** via the Integration Gateway
3. **Deploy as a reusable service** in the backend infrastructure
4. **Add logging and monitoring** through the agent tracking system

## Additional Resources

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Aixtiv Symphony Integration Guides](/docs/integration/)
- [Aixtiv CLI Documentation](https://aixtiv.com/docs/cli)
- [Claude Best Practices](/docs/ai/claude/)

---

*This integration is part of the Aixtiv Symphony Orchestrating Operating System.*

