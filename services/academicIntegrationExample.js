/**
 * Academic Gateway Integration Example
 * Demonstrates how to use AcademicGateway with AcademicService
 */

const { AcademicGateway } = require('./services/gateway');
const AcademicService = require('./AcademicService');
const winston = require('winston');

// Set up logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Example SallyPort verifier implementation (mock)
class SallyPortVerifier {
  async verify(token) {
    // Simulate token verification
    if (token === 'invalid_token') {
      return {
        isValid: false,
        reason: 'Token expired'
      };
    }
    
    return {
      isValid: true,
      authLevel: 4.0,
      userId: 'user123',
      expires: new Date(Date.now() + 3600000).toISOString()
    };
  }
}

// Initialize the Academic Service
const academicService = new AcademicService({
  logger,
  // Add some sample resources for demonstration
  resources: [
    {
      id: 'res1',
      title: 'Introduction to Quantum Computing',
      accessLevel: 'read',
      createdAt: '2023-01-15T12:00:00Z'
    },
    {
      id: 'res2',
      title: 'Advanced Machine Learning Techniques',
      accessLevel: 'write',
      createdAt: '2023-02-20T10:30:00Z'
    },
    {
      id: 'res3',
      title: 'Administrative Resources',
      accessLevel: 'admin',
      createdAt: '2023-03-10T09:15:00Z'
    }
  ]
});

// Initialize the Academic Gateway
const academicGateway = new AcademicGateway({
  logger,
  sallyPortVerifier: new SallyPortVerifier(),
  academicService
});

// Example usage functions
async function demonstrateSuccessfulAuthentication() {
  console.log('\n--- Demonstrating Successful Authentication ---');
  
  const context = {
    requestId: 'req123',
    userId: 'user123',
    sallyPortToken: 'valid_token',
    academicCredentials: {
      institution: 'Harvard University',
      email: 'professor@harvard.edu',
      role: 'Faculty',
      id: 'user123'
    }
  };
  
  const result = await academicGateway.authenticate(context);
  console.log('Authentication Result:', JSON.stringify(result, null, 2));
  
  // If successful, context will now contain academicVerification data
  if (result.success) {
    console.log('Academic Verification:', JSON.stringify(context.academicVerification, null, 2));
  }
}

async function demonstrateResourceRetrieval() {
  console.log('\n--- Demonstrating Resource Retrieval ---');
  
  const context = {
    requestId: 'req456',
    userId: 'user123',
    sallyPortToken: 'valid_token',
    academicCredentials: {
      institution: 'Stanford University',
      email: 'professor@stanford.edu',
      role: 'Faculty',
      id: 'user123'
    }
  };
  
  // First authenticate the user
  await academicGateway.authenticate(context);
  
  // Now retrieve resources
  const resourceOptions = {
    limit: 10,
    offset: 0,
    filters: { },
    sort: { field: 'createdAt', order: 'desc' }
  };
  
  const result = await academicGateway.getAcademicResources(context, resourceOptions);
  console.log('Resource Retrieval Result:', JSON.stringify(result, null, 2));
}

async function demonstrateContributionSubmission() {
  console.log('\n--- Demonstrating Contribution Submission ---');
  
  const context = {
    requestId: 'req789',
    userId: 'user123',
    sallyPortToken: 'valid_token',
    academicCredentials: {
      institution: 'MIT',
      email: 'researcher@mit.edu',
      role: 'Researcher',
      id: 'user123'
    }
  };
  
  // First authenticate the user
  await academicGateway.authenticate(context);
  
  // Now submit a contribution
  const contribution = {
    title: 'Breakthroughs in Neural Networks',
    content: 'This paper discusses recent advancements in neural network architectures...',
    category: 'Machine Learning',
    tags: ['neural networks', 'deep learning', 'research']
  };
  
  const result = await academicGateway.submitAcademicContribution(context, contribution);
  console.log('Contribution Submission Result:', JSON.stringify(result, null, 2));
}

async function demonstrateFailedAuthentication() {
  console.log('\n--- Demonstrating Failed Authentication ---');
  
  const context = {
    requestId: 'req999',
    userId: 'user456',
    sallyPortToken: 'invalid_token',
    academicCredentials: {
      institution: 'Unknown University',
      email: 'user@unknown.com',
      role: 'Student',
      id: 'user456'
    }
  };
  
  const result = await academicGateway.authenticate(context);
  console.log('Failed Authentication Result:', JSON.stringify(result, null, 2));
}

// Run all demonstration functions
async function runDemonstrations() {
  try {
    await demonstrateSuccessfulAuthentication();
    await demonstrateResourceRetrieval();
    await demonstrateContributionSubmission();
    await demonstrateFailedAuthentication();
  } catch (error) {
    console.error('Error running demonstrations:', error);
  }
}

// Execute the demonstrations
runDemonstrations().then(() => {
  console.log('\nDemonstrations completed');
});

// Export for potential use in other modules
module.exports = {
  academicService,
  academicGateway
};
