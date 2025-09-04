#!/usr/bin/env node
/**
 * MOCOA Diamond SAO Guardian
 * Prevents files from being reverted and maintains integrity
 * Creates checksums and monitors for unauthorized changes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MOCOAGuardian {
  constructor() {
    this.htmlFile = path.join(__dirname, 'mocoa-current.html');
    this.guardianDir = path.join(__dirname, '.guardian');
    this.logFile = path.join(__dirname, 'guardian.log');
    this.checksumFile = path.join(this.guardianDir, 'integrity.json');
    this.lockFile = path.join(this.guardianDir, 'guardian.lock');
    
    this.ensureGuardianDir();
  }
  
  ensureGuardianDir() {
    if (!fs.existsSync(this.guardianDir)) {
      fs.mkdirSync(this.guardianDir, { recursive: true });
    }
  }
  
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    console.log(`🛡️ GUARDIAN: ${message}`);
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to log:', error.message);
    }
  }
  
  calculateChecksum(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }
  
  saveIntegrityData(content) {
    const checksum = this.calculateChecksum(content);
    const timestamp = new Date().toISOString();
    
    const integrityData = {
      checksum,
      timestamp,
      size: content.length,
      lastModified: fs.statSync(this.htmlFile).mtime.toISOString(),
      protected: true
    };
    
    fs.writeFileSync(this.checksumFile, JSON.stringify(integrityData, null, 2));
    this.log(`Integrity checkpoint saved: ${checksum.substring(0, 8)}...`);
    return integrityData;
  }
  
  loadIntegrityData() {
    try {
      if (fs.existsSync(this.checksumFile)) {
        return JSON.parse(fs.readFileSync(this.checksumFile, 'utf8'));
      }
    } catch (error) {
      this.log(`Failed to load integrity data: ${error.message}`, 'WARN');
    }
    return null;
  }
  
  createLockFile() {
    const lockData = {
      pid: process.pid,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
    this.log(`Guardian lock created (PID: ${process.pid})`);
  }
  
  removeLockFile() {
    try {
      if (fs.existsSync(this.lockFile)) {
        fs.unlinkSync(this.lockFile);
        this.log('Guardian lock removed');
      }
    } catch (error) {
      this.log(`Failed to remove lock: ${error.message}`, 'WARN');
    }
  }
  
  detectChanges() {
    const currentContent = fs.readFileSync(this.htmlFile, 'utf8');
    const currentChecksum = this.calculateChecksum(currentContent);
    const storedData = this.loadIntegrityData();
    
    if (!storedData) {
      this.log('No integrity baseline found - creating one', 'WARN');
      return { changed: false, firstRun: true, currentContent };
    }
    
    if (currentChecksum !== storedData.checksum) {
      this.log(`File integrity compromised! Checksum mismatch`, 'ERROR');
      this.log(`Expected: ${storedData.checksum.substring(0, 12)}...`);
      this.log(`Current:  ${currentChecksum.substring(0, 12)}...`);
      return { changed: true, currentContent, storedData };
    }
    
    return { changed: false, currentContent, storedData };
  }
  
  createProtectedVersion() {
    this.log('🛡️ Creating protected version with integrity locks...');
    
    const content = fs.readFileSync(this.htmlFile, 'utf8');
    
    // Add integrity protection comments
    const protectionHeader = `
<!-- 🛡️ DIAMOND SAO GUARDIAN PROTECTION ACTIVE -->
<!-- File integrity monitored and protected -->
<!-- Checksum: ${this.calculateChecksum(content).substring(0, 16)} -->
<!-- Protected: ${new Date().toISOString()} -->
`;
    
    const protectionFooter = `
<!-- 🛡️ END DIAMOND SAO PROTECTION -->
`;
    
    // Insert protection markers if they don't exist
    let protectedContent = content;
    if (!content.includes('DIAMOND SAO GUARDIAN PROTECTION')) {
      protectedContent = protectionHeader + content + protectionFooter;
    }
    
    // Save the protected version
    fs.writeFileSync(this.htmlFile, protectedContent);
    this.saveIntegrityData(protectedContent);
    
    this.log('✅ Protected version created and locked');
    return protectedContent;
  }
  
  restoreFromBackup(storedData) {
    this.log('🔄 Attempting to restore from backup...');
    
    // Look for the most recent backup
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      this.log('No backup directory found', 'ERROR');
      return false;
    }
    
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('mocoa-') && file.endsWith('.html'))
      .sort()
      .reverse();
    
    if (backups.length === 0) {
      this.log('No backups found', 'ERROR');
      return false;
    }
    
    const latestBackup = path.join(backupDir, backups[0]);
    this.log(`Restoring from backup: ${backups[0]}`);
    
    try {
      const backupContent = fs.readFileSync(latestBackup, 'utf8');
      fs.writeFileSync(this.htmlFile, backupContent);
      this.saveIntegrityData(backupContent);
      this.log('✅ File restored from backup');
      return true;
    } catch (error) {
      this.log(`Backup restoration failed: ${error.message}`, 'ERROR');
      return false;
    }
  }
  
  setupFileWatcher() {
    this.log('👁️  Setting up file system monitoring...');
    
    let isProcessingChange = false;
    
    const watcher = fs.watch(this.htmlFile, (eventType, filename) => {
      if (isProcessingChange) return;
      
      this.log(`File change detected: ${eventType} on ${filename}`);
      
      isProcessingChange = true;
      setTimeout(() => {
        const changes = this.detectChanges();
        
        if (changes.changed) {
          this.log('🚨 UNAUTHORIZED FILE MODIFICATION DETECTED!', 'ERROR');
          
          // Attempt to restore
          if (this.restoreFromBackup(changes.storedData)) {
            this.log('🛡️ File integrity restored automatically');
          } else {
            this.log('❌ Failed to restore file integrity', 'ERROR');
          }
        }
        
        isProcessingChange = false;
      }, 1000);
    });
    
    // Cleanup on exit
    process.on('exit', () => {
      watcher.close();
      this.removeLockFile();
    });
    
    process.on('SIGINT', () => {
      this.log('Guardian shutting down...');
      watcher.close();
      this.removeLockFile();
      process.exit(0);
    });
    
    return watcher;
  }
  
  async protect() {
    this.log('🛡️ Starting Diamond SAO Guardian Protection...');
    
    try {
      // Create lock file
      this.createLockFile();
      
      // Check current state
      const changes = this.detectChanges();
      
      if (changes.firstRun) {
        this.log('First run - creating protected baseline');
        this.createProtectedVersion();
      } else if (changes.changed) {
        this.log('File has been modified - checking if restoration is needed');
        
        // For now, just update the checksum if the file seems intentionally modified
        // You can modify this logic based on your needs
        this.saveIntegrityData(changes.currentContent);
        this.log('Integrity baseline updated');
      } else {
        this.log('✅ File integrity verified - protection active');
      }
      
      // Set up monitoring
      this.setupFileWatcher();
      
      this.log('🛡️ Guardian protection is now ACTIVE');
      this.log('Press Ctrl+C to stop monitoring');
      
      // Keep the process running
      return new Promise(() => {}); // Run indefinitely
      
    } catch (error) {
      this.log(`Guardian failed: ${error.message}`, 'ERROR');
      this.removeLockFile();
      throw error;
    }
  }
  
  async status() {
    const changes = this.detectChanges();
    const lockExists = fs.existsSync(this.lockFile);
    
    console.log('\n🛡️ DIAMOND SAO GUARDIAN STATUS:');
    console.log(`File: ${this.htmlFile}`);
    console.log(`Protected: ${changes.storedData ? '✅ YES' : '❌ NO'}`);
    console.log(`Integrity: ${changes.changed ? '❌ COMPROMISED' : '✅ INTACT'}`);
    console.log(`Guardian Active: ${lockExists ? '✅ YES' : '❌ NO'}`);
    
    if (changes.storedData) {
      console.log(`Last Protected: ${changes.storedData.timestamp}`);
      console.log(`Checksum: ${changes.storedData.checksum.substring(0, 16)}...`);
    }
    
    return {
      protected: !!changes.storedData,
      integrity: !changes.changed,
      active: lockExists
    };
  }
}

// CLI execution
if (require.main === module) {
  const guardian = new MOCOAGuardian();
  const command = process.argv[2] || 'protect';
  
  switch (command) {
    case 'protect':
      guardian.protect().catch(error => {
        console.error('Guardian failed:', error.message);
        process.exit(1);
      });
      break;
      
    case 'status':
      guardian.status().then(status => {
        process.exit(status.protected && status.integrity ? 0 : 1);
      });
      break;
      
    case 'create':
      guardian.createProtectedVersion();
      console.log('✅ Protected version created');
      break;
      
    default:
      console.log('Usage: node mocoa-guardian.js [protect|status|create]');
      console.log('  protect - Start file monitoring and protection');
      console.log('  status  - Check current protection status');
      console.log('  create  - Create a protected version now');
      process.exit(1);
  }
}

module.exports = MOCOAGuardian;
