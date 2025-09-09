#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find package.json files containing opus1_amplify
function findOpusPackageFiles(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    try {
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .git directories for performance
        if (file !== 'node_modules' && file !== '.git') {
          findOpusPackageFiles(filePath, results);
        }
      } else if (file === 'package.json' && filePath.includes('opus1_amplify')) {
        results.push(filePath);
      }
    } catch (err) {
      console.warn(`Warning: Could not access ${filePath}: ${err.message}`);
    }
  }
  
  return results;
}

function fixPackageJson(filePath) {
  console.log(`\n🔧 Fixing: ${filePath}`);
  
  try {
    // Check if file exists and get its size
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`   File size: ${stats.size} bytes`);
    console.log(`   Current content: "${content}"`);
    
    // Create a proper package.json
    const properPackageJson = {
      'name': 'opus1-amplify-core',
      'version': '1.0.0',
      'description': 'Opus1 Amplify Core package',
      'engines': {
        'node': '>=24.0.0'
      },
      'private': true
    };
    
    // Write the fixed content
    fs.writeFileSync(filePath, JSON.stringify(properPackageJson, null, 2) + '\n', 'utf8');
    console.log('   ✅ Fixed successfully');
    
    return true;
  } catch (err) {
    console.error(`   ❌ Error fixing ${filePath}: ${err.message}`);
    return false;
  }
}

// Main execution
console.log('🚀 Starting Opus1 package.json fix...\n');

try {
  const baseDir = process.cwd();
  console.log(`Searching in: ${baseDir}`);
  
  const packageFiles = findOpusPackageFiles(baseDir);
  
  if (packageFiles.length === 0) {
    console.log('No opus1_amplify package.json files found.');
    process.exit(0);
  }
  
  console.log(`Found ${packageFiles.length} opus1_amplify package.json files:`);
  packageFiles.forEach(file => console.log(`  - ${file}`));
  
  let fixedCount = 0;
  for (const file of packageFiles) {
    if (fixPackageJson(file)) {
      fixedCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Total files found: ${packageFiles.length}`);
  console.log(`   Successfully fixed: ${fixedCount}`);
  console.log(`   Failed to fix: ${packageFiles.length - fixedCount}`);
  
} catch (err) {
  console.error('❌ Error during execution:', err.message);
  process.exit(1);
}
