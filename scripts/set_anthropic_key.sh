#!/bin/zsh

# ----------------------------------------------------------------
# Script to set the ANTHROPIC_API_KEY environment variable
# ----------------------------------------------------------------

# INSTRUCTIONS:
# 1. Replace "your-actual-api-key-here" with your Anthropic API key 
# 2. Run this script with: source scripts/set_anthropic_key.sh
#    (Using 'source' ensures the variable is available in your current shell)
# ----------------------------------------------------------------

# SallyPort Security Management Notice:
# For production environments, consider using aixtiv-cli for secrets management
# Example: aixtiv agent:grant --resource=anthropic-api --principal=claude-integration

# Set the API key
export ANTHROPIC_API_KEY="your-actual-api-key-here"

# Verification (doesn't show the full key for security)
if [[ -n "$ANTHROPIC_API_KEY" ]]; then
  echo "✅ ANTHROPIC_API_KEY has been set successfully!"
  echo "  Key begins with: ${ANTHROPIC_API_KEY:0:4}... and has ${#ANTHROPIC_API_KEY} characters"
else
  echo "❌ Failed to set ANTHROPIC_API_KEY"
fi

echo ""
echo "Now you can run: python3 scripts/claude_palindrome_checker.py"

