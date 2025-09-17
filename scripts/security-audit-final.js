#!/usr/bin/env node

/**
 * 🔒 Final Security Audit Script
 * Comprehensive security vulnerability assessment
 * AI Publishing International LLP Security Framework
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityAudit {
    constructor() {
        this.findings = [];
        this.criticalCount = 0;
        this.highCount = 0;
        this.mediumCount = 0;
        this.lowCount = 0;
    }

    log(severity, category, message, file = null) {
        const finding = {
            severity,
            category,
            message,
            file,
            timestamp: new Date().toISOString()
        };
        
        this.findings.push(finding);
        
        switch(severity) {
            case 'CRITICAL': this.criticalCount++; break;
            case 'HIGH': this.highCount++; break;
            case 'MEDIUM': this.mediumCount++; break;
            case 'LOW': this.lowCount++; break;
        }

        const icon = {
            'CRITICAL': '🚨',
            'HIGH': '🔴',
            'MEDIUM': '🟡',
            'LOW': '🔵'
        };

        console.log(`${icon[severity]} [${severity}] ${category}: ${message}${file ? ` (${file})` : ''}`);
    }

    async runAudit() {
        console.log('🔒 Starting Final Security Audit...');
        console.log('='.repeat(50));
        
        await this.auditPackageVulnerabilities();
        await this.auditFilePermissions();
        await this.auditHardcodedSecrets();
        await this.auditCommandInjection();
        await this.auditInsecureConnections();
        await this.auditDependencyVersions();
        
        this.generateReport();
    }

    async auditPackageVulnerabilities() {
        console.log('\n📦 Auditing Package Vulnerabilities...');
        
        try {
            // Check main package.json
            if (fs.existsSync('package.json')) {
                const result = execSync('npm audit --json', { encoding: 'utf8' });
                const audit = JSON.parse(result);
                
                if (audit.metadata && audit.metadata.vulnerabilities) {
                    const vulns = audit.metadata.vulnerabilities;
                    if (vulns.critical > 0) {
                        this.log('CRITICAL', 'NPM_AUDIT', `${vulns.critical} critical vulnerabilities found`);
                    }
                    if (vulns.high > 0) {
                        this.log('HIGH', 'NPM_AUDIT', `${vulns.high} high vulnerabilities found`);
                    }
                    if (vulns.moderate > 0) {
                        this.log('MEDIUM', 'NPM_AUDIT', `${vulns.moderate} moderate vulnerabilities found`);
                    }
                }
            }
        } catch (error) {
            // npm audit returns non-zero exit code when vulnerabilities found
            this.log('MEDIUM', 'NPM_AUDIT', 'Error running npm audit - vulnerabilities may exist');
        }
    }

    async auditFilePermissions() {
        console.log('\n🔐 Auditing File Permissions...');
        
        const sensitiveFiles = [
            '.env',
            '.env.local',
            '.env.production',
            'secrets.json',
            'config/production.json'
        ];

        sensitiveFiles.forEach(file => {
            if (fs.existsSync(file)) {
                try {
                    const stats = fs.statSync(file);
                    const mode = (stats.mode & parseInt('777', 8)).toString(8);
                    if (mode !== '600') {
                        this.log('HIGH', 'FILE_PERMISSIONS', `Sensitive file has incorrect permissions: ${mode}`, file);
                    }
                } catch (error) {
                    this.log('MEDIUM', 'FILE_PERMISSIONS', `Cannot check permissions for ${file}`);
                }
            }
        });
    }

    async auditHardcodedSecrets() {
        console.log('\n🔍 Scanning for Hardcoded Secrets...');
        
        const secretPatterns = [
            /password\s*[:=]\s*['"][^'"]+['"]/gi,
            /api_key\s*[:=]\s*['"][^'"]+['"]/gi,
            /secret\s*[:=]\s*['"][^'"]+['"]/gi,
            /token\s*[:=]\s*['"][^'"]+['"]/gi,
            /private_key\s*[:=]\s*['"][^'"]+['"]/gi,
            /-----BEGIN PRIVATE KEY-----/gi,
            /sk_[a-z0-9]{32,}/gi, // Stripe secret keys
            /pk_[a-z0-9]{32,}/gi, // Stripe public keys
            /AIza[0-9A-Za-z\\-_]{35}/gi, // Google API keys
            /ya29\\.[0-9A-Za-z\\-_]+/gi, // Google OAuth tokens
        ];

        this.scanDirectoryForPatterns('.', secretPatterns, [
            'node_modules',
            '.git',
            'dist',
            'build',
            'coverage',
            'ARC-AGI-master/data'
        ]);
    }

    scanDirectoryForPatterns(dir, patterns, excludeDirs = []) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !excludeDirs.includes(file)) {
                this.scanDirectoryForPatterns(fullPath, patterns, excludeDirs);
            } else if (stat.isFile() && this.isTextFile(fullPath)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    patterns.forEach(pattern => {
                        const matches = content.match(pattern);
                        if (matches) {
                            this.log('CRITICAL', 'HARDCODED_SECRET', `Potential hardcoded secret found: ${matches[0].substring(0, 50)}...`, fullPath);
                        }
                    });
                } catch (error) {
                    // Skip binary files or files that can't be read
                }
            }
        });
    }

    isTextFile(filePath) {
        const textExtensions = ['.js', '.ts', '.json', '.md', '.txt', '.yml', '.yaml', '.env', '.config'];
        return textExtensions.some(ext => filePath.endsWith(ext));
    }

    async auditCommandInjection() {
        console.log('\n⚠️ Scanning for Command Injection Vulnerabilities...');
        
        const dangerousPatterns = [
            /execSync\s*\(\s*[`$]/gi, // Template literals in execSync
            /exec\s*\(\s*[`$]/gi,     // Template literals in exec
            /spawn\s*\(\s*[`$]/gi,    // Template literals in spawn
            /eval\s*\(/gi,            // eval() usage
            /Function\s*\(/gi,        // Function constructor
        ];

        this.scanDirectoryForPatterns('.', dangerousPatterns, [
            'node_modules',
            '.git',
            'dist',
            'build',
            'coverage',
            'ARC-AGI-master'
        ]);
    }

    async auditInsecureConnections() {
        console.log('\n🌐 Scanning for Insecure Connections...');
        
        const insecurePatterns = [
            /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/gi, // HTTP connections (not localhost)
            /ftp:\/\//gi,                                      // FTP connections
            /telnet:\/\//gi,                                   // Telnet connections
        ];

        this.scanDirectoryForPatterns('.', insecurePatterns, [
            'node_modules',
            '.git',
            'dist',
            'build',
            'coverage',
            'ARC-AGI-master'
        ]);
    }

    async auditDependencyVersions() {
        console.log('\n📋 Checking Dependency Versions...');
        
        if (fs.existsSync('package.json')) {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            // Check for outdated or vulnerable packages
            const vulnerablePackages = {
                'lodash': '4.17.20',
                'minimist': '1.2.6',
                'node-fetch': '2.6.7',
                'semver': '7.5.2'
            };

            Object.entries(vulnerablePackages).forEach(([name, minVersion]) => {
                const currentVersion = pkg.dependencies?.[name] || pkg.devDependencies?.[name];
                if (currentVersion && !this.isVersionSafe(currentVersion, minVersion)) {
                    this.log('HIGH', 'VULNERABLE_DEPENDENCY', `${name}@${currentVersion} has known vulnerabilities, upgrade to ${minVersion}+`);
                }
            });
        }
    }

    isVersionSafe(current, minimum) {
        // Simple version comparison (for demonstration)
        // In production, use semver library
        const currentParts = current.replace(/[^0-9.]/g, '').split('.').map(n => parseInt(n));
        const minimumParts = minimum.split('.').map(n => parseInt(n));
        
        for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
            const curr = currentParts[i] || 0;
            const min = minimumParts[i] || 0;
            
            if (curr > min) return true;
            if (curr < min) return false;
        }
        
        return true;
    }

    generateReport() {
        console.log('\n📊 Security Audit Report');
        console.log('='.repeat(50));
        console.log(`🚨 Critical: ${this.criticalCount}`);
        console.log(`🔴 High: ${this.highCount}`);
        console.log(`🟡 Medium: ${this.mediumCount}`);
        console.log(`🔵 Low: ${this.lowCount}`);
        console.log(`📝 Total Findings: ${this.findings.length}`);
        
        // Save detailed report
        const report = {
            summary: {
                critical: this.criticalCount,
                high: this.highCount,
                medium: this.mediumCount,
                low: this.lowCount,
                total: this.findings.length
            },
            timestamp: new Date().toISOString(),
            findings: this.findings
        };

        fs.writeFileSync('security-audit-report.json', JSON.stringify(report, null, 2));
        console.log('\n✅ Detailed report saved to security-audit-report.json');
        
        // Recommendations
        console.log('\n🔧 Recommendations:');
        if (this.criticalCount > 0) {
            console.log('• Address critical vulnerabilities immediately');
        }
        if (this.highCount > 0) {
            console.log('• Review and fix high-severity issues');
        }
        console.log('• Run npm audit fix to automatically fix vulnerable dependencies');
        console.log('• Consider using automated security monitoring tools');
        console.log('• Implement regular security audits in CI/CD pipeline');
    }
}

// Run audit if script is called directly
if (require.main === module) {
    const audit = new SecurityAudit();
    audit.runAudit().catch(error => {
        console.error('Audit failed:', error.message);
        process.exit(1);
    });
}

module.exports = SecurityAudit;