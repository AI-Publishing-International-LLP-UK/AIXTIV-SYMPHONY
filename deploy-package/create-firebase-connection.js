#!/usr/bin/env node

/**
 * Connect Firebase Hosting sites to Symphony and Anthology
 */
const { execSync } = require('child_process');
const fs = require('fs');

// Connect Firebase hosting sites to domains
function connectFirebaseSites() {
  try {
    console.log('Connecting Firebase sites to subdomains...');
    
    // Get site IDs from .firebaserc
    const firebaseRcContent = fs.readFileSync('./.firebaserc', 'utf8');
    const firebaseRc = JSON.parse(firebaseRcContent);
    const targets = firebaseRc.targets['api-for-warp-drive'].hosting;
    const symphonySite = targets.symphony[0];
    const anthologySite = targets.anthology[0];
    
    console.log(`Symphony site ID: ${symphonySite}`);
    console.log(`Anthology site ID: ${anthologySite}`);
    
    // Connect Symphony site to symphony.asoos.2100.cool
    console.log('\nConnecting Symphony site to symphony.asoos.2100.cool...');
    const symphonyCommand = `firebase hosting:sites:update ${symphonySite} --site-config '{"appId":"api-for-warp-drive","domains":["symphony.asoos.2100.cool"]}'`;
    console.log(`Running: ${symphonyCommand}`);
    const symphonyOutput = execSync(symphonyCommand).toString();
    console.log(symphonyOutput);
    
    // Connect Anthology site to anthology.asoos.2100.cool
    console.log('\nConnecting Anthology site to anthology.asoos.2100.cool...');
    const anthologyCommand = `firebase hosting:sites:update ${anthologySite} --site-config '{"appId":"api-for-warp-drive","domains":["anthology.asoos.2100.cool"]}'`;
    console.log(`Running: ${anthologyCommand}`);
    const anthologyOutput = execSync(anthologyCommand).toString();
    console.log(anthologyOutput);
    
    console.log('\nFirebase site connections complete!');
    console.log('Note: SSL provisioning may take several hours to complete.');
    console.log('Sites will be available at:');
    console.log('- https://asoos.2100.cool (main site, already connected)');
    console.log('- https://symphony.asoos.2100.cool');
    console.log('- https://anthology.asoos.2100.cool');
  } catch (error) {
    console.error('Error connecting Firebase sites:', error.message);
    if (error.stdout) console.log('stdout:', error.stdout.toString());
    if (error.stderr) console.log('stderr:', error.stderr.toString());
  }
}

connectFirebaseSites();