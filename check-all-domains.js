/**
 * Check All Domains Status
 * 
 * This script checks the status of all domains in the ASOOS ecosystem,
 * including DNS configuration, SSL certificates, and HTTP status.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const CONFIG = {
  verificationLogPath: path.join(__dirname, 'verification-results.json'),
  outputPath: path.join(__dirname, 'domains', 'status-report.md'),
  
  // Add your domains to check here
  domains: [
    "asoos.2100.cool",
    "2100.cool",
    "coaching2100.com",
    "www.coaching2100.com",
    "2100.vision",
    "www.2100.vision"
    // Add more domains as needed
  ]
};

// Ensure output directory exists
const ensureOutputDir = () => {
  const dir = path.dirname(CONFIG.outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Check DNS A record
const checkDns = async (domain) => {
  try {
    const { stdout } = await execPromise(`dig ${domain} A +short`);
    const ips = stdout.trim().split('\n').filter(Boolean);
    
    if (ips.length === 0) {
      return { status: 'error', message: 'No A record found' };
    }
    
    // Check if any of the IPs are Firebase hosting IPs
    const firebaseIps = ['199.36.158.100', '151.101.1.195', '151.101.65.195'];
    const isFirebase = ips.some(ip => firebaseIps.includes(ip));
    
    return { 
      status: isFirebase ? 'ok' : 'warning', 
      message: isFirebase ? 'Points to Firebase' : 'Not pointing to Firebase',
      ips
    };
  } catch (error) {
    return { status: 'error', message: `DNS check failed: ${error.message}` };
  }
};

// Check HTTPS status
const checkHttps = async (domain) => {
  try {
    const { stdout, stderr } = await execPromise(`curl -s -o /dev/null -w "%{http_code}" https://${domain}`);
    const statusCode = stdout.trim();
    
    if (statusCode.startsWith('2')) {
      return { status: 'ok', message: `HTTP ${statusCode} (OK)` };
    } else if (statusCode === '404') {
      return { status: 'warning', message: `HTTP ${statusCode} (Not Found) - Site connected but no content` };
    } else if (statusCode.startsWith('3')) {
      return { status: 'info', message: `HTTP ${statusCode} (Redirect)` };
    } else {
      return { status: 'error', message: `HTTP ${statusCode}` };
    }
  } catch (error) {
    return { status: 'error', message: `HTTPS check failed: ${error.message}` };
  }
};

// Check SSL certificate
const checkSsl = async (domain) => {
  try {
    // Get SSL certificate expiration date
    const { stdout } = await execPromise(
      `openssl s_client -connect ${domain}:443 -servername ${domain} < /dev/null 2>/dev/null | openssl x509 -noout -dates`
    );
    
    // Parse notBefore and notAfter dates
    const notBefore = stdout.match(/notBefore=(.+)/)?.[1];
    const notAfter = stdout.match(/notAfter=(.+)/)?.[1];
    
    if (!notAfter) {
      return { status: 'error', message: 'No SSL certificate found' };
    }
    
    // Parse expiry date
    const expiryDate = new Date(notAfter);
    const now = new Date();
    const daysLeft = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { status: 'error', message: `SSL certificate expired ${-daysLeft} days ago` };
    } else if (daysLeft < 30) {
      return { status: 'warning', message: `SSL expires in ${daysLeft} days` };
    } else {
      return { status: 'ok', message: `SSL valid for ${daysLeft} days` };
    }
  } catch (error) {
    return { status: 'error', message: `SSL check failed: ${error.message}` };
  }
};

// Check if domain is verified
const checkVerification = (domain, verificationResults) => {
  if (!verificationResults[domain]) {
    return { status: 'unknown', message: 'No verification record found' };
  }
  
  return {
    status: verificationResults[domain].status,
    message: `Verified: ${verificationResults[domain].addedAt}`
  };
};

// Main function
const main = async () => {
  console.log('=== Checking All Domains Status ===');
  ensureOutputDir();
  
  // Load verification results
  let verificationResults = {};
  try {
    if (fs.existsSync(CONFIG.verificationLogPath)) {
      verificationResults = JSON.parse(fs.readFileSync(CONFIG.verificationLogPath, 'utf8'));
    }
  } catch (error) {
    console.error(`Error loading verification results: ${error.message}`);
  }
  
  // Prepare report
  let report = `# ASOOS Domain Status Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  report += `| Domain | DNS | SSL | HTTPS | Verification |\n`;
  report += `|--------|-----|-----|-------|-------------|\n`;
  
  // Check each domain
  for (const domain of CONFIG.domains) {
    console.log(`Checking ${domain}...`);
    
    // Gather results
    const dnsResult = await checkDns(domain);
    let sslResult = { status: 'unknown', message: 'Not checked' };
    let httpsResult = { status: 'unknown', message: 'Not checked' };
    
    // Only check SSL and HTTPS if DNS is resolved
    if (dnsResult.status !== 'error') {
      sslResult = await checkSsl(domain);
      httpsResult = await checkHttps(domain);
    }
    
    const verificationResult = checkVerification(domain, verificationResults);
    
    // Add to report
    report += `| ${domain} | `;
    report += `${getStatusEmoji(dnsResult.status)} ${dnsResult.message} | `;
    report += `${getStatusEmoji(sslResult.status)} ${sslResult.message} | `;
    report += `${getStatusEmoji(httpsResult.status)} ${httpsResult.message} | `;
    report += `${getStatusEmoji(verificationResult.status)} ${verificationResult.message} |\n`;
    
    // Log to console
    console.log(`  DNS: ${dnsResult.status.toUpperCase()} - ${dnsResult.message}`);
    console.log(`  SSL: ${sslResult.status.toUpperCase()} - ${sslResult.message}`);
    console.log(`  HTTPS: ${httpsResult.status.toUpperCase()} - ${httpsResult.message}`);
    console.log(`  Verification: ${verificationResult.status.toUpperCase()} - ${verificationResult.message}`);
    console.log();
  }
  
  // Add conclusion to report
  report += `\n## Summary\n\n`;
  report += `This report provides a snapshot of the current status of all domains in the ASOOS ecosystem. `;
  report += `For domains showing errors or warnings, please refer to the [Domain Configuration Guide](/Users/as/asoos/DOMAIN-CONFIGURATION-GUIDE.md) `;
  report += `for troubleshooting steps.\n\n`;
  report += `To fix verification issues, use:\n\`\`\`\nnode add-domain-verification.js yourdomain.com VERIFICATION_CODE\n\`\`\`\n\n`;
  report += `To configure all domains automatically, use:\n\`\`\`\nnode configure-all-domains.js\n\`\`\`\n`;
  
  // Save report
  fs.writeFileSync(CONFIG.outputPath, report);
  console.log(`Report saved to: ${CONFIG.outputPath}`);
};

// Helper function to get status emoji
const getStatusEmoji = (status) => {
  switch (status) {
    case 'ok':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'info':
      return 'ℹ️';
    case 'pending':
      return '⏳';
    default:
      return '❓';
  }
};

// Run the script
main().catch(error => {
  console.error('Error running domain check:', error);
  process.exit(1);
});