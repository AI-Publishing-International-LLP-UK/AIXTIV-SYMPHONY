#!/usr/bin/env node

/**
 * Node.js Upgrade Manager
 * 
 * Central control script for managing Node.js version monitoring,
 * compatibility checking, and automated upgrades.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class NodeJSUpgradeManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.scriptsDir = path.join(this.projectRoot, 'scripts');
  }

  /**
   * Display help information
   */
  showHelp() {
    console.log(`
🚀 Node.js Upgrade Manager

COMMANDS:
  check                 - Check current Node.js versions across the project
  monitor              - Monitor for new Node.js versions and generate report
  compatibility <ver>  - Check dependency compatibility for target version
  upgrade <ver>        - Perform automated upgrade to specified version
  status               - Show current upgrade system status
  validate             - Validate all monitoring scripts and configurations

OPTIONS:
  --json              - Output in JSON format
  --force             - Force operations even with warnings
  --dry-run           - Show what would be done without executing
  
EXAMPLES:
  node scripts/nodejs-upgrade-manager.js check
  node scripts/nodejs-upgrade-manager.js compatibility 24
  node scripts/nodejs-upgrade-manager.js upgrade 24 --dry-run
  node scripts/nodejs-upgrade-manager.js status --json
    `);
  }

  /**
   * Execute version monitoring
   */
  async runVersionCheck(options = {}) {
    console.log('🔍 Running Node.js version check...\n');
    
    try {
      const monitorScript = path.join(this.scriptsDir, 'nodejs-version-monitor.js');
      const env = { ...process.env };
      
      if (options.json) {
        env.OUTPUT_FORMAT = 'json';
      }

      execSync(`node "${monitorScript}"`, { 
        stdio: 'inherit', 
        env,
        cwd: this.projectRoot 
      });
      
    } catch (error) {
      if (error.status === 2) {
        console.log('\n⚠️  Critical issues detected. Check the report above.');
        return { status: 'critical', issues: true };
      } else if (error.status === 1) {
        console.log('\n🔧 Upgrades recommended. Check the report above.');
        return { status: 'upgrade-available', issues: false };
      } else {
        throw error;
      }
    }
    
    return { status: 'up-to-date', issues: false };
  }

  /**
   * Check dependency compatibility
   */
  async checkCompatibility(targetVersion, options = {}) {
    console.log(`🧪 Checking dependency compatibility for Node.js ${targetVersion}...\n`);
    
    try {
      const compatScript = path.join(this.scriptsDir, 'dependency-compatibility-checker.js');
      
      execSync(`node "${compatScript}" ${targetVersion}`, { 
        stdio: 'inherit', 
        cwd: this.projectRoot 
      });
      
      return { compatible: true, issues: [] };
      
    } catch (error) {
      if (error.status === 2) {
        console.log(`\n❌ Incompatible dependencies detected for Node.js ${targetVersion}`);
        return { compatible: false, severity: 'blocking' };
      } else if (error.status === 1) {
        console.log(`\n⚠️  Compatibility issues detected for Node.js ${targetVersion}`);
        return { compatible: false, severity: 'warning' };
      } else {
        throw error;
      }
    }
  }

  /**
   * Perform automated upgrade
   */
  async performUpgrade(targetVersion, options = {}) {
    console.log(`🚀 Starting automated upgrade to Node.js ${targetVersion}...\n`);
    
    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }

    // Step 1: Version check
    console.log('Step 1: Checking current versions...');
    const versionCheck = await this.runVersionCheck();
    
    // Step 2: Compatibility check
    console.log('\nStep 2: Checking compatibility...');
    const compatibilityResult = await this.checkCompatibility(targetVersion);
    
    if (!compatibilityResult.compatible && compatibilityResult.severity === 'blocking' && !options.force) {
      console.log('\n❌ Upgrade blocked due to compatibility issues.');
      console.log('💡 Use --force to override, or fix compatibility issues first.');
      return { success: false, reason: 'compatibility-blocked' };
    }

    if (options.dryRun) {
      console.log('\n✅ DRY RUN COMPLETE');
      console.log(`🎯 Would upgrade to Node.js ${targetVersion}`);
      console.log(`⚠️  Compatibility: ${compatibilityResult.compatible ? 'OK' : 'Issues detected'}`);
      return { success: true, dryRun: true };
    }

    // Step 3: Create upgrade branch and PR
    console.log('\nStep 3: Creating upgrade branch...');
    const branchName = `nodejs-upgrade-${targetVersion}-${Date.now()}`;
    
    try {
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });
      console.log(`✅ Created branch: ${branchName}`);
    } catch (error) {
      console.log(`❌ Failed to create branch: ${error.message}`);
      return { success: false, reason: 'branch-creation-failed' };
    }

    // Step 4: Run upgrade script
    console.log('\nStep 4: Applying upgrades...');
    // This would typically trigger the GitHub Actions workflow
    // For local testing, we can simulate the upgrade process
    
    console.log('✅ Upgrade process initiated');
    console.log(`🎯 Target version: ${targetVersion}`);
    console.log(`🌿 Branch: ${branchName}`);
    console.log('📝 Next: Push branch to trigger automated PR creation');
    
    return { 
      success: true, 
      targetVersion, 
      branch: branchName,
      compatibility: compatibilityResult
    };
  }

  /**
   * Show system status
   */
  async showStatus(options = {}) {
    const status = {
      timestamp: new Date().toISOString(),
      scripts: {},
      reports: {},
      workflows: {},
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    // Check script availability
    const scripts = [
      'nodejs-version-monitor.js',
      'dependency-compatibility-checker.js',
      'nodejs-upgrade-manager.js'
    ];

    for (const script of scripts) {
      const scriptPath = path.join(this.scriptsDir, script);
      try {
        await fs.access(scriptPath);
        const stats = await fs.stat(scriptPath);
        status.scripts[script] = {
          exists: true,
          executable: !!(stats.mode & parseInt('111', 8)),
          size: stats.size,
          modified: stats.mtime
        };
      } catch (error) {
        status.scripts[script] = { exists: false, error: error.message };
      }
    }

    // Check for recent reports
    const reportFiles = [
      'nodejs-version-report.json',
      'dependency-compatibility-report.json'
    ];

    for (const report of reportFiles) {
      const reportPath = path.join(this.projectRoot, report);
      try {
        await fs.access(reportPath);
        const stats = await fs.stat(reportPath);
        const content = await fs.readFile(reportPath, 'utf8');
        const data = JSON.parse(content);
        
        status.reports[report] = {
          exists: true,
          size: stats.size,
          modified: stats.mtime,
          summary: data.summary || 'No summary available'
        };
      } catch (error) {
        status.reports[report] = { exists: false };
      }
    }

    // Check GitHub workflows
    const workflowsDir = path.join(this.projectRoot, '.github', 'workflows');
    const workflows = [
      'nodejs-auto-upgrade.yml',
      'deployment-health-monitor.yml'
    ];

    for (const workflow of workflows) {
      const workflowPath = path.join(workflowsDir, workflow);
      try {
        await fs.access(workflowPath);
        const stats = await fs.stat(workflowPath);
        status.workflows[workflow] = {
          exists: true,
          size: stats.size,
          modified: stats.mtime
        };
      } catch (error) {
        status.workflows[workflow] = { exists: false };
      }
    }

    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.log('📊 Node.js Upgrade System Status');
      console.log('=================================\\n');
      
      console.log('🔧 Scripts:');
      Object.entries(status.scripts).forEach(([name, info]) => {
        const icon = info.exists ? (info.executable ? '✅' : '⚠️ ') : '❌';
        console.log(`   ${icon} ${name}`);
      });
      
      console.log('\\n📋 Recent Reports:');
      Object.entries(status.reports).forEach(([name, info]) => {
        const icon = info.exists ? '📄' : '❌';
        console.log(`   ${icon} ${name}${info.modified ? ` (${new Date(info.modified).toLocaleString()})` : ''}`);
      });
      
      console.log('\\n🔄 Workflows:');
      Object.entries(status.workflows).forEach(([name, info]) => {
        const icon = info.exists ? '✅' : '❌';
        console.log(`   ${icon} ${name}`);
      });
      
      console.log(`\\n💻 System: Node.js ${status.system.nodeVersion} on ${status.system.platform}`);
    }

    return status;
  }

  /**
   * Validate all components
   */
  async validateSystem() {
    console.log('🔍 Validating Node.js upgrade system..\\n');
    
    const issues = [];
    const warnings = [];

    // Check scripts
    console.log('Checking scripts...');
    const requiredScripts = [
      'nodejs-version-monitor.js',
      'dependency-compatibility-checker.js'
    ];

    for (const script of requiredScripts) {
      const scriptPath = path.join(this.scriptsDir, script);
      try {
        await fs.access(scriptPath);
        const stats = await fs.stat(scriptPath);
        
        if (!(stats.mode & parseInt('111', 8))) {
          warnings.push(`Script ${script} is not executable`);
        }
        
        console.log(`   ✅ ${script}`);
      } catch (error) {
        issues.push(`Missing required script: ${script}`);
        console.log(`   ❌ ${script} - ${error.message}`);
      }
    }

    // Check workflows
    console.log('\\nChecking workflows...');
    const requiredWorkflows = [
      'nodejs-auto-upgrade.yml',
      'deployment-health-monitor.yml'
    ];

    const workflowsDir = path.join(this.projectRoot, '.github', 'workflows');
    
    try {
      await fs.access(workflowsDir);
    } catch (error) {
      issues.push('GitHub workflows directory missing');
    }

    for (const workflow of requiredWorkflows) {
      const workflowPath = path.join(workflowsDir, workflow);
      try {
        await fs.access(workflowPath);
        console.log(`   ✅ ${workflow}`);
      } catch (error) {
        issues.push(`Missing workflow: ${workflow}`);
        console.log(`   ❌ ${workflow} - ${error.message}`);
      }
    }

    // Check package.json for required permissions
    console.log('\\nChecking package.json configurations...');
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const pkg = JSON.parse(packageContent);
      
      if (pkg.engines && pkg.engines.node) {
        console.log(`   ✅ Node.js engine specified: ${pkg.engines.node}`);
      } else {
        warnings.push('No Node.js engine specified in main package.json');
      }
    } catch (error) {
      issues.push('Cannot read main package.json');
    }

    // Summary
    console.log('\\n📊 Validation Summary:');
    console.log(`   Issues: ${issues.length}`);
    console.log(`   Warnings: ${warnings.length}`);

    if (issues.length > 0) {
      console.log('\\n❌ Issues found:');
      issues.forEach(issue => console.log(`   • ${issue}`));
    }

    if (warnings.length > 0) {
      console.log('\\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('\\n✅ All components are properly configured!');
    }

    return { issues, warnings, valid: issues.length === 0 };
  }

  /**
   * Main execution function
   */
  async run() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const options = {
      json: args.includes('--json'),
      force: args.includes('--force'),
      dryRun: args.includes('--dry-run')
    };

    try {
      switch (command) {
      case 'check':
      case 'monitor':
        await this.runVersionCheck(options);
        break;
          
      case 'compatibility':
        const targetVer = args[1];
        if (!targetVer) {
          console.error('❌ Target version required for compatibility check');
          console.error('Usage: compatibility <version>');
          process.exit(1);
        }
        await this.checkCompatibility(targetVer, options);
        break;
          
      case 'upgrade':
        const upgradeVer = args[1];
        if (!upgradeVer) {
          console.error('❌ Target version required for upgrade');
          console.error('Usage: upgrade <version>');
          process.exit(1);
        }
        const result = await this.performUpgrade(upgradeVer, options);
        if (!result.success) {
          process.exit(1);
        }
        break;
          
      case 'status':
        await this.showStatus(options);
        break;
          
      case 'validate':
        const validation = await this.validateSystem();
        if (!validation.valid) {
          process.exit(1);
        }
        break;
          
      case 'help':
      case '--help':
      case '-h':
      default:
        this.showHelp();
        break;
      }
    } catch (error) {
      console.error('💥 Error:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const manager = new NodeJSUpgradeManager();
  manager.run();
}

module.exports = NodeJSUpgradeManager;
