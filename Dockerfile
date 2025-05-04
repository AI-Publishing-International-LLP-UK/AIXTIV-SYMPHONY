FROM python:3.9-slim

WORKDIR /app

# Copy requirements file
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV OPENAI_API_KEY="your-openai-api-key"
ENV ANTHROPIC_API_KEY="your-anthropic-api-key"
ENV PINECONE_API_KEY="your-pinecone-api-key"
ENV PINECONE_ENVIRONMENT="your-pinecone-environment"
ENV WALLET_PRIVATE_KEY="your-wallet-private-key"
ENV WEB3_PROVIDER_URI="your-web3-provider-uri"
ENV FIREBASE_PROJECT_ID="your-firebase-project-id"

# Run the orchestrator
CMD ["python", "llm_orchestrator.py"]
