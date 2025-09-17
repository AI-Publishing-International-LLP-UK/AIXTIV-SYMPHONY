#!/usr/bin/env node

/**
 * 🔍 Vulnerable Package Checker
 * Checks for packages commonly flagged by GitHub Security
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Known vulnerable packages and their safe versions
const VULNERABLE_PACKAGES = {
    // High-risk packages commonly flagged by GitHub
    'lodash': { 
        minVersion: '4.17.21',
        issues: ['Prototype Pollution', 'Command Injection'],
        severity: 'high'
    },
    'minimist': { 
        minVersion: '1.2.6',
        issues: ['Prototype Pollution'],
        severity: 'critical'
    },
    'node-fetch': { 
        minVersion: '3.3.2',
        issues: ['Information Exposure'],
        severity: 'moderate'
    },
    'semver': { 
        minVersion: '7.5.4',
        issues: ['ReDoS (Regular Expression Denial of Service)'],
        severity: 'moderate'
    },
    'ws': { 
        minVersion: '8.17.1',
        issues: ['Crash due to unprepared extension', 'ReDoS'],
        severity: 'moderate'
    },
    'express': { 
        minVersion: '4.19.2',
        issues: ['Open Redirect', 'XSS'],
        severity: 'moderate'
    },
    'axios': { 
        minVersion: '1.7.4',
        issues: ['SSRF', 'Information Disclosure'],
        severity: 'moderate'
    },
    'braces': { 
        minVersion: '3.0.3',
        issues: ['ReDoS'],
        severity: 'high'
    },
    'follow-redirects': { 
        minVersion: '1.15.6',
        issues: ['Improper Input Validation'],
        severity: 'moderate'
    },
    'tar': { 
        minVersion: '6.2.1',
        issues: ['Arbitrary File Creation/Overwrite'],
        severity: 'high'
    },
    'qs': { 
        minVersion: '6.11.0',
        issues: ['Prototype Pollution'],
        severity: 'moderate'
    },
    'cookie': { 
        minVersion: '0.6.0',
        issues: ['Cross-site Scripting'],
        severity: 'moderate'
    },
    'path-to-regexp': { 
        minVersion: '8.0.0',
        issues: ['ReDoS'],
        severity: 'high'
    },
    'micromatch': { 
        minVersion: '4.0.8',
        issues: ['ReDoS'],
        severity: 'moderate'
    }
};

class VulnerablePackageChecker {
    constructor() {
        this.vulnerabilities = [];
        this.packagesChecked = 0;
        this.directories = [
            '.',
            './diamond-cli-copy',
            './mocoa-cloud-run'
        ];
    }

    async checkAllDirectories() {
        console.log('🔍 Checking for vulnerable packages...');
        console.log('=' .repeat(50));

        for (const dir of this.directories) {
            await this.checkDirectory(dir);
        }

        this.generateReport();
    }

    async checkDirectory(directory) {
        const packageJsonPath = path.join(directory, 'package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
            console.log(`⚠️  No package.json found in ${directory}`);
            return;
        }

        console.log(`\n📦 Checking ${directory}/package.json...`);
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const allDeps = {
                ...packageJson.dependencies || {},
                ...packageJson.devDependencies || {},
                ...packageJson.peerDependencies || {},
                ...packageJson.optionalDependencies || {}
            };

            for (const [packageName, currentVersion] of Object.entries(allDeps)) {
                this.packagesChecked++;
                await this.checkPackage(packageName, currentVersion, directory);
            }

            // Check for missing overrides
            this.checkForMissingOverrides(packageJson, directory);

        } catch (error) {
            console.log(`❌ Error reading ${packageJsonPath}: ${error.message}`);
        }
    }

    async checkPackage(packageName, currentVersion, directory) {
        const vulnerability = VULNERABLE_PACKAGES[packageName];
        
        if (!vulnerability) {
            return; // Package not in vulnerable list
        }

        const cleanVersion = currentVersion.replace(/[^0-9.]/g, '');
        const isVulnerable = this.isVersionVulnerable(cleanVersion, vulnerability.minVersion);

        if (isVulnerable) {
            const vuln = {
                package: packageName,
                currentVersion: currentVersion,
                minSafeVersion: vulnerability.minVersion,
                issues: vulnerability.issues,
                severity: vulnerability.severity,
                directory: directory,
                fix: this.generateFix(packageName, vulnerability.minVersion)
            };

            this.vulnerabilities.push(vuln);
            
            const severityIcon = this.getSeverityIcon(vulnerability.severity);
            console.log(`${severityIcon} ${packageName}@${currentVersion} → ${vulnerability.minVersion} (${vulnerability.severity})`);
            console.log(`   Issues: ${vulnerability.issues.join(', ')}`);
            console.log(`   Fix: ${vuln.fix}`);
        } else {
            console.log(`✅ ${packageName}@${currentVersion} (secure)`);
        }
    }

    isVersionVulnerable(current, minimum) {
        const currentParts = current.split('.').map(n => parseInt(n) || 0);
        const minimumParts = minimum.split('.').map(n => parseInt(n) || 0);
        
        for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
            const curr = currentParts[i] || 0;
            const min = minimumParts[i] || 0;
            
            if (curr > min) return false;
            if (curr < min) return true;
        }
        
        return false;
    }

    checkForMissingOverrides(packageJson, directory) {
        if (directory === '.' && !packageJson.overrides) {
            console.log('⚠️  No overrides section found in root package.json');
            console.log('   Consider adding overrides to force secure versions');
        }
    }

    generateFix(packageName, minVersion) {
        return `npm install ${packageName}@^${minVersion} --save`;
    }

    getSeverityIcon(severity) {
        const icons = {
            'critical': '🚨',
            'high': '🔴', 
            'moderate': '🟡',
            'low': '🔵'
        };
        return icons[severity] || '⚪';
    }

    generateReport() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 Vulnerable Package Report');
        console.log('='.repeat(50));

        const severityCounts = {
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0
        };

        this.vulnerabilities.forEach(vuln => {
            severityCounts[vuln.severity]++;
        });

        console.log(`🔍 Total packages checked: ${this.packagesChecked}`);
        console.log(`⚠️  Vulnerable packages found: ${this.vulnerabilities.length}`);
        console.log(`🚨 Critical: ${severityCounts.critical}`);
        console.log(`🔴 High: ${severityCounts.high}`);
        console.log(`🟡 Moderate: ${severityCounts.moderate}`);
        console.log(`🔵 Low: ${severityCounts.low}`);

        if (this.vulnerabilities.length > 0) {
            console.log('\n🔧 Recommended Actions:');
            console.log('1. Run: npm audit fix --force');
            console.log('2. Update overrides in package.json');
            console.log('3. Test thoroughly after updates');
            console.log('4. Consider enabling Dependabot alerts');

            // Save detailed report
            const report = {
                timestamp: new Date().toISOString(),
                summary: severityCounts,
                totalChecked: this.packagesChecked,
                vulnerabilities: this.vulnerabilities
            };

            fs.writeFileSync('vulnerable-packages-report.json', JSON.stringify(report, null, 2));
            console.log('\n✅ Detailed report saved to vulnerable-packages-report.json');
            
            // Generate override recommendations
            this.generateOverrideRecommendations();
        } else {
            console.log('\n✅ No vulnerable packages found!');
        }

        this.printGitHubSecurityGuidance();
    }

    generateOverrideRecommendations() {
        console.log('\n📝 Recommended package.json overrides:');
        console.log('```json');
        console.log('"overrides": {');
        
        this.vulnerabilities.forEach((vuln, index) => {
            const comma = index < this.vulnerabilities.length - 1 ? ',' : '';
            console.log(`  "${vuln.package}": "^${vuln.minSafeVersion}"${comma}`);
        });
        
        console.log('}');
        console.log('```');
    }

    printGitHubSecurityGuidance() {
        console.log('\n🔒 GitHub Security Tab Guidance:');
        console.log('1. Visit: https://github.com/AI-Publishing-International-LLP-UK/AIXTIV-SYMPHONY/security');
        console.log('2. Check "Dependabot alerts" for active vulnerabilities');
        console.log('3. Enable "Dependabot security updates" in Settings');
        console.log('4. Review and merge any Dependabot PRs');
        console.log('5. Monitor the Security tab regularly');
        
        if (this.vulnerabilities.length > 0) {
            console.log('\n⚠️  Expected GitHub vulnerabilities based on local scan:');
            console.log(`   - ${severityCounts.critical + severityCounts.high} high-priority issues`);
            console.log(`   - ${severityCounts.moderate + severityCounts.low} moderate/low priority issues`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const checker = new VulnerablePackageChecker();
    checker.checkAllDirectories().catch(error => {
        console.error('Check failed:', error.message);
        process.exit(1);
    });
}

module.exports = VulnerablePackageChecker;