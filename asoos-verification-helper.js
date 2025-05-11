/**
 * Helper script to add verification TXT record for asoos.2100.cool
 * Run this with the verification code from Firebase
 * Example: node asoos-verification-helper.js firebase-verification-code-123456
 */
const { execSync } = require('child_process');

const verificationCode = process.argv[2];
if (!verificationCode) {
  console.error('Please provide the verification code from Firebase');
  console.error('Usage: node asoos-verification-helper.js [verification-code]');
  process.exit(1);
}

try {
  console.log(`Adding TXT verification record: ${verificationCode}`);
  const command = `node update-asoos-dns.js "${verificationCode}"`;
  const output = execSync(command, { encoding: 'utf-8' });
  console.log(output);
  console.log('Verification TXT record added successfully');
} catch (error) {
  console.error('Error adding verification record:', error.message);
}
