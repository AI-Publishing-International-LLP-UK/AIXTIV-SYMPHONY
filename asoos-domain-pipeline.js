/**
 * ASOOS Domain Integration Pipeline
 * 
 * This script integrates with your existing data pipelines to:
 * 1. Update GoDaddy DNS
 * 2. Configure Firebase hosting
 * 3. Deploy the website
 * 4. Verify domain connection
 * 
 * Can be called from your CI/CD system or data pipe automation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectId: 'api-for-warp-drive',
  domain: '2100.cool',
  subdomain: 'asoos',
  hostingTarget: 'asoos-2100-cool',
  siteName: 'asoos-2100-cool',
  publicDir: path.join(__dirname, 'public/asoos-2100-cool'),
  firebaseConfigFile: path.join(__dirname, '2100-cool-firebase.json'),
  siteMappingsFile: path.join(__dirname, 'domain-management/config/site-mappings.json'),
  firebaseProjectsFile: path.join(__dirname, 'domain-management/config/firebase-projects.json')
};

// Helper for executing shell commands
const execCommand = (command, options = {}) => {
  try {
    console.log(`Executing: ${command}`);
    return execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options
    });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    if (options.ignoreError) {
      return null;
    }
    throw error;
  }
};

// Check if site exists in Firebase
const checkFirebaseSite = () => {
  try {
    console.log(`Checking if ${CONFIG.siteName} exists in Firebase...`);
    const result = execCommand(`firebase hosting:sites:list --project=${CONFIG.projectId}`, { 
      silent: true 
    });
    
    return result.includes(CONFIG.siteName);
  } catch (error) {
    console.error('Error checking Firebase site:', error.message);
    return false;
  }
};

// Create Firebase site
const createFirebaseSite = () => {
  try {
    console.log(`Creating Firebase site ${CONFIG.siteName}...`);
    execCommand(`firebase hosting:sites:create ${CONFIG.siteName} --project=${CONFIG.projectId}`);
    return true;
  } catch (error) {
    console.error('Error creating Firebase site:', error.message);
    return false;
  }
};

// Apply hosting target
const applyFirebaseTarget = () => {
  try {
    console.log(`Applying Firebase target ${CONFIG.hostingTarget} to ${CONFIG.siteName}...`);
    execCommand(`firebase target:apply hosting ${CONFIG.hostingTarget} ${CONFIG.siteName} --project=${CONFIG.projectId}`);
    return true;
  } catch (error) {
    console.error('Error applying Firebase target:', error.message);
    return false;
  }
};

// Update GoDaddy DNS
const updateGodaddyDns = () => {
  try {
    console.log('Updating GoDaddy DNS...');
    execCommand('node godaddy-dns-update.js');
    return true;
  } catch (error) {
    console.error('Error updating GoDaddy DNS:', error.message);
    return false;
  }
};

// Deploy website
const deployWebsite = () => {
  try {
    // Check if public directory exists
    if (!fs.existsSync(CONFIG.publicDir)) {
      console.error(`Public directory ${CONFIG.publicDir} not found. Aborting deployment.`);
      return false;
    }
    
    console.log(`Deploying website to ${CONFIG.subdomain}.${CONFIG.domain}...`);
    execCommand(`firebase deploy --only hosting:${CONFIG.hostingTarget} --config ${CONFIG.firebaseConfigFile} --project=${CONFIG.projectId}`);
    return true;
  } catch (error) {
    console.error('Error deploying website:', error.message);
    return false;
  }
};

// Update site mappings
const updateSiteMappings = () => {
  try {
    console.log('Verifying site mappings configuration...');
    
    if (!fs.existsSync(CONFIG.siteMappingsFile)) {
      console.error(`Site mappings file not found at ${CONFIG.siteMappingsFile}`);
      return false;
    }
    
    const siteMappings = JSON.parse(fs.readFileSync(CONFIG.siteMappingsFile, 'utf8'));
    const fullDomain = `${CONFIG.subdomain}.${CONFIG.domain}`;
    
    // Check if the domain mapping already exists
    if (!siteMappings.domainMappings[fullDomain]) {
      console.log(`Adding ${fullDomain} to site mappings...`);
      
      siteMappings.domainMappings[fullDomain] = {
        primarySite: CONFIG.siteName,
        alternateSites: []
      };
      
      // Add to platforms group if not already there
      if (!siteMappings.siteGroups.platforms.includes(CONFIG.siteName)) {
        siteMappings.siteGroups.platforms.push(CONFIG.siteName);
      }
      
      fs.writeFileSync(CONFIG.siteMappingsFile, JSON.stringify(siteMappings, null, 2));
      console.log('Site mappings updated successfully');
    } else {
      console.log('Site mapping already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating site mappings:', error.message);
    return false;
  }
};

// Update Firebase projects
const updateFirebaseProjects = () => {
  try {
    console.log('Verifying Firebase projects configuration...');
    
    if (!fs.existsSync(CONFIG.firebaseProjectsFile)) {
      console.error(`Firebase projects file not found at ${CONFIG.firebaseProjectsFile}`);
      return false;
    }
    
    const firebaseProjects = JSON.parse(fs.readFileSync(CONFIG.firebaseProjectsFile, 'utf8'));
    
    // Check if the site already exists in the web project
    if (!firebaseProjects.projects.web.sites[CONFIG.siteName]) {
      console.log(`Adding ${CONFIG.siteName} to Firebase projects...`);
      
      firebaseProjects.projects.web.sites[CONFIG.siteName] = "ASOOS Platform Interface";
      
      fs.writeFileSync(CONFIG.firebaseProjectsFile, JSON.stringify(firebaseProjects, null, 2));
      console.log('Firebase projects updated successfully');
    } else {
      console.log('Firebase project site already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating Firebase projects:', error.message);
    return false;
  }
};

// Main pipeline function
const runPipeline = async () => {
  console.log(`=== ASOOS.2100.COOL Domain Integration Pipeline ===`);
  
  // Set Firebase project
  execCommand(`firebase use ${CONFIG.projectId}`);
  
  // Check and create Firebase site if necessary
  const siteExists = checkFirebaseSite();
  if (!siteExists) {
    if (!createFirebaseSite()) {
      console.error('Pipeline failed: Could not create Firebase site');
      process.exit(1);
    }
  }
  
  // Apply Firebase target
  if (!applyFirebaseTarget()) {
    console.error('Pipeline failed: Could not apply Firebase target');
    process.exit(1);
  }
  
  // Update configuration files
  if (!updateSiteMappings() || !updateFirebaseProjects()) {
    console.error('Pipeline failed: Could not update configuration files');
    process.exit(1);
  }
  
  // Update DNS
  if (!updateGodaddyDns()) {
    console.error('Pipeline failed: Could not update GoDaddy DNS');
    process.exit(1);
  }
  
  // Deploy website
  if (!deployWebsite()) {
    console.error('Pipeline failed: Could not deploy website');
    process.exit(1);
  }
  
  console.log(`=== Pipeline completed successfully ===`);
  console.log(`Website URL: https://${CONFIG.subdomain}.${CONFIG.domain}`);
  console.log('Please allow up to 24 hours for DNS propagation and SSL certificate provisioning.');
};

// Run the pipeline
runPipeline().catch(error => {
  console.error('Pipeline execution error:', error);
  process.exit(1);
});