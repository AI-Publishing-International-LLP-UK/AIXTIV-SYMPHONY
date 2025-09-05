#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to recursively find package.json files
function findPackageJsonFiles(dir, results = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, .git, and other system directories for performance
          if (!['node_modules', '.git', '.DS_Store', '__pycache__'].includes(file)) {
            findPackageJsonFiles(filePath, results);
          }
        } else if (file === 'package.json') {
          results.push(filePath);
        }
      } catch (err) {
        console.warn(`Warning: Could not access ${filePath}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`Warning: Could not read directory ${dir}: ${err.message}`);
  }
  
  return results;
}

// Function to check if a package.json has dependencies that need a lock file
function hasDependencies(packageJsonPath) {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const packageData = JSON.parse(content);
    
    return !!(
      packageData.dependencies || 
      packageData.devDependencies || 
      packageData.peerDependencies || 
      packageData.optionalDependencies
    );
  } catch (err) {
    console.warn(`Warning: Could not parse ${packageJsonPath}: ${err.message}`);
    return false;
  }
}

// Function to check if lock file already exists
function hasLockFile(packageDir) {
  const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  return lockFiles.some(lockFile => fs.existsSync(path.join(packageDir, lockFile)));
}

// Function to generate package-lock.json
async function generateLockFile(packageDir, packageJsonPath) {
  console.log(`\n🔧 Generating lock file for: ${packageJsonPath}`);
  
  try {
    // Change to the package directory
    const originalCwd = process.cwd();
    process.chdir(packageDir);
    
    console.log(`   Working directory: ${packageDir}`);
    
    // Run npm install to generate package-lock.json
    // Use --package-lock-only to avoid actually installing node_modules
    const command = 'npm install --package-lock-only --no-audit --no-fund';
    console.log(`   Running: ${command}`);
    
    execSync(command, { 
      stdio: 'pipe',
      timeout: 60000, // 60 second timeout
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    // Verify the lock file was created
    const lockFilePath = path.join(packageDir, 'package-lock.json');
    if (fs.existsSync(lockFilePath)) {
      console.log(`   ✅ Successfully generated package-lock.json`);
      
      // Get file size for verification
      const stats = fs.statSync(lockFilePath);
      console.log(`   Lock file size: ${stats.size} bytes`);
      
      return true;
    } else {
      console.log(`   ⚠️  Lock file not created (may have no dependencies)`);
      return false;
    }
    
  } catch (err) {
    console.error(`   ❌ Error generating lock file: ${err.message}`);
    return false;
  } finally {
    // Always restore original working directory
    try {
      process.chdir(process.cwd());
    } catch (restoreErr) {
      console.warn(`Warning: Could not restore working directory: ${restoreErr.message}`);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting package-lock.json generation for missing lock files...\n');

  try {
    const baseDir = process.cwd();
    console.log(`Searching in: ${baseDir}`);
    
    const packageFiles = findPackageJsonFiles(baseDir);
    console.log(`\n📦 Found ${packageFiles.length} package.json files`);
    
    const needsLockFile = [];
    
    // Filter files that need lock files
    for (const packageJsonPath of packageFiles) {
      const packageDir = path.dirname(packageJsonPath);
      
      if (hasDependencies(packageJsonPath) && !hasLockFile(packageDir)) {
        needsLockFile.push({
          packageJsonPath,
          packageDir,
          relativePath: path.relative(baseDir, packageJsonPath)
        });
      }
    }
    
    if (needsLockFile.length === 0) {
      console.log('\n✅ All packages with dependencies already have lock files!');
      return;
    }
    
    console.log(`\n🔍 Found ${needsLockFile.length} packages that need lock files:`);
    needsLockFile.forEach(item => console.log(`   - ${item.relativePath}`));
    
    console.log(`\n⚡ Starting lock file generation...`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Generate lock files sequentially to avoid conflicts
    for (const item of needsLockFile) {
      const success = await generateLockFile(item.packageDir, item.packageJsonPath);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Small delay to prevent system overload
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Generation Summary:`);
    console.log(`   Total packages processed: ${needsLockFile.length}`);
    console.log(`   Successfully generated: ${successCount}`);
    console.log(`   Failed to generate: ${failCount}`);
    
    if (successCount > 0) {
      console.log(`\n🎉 Lock file generation completed! Run the dependency checker again to verify.`);
    }
    
  } catch (err) {
    console.error('❌ Error during execution:', err.message);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Process interrupted by user. Cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Process terminated. Cleaning up...');
  process.exit(0);
});

// Run the main function
main().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
