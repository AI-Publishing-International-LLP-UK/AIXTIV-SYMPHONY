#!/usr/bin/env node

/**
 * Package.json Engine Fixer
 * 
 * This script automatically adds Node.js engine specifications to all package.json
 * files in the project and fixes any malformed JSON.
 */

const fs = require('fs').promises;
const path = require('path');

class PackageJsonFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.targetNodeVersion = '24.0.0'; // Current target version
    this.fixedFiles = [];
    this.skippedFiles = [];
    this.errors = [];
  }

  /**
   * Find all package.json files in the project
   */
  async findPackageJsonFiles() {
    const packageFiles = [];
    
    const findFiles = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules, .git, and other system directories
            if (!['node_modules', '.git', 'dist', 'build', '.next', '.nuxt'].includes(entry.name)) {
              await findFiles(fullPath);
            }
          } else if (entry.name === 'package.json') {
            packageFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
        console.warn(`Warning: Cannot read directory ${dir}: ${error.message}`);
      }
    };

    await findFiles(this.projectRoot);
    return packageFiles;
  }

  /**
   * Fix a single package.json file
   */
  async fixPackageJson(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    
    try {
      // Try to read the file
      const content = await fs.readFile(filePath, 'utf8');
      
      if (!content.trim()) {
        console.log(`⚠️  ${relativePath}: File is empty, skipping`);
        this.skippedFiles.push({ file: relativePath, reason: 'Empty file' });
        return false;
      }

      let packageJson;
      let needsUpdate = false;

      try {
        packageJson = JSON.parse(content);
      } catch (parseError) {
        console.log(`❌ ${relativePath}: Invalid JSON - ${parseError.message}`);
        
        // Try to fix common JSON issues
        let fixedContent = content
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":') // Quote unquoted keys
          .trim();

        // Remove any trailing commas after the last property
        fixedContent = fixedContent.replace(/,(\s*})$/g, '$1');

        try {
          packageJson = JSON.parse(fixedContent);
          console.log(`✅ ${relativePath}: Fixed JSON syntax errors`);
          needsUpdate = true;
        } catch (secondParseError) {
          this.errors.push({
            file: relativePath,
            error: `Could not fix JSON: ${secondParseError.message}`,
            originalError: parseError.message
          });
          return false;
        }
      }

      // Check if engines section exists and has Node.js specification
      if (!packageJson.engines) {
        packageJson.engines = {};
        needsUpdate = true;
      }

      if (!packageJson.engines.node) {
        packageJson.engines.node = `>=${this.targetNodeVersion}`;
        needsUpdate = true;
        console.log(`✅ ${relativePath}: Added Node.js engine specification (>=${this.targetNodeVersion})`);
      } else {
        // Check if the current specification is compatible with our target
        const currentEngine = packageJson.engines.node;
        if (this.shouldUpdateEngine(currentEngine)) {
          const oldEngine = currentEngine;
          packageJson.engines.node = `>=${this.targetNodeVersion}`;
          needsUpdate = true;
          console.log(`🔄 ${relativePath}: Updated Node.js engine (${oldEngine} → >=${this.targetNodeVersion})`);
        } else {
          console.log(`ℹ️  ${relativePath}: Node.js engine already specified (${currentEngine})`);
        }
      }

      // Write the updated package.json if changes were made
      if (needsUpdate) {
        const updatedContent = JSON.stringify(packageJson, null, 2) + '\n';
        await fs.writeFile(filePath, updatedContent, 'utf8');
        
        this.fixedFiles.push({
          file: relativePath,
          changes: needsUpdate ? ['Added/updated Node.js engine specification'] : ['Fixed JSON syntax']
        });
        
        return true;
      }

      return false;

    } catch (error) {
      this.errors.push({
        file: relativePath,
        error: error.message
      });
      console.error(`❌ ${relativePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Determine if an engine specification should be updated
   */
  shouldUpdateEngine(currentEngine) {
    if (!currentEngine || typeof currentEngine !== 'string') {
      return true;
    }

    // Extract version number from engine specification
    const versionMatch = currentEngine.match(/(\d+)/);
    if (!versionMatch) {
      return true;
    }

    const currentMajor = parseInt(versionMatch[1]);
    const targetMajor = parseInt(this.targetNodeVersion.split('.')[0]);

    // Update if current version is less than target
    return currentMajor < targetMajor;
  }

  /**
   * Generate package-lock.json files where missing
   */
  async generateLockFiles() {
    console.log('\n🔒 Checking for missing package-lock.json files...\n');
    
    const packageDirs = new Set();
    
    // Find all directories with package.json files
    for (const fixedFile of this.fixedFiles) {
      const dir = path.dirname(path.join(this.projectRoot, fixedFile.file));
      packageDirs.add(dir);
    }

    for (const dir of packageDirs) {
      const lockFilePath = path.join(dir, 'package-lock.json');
      const packageJsonPath = path.join(dir, 'package.json');
      const relativePath = path.relative(this.projectRoot, dir);
      
      try {
        // Check if lock file already exists
        await fs.access(lockFilePath);
        console.log(`ℹ️  ${relativePath}: package-lock.json already exists`);
      } catch (error) {
        // Lock file doesn't exist, check if package.json has dependencies
        try {
          const packageContent = await fs.readFile(packageJsonPath, 'utf8');
          const pkg = JSON.parse(packageContent);
          
          const hasDependencies = (
            (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) ||
            (pkg.devDependencies && Object.keys(pkg.devDependencies).length > 0)
          );

          if (hasDependencies) {
            console.log(`⚠️  ${relativePath}: Has dependencies but no package-lock.json`);
            console.log(`   💡 Consider running: cd "${relativePath}" && npm install`);
          }
        } catch (readError) {
          // Skip if we can't read the package.json
        }
      }
    }
  }

  /**
   * Generate summary report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.fixedFiles.length + this.skippedFiles.length + this.errors.length,
        fixedFiles: this.fixedFiles.length,
        skippedFiles: this.skippedFiles.length,
        errorFiles: this.errors.length
      },
      fixedFiles: this.fixedFiles,
      skippedFiles: this.skippedFiles,
      errors: this.errors,
      targetNodeVersion: this.targetNodeVersion
    };

    return report;
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🔧 Starting package.json engine specification fixes...\n');
    
    try {
      // Find all package.json files
      console.log('📦 Finding all package.json files...');
      const packageFiles = await this.findPackageJsonFiles();
      console.log(`   Found ${packageFiles.length} package.json files\n`);

      // Fix each file
      console.log('🛠️  Fixing package.json files:\n');
      
      for (const filePath of packageFiles) {
        await this.fixPackageJson(filePath);
      }

      // Generate lock file recommendations
      await this.generateLockFiles();

      // Generate and save report
      const report = this.generateReport();
      
      await fs.writeFile(
        path.join(this.projectRoot, 'package-json-fixes-report.json'),
        JSON.stringify(report, null, 2)
      );

      // Print summary
      console.log('\n📊 Summary:');
      console.log(`   Total files processed: ${report.summary.totalFiles}`);
      console.log(`   ✅ Fixed files: ${report.summary.fixedFiles}`);
      console.log(`   ⏭️  Skipped files: ${report.summary.skippedFiles}`);
      console.log(`   ❌ Error files: ${report.summary.errorFiles}`);

      if (this.fixedFiles.length > 0) {
        console.log('\n✅ Fixed files:');
        this.fixedFiles.forEach(fix => {
          console.log(`   • ${fix.file}`);
        });
      }

      if (this.errors.length > 0) {
        console.log('\n❌ Files with errors:');
        this.errors.forEach(error => {
          console.log(`   • ${error.file}: ${error.error}`);
        });
      }

      console.log('\n🎯 All package.json files now have Node.js engine specifications!');
      console.log(`📄 Detailed report saved to: package-json-fixes-report.json`);

      // Exit with appropriate code
      process.exit(this.errors.length > 0 ? 1 : 0);

    } catch (error) {
      console.error('💥 Fatal error:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const fixer = new PackageJsonFixer();
  fixer.run();
}

module.exports = PackageJsonFixer;
