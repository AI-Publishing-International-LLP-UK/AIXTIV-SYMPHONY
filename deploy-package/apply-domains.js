#!/usr/bin/env node

/**
 * Apply domain connections to asoos.2100.cool
 */
const { execSync } = require('child_process');

// Connect subdomains with apply flag
function applyDomainConnections() {
  try {
    console.log('Applying domain connections for asoos.2100.cool...');
    
    // Add Symphony domain with specific site
    console.log('\nConnecting symphony subdomain...');
    const symphonyCommand = 'node /Users/as/asoos/2100-cool-subdomain-manager.js --add symphony --site symphony-asoos-20250511141914 --apply';
    console.log('Running:', symphonyCommand);
    const symphonyOutput = execSync(symphonyCommand).toString();
    console.log(symphonyOutput);
    
    // Add Anthology domain with specific site
    console.log('\nConnecting anthology subdomain...');
    const anthologyCommand = 'node /Users/as/asoos/2100-cool-subdomain-manager.js --add anthology --site anthology-asoos-20250511141914 --apply';
    console.log('Running:', anthologyCommand);
    const anthologyOutput = execSync(anthologyCommand).toString();
    console.log(anthologyOutput);
    
    console.log('\nAll domain connections applied successfully!');
    console.log('Your sites will be available at:');
    console.log('- https://asoos.2100.cool (already connected)');
    console.log('- https://symphony.asoos.2100.cool');
    console.log('- https://anthology.asoos.2100.cool');
    console.log('\nNote: DNS propagation may take up to 24-48 hours.');
  } catch (error) {
    console.error('Error applying domain connections:', error.message);
  }
}

applyDomainConnections();