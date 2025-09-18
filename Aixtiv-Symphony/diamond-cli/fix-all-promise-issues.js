#!/usr/bin/env node
/**
 * Comprehensive Promise Resolution Fix
 * 
 * This script identifies and fixes all [object Promise] issues throughout
 * your AIXTIV Symphony codebase, particularly in:
 * 1. CLI interfaces that don't await promises
 * 2. Console.log statements that display promises
 * 3. Return statements that resolve to promises
 * 4. Template literals that include promises
 * 5. HTML rendering that includes unresolved promises
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import winston from 'winston';

const execAsync = promisify(exec);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'promise-fix.log' })
  ]
});

class PromiseIssueFixer {
  constructor() {
    this.rootPath = '/Users/as/asoos/Aixtiv-Symphony';
    this.fixedFiles = [];
    this.problemPatterns = [
      // Common patterns that cause [object Promise]
      {
        pattern: /console\.log\([^)]*[^a]wait\s+[^)]+\)/g,
        description: 'Console.log with unresolved promises',
        fix: (match) => match.replace(/console\.log\(([^)]*)((?!await\s+)[^)]+)\)/, 'console.log($1await $2)')
      },
      {
        pattern: /return\s+(?!await\s+)([^;]+Promise[^;]*);/g,
        description: 'Return statement without await',
        fix: (match) => match.replace(/return\s+([^;]+);/, 'return await $1;')
      },
      {
        pattern: /\$\{(?!await\s+)([^}]*Promise[^}]*)\}/g,
        description: 'Template literal with unresolved promise',
        fix: (match) => match.replace(/\$\{([^}]*)\}/, '${await $1}')
      },
      {
        pattern: /\.then\(([^)]+)\)(?!\s*\.catch)/g,
        description: 'Promise.then without catch',
        fix: (match) => match + '.catch(error => logger.error("Promise error:", error))'
      }
    ];
  }

  /**
   * Scan directory for JavaScript/TypeScript files
   */
  async scanDirectory(dirPath, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && !['node_modules', 'dist', 'build'].includes(entry.name)) {
          const subFiles = await this.scanDirectory(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      logger.warn(`Cannot scan directory ${dirPath}:`, error.message);
    }
    
    return files;
  }

  /**
   * Analyze file for promise issues
   */
  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const issues = [];
      
      // Check for [object Promise] patterns
      if (content.includes('[object Promise]')) {
        issues.push({
          type: 'literal_object_promise',
          line: content.split('\n').findIndex(line => line.includes('[object Promise]')) + 1,
          description: 'Contains literal [object Promise] text'
        });
      }
      
      // Check for common promise antipatterns
      for (const pattern of this.problemPatterns) {
        const matches = content.match(pattern.pattern);
        if (matches) {
          issues.push({
            type: 'promise_antipattern',
            pattern: pattern.description,
            matches: matches.length,
            description: pattern.description
          });
        }
      }
      
      // Check for CLI interfaces without proper awaiting
      if (content.includes('process.argv') && content.includes('.then(')) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('.then(') && line.includes('console.log')) {
            issues.push({
              type: 'cli_promise_issue',
              line: index + 1,
              description: 'CLI command using .then() instead of await',
              content: line.trim()
            });
          }
        });
      }
      
      return issues.length > 0 ? { filePath, issues } : null;
    } catch (error) {
      logger.error(`Error analyzing ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Fix CLI promise issues specifically
   */
  fixCLIPromiseIssues(content) {
    let fixed = content;
    
    // Fix CLI patterns like: somePromise.then(result => console.log(...))
    fixed = fixed.replace(
      /(\w+)\.then\(([^=]+)=>\s*{\s*console\.log\(([^)]+)\);\s*}\);?/g,
      'const $2 = await $1; console.log($3);'
    );
    
    // Fix CLI patterns like: somePromise.then(result => console.log(...)).catch(...)
    fixed = fixed.replace(
      /(\w+)\.then\(([^=]+)=>\s*{\s*console\.log\(([^)]+)\);\s*}\)\.catch\([^)]+\);?/g,
      'try { const $2 = await $1; console.log($3); } catch (error) { console.error("Error:", error.message); }'
    );
    
    // Wrap CLI main execution in async function if not already
    if (fixed.includes('process.argv') && fixed.includes('await ') && !fixed.includes('(async () => {')) {
      const mainExecutionStart = fixed.indexOf('if (args.includes(');
      if (mainExecutionStart > -1) {
        const beforeMain = fixed.substring(0, mainExecutionStart);
        const afterMain = fixed.substring(mainExecutionStart);
        fixed = beforeMain + '(async () => {\n' + afterMain + '\n})();';
      }
    }
    
    return fixed;
  }

  /**
   * Fix promise issues in a file
   */
  async fixFile(filePath, issues) {
    try {
      let content = await fs.readFile(filePath, 'utf8');
      let wasModified = false;
      
      // Apply pattern-based fixes
      for (const issue of issues) {
        if (issue.type === 'promise_antipattern') {
          for (const pattern of this.problemPatterns) {
            if (pattern.description === issue.pattern) {
              const originalContent = content;
              content = content.replace(pattern.pattern, pattern.fix);
              if (content !== originalContent) {
                wasModified = true;
                logger.info(`Applied ${pattern.description} fix to ${path.basename(filePath)}`);
              }
            }
          }
        }
        
        if (issue.type === 'cli_promise_issue') {
          content = this.fixCLIPromiseIssues(content);
          wasModified = true;
        }
      }
      
      // Fix literal [object Promise] issues
      if (content.includes('[object Promise]')) {
        content = content.replace(/\[object Promise\]/g, '${await promise}');
        wasModified = true;
        logger.info(`Fixed literal [object Promise] in ${path.basename(filePath)}`);
      }
      
      if (wasModified) {
        await fs.writeFile(filePath, content, 'utf8');
        this.fixedFiles.push(filePath);
        logger.info(`✅ Fixed promise issues in ${filePath}`);
      }
      
      return wasModified;
    } catch (error) {
      logger.error(`Error fixing ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Fix the specific repair-mocoa-health.js CLI issues
   */
  async fixRepairMocoaHealthCLI() {
    const filePath = '/Users/as/asoos/Aixtiv-Symphony/diamond-cli/repair-mocoa-health.js';
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Fix the CLI interface by wrapping in async IIFE and properly awaiting
      const cliSection = `
// CLI interface
const isMainModule = import.meta.url === \`file://\${process.argv[1]}\`;
if (isMainModule) {
  const repair = new MocoaHealthRepair();
  
  const args = process.argv.slice(2);
  
  (async () => {
    try {
      if (args.includes('--check-health')) {
        const status = await repair.checkServiceHealth();
        console.log('Service health status:', JSON.stringify(status, null, 2));
      } else if (args.includes('--repair-all')) {
        const success = await repair.performComprehensiveRepair();
        if (success) {
          console.log('✅ Comprehensive repair completed successfully');
          // Test ElevenLabs integration
          const testPassed = await repair.testElevenLabsIntegration();
          process.exit(testPassed ? 0 : 1);
        } else {
          console.log('❌ Repair process completed with some failures');
          process.exit(1);
        }
      } else if (args.includes('--logs')) {
        const logs = await repair.checkHealthCheckLogs();
        console.log('Recent health check failures:');
        logs.forEach(log => console.log(\`\${log.timestamp}: \${log.service} - \${log.message}\`));
      } else {
        console.log(\`
🔧 Mocoa Health Check Repair System

Usage:
  node repair-mocoa-health.js --check-health    Check current health status
  node repair-mocoa-health.js --repair-all      Perform comprehensive repair
  node repair-mocoa-health.js --logs            Show recent health check failures

This tool fixes the mocoa-container health check failures that cause
PCP computational agent failures in your Diamond SAO Command Center.
        \`);
      }
    } catch (error) {
      console.error('❌ CLI execution error:', error.message);
      process.exit(1);
    }
  })();
}`;

      // Replace the existing CLI section
      const cliStart = content.indexOf('// CLI interface');
      const exportLine = content.lastIndexOf('export default MocoaHealthRepair;');
      
      if (cliStart > -1 && exportLine > -1) {
        const beforeCLI = content.substring(0, cliStart);
        const afterExport = content.substring(exportLine);
        content = beforeCLI + cliSection + '\n\n' + afterExport;
        
        await fs.writeFile(filePath, content, 'utf8');
        logger.info('✅ Fixed CLI promise issues in repair-mocoa-health.js');
        return true;
      }
    } catch (error) {
      logger.error('Error fixing repair-mocoa-health.js:', error.message);
    }
    
    return false;
  }

  /**
   * Fix the self-healing ElevenLabs CLI issues
   */
  async fixSelfHealingElevenLabsCLI() {
    const filePath = '/Users/as/asoos/Aixtiv-Symphony/diamond-cli/self-healing-elevenlabs.js';
    
    try {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Fix the CLI interface
      const cliSection = `
// CLI interface for direct execution
const isMainModule = import.meta.url === \`file://\${process.argv[1]}\`;
if (isMainModule) {
  const healer = new ElevenLabsSelfHealer();
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  (async () => {
    try {
      if (args.includes('--start-monitoring')) {
        healer.startSelfMonitoring();
        healer.startHttpServer();
      } else if (args.includes('--health-check')) {
        const result = await healer.performHealthCheck();
        console.log('Health check result:', JSON.stringify(result, null, 2));
        process.exit(result.status === 'critical' ? 1 : 0);
      } else if (args.includes('--get-key')) {
        const key = await healer.getValidatedApiKey();
        console.log('Validated API key retrieved successfully');
        process.exit(0);
      } else {
        console.log(\`
🎯 ElevenLabs Self-Healing PCP System for AI Publishing International LLP

Usage:
  node self-healing-elevenlabs.js --start-monitoring    Start continuous monitoring
  node self-healing-elevenlabs.js --health-check       Perform one-time health check
  node self-healing-elevenlabs.js --get-key           Get validated API key

Environment Variables:
  OAUTH2_ENABLED=true                                  Enable OAuth2 validation
  ELEVENLABS_API_KEY=<fallback-key>                   Fallback API key (not recommended)

This system prevents popups by ensuring API keys are always valid and automatically
refreshed from Google Cloud Secret Manager with double validation.
        \`);
      }
    } catch (error) {
      console.error('❌ CLI execution error:', error.message);
      process.exit(1);
    }
  })();
}`;

      // Replace the existing CLI section
      const cliStart = content.indexOf('// CLI interface for direct execution');
      if (cliStart > -1) {
        const beforeCLI = content.substring(0, cliStart);
        content = beforeCLI + cliSection;
        
        await fs.writeFile(filePath, content, 'utf8');
        logger.info('✅ Fixed CLI promise issues in self-healing-elevenlabs.js');
        return true;
      }
    } catch (error) {
      logger.error('Error fixing self-healing-elevenlabs.js:', error.message);
    }
    
    return false;
  }

  /**
   * Run comprehensive promise fix across the entire codebase
   */
  async runComprehensiveFix() {
    logger.info('🚀 Starting comprehensive promise issue fix');
    
    // Step 1: Fix the specific CLI files first
    await this.fixRepairMocoaHealthCLI();
    await this.fixSelfHealingElevenLabsCLI();
    
    // Step 2: Scan for all JavaScript/TypeScript files
    logger.info('📁 Scanning for JavaScript/TypeScript files...');
    const files = await this.scanDirectory(this.rootPath);
    logger.info(`Found ${files.length} files to analyze`);
    
    // Step 3: Analyze files for promise issues
    const problemFiles = [];
    let analyzed = 0;
    
    for (const file of files) {
      const issues = await this.analyzeFile(file);
      if (issues) {
        problemFiles.push(issues);
      }
      analyzed++;
      
      if (analyzed % 100 === 0) {
        logger.info(`Analyzed ${analyzed}/${files.length} files...`);
      }
    }
    
    logger.info(`📊 Found promise issues in ${problemFiles.length} files`);
    
    // Step 4: Fix the issues
    let fixedCount = 0;
    for (const fileIssues of problemFiles) {
      const wasFixed = await this.fixFile(fileIssues.filePath, fileIssues.issues);
      if (wasFixed) {
        fixedCount++;
      }
    }
    
    // Step 5: Generate report
    const report = {
      totalFilesScanned: files.length,
      filesWithIssues: problemFiles.length,
      filesFixed: fixedCount,
      fixedFiles: this.fixedFiles,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(
      '/Users/as/asoos/Aixtiv-Symphony/diamond-cli/promise-fix-report.json',
      JSON.stringify(report, null, 2)
    );
    
    logger.info('🎉 Promise fix completed!');
    logger.info(`📊 Results: ${fixedCount}/${problemFiles.length} files fixed`);
    
    return report;
  }

  /**
   * Quick fix for immediate [object Promise] issues
   */
  async quickFix() {
    logger.info('⚡ Running quick fix for immediate issues...');
    
    // Fix the two main CLI files that are causing immediate issues
    const fixes = [
      await this.fixRepairMocoaHealthCLI(),
      await this.fixSelfHealingElevenLabsCLI()
    ];
    
    const successCount = fixes.filter(Boolean).length;
    logger.info(`✅ Quick fix completed: ${successCount}/2 files fixed`);
    
    return successCount === 2;
  }
}

// CLI interface
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const fixer = new PromiseIssueFixer();
  const args = process.argv.slice(2);
  
  (async () => {
    try {
      if (args.includes('--quick-fix')) {
        const success = await fixer.quickFix();
        process.exit(success ? 0 : 1);
      } else if (args.includes('--comprehensive')) {
        const report = await fixer.runComprehensiveFix();
        console.log('Fix complete. Report saved to promise-fix-report.json');
        process.exit(0);
      } else {
        console.log(`
🔧 Promise Issue Fixer for AIXTIV Symphony

Usage:
  node fix-all-promise-issues.js --quick-fix        Fix immediate CLI promise issues
  node fix-all-promise-issues.js --comprehensive    Full codebase promise fix

This tool eliminates [object Promise] issues throughout your system.
        `);
      }
    } catch (error) {
      console.error('❌ Fix execution error:', error.message);
      process.exit(1);
    }
  })();
}

export default PromiseIssueFixer;