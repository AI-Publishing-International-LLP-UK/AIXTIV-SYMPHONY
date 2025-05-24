const PublishingAutomationManager = require('./multi_claude_manager');

// Create manager instance with placeholder key
const manager = new PublishingAutomationManager({
  anthropicKey: 'your-api-key-here',
});

// Test function with error handling
async function testCodeGeneration() {
  try {
    console.log('Testing code generation service...');

    const result = await manager.services.codeGeneration.generateCode({
      name: 'hello-world',
      specification: 'Create a basic Hello World API',
    });

    console.log('Test successful!');
    console.log('Generated result:', result);
  } catch (error) {
    console.error('Error during test:', error.message);
    process.exit(1);
  }
}

// Run the test
testCodeGeneration();
