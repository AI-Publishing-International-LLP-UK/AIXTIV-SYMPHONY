# ASOOS Symphony Opus 1.0.1

![ASOOS Symphony](public/images/logo.svg)

ASOOS (Aixtiv Symphony Orchestrating Operating System) is a modular, agent-driven enterprise solution, and the first architecture built to operate across decentralized systems, with deep integration of AI orchestration, blockchain workflows, learning prediction systems, and real-time agent delegation.

## 🏛️ Architecture Overview

ASOOS Symphony Opus 1.0.1 harmonizes multiple components including:

- **🎓 The Academy** - Learning Environment
- **✈️ The Wing** - Agent Orchestration
- **🛍️ Gift Shop** - E-commerce Engine
- **🧠 Dream Commander** - Learning Path Prediction
- **🤝 RIX CRX & Co-Pilots** - Specially designed pilot-agents
- **🤝 Ground Crew, Tower Block Chain and Queen Mint Mark** - Blockchain infrastructure
- **🧩 Integration Gateway** - Security, Routing, and Token Control

### System Flow: End-to-End

1. **User Authenticates** (via Sallyport + Dr. Grant Authenticator)
2. **Gateway Validates** token, UUID role, subscription tier
3. **User Lands in Academy / Pilots Lounge**
4. **Dream Commander Predicts** optimal learning path
5. **Wing Agents Activated** per learning/product stream
6. **CRX Takes Over** post-chat or post-purchase
7. **All Events Logged to FMS** (Flight Memory System)
8. **Approvals via S2DO Smart Contracts**

### Key Components

- **The Wing** - Agent orchestration system managing deployment, training, and performance tracking
- **Dewey Cards** - Task representation system with performance metrics and blockchain verification
- **S2DO Workflow** - Scan-to-Do system for task management and blockchain integration
- **Integration Gateway** - Security and routing middleware for the entire system
- **Dr. Claude Interface** - Primary agent orchestration interface
- **Deepgram Speech Recognition** - AI-powered speech-to-text transcription with model comparison

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- Firebase CLI (for deployment)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/aixtiv-symphony-opus.git
   cd aixtiv-symphony-opus1.0.1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # For development
   cp deploy/env.staging .env
   
   # For production
   cp deploy/env.production .env
   ```

4. Set up Deepgram API key:
   
   - Create an account at [Deepgram](https://deepgram.com)
   - Generate an API key with "Full Access" permissions
   - Add your Deepgram API key to the `.env` file:
     ```
     REACT_APP_DEEPGRAM_API_KEY=your_deepgram_api_key_here
     ```

5. Start the development server:
   ```bash
   npm start
   ```

## 🖥️ Usage

### Development Mode

Run the application in development mode with hot-reload:

```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Testing

Run the test suite:

```bash
npm test
```

### Building

Build the application for production:

```bash
npm run build
```

## 🚢 Deployment

ASOOS Symphony uses Firebase for hosting and serverless functions deployment.

### Automated Deployment

To deploy to the staging environment:

```bash
cd deploy
./deploy.sh staging
```

To deploy to the production environment:

```bash
cd deploy
./deploy.sh production
```

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase hosting:
   ```bash
   firebase deploy --only hosting:asoos-primary
   ```

3. Deploy Firebase functions:
   ```bash
   firebase deploy --only functions
   ```

## 📁 Project Structure

```
aixtiv-symphony-opus1.0.1/
├── build/                  # Compiled files for deployment
├── deploy/                 # Deployment scripts and configurations
│   ├── env.production      # Production environment variables
│   ├── env.staging         # Staging environment variables
│   └── deploy.sh           # Deployment automation script
├── public/                 # Static assets
│   ├── images/             # Image assets
│   ├── manifest.json       # Web app manifest
│   └── index.html          # HTML template
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── AgentManager.jsx    # Agent management UI
│   │   ├── AgentManager.jsx        # Agent management UI
│   │   ├── ClaudeInterface.jsx     # Dr. Claude interface
│   │   ├── DeweyCard.jsx           # Task card component
│   │   └── DeepgramTranscriber.jsx # Speech recognition UI
│   ├── contexts/           # React contexts for state management
│   ├── services/           # Service integrations (Firebase, API, etc.)
│   │   └── deepgramService.js  # Deepgram API integration service
│   │   └── main.css        # Main stylesheet
│   ├── App.jsx             # Main application component
│   └── index.js            # Application entry point
├── .firebaserc             # Firebase project configuration
├── firebase.json           # Firebase service configuration
├── package.json            # npm package configuration
└── README.md               # Project documentation
```

## 📜 Available Scripts

- `npm start` - Starts the development server
- `npm test` - Runs the test suite
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from react-scripts
- `npm run deploy` - Builds and deploys to Firebase hosting
- `npm run deploy:functions` - Deploys only Firebase functions
- `npm run deploy:all` - Deploys all Firebase services
- `npm run lint` - Lints the codebase
- `npm run lint:fix` - Automatically fixes linting issues
- `npm run format` - Formats code with Prettier
- `npm run analyze` - Analyzes the bundle size

## 🛠️ Technologies Used

- **Frontend**:
  - React 18
  - Modern JavaScript (ES6+)
  - CSS3 with custom properties

- **Backend**:
- **Backend**:
  - Firebase Functions
  - Firebase Firestore
  - Firebase Authentication
  - Firebase Storage
  - Deepgram API (Speech Recognition)

- **Deployment**:
  - GitHub Actions CI/CD

- **Core Technologies**:
  - AI Agent Orchestration
  - Blockchain Integration
  - Blockchain Integration
  - Vector Database Search
  - Real-time Collaboration
  - Speech Recognition & Transcription

## 🎤 Speech Recognition Features

The Deepgram integration provides the following capabilities:

- **Audio Recording** - Record audio directly from the browser's microphone
- **Audio File Upload** - Upload audio files in various formats (WAV, MP3, OGG, WEBM, FLAC)
- **Model Selection** - Choose between Nova-3 (faster) and Whisper (higher accuracy) models
- **Model Comparison** - Compare transcription results from different models
- **Transcription Options** - Configure language, smart formatting, punctuation, and diarization
- **Result Analysis** - View confidence scores, processing times, and transcription differences

For testing and development, you can store audio files in the `public/test-assets/` directory.

## 🤝 Contributing
We welcome contributions to ASOOS Symphony! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure your code follows our coding standards and includes appropriate tests.

### Coding Standards

- Follow the existing code style and organization
- Write meaningful commit messages
- Document new features or changes
- Write tests for new functionality
- Ensure all tests pass before submitting a pull request

## 📄 License

ASOOS Symphony is proprietary software. All rights reserved.

## 📞 Contact

For questions about ASOOS Symphony, please contact:

- **Project Maintainer**: [maintainer@asoos-2100.com](mailto:maintainer@asoos-2100.com)
- **Support**: [support@asoos-2100.com](mailto:support@asoos-2100.com)

---

&copy; 2025 ASOOS Symphony. All rights reserved.

