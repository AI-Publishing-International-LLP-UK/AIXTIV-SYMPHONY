#!/usr/bin/env node

/**
 * Node.js Version Monitoring and Upgrade Detection Script
 * 
 * This script monitors Node.js versions across the project and compares them
 * with the latest available versions to determine if upgrades are needed.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class NodeVersionMonitor {
  constructor() {
    this.projectRoot = process.cwd();
    this.currentVersions = new Map();
    this.latestVersions = new Map();
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * Fetch the latest Node.js version information from official API
   */
  async fetchLatestNodeVersions() {
    return new Promise((resolve, reject) => {
      const url = 'https://nodejs.org/dist/index.json';
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const versions = JSON.parse(data);
            
            // Find current LTS version
            const currentLTS = versions.find(v => v.lts && typeof v.lts === 'string');
            const latestStable = versions[0]; // First item is always latest
            const maintenanceLTS = versions.find(v => v.lts === true);
            
            this.latestVersions.set('current-lts', {
              version: currentLTS.version,
              lts: currentLTS.lts,
              date: currentLTS.date,
              security: currentLTS.security || false
            });
            
            this.latestVersions.set('latest', {
              version: latestStable.version,
              lts: latestStable.lts || false,
              date: latestStable.date,
              security: latestStable.security || false
            });

            // Get all LTS versions for comparison
            const ltsVersions = versions.filter(v => v.lts);
            this.latestVersions.set('all-lts', ltsVersions.slice(0, 3)); // Last 3 LTS versions
            
            resolve();
          } catch (error) {
            reject(new Error(`Failed to parse Node.js version data: ${error.message}`));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Scan project files for Node.js version specifications
   */
  async scanProjectVersions() {
    const filesToCheck = [
      'package.json',
      '.github/workflows/deploy.yml',
      '.github/workflows/build.yml',
      '.github/workflows/build-test.yml',
      'Dockerfile.fixed',
      'functions.backup/Dockerfile.mock-sallyport',
      'app.yaml',
      'cloud-functions/dr-claude/package.json',
      'asoos-deploy/functions/package.json'
    ];

    for (const file of filesToCheck) {
      const fullPath = path.join(this.projectRoot, file);
      
      try {
        await fs.access(fullPath);
        const content = await fs.readFile(fullPath, 'utf8');
        const version = this.extractVersionFromFile(file, content);
        
        if (version) {
          this.currentVersions.set(file, version);
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn(`Warning: Could not read ${file}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Extract Node.js version from file content based on file type
   */
  extractVersionFromFile(filename, content) {
    try {
      if (filename.includes('package.json')) {
        const pkg = JSON.parse(content);
        if (pkg.engines && pkg.engines.node) {
          return {
            type: 'package.json',
            version: pkg.engines.node,
            raw: pkg.engines.node
          };
        }
        return null;
      }

      if (filename.includes('.yml')) {
        // Extract from GitHub Actions workflows
        const nodeVersionMatch = content.match(/node-version:\s*['"']?([^'">\s\[\]]+)['"']?/);
        if (nodeVersionMatch) {
          return {
            type: 'github-actions',
            version: nodeVersionMatch[1],
            raw: nodeVersionMatch[0]
          };
        }
        // Also check for matrix format like [24.x] or strategy.matrix.node-version: [24.x]
        const matrixMatch = content.match(/node-version:\s*\[([^\]]+)\]/);
        if (matrixMatch) {
          const versions = matrixMatch[1].split(',').map(v => v.trim().replace(/["']/g, ''));
          return {
            type: 'github-actions',
            version: versions[0], // Use first version in matrix
            raw: matrixMatch[0]
          };
        }
        // Check for template variable format like ${{ matrix.node-version }}
        const templateMatch = content.match(/node-version:\s*\$\{\{\s*matrix\.node-version\s*\}\}/);
        if (templateMatch) {
          // Look for the matrix definition
          const strategyMatch = content.match(/matrix:\s*\n\s*node-version:\s*\[([^\]]+)\]/);
          if (strategyMatch) {
            const versions = strategyMatch[1].split(',').map(v => v.trim().replace(/["']/g, ''));
            return {
              type: 'github-actions',
              version: versions[0],
              raw: templateMatch[0]
            };
          }
        }
        return null;
      }

      if (filename.includes('Dockerfile')) {
        // Extract from Docker FROM statements
        const dockerMatch = content.match(/FROM\s+node:([^\s]+)/);
        if (dockerMatch) {
          return {
            type: 'dockerfile',
            version: dockerMatch[1],
            raw: dockerMatch[0]
          };
        }
        return null;
      }

      if (filename === 'app.yaml') {
        // Extract from App Engine runtime
        const runtimeMatch = content.match(/runtime:\s*nodejs(\d+)/);
        if (runtimeMatch) {
          return {
            type: 'app-engine',
            version: runtimeMatch[1],
            raw: runtimeMatch[0]
          };
        }
        return null;
      }

      return null;
    } catch (error) {
      console.warn(`Error parsing ${filename}: ${error.message}`);
      return null;
    }
  }

  /**
   * Normalize version string to compare with latest versions
   */
  normalizeVersion(version) {
    // Handle different version formats
    if (typeof version !== 'string') return null;
    
    // Remove prefixes and suffixes
    let normalized = version
      .replace(/^>=?/, '') // Remove >= or >
      .replace(/\.x$/, '')  // Remove .x suffix
      .replace(/-alpine$/, '') // Remove -alpine suffix  
      .replace(/-slim$/, '')   // Remove -slim suffix
      .trim();

    // Extract major version number
    const majorMatch = normalized.match(/^(\d+)/);
    return majorMatch ? parseInt(majorMatch[1]) : null;
  }

  /**
   * Check if current versions need upgrades
   */
  analyzeVersions() {
    const currentLTS = this.latestVersions.get('current-lts');
    const latestVersion = this.latestVersions.get('latest');
    const currentLTSMajor = this.normalizeVersion(currentLTS.version);
    const latestMajor = this.normalizeVersion(latestVersion.version);

    for (const [file, versionInfo] of this.currentVersions) {
      const currentMajor = this.normalizeVersion(versionInfo.version);
      
      if (!currentMajor) {
        this.warnings.push(`Could not parse version in ${file}: ${versionInfo.version}`);
        continue;
      }

      // Check if version is outdated
      if (currentMajor < currentLTSMajor) {
        this.recommendations.push({
          file,
          current: versionInfo.version,
          recommended: currentLTS.version.replace('v', ''),
          reason: `Upgrade to current LTS (${currentLTS.lts})`,
          severity: 'high',
          type: versionInfo.type
        });
      } else if (currentMajor < latestMajor) {
        this.recommendations.push({
          file,
          current: versionInfo.version,
          recommended: latestVersion.version.replace('v', ''),
          reason: 'Latest version available',
          severity: 'medium',
          type: versionInfo.type
        });
      }

      // Check for end-of-life versions
      if (currentMajor < 18) {
        this.warnings.push(`${file} uses Node.js ${currentMajor} which is end-of-life and unsupported`);
      } else if (currentMajor < 20) {
        this.warnings.push(`${file} uses Node.js ${currentMajor} which will reach end-of-life soon`);
      }
    }
  }

  /**
   * Generate upgrade recommendations
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      currentVersions: Object.fromEntries(this.currentVersions),
      latestVersions: Object.fromEntries(this.latestVersions),
      warnings: this.warnings,
      recommendations: this.recommendations,
      summary: {
        filesScanned: this.currentVersions.size,
        upgradesRecommended: this.recommendations.length,
        criticalWarnings: this.warnings.length,
        overallStatus: this.getOverallStatus()
      }
    };

    return report;
  }

  /**
   * Determine overall upgrade status
   */
  getOverallStatus() {
    if (this.warnings.length > 0) return 'critical';
    if (this.recommendations.filter(r => r.severity === 'high').length > 0) return 'upgrade-required';
    if (this.recommendations.length > 0) return 'upgrade-available';
    return 'up-to-date';
  }

  /**
   * Output report in different formats
   */
  outputReport(format = 'console', report = null) {
    const rpt = report || this.generateReport();

    switch (format) {
    case 'json':
      console.log(JSON.stringify(rpt, null, 2));
      break;
      
    case 'github-actions':
      // Output for GitHub Actions
      console.log(`::set-output name=status::${rpt.summary.overallStatus}`);
      console.log(`::set-output name=upgrades-needed::${rpt.recommendations.length}`);
        
      if (rpt.warnings.length > 0) {
        rpt.warnings.forEach(warning => {
          console.log(`::warning::${warning}`);
        });
      }

      if (rpt.recommendations.length > 0) {
        console.log('::group::Upgrade Recommendations');
        rpt.recommendations.forEach(rec => {
          console.log(`::notice title=${rec.file}::${rec.reason}: ${rec.current} → ${rec.recommended}`);
        });
        console.log('::endgroup::');
      }
      break;

    default: // console
      console.log('\n🔍 Node.js Version Monitoring Report');
      console.log('=====================================\n');
        
      console.log('📊 Summary:');
      console.log(`   Files scanned: ${rpt.summary.filesScanned}`);
      console.log(`   Status: ${rpt.summary.overallStatus.toUpperCase()}`);
      console.log(`   Upgrades recommended: ${rpt.summary.upgradesRecommended}`);
      console.log(`   Warnings: ${rpt.summary.criticalWarnings}\n`);

      if (rpt.warnings.length > 0) {
        console.log('⚠️  Critical Warnings:');
        rpt.warnings.forEach(warning => console.log(`   • ${warning}`));
        console.log();
      }

      if (rpt.recommendations.length > 0) {
        console.log('📈 Upgrade Recommendations:');
        rpt.recommendations.forEach(rec => {
          const priority = rec.severity === 'high' ? '🔴' : '🟡';
          console.log(`   ${priority} ${rec.file}: ${rec.current} → ${rec.recommended} (${rec.reason})`);
        });
        console.log();
      }

      console.log('🌐 Latest Available Versions:');
      const lts = rpt.latestVersions['current-lts'];
      const latest = rpt.latestVersions['latest'];
      console.log(`   Current LTS: ${lts.version} (${lts.lts})`);
      console.log(`   Latest: ${latest.version}`);
      break;
    }
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      console.log('🚀 Starting Node.js version monitoring...\n');
      
      await this.fetchLatestNodeVersions();
      await this.scanProjectVersions();
      this.analyzeVersions();
      
      const report = this.generateReport();
      
      // Output based on environment
      const outputFormat = process.env.GITHUB_ACTIONS ? 'github-actions' : 'console';
      this.outputReport(outputFormat, report);

      // Save report to file for other scripts
      await fs.writeFile(
        path.join(this.projectRoot, 'nodejs-version-report.json'),
        JSON.stringify(report, null, 2)
      );

      // Exit with appropriate code
      process.exit(report.summary.overallStatus === 'critical' ? 2 : 0);
      
    } catch (error) {
      console.error('❌ Error during monitoring:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const monitor = new NodeVersionMonitor();
  monitor.run();
}

module.exports = NodeVersionMonitor;
