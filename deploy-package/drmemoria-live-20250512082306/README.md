# Dr. Memoria's Anthology - Firebase Functions

## Project Overview

Dr. Memoria's Anthology is a sophisticated AI-assisted publishing system powered by Firebase Cloud Functions. The platform facilitates human-AI collaborative content creation with a strong emphasis on ethical considerations, human creative leadership, and transparent attribution. 

Key components include:

- **Roark 5.0 Authorship Model**: Manages human-AI collaborative content creation with strict controls maintaining human creative sovereignty (minimum 70% human contribution required)
- **CIG (Code is Gold) Framework**: Validates content integrity, originality, and ethical compliance
- **Blockchain Integration**: Registers content ownership on the blockchain with NFT generation
- **Multi-Platform Publishing**: Enables publishing to platforms like YouTube, Kindle, and Coursera

The system is designed to maintain the highest standards of creative integrity in the age of AI collaboration while providing a seamless publishing experience.

## Prerequisites

Before setting up the development environment, ensure you have the following:

- Node.js (v14 or later)
- npm (v6 or later)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Blaze plan (required for external API calls)
- Access to the following APIs:
  - OpenAI API
  - Anthropic API (optional for fallback)
  - Pinecone (for vector embeddings)
  - NFT.Storage (for blockchain content registration)
  - Web3 provider (Infura or similar)

## Installation

1. **Clone the repository**:
   ```bash
   git clone [repository URL]
   cd dr-memoria-anthology
   ```

2. **Install dependencies**:
   ```bash
   cd functions
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the functions directory with the following variables:
   ```
   # Firebase Project Configuration
   FIREBASE_API_KEY=your_api_key_here
   FIREBASE_PROJECT_ID=dr-memoria-anthology
   FIREBASE_STORAGE_BUCKET=dr-memoria-anthology.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   FIREBASE_MEASUREMENT_ID=your_measurement_id

   # External API Keys
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   NFT_STORAGE_KEY=your_nft_storage_key
   ETHEREUM_RPC_URL=your_ethereum_rpc_url

   # System Configuration
   MAX_AI_CONTRIBUTION_PERCENTAGE=0.3
   MIN_HUMAN_CONTRIBUTION_PERCENTAGE=0.7
   LOG_LEVEL=info
   ```

4. **Setup Firebase project**:
   ```bash
   firebase login
   firebase use --add
   ```
   Select your Firebase project when prompted.

## Local Development

### Running Firebase Functions Locally

1. **Start the local emulator**:
   ```bash
   npm run serve
   ```
   This will start Firebase Functions locally on port 5001.

2. **Setting Firebase Functions config**:
   For local development with sensitive keys:
   ```bash
   firebase functions:config:set openai.key="YOUR_OPENAI_KEY" pinecone.key="YOUR_PINECONE_KEY" pinecone.environment="YOUR_PINECONE_ENV" nftstorage.key="YOUR_NFTSTORAGE_KEY" ethereum.rpc_url="YOUR_ETHEREUM_RPC"
   ```

3. **Code Structure**:
   - `index.js` - Main entry point exporting Firebase functions
   - `roark-authorship.js` - Implementation of the Roark 5.0 Authorship model
   - `cig-framework.js` - Implementation of the Code is Gold framework
   - `blockchain-integration.js` - Blockchain verification and NFT generation
   - `utils/` - Utility functions including error handling
   - `config/` - Configuration files

### Development Guidelines

1. **AI Contribution Governance**:
   - Ensure the MAX_AI_CONTRIBUTION_PERCENTAGE is enforced (30%)
   - Validate human creative sovereignty in all content creation flows

2. **Error Handling**:
   - Use the standardized error logging utility for consistent error handling
   - Include proper HTTP status codes in all error responses

3. **Testing**:
   - Write tests for all new functionality
   - Ensure tests validate the ethical guidelines and contribution limits

## Testing

### Running Tests

```bash
npm test
```

This will run the Mocha test suite defined in the `test` directory.

### Test Coverage

To generate test coverage reports:

```bash
npm run coverage
```

This will create a coverage report in the `coverage` directory.

### Key Test Areas

1. **Roark Authorship Model Tests**:
   - Validates human contribution requirements
   - Tests AI contribution tracking
   - Verifies ethical content screening

2. **CIG Framework Tests**:
   - Tests originality scoring
   - Validates certification generation
   - Verifies ethical compliance checks

3. **Blockchain Integration Tests**:
   - Tests NFT generation
   - Validates ownership registration
   - Verifies QR code generation

## Deployment

### Automated Deployment (CI/CD)

The repository includes GitHub Actions workflows for automated deployment:

1. **To deploy to staging**:
   ```bash
   git checkout develop
   git commit -m "Your changes"
   git push origin develop
   ```
   This will trigger the GitHub Actions workflow to deploy to staging.

2. **To deploy to production**:
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```
   This will trigger the GitHub Actions workflow to deploy to production.

### Manual Deployment

To manually deploy Firebase Functions:

1. **Deploy to staging**:
   ```bash
   firebase use staging
   firebase deploy --only functions
   ```

2. **Deploy to production**:
   ```bash
   firebase use production
   firebase deploy --only functions
   ```

### Post-Deployment Verification

After deployment:

1. Check the Firebase Console to verify the functions are deployed
2. Run test queries against the deployed functions
3. Monitor logs for any errors
4. Verify integration with blockchain and LLM providers

## Monitoring and Troubleshooting

### Firebase Logs

To view logs for Firebase Functions:

```bash
firebase functions:log
```

### Error Handling

The system uses a standardized error logging utility that provides:
- Consistent error format
- Proper HTTP status codes
- Detailed error messages
- Integration with Firebase monitoring

### Health Checks

The system includes health check endpoints that verify:
- Database connectivity
- LLM provider availability
- Blockchain network connectivity
- Overall system status

## License and Attribution

Dr. Memoria's Anthology is licensed under [LICENSE TYPE].

All published works maintain the Roark 5.0 Authorship model standards for attributing human and AI contributions with complete transparency.

## Footnote

This system implements the Roark 5.0 Authorship model and CIG (Code is Gold) framework to ensure the highest standards of creative integrity, with human innovation and ingenuity as requirements. AI is part of our process for modern content development, but human participation is guaranteed at all steps of the creative, development, editorial, and final authorization process.

