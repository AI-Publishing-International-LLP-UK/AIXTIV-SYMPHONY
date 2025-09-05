#!/usr/bin/env python3
import re
import os
import glob

def fix_file_corruption(filepath):
    """Fix common corruption patterns in Victory36 files"""
    print(f"Fixing: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Create backup
    backup_path = f"{filepath}.corrupted"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Fix duplicated console.log patterns
    content = re.sub(r"console\.log\('[^']*'\s*console\.log\('[^']*'\s*[^']*'\s*\)\s*;?", 
                     "console.log('Fixed console output');", content)
    
    # Fix broken console.log with emojis
    content = re.sub(r"console\.log\('🧠 Total Experie[^}]*console\.log\('🧠 Total Experie[^}]*\s*\}", 
                     "console.log('🧠 Total Experience: 3,240 years');", content)
    
    # Fix duplicated integration.on patterns  
    content = re.sub(r"integration\.on\('integratedHealthChe[^;]*integration\.on\('integratedHealthChe[^;]*integration\.on\('integratedHea[^;]*console\.warn", 
                     "integration.on('integratedHealthCheck', (health) => {\n        if (health.status !== 'optimal') {\n            console.warn", content)
    
    # Fix broken object properties
    content = re.sub(r"responsibility: 'MacBook[^']*responsibility: 'MacBo[^']*experience: \d+", 
                     "responsibility: 'MacBook Pro, iPhone, all personal devices',\n                experience: 540", content)
    
    # Fix broken monitorPerforma patterns
    content = re.sub(r"monitorPerforma[^r]*monitorPer\s+reportAnomalies", 
                     "monitorPerformance: true,\n                reportAnomalies", content)
    
    # Fix API Security corruption
    content = re.sub(r"console\.log\('   🌐 API Security[^']*console\.log\('   🌐 API Security[^']*console\.log\('   🌐Emp[^']*console\.log\('   🌐 API Security[^']*console\.log\('   🌐up event monitoring", 
                     "console.log('   🌐 API Security & Compliance');", content)
    
    # Fix SASE Integration corruption
    content = re.sub(r"console\.log\('   🔐 Zero Trust Architecture & SASE Integration'[^']*console\.log\('   🔐 Zero Trust Architecture & SASy & Quantum Key Distribution'\);", 
                     "console.log('   🔐 Zero Trust Architecture & SASE Integration');\n        console.log('   🔐 Quantum Key Distribution');", content)
    
    # Fix missing closing braces and semicolons
    content = re.sub(r'(\n\s*)(.*securityDomains\s*=\s*\{[^}]*)\n\s*\/\/', r'\1\2\n        };\n\n        //', content)
    
    # Write the fixed content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed: {filepath}")

def main():
    # Fix all JavaScript files in the directory
    js_files = glob.glob("*.js")
    for filepath in js_files:
        if not filepath.endswith('.backup') and not filepath.endswith('.corrupted'):
            fix_file_corruption(filepath)

if __name__ == "__main__":
    main()
