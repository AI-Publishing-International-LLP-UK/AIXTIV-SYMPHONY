/**
 * Connect all subdomains to asoos.2100.cool
 */
const fs = require('fs');
const { exec } = require('child_process');

// Connect subdomains
function connectSubdomains() {
  console.log('Connecting subdomains to asoos.2100.cool...');
  
  // Add ASOOS main domain
  exec('node /Users/as/asoos/2100-cool-subdomain-manager.js --add main', (error, stdout, stderr) => {
    if (error) {
      console.error('Error connecting main domain:', stderr);
      return;
    }
    console.log('Main domain connected:', stdout);
    
    // Add Symphony subdomain
    exec('node /Users/as/asoos/2100-cool-subdomain-manager.js --add symphony', (error, stdout, stderr) => {
      if (error) {
        console.error('Error connecting symphony subdomain:', stderr);
        return;
      }
      console.log('Symphony subdomain connected:', stdout);
      
      // Add Anthology subdomain
      exec('node /Users/as/asoos/2100-cool-subdomain-manager.js --add anthology', (error, stdout, stderr) => {
        if (error) {
          console.error('Error connecting anthology subdomain:', stderr);
          return;
        }
        console.log('Anthology subdomain connected:', stdout);
        
        console.log('All domains connected successfully!');
        console.log('Your sites are now available at:');
        console.log('- https://asoos.2100.cool');
        console.log('- https://symphony.asoos.2100.cool');
        console.log('- https://anthology.asoos.2100.cool');
      });
    });
  });
}

connectSubdomains();
