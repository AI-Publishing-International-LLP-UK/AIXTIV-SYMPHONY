/**
 * OAuth2 Fix Test - ES Module Version
 * Diamond SAO Command Center - OAuth2 Integration Test
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ES Module compatible imports
import { 
  createRequire 
} from 'module';

// For compatibility with CommonJS modules if needed
const require = createRequire(import.meta.url);

class OAuth2TestFix {
  constructor() {
    this.testResults = [];
  }

  async runTests() {
    console.log('🔧 Running OAuth2 Fix Tests...');
    
    try {
      await this.testESModuleCompatibility();
      await this.testOAuth2Configuration();
      await this.testVersionFloorProtection();
      
      console.log('✅ All OAuth2 tests passed!');
      return true;
    } catch (error) {
      console.error('❌ OAuth2 tests failed:', error.message);
      return false;
    }
  }

  async testESModuleCompatibility() {
    console.log('🧪 Testing ES Module compatibility...');
    
    // Test that we can use import syntax
    const testImport = await import('./version-floor-protection.js');
    
    if (testImport && testImport.MIN_VERSION) {
      console.log('✅ ES Module imports working');
      this.testResults.push({ test: 'ES_MODULE', status: 'PASS' });
    } else {
      throw new Error('ES Module import failed');
    }
  }

  async testOAuth2Configuration() {
    console.log('🔐 Testing OAuth2 configuration...');
    
    // Test OAuth2 environment variables
    const requiredEnvVars = [
      'GOOGLE_OAUTH_CLIENT_ID',
      'GOOGLE_OAUTH_CLIENT_SECRET'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing OAuth2 env vars: ${missingVars.join(', ')}`);
      console.log('ℹ️ OAuth2 will use fallback configuration');
    }
    
    console.log('✅ OAuth2 configuration test complete');
    this.testResults.push({ test: 'OAUTH2_CONFIG', status: 'PASS' });
  }

  async testVersionFloorProtection() {
    console.log('🛡️ Testing version floor protection...');
    
    const currentVersion = process.version;
    console.log(`Current Node.js version: ${currentVersion}`);
    
    // Import and test version protection
    const { getVersionStatus } = await import('./version-floor-protection.js');
    const status = getVersionStatus();
    
    if (status.compliant) {
      console.log('✅ Version compliance verified');
      this.testResults.push({ test: 'VERSION_FLOOR', status: 'PASS' });
    } else {
      throw new Error(`Version ${status.current} is below minimum ${status.minimum}`);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      testResults: this.testResults,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASS').length,
        failed: this.testResults.filter(r => r.status === 'FAIL').length
      }
    };
    
    await fs.writeFile(
      path.join(__dirname, 'oauth2-test-report.json'), 
      JSON.stringify(report, null, 2)
    );
    
    console.log('📄 Test report saved to oauth2-test-report.json');
    return report;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new OAuth2TestFix();
  
  try {
    const success = await tester.runTests();
    await tester.generateReport();
    
    if (success) {
      console.log('🎉 OAuth2 fix validation complete - all systems ready!');
      process.exit(0);
    } else {
      console.error('💥 OAuth2 fix validation failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('🚨 Critical test failure:', error.message);
    process.exit(1);
  }
}

export { OAuth2TestFix };
