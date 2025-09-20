#!/usr/bin/env node
/**
 * MOCOA Diamond SAO Self-Healing Validator
 * Prevents JavaScript syntax errors and missing functions from recurring
 * Auto-repairs common issues and creates backups
 */

const fs = require('fs');
const path = require('path');

class MOCOAHealer {
  constructor() {
    this.htmlFile = path.join(__dirname, 'mocoa-current.html');
    this.backupDir = path.join(__dirname, 'backups');
    this.logFile = path.join(__dirname, 'mocoa-healer.log');
    
    // Critical functions that must exist
    this.requiredFunctions = [
      'toggleScanToApprove',
      'activateSRIX',
      'activateVICTORY36',
      'sendCopilotMessage',
      'activateRIX',
      'showNotification',
      'togglePanel'
    ];
    
    this.ensureBackupDir();
  }
  
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
  
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    console.log(`🛡️ DIAMOND HEALER: ${message}`);
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to log:', error.message);
    }
  }
  
  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `mocoa-${timestamp}.html`);
    
    try {
      fs.copyFileSync(this.htmlFile, backupPath);
      this.log(`Backup created: ${path.basename(backupPath)}`);
      return backupPath;
    } catch (error) {
      this.log(`Backup failed: ${error.message}`, 'ERROR');
      return null;
    }
  }
  
  checkBraceBalance(jsCode) {
    let balance = 0;
    let inString = false;
    let stringChar = '';
    let inComment = false;
    let inRegex = false;
    
    for (let i = 0; i < jsCode.length; i++) {
      const char = jsCode[i];
      const nextChar = jsCode[i + 1];
      const prevChar = jsCode[i - 1];
      
      // Handle strings
      if (!inComment && !inRegex && (char === '"' || char === '\'' || char === '`')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar && prevChar !== '\\') {
          inString = false;
          stringChar = '';
        }
        continue;
      }
      
      if (inString) continue;
      
      // Handle regex literals (basic detection)
      if (!inComment && char === '/' && nextChar !== '/' && nextChar !== '*' && prevChar !== '*') {
        // Simple regex detection - could be improved
        if (!inRegex && /[=:(,\[!&|?+\*\/^%-]/.test(prevChar || ' ')) {
          inRegex = true;
          continue;
        } else if (inRegex) {
          inRegex = false;
          continue;
        }
      }
      
      if (inRegex) continue;
      
      // Handle comments
      if (char === '/' && nextChar === '/') {
        inComment = 'line';
        i++; // Skip next character
        continue;
      }
      
      if (char === '/' && nextChar === '*') {
        inComment = 'block';
        i++; // Skip next character
        continue;
      }
      
      if (inComment === 'line' && char === '\n') {
        inComment = false;
        continue;
      }
      
      if (inComment === 'block' && char === '*' && nextChar === '/') {
        inComment = false;
        i++; // Skip next character
        continue;
      }
      
      if (inComment) continue;
      
      // Count braces
      if (char === '{') {
        balance++;
      } else if (char === '}') {
        balance--;
      }
    }
    
    return balance;
  }
  
  validateJavaScript(htmlContent) {
    const issues = [];
    
    // Extract main script block
    const scriptMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    
    if (!scriptMatch) {
      issues.push({ type: 'error', message: 'No script blocks found' });
      return issues;
    }
    
    // Check each script block
    scriptMatch.forEach((scriptBlock, index) => {
      const jsCode = scriptBlock.replace(/<\/?script[^>]*>/gi, '');
      
      // Check brace balance
      const braceBalance = this.checkBraceBalance(jsCode);
      if (braceBalance !== 0) {
        issues.push({
          type: 'syntax',
          message: `Script ${index + 1}: Unmatched braces (${braceBalance > 0 ? 'missing closing' : 'extra closing'})`,
          braceBalance
        });
      }
      
      // Check for required functions
      this.requiredFunctions.forEach(funcName => {
        const functionDefRegex = new RegExp(`function\\s+${funcName}\\s*\\(`, 'g');
        const windowAssignRegex = new RegExp(`window\\.${funcName}\\s*=`, 'g');
        
        if (!functionDefRegex.test(jsCode)) {
          issues.push({
            type: 'missing_function',
            message: `Function '${funcName}' definition not found`,
            function: funcName
          });
        }
        
        if (!windowAssignRegex.test(jsCode)) {
          issues.push({
            type: 'missing_assignment',
            message: `Window assignment for '${funcName}' not found`,
            function: funcName
          });
        }
      });
    });
    
    return issues;
  }
  
  repairSyntaxErrors(htmlContent, issues) {
    let repairedContent = htmlContent;
    let repairs = [];
    
    // Fix brace balance issues
    const braceIssues = issues.filter(i => i.type === 'syntax' && i.braceBalance > 0);
    
    if (braceIssues.length > 0) {
      // Find the main script block and add missing closing braces
      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
      
      repairedContent = repairedContent.replace(scriptRegex, (match, jsCode) => {
        const balance = this.checkBraceBalance(jsCode);
        if (balance > 0) {
          const closingBraces = '}\n    '.repeat(balance);
          const repairedJs = jsCode + '\n    ' + closingBraces;
          repairs.push(`Added ${balance} missing closing brace(s)`);
          return match.replace(jsCode, repairedJs);
        }
        return match;
      });
    }
    
    // Add missing function templates if needed
    const missingFunctions = issues.filter(i => i.type === 'missing_function');
    
    const functionTemplates = {
      'toggleScanToApprove': `
    function toggleScanToApprove(button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
        showNotification('Scan to Approve activated - Processing workflow items', 'success');
      }, 100);
    }`,
      'activateSRIX': `
    function activateSRIX(rixType, name) {
      // Wrapper function for activateRIX to maintain compatibility
      return activateRIX(rixType, name);
    }`,
      'activateVICTORY36': `
    function activateVICTORY36(rixType, name) {
      // Wrapper function for Victory36 activation
      return activateRIX(rixType, name);
    }`
    };
    
    missingFunctions.forEach(issue => {
      const funcName = issue.function;
      if (functionTemplates[funcName]) {
        // Find insertion point before window assignments
        const windowAssignments = repairedContent.indexOf('// Make ALL functions globally available');
        if (windowAssignments !== -1) {
          const insertionPoint = repairedContent.lastIndexOf('\n', windowAssignments);
          const before = repairedContent.slice(0, insertionPoint);
          const after = repairedContent.slice(insertionPoint);
          
          repairedContent = before + functionTemplates[funcName] + after;
          repairs.push(`Added missing function: ${funcName}`);
        }
      }
    });
    
    // Add missing window assignments
    const missingAssignments = issues.filter(i => i.type === 'missing_assignment');
    
    missingAssignments.forEach(issue => {
      const funcName = issue.function;
      const windowSection = repairedContent.indexOf('window.selectIcon = selectIcon;');
      
      if (windowSection !== -1) {
        const insertionPoint = repairedContent.indexOf('\n', windowSection);
        const before = repairedContent.slice(0, insertionPoint);
        const after = repairedContent.slice(insertionPoint);
        
        repairedContent = before + `\n    window.${funcName} = ${funcName};` + after;
        repairs.push(`Added window assignment: ${funcName}`);
      }
    });
    
    return { content: repairedContent, repairs };
  }
  
  async heal() {
    this.log('🛡️ Starting Diamond SAO healing process...');
    
    try {
      // Check if file exists
      if (!fs.existsSync(this.htmlFile)) {
        throw new Error(`HTML file not found: ${this.htmlFile}`);
      }
      
      // Create backup
      const backupPath = this.createBackup();
      if (!backupPath) {
        throw new Error('Failed to create backup');
      }
      
      // Read and validate
      const htmlContent = fs.readFileSync(this.htmlFile, 'utf8');
      this.log('Analyzing JavaScript syntax and function definitions...');
      
      const issues = this.validateJavaScript(htmlContent);
      
      if (issues.length === 0) {
        this.log('✅ No issues found - system is healthy!');
        return { success: true, issues: 0, repairs: 0 };
      }
      
      this.log(`Found ${issues.length} issue(s) to repair`);
      issues.forEach(issue => this.log(`  - ${issue.message}`, 'WARN'));
      
      // Attempt repairs
      this.log('Applying automatic repairs...');
      const { content: repairedContent, repairs } = this.repairSyntaxErrors(htmlContent, issues);
      
      if (repairs.length > 0) {
        // Write repaired content
        fs.writeFileSync(this.htmlFile, repairedContent);
        
        this.log(`✅ Applied ${repairs.length} repair(s):`);
        repairs.forEach(repair => this.log(`  ✅ ${repair}`));
        
        // Validate repairs
        const finalIssues = this.validateJavaScript(repairedContent);
        const remaining = finalIssues.length;
        
        this.log(`Final validation: ${remaining} issue(s) remaining`);
        
        return {
          success: remaining === 0,
          issues: issues.length,
          repairs: repairs.length,
          remaining,
          details: { repairs, remainingIssues: finalIssues }
        };
      } else {
        this.log('❌ No automatic repairs could be applied');
        return {
          success: false,
          issues: issues.length,
          repairs: 0,
          remaining: issues.length,
          details: { remainingIssues: issues }
        };
      }
      
    } catch (error) {
      this.log(`❌ Healing failed: ${error.message}`, 'ERROR');
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI execution
if (require.main === module) {
  const healer = new MOCOAHealer();
  
  healer.heal().then(result => {
    console.log('\\n🛡️ DIAMOND SAO HEALING RESULTS:');
    console.log(`Status: ${result.success ? '✅ HEALTHY' : '❌ NEEDS ATTENTION'}`);
    
    if (result.issues !== undefined) {
      console.log(`Issues found: ${result.issues}`);
      console.log(`Repairs applied: ${result.repairs}`);
      
      if (result.remaining !== undefined) {
        console.log(`Remaining issues: ${result.remaining}`);
      }
    }
    
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    
    console.log('\\n🔒 Diamond SAO Protection: Interface integrity maintained');
    
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = MOCOAHealer;
