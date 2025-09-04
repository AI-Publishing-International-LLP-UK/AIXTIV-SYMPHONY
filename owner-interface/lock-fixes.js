#!/usr/bin/env node
/**
 * MOCOA Fix Locker - Prevents fixes from being reverted
 * Simple approach: commit changes immediately and make file read-only
 */

const fs = require('fs');
const { execSync } = require('child_process');

function lockFixes() {
  console.log('🔒 Locking fixes in place...');
  
  try {
    // 1. First run the healer to fix any current issues
    console.log('1. Running healer to fix current issues...');
    execSync('node mocoa-healer.js', { stdio: 'inherit' });
    
    // 2. Add and commit the fixes to git immediately
    console.log('2. Committing fixes to git...');
    execSync('git add mocoa-current.html', { stdio: 'inherit' });
    execSync('git commit -m "🛡️ DIAMOND SAO: Lock JavaScript fixes in place"', { stdio: 'inherit' });
    
    // 3. Make the file temporarily read-only to prevent overwrites
    console.log('3. Setting file protection...');
    execSync('chmod 444 mocoa-current.html');
    
    console.log('✅ Fixes are now locked in place!');
    console.log('📌 File is committed to git and protected from writes');
    console.log('🔓 To unlock: chmod 644 mocoa-current.html');
    
  } catch (error) {
    console.error('❌ Failed to lock fixes:', error.message);
    
    // If chmod failed, try to restore write permissions
    try {
      execSync('chmod 644 mocoa-current.html');
    } catch (e) {
      // Ignore
    }
  }
}

function unlockFixes() {
  console.log('🔓 Unlocking fixes...');
  try {
    execSync('chmod 644 mocoa-current.html');
    console.log('✅ File is now editable again');
  } catch (error) {
    console.error('❌ Failed to unlock:', error.message);
  }
}

function status() {
  try {
    const stats = fs.statSync('mocoa-current.html');
    const isReadOnly = !(stats.mode & parseInt('200', 8));
    
    console.log('\n🛡️ LOCK STATUS:');
    console.log(`File: mocoa-current.html`);
    console.log(`Protected: ${isReadOnly ? '✅ YES (read-only)' : '❌ NO (writable)'}`);
    console.log(`Last modified: ${stats.mtime}`);
    
    // Check git status
    try {
      const gitStatus = execSync('git status --porcelain mocoa-current.html', { encoding: 'utf8' });
      console.log(`Git status: ${gitStatus.trim() || 'Clean (committed)'}`);
    } catch (e) {
      console.log('Git status: Unknown');
    }
    
  } catch (error) {
    console.error('❌ Failed to check status:', error.message);
  }
}

// CLI
const command = process.argv[2] || 'lock';

switch (command) {
  case 'lock':
    lockFixes();
    break;
  case 'unlock':
    unlockFixes();
    break;
  case 'status':
    status();
    break;
  default:
    console.log('Usage: node lock-fixes.js [lock|unlock|status]');
    console.log('  lock   - Fix issues and lock file against changes');
    console.log('  unlock - Remove file protection');
    console.log('  status - Show current lock status');
}
