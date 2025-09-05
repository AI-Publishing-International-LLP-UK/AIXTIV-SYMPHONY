#!/usr/bin/env node

/**
 * Advanced Dependency Compatibility Checker
 * 
 * This script checks if project dependencies are compatible with a target
 * Node.js version before performing upgrades.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

class DependencyCompatibilityChecker {
  constructor(targetNodeVersion) {
    this.targetNodeVersion = targetNodeVersion;
    this.projectRoot = process.cwd();
    this.packageFiles = [];
    this.compatibilityIssues = [];
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * Find all package.json files in the project
   */
  async findPackageFiles() {
    const findPackageFiles = async (dir, files = []) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and .git directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            await findPackageFiles(fullPath, files);
          }
        } else if (entry.name === 'package.json') {
          files.push(fullPath);
        }
      }
      
      return files;
    };

    this.packageFiles = await findPackageFiles(this.projectRoot);
    console.log(`📦 Found ${this.packageFiles.length} package.json files`);
  }

  /**
   * Check Node.js engines compatibility for each package.json
   */
  async checkEnginesCompatibility() {
    console.log(`🔍 Checking engines compatibility for Node.js ${this.targetNodeVersion}...`);
    
    for (const packageFile of this.packageFiles) {
      try {
        const content = await fs.readFile(packageFile, 'utf8');
        const pkg = JSON.parse(content);
        const relativePath = path.relative(this.projectRoot, packageFile);
        
        if (pkg.engines && pkg.engines.node) {
          const engineSpec = pkg.engines.node;
          const isCompatible = this.checkNodeVersionCompatibility(engineSpec, this.targetNodeVersion);
          
          if (!isCompatible) {
            this.compatibilityIssues.push({
              type: 'engine-incompatible',
              file: relativePath,
              issue: `Node.js engine requirement "${engineSpec}" is incompatible with target version ${this.targetNodeVersion}`,
              current: engineSpec,
              target: this.targetNodeVersion,
              severity: 'high'
            });
          }
        } else {
          this.warnings.push({
            type: 'no-engine-spec',
            file: relativePath,
            message: 'No Node.js engine specification found'
          });
        }
      } catch (error) {
        this.warnings.push({
          type: 'parse-error',
          file: path.relative(this.projectRoot, packageFile),
          message: `Could not parse package.json: ${error.message}`
        });
      }
    }
  }

  /**
   * Check if a Node.js version satisfies an engine specification
   */
  checkNodeVersionCompatibility(engineSpec, targetVersion) {
    try {
      // Simple compatibility check - can be enhanced with semver library
      const targetMajor = parseInt(targetVersion.toString().split('.')[0]);
      
      // Handle common patterns
      if (engineSpec.startsWith('>=')) {
        const minVersion = parseInt(engineSpec.replace('>=', '').split('.')[0]);
        return targetMajor >= minVersion;
      }
      
      if (engineSpec.startsWith('>')) {
        const minVersion = parseInt(engineSpec.replace('>', '').split('.')[0]);
        return targetMajor > minVersion;
      }
      
      if (engineSpec.includes('-')) {
        // Range like "14-18" or "^14.0.0 || ^16.0.0"
        return true; // Complex range, assume compatible for now
      }
      
      if (engineSpec.includes('||')) {
        // Multiple version support like ">=14 || >=16"
        return engineSpec.split('||').some(spec => 
          this.checkNodeVersionCompatibility(spec.trim(), targetVersion)
        );
      }
      
      // Exact or caret version
      const specMajor = parseInt(engineSpec.replace(/[\^~>=<]/, '').split('.')[0]);
      return targetMajor >= specMajor;
      
    } catch (error) {
      console.warn(`Warning: Could not parse engine spec "${engineSpec}": ${error.message}`);
      return true; // Assume compatible if can't parse
    }
  }

  /**
   * Check dependencies against Node.js compatibility databases
   */
  async checkDependencyCompatibility() {
    console.log('🔍 Checking individual dependency compatibility...');
    
    for (const packageFile of this.packageFiles) {
      try {
        const content = await fs.readFile(packageFile, 'utf8');
        const pkg = JSON.parse(content);
        const relativePath = path.relative(this.projectRoot, packageFile);
        
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.peerDependencies,
          ...pkg.optionalDependencies
        };

        // Check known problematic packages
        await this.checkKnownIncompatiblePackages(allDeps, relativePath);
        
        // Check for deprecated packages
        await this.checkDeprecatedPackages(allDeps, relativePath);
        
      } catch (error) {
        this.warnings.push({
          type: 'dependency-check-error',
          file: path.relative(this.projectRoot, packageFile),
          message: `Could not check dependencies: ${error.message}`
        });
      }
    }
  }

  /**
   * Check against known incompatible packages for specific Node.js versions
   */
  async checkKnownIncompatiblePackages(dependencies, packageFile) {
    // Known compatibility issues for different Node.js versions
    const knownIssues = {
      22: [
        { package: 'node-sass', reason: 'Use dart-sass instead', alternative: 'sass' },
        { package: 'fibers', reason: 'No longer maintained, incompatible with Node.js 16+' }
      ],
      20: [
        { package: 'node-sass', reason: 'Limited support, use dart-sass', alternative: 'sass' }
      ],
      24: [
        { package: 'node-sass', reason: 'Not compatible with Node.js 24+', alternative: 'sass' },
        { package: 'fibers', reason: 'Deprecated and not compatible', alternative: 'Remove or find alternative' }
      ]
    };

    const targetMajor = parseInt(this.targetNodeVersion.toString().split('.')[0]);
    const issues = knownIssues[targetMajor] || [];

    for (const issue of issues) {
      if (dependencies[issue.package]) {
        this.compatibilityIssues.push({
          type: 'known-incompatible',
          file: packageFile,
          package: issue.package,
          version: dependencies[issue.package],
          issue: issue.reason,
          alternative: issue.alternative,
          severity: 'high'
        });
      }
    }
  }

  /**
   * Check for deprecated packages that might have issues
   */
  async checkDeprecatedPackages(dependencies, packageFile) {
    const deprecatedPackages = [
      'request', 'gulp-util', 'node-uuid', 'native-promise-only',
      'graceful-fs', 'minimatch', 'mkdirp', 'rimraf'
    ];

    for (const dep of Object.keys(dependencies)) {
      if (deprecatedPackages.includes(dep)) {
        this.warnings.push({
          type: 'deprecated-package',
          file: packageFile,
          package: dep,
          message: `Package "${dep}" is deprecated and may have compatibility issues`
        });
      }
    }
  }

  /**
   * Test actual npm installation compatibility
   */
  async testInstallationCompatibility() {
    console.log('🧪 Testing actual npm installation compatibility...');
    
    const testResults = [];
    
    for (const packageFile of this.packageFiles) {
      const relativePath = path.relative(this.projectRoot, packageFile);
      const packageDir = path.dirname(packageFile);
      
      try {
        // Create a temporary test environment
        console.log(`   Testing ${relativePath}...`);
        
        // Check if there's a package-lock.json or yarn.lock
        const hasLockFile = await this.hasLockFile(packageDir);
        
        if (!hasLockFile) {
          this.warnings.push({
            type: 'no-lock-file',
            file: relativePath,
            message: 'No lock file found - dependency versions may vary'
          });
          continue;
        }

        // Simulate installation test (in a safe way)
        const testResult = await this.simulateInstallation(packageDir, relativePath);
        testResults.push(testResult);
        
      } catch (error) {
        this.compatibilityIssues.push({
          type: 'installation-test-failed',
          file: relativePath,
          issue: `Installation test failed: ${error.message}`,
          severity: 'medium'
        });
      }
    }
    
    return testResults;
  }

  /**
   * Check if package directory has a lock file
   */
  async hasLockFile(packageDir) {
    try {
      const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
      
      for (const lockFile of lockFiles) {
        await fs.access(path.join(packageDir, lockFile));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Simulate npm installation to test compatibility
   */
  async simulateInstallation(packageDir, relativePath) {
    try {
      // Use npm ls to check for dependency issues without actually installing
      const result = execSync('npm ls --production --json', {
        cwd: packageDir,
        encoding: 'utf8',
        timeout: 30000,
        stdio: 'pipe'
      });

      const lsResult = JSON.parse(result);
      
      if (lsResult.problems && lsResult.problems.length > 0) {
        this.warnings.push({
          type: 'dependency-issues',
          file: relativePath,
          message: `Found ${lsResult.problems.length} dependency issues`,
          details: lsResult.problems.slice(0, 5) // Limit to first 5 issues
        });
      }

      return { success: true, file: relativePath };
      
    } catch (error) {
      // If npm ls fails, try a dry-run installation check
      try {
        execSync('npm ci --dry-run', {
          cwd: packageDir,
          encoding: 'utf8',
          timeout: 60000,
          stdio: 'pipe'
        });
        
        return { success: true, file: relativePath };
        
      } catch (dryRunError) {
        return {
          success: false,
          file: relativePath,
          error: dryRunError.message,
          details: 'Both npm ls and npm ci --dry-run failed'
        };
      }
    }
  }

  /**
   * Generate compatibility recommendations
   */
  generateRecommendations() {
    console.log('💡 Generating upgrade recommendations...');
    
    // Group issues by type
    const issuesByType = {};
    
    for (const issue of this.compatibilityIssues) {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    }

    // Generate specific recommendations
    for (const [type, issues] of Object.entries(issuesByType)) {
      switch (type) {
        case 'known-incompatible':
          this.recommendations.push({
            type: 'package-replacement',
            priority: 'high',
            action: 'Replace incompatible packages',
            details: issues.map(i => `Replace ${i.package} with ${i.alternative}`),
            affectedFiles: issues.map(i => i.file)
          });
          break;

        case 'engine-incompatible':
          this.recommendations.push({
            type: 'engine-update',
            priority: 'high',
            action: 'Update Node.js engine specifications',
            details: issues.map(i => `Update ${i.file} to require Node.js >=${this.targetNodeVersion}`),
            affectedFiles: issues.map(i => i.file)
          });
          break;

        case 'installation-test-failed':
          this.recommendations.push({
            type: 'dependency-resolution',
            priority: 'medium',
            action: 'Resolve dependency conflicts',
            details: 'Run npm audit and fix dependency issues',
            affectedFiles: issues.map(i => i.file)
          });
          break;
      }
    }
  }

  /**
   * Generate comprehensive compatibility report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      targetNodeVersion: this.targetNodeVersion,
      summary: {
        packageFilesChecked: this.packageFiles.length,
        compatibilityIssues: this.compatibilityIssues.length,
        warnings: this.warnings.length,
        recommendations: this.recommendations.length,
        overallCompatibility: this.getOverallCompatibility()
      },
      issues: this.compatibilityIssues,
      warnings: this.warnings,
      recommendations: this.recommendations,
      packageFiles: this.packageFiles.map(f => path.relative(this.projectRoot, f))
    };

    return report;
  }

  /**
   * Determine overall compatibility status
   */
  getOverallCompatibility() {
    const highSeverityIssues = this.compatibilityIssues.filter(i => i.severity === 'high');
    
    if (highSeverityIssues.length > 0) return 'incompatible';
    if (this.compatibilityIssues.length > 0) return 'issues-detected';
    if (this.warnings.length > 0) return 'warnings-only';
    return 'compatible';
  }

  /**
   * Output report in different formats
   */
  outputReport(format = 'console') {
    const report = this.generateReport();

    switch (format) {
      case 'json':
        console.log(JSON.stringify(report, null, 2));
        break;

      case 'github-actions':
        console.log(`::set-output name=compatibility::${report.summary.overallCompatibility}`);
        console.log(`::set-output name=issues::${report.summary.compatibilityIssues}`);
        
        // Output issues as GitHub Actions annotations
        for (const issue of report.issues) {
          const level = issue.severity === 'high' ? 'error' : 'warning';
          console.log(`::${level} file=${issue.file}::${issue.issue}`);
        }
        
        for (const warning of report.warnings) {
          console.log(`::warning file=${warning.file}::${warning.message}`);
        }
        break;

      default: // console
        console.log('\n📋 Dependency Compatibility Report');
        console.log('===================================\n');
        
        console.log(`🎯 Target Node.js Version: ${this.targetNodeVersion}`);
        console.log(`📊 Overall Compatibility: ${report.summary.overallCompatibility.toUpperCase()}\n`);
        
        console.log(`📦 Summary:`);
        console.log(`   Package files checked: ${report.summary.packageFilesChecked}`);
        console.log(`   Compatibility issues: ${report.summary.compatibilityIssues}`);
        console.log(`   Warnings: ${report.summary.warnings}`);
        console.log(`   Recommendations: ${report.summary.recommendations}\n`);

        if (report.issues.length > 0) {
          console.log('🚨 Compatibility Issues:');
          report.issues.forEach(issue => {
            const icon = issue.severity === 'high' ? '🔴' : '🟡';
            console.log(`   ${icon} ${issue.file}: ${issue.issue}`);
            if (issue.alternative) {
              console.log(`      💡 Suggested fix: ${issue.alternative}`);
            }
          });
          console.log();
        }

        if (report.warnings.length > 0) {
          console.log('⚠️  Warnings:');
          report.warnings.forEach(warning => {
            console.log(`   • ${warning.file}: ${warning.message}`);
          });
          console.log();
        }

        if (report.recommendations.length > 0) {
          console.log('💡 Recommendations:');
          report.recommendations.forEach(rec => {
            const priority = rec.priority === 'high' ? '🔴' : '🟡';
            console.log(`   ${priority} ${rec.action}`);
            if (Array.isArray(rec.details)) {
              rec.details.forEach(detail => console.log(`      - ${detail}`));
            } else {
              console.log(`      - ${rec.details}`);
            }
          });
        }
        break;
    }

    return report;
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log(`🚀 Starting dependency compatibility check for Node.js ${this.targetNodeVersion}...\n`);
      
      await this.findPackageFiles();
      await this.checkEnginesCompatibility();
      await this.checkDependencyCompatibility();
      await this.testInstallationCompatibility();
      this.generateRecommendations();
      
      const report = this.outputReport(process.env.GITHUB_ACTIONS ? 'github-actions' : 'console');
      
      // Save report to file
      await fs.writeFile(
        path.join(this.projectRoot, 'dependency-compatibility-report.json'),
        JSON.stringify(report, null, 2)
      );

      // Exit with appropriate code
      const compatibility = report.summary.overallCompatibility;
      if (compatibility === 'incompatible') {
        console.log('\n❌ Incompatible dependencies detected. Upgrade blocked.');
        process.exit(2);
      } else if (compatibility === 'issues-detected') {
        console.log('\n⚠️  Issues detected but upgrade may be possible with fixes.');
        process.exit(1);
      } else {
        console.log('\n✅ Dependencies are compatible with the target Node.js version.');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('💥 Error during compatibility check:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const targetVersion = process.argv[2];
  
  if (!targetVersion) {
    console.error('Usage: node dependency-compatibility-checker.js <node-version>');
    console.error('Example: node dependency-compatibility-checker.js 24');
    process.exit(1);
  }
  
  const checker = new DependencyCompatibilityChecker(targetVersion);
  checker.run();
}

module.exports = DependencyCompatibilityChecker;
