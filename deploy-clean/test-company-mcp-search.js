/**
 * Test Company MCP Search Functionality
 * Simulates the JavaScript logic from the authentication page
 */

// Copy of the company MCP configuration from asoos.2100.cool/auth
const companyMcps = {
  'nestle': 'https://mcp.nestle.2100.cool/',
  'microsoft': 'https://mcp.microsoft.2100.cool/',
  'google': 'https://mcp.google.2100.cool/',
  'deloitte': 'https://mcp.deloitte.2100.cool/',
  'ey': 'https://mcp.ey.2100.cool/',
  'ernst & young': 'https://mcp.ey.2100.cool/',
  'ai publishing': 'https://mcp.aipub.2100.cool/',
  'ai publishing international llp': 'https://mcp.aipub.2100.cool/',
  'aipub': 'https://mcp.aipub.2100.cool/'
};

function testCompanySearch(companyName) {
  console.log(`🔍 Testing search for: "${companyName}"`);
  
  const companyLower = companyName.toLowerCase();
  const mcpUrl = companyMcps[companyLower];
  
  if (mcpUrl) {
    console.log(`✅ Found ${companyName} MCP server!`);
    console.log(`📍 URL: ${mcpUrl}`);
    console.log(`🔗 Would redirect to: ${mcpUrl}`);
    
    // Simulate the authentication URL that would be generated
    const authUrl = `https://oauth2-auth-only.pr-aef.workers.dev/auth/oauth2/authorize?provider=company&company=${encodeURIComponent(companyName)}&client_id=company&redirect_uri=${encodeURIComponent(mcpUrl)}&scope=profile&state=join-company`;
    console.log(`🔐 Auth URL: ${authUrl}`);
    
    return {
      found: true,
      company: companyName,
      mcpUrl: mcpUrl,
      authUrl: authUrl
    };
  } else {
    console.log(`❌ No MCP server found for "${companyName}"`);
    return {
      found: false,
      company: companyName,
      mcpUrl: null,
      authUrl: null
    };
  }
}

// Test various search terms for AI Publishing International LLP
console.log('🧪 Testing Company MCP Search Functionality\n');

const testCases = [
  'AI Publishing International LLP',
  'ai publishing international llp',
  'AI Publishing',
  'ai publishing', 
  'AIPub',
  'aipub',
  'AI Pub',
  'ai pub'
];

testCases.forEach(testCase => {
  console.log('═'.repeat(60));
  const result = testCompanySearch(testCase);
  console.log(`Result: ${result.found ? '✅ SUCCESS' : '❌ NOT FOUND'}`);
  console.log('');
});

console.log('═'.repeat(60));
console.log('🎯 SUMMARY:');
console.log('✅ "AI Publishing International LLP" (exact) - FOUND');
console.log('✅ "ai publishing international llp" (lowercase) - FOUND');
console.log('✅ "AI Publishing" (short form) - FOUND');
console.log('✅ "aipub" (abbreviation) - FOUND');
console.log('❌ "AI Pub" (with space) - NOT FOUND (not configured)');
console.log('');
console.log('💡 Users can find AI Publishing International LLP using:');
console.log('   - "AI Publishing International LLP" (full name)');
console.log('   - "AI Publishing" (short form)'); 
console.log('   - "aipub" (abbreviation)');
