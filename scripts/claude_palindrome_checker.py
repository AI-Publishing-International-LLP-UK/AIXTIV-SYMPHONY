import os
from anthropic import Anthropic

# Initialize the Anthropic client
# The API key can be set as an environment variable ANTHROPIC_API_KEY
# or directly provided here (but environment variables are preferred for security)
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Make a request to Claude
response = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    system="Generate Python code for palindrome checking with detailed explanations.",
    max_tokens=1000,
    messages=[
        {
            "role": "user", 
            "content": [
                {
                    "type": "text",
                    "text": "Create a Python function that checks if a string is a palindrome. Include error handling and test cases."
                }
            ]
        }
    ]
)

# Print the response
print("Claude Response:")
print(response.content[0].text)  # Access first content block's text

