#!/usr/bin/env node

/**
 * 💎 DIAMOND QUANTUM SPEED OPERATIONS - DUPLICATION REMOVAL SCRIPT
 * 
 * Authority: Mr. Phillip Corey Roark (0000001) - Diamond SAO Command Center
 * Purpose: Remove duplicate JavaScript files and create proper references
 * 
 * @classification DIAMOND_SAO_EXCLUSIVE
 * @date 2025-09-02
 */

const fs = require('fs').promises;
const path = require('path');

class DuplicationRemover {
    constructor() {
        this.duplicateMapping = {
            'enhanced-wfa-mcp-integration.js': {
                main: './enhanced-wfa-mcp-integration.js',
                duplicates: [
                    './deploy-package/enhanced-wfa-mcp-integration.js',
                    './mocoa-source/enhanced-wfa-mcp-integration.js',
                    './mocoa-cloud-run/enhanced-wfa-mcp-integration.js'
                ]
            },
            'dream-commander-integration.js': {
                main: './mocoa-source/dream-commander-integration.js',
                duplicates: [
                    './deploy-package/dream-commander-integration.js',
                    './mocoa-cloud-run/dream-commander-integration.js'
                ]
            },
            'ufo-mcp-integration.js': {
                main: './ufo-mcp-integration.js',
                duplicates: [
                    './deploy-package/ufo-mcp-integration.js',
                    './mocoa-source/ufo-mcp-integration.js',
                    './mocoa-cloud-run/ufo-mcp-integration.js'
                ]
            },
            'enterprise-security-anti-lock.js': {
                main: './mocoa-source/enterprise-security-anti-lock.js',
                duplicates: [
                    './deploy-package/enterprise-security-anti-lock.js',
                    './mocoa-cloud-run/enterprise-security-anti-lock.js'
                ]
            }
        };
    }

    async removeDuplicates() {
        console.log('💎 DIAMOND QUANTUM SPEED OPERATIONS - Removing duplicates...\n');
        let totalRemoved = 0;

        for (const [fileName, config] of Object.entries(this.duplicateMapping)) {
            console.log(`🔍 Processing: ${fileName}`);
            
            // Check if main file exists
            try {
                await fs.access(config.main);
                console.log(`  ✅ Main file exists: ${config.main}`);
            } catch (error) {
                console.log(`  ⚠️ Main file missing: ${config.main}`);
                continue;
            }

            // Remove duplicates
            for (const duplicate of config.duplicates) {
                try {
                    await fs.access(duplicate);
                    await fs.unlink(duplicate);
                    console.log(`  🗑️ Removed duplicate: ${duplicate}`);
                    totalRemoved++;
                } catch (error) {
                    console.log(`  ℹ️ Already removed or doesn't exist: ${duplicate}`);
                }
            }
            console.log('');
        }

        // Remove node_modules duplicates (these are expected)
        console.log('📦 Ignoring node_modules duplicates (expected for dependencies)');
        
        console.log(`🎉 Duplication removal complete! Removed ${totalRemoved} duplicate files.\n`);
        console.log('✅ Benefits:');
        console.log('  • Reduced codebase size');
        console.log('  • Eliminated maintenance overhead');
        console.log('  • Improved deployment consistency');
        console.log('  • Single source of truth for each module');
    }

    async run() {
        await this.removeDuplicates();
    }
}

if (require.main === module) {
    new DuplicationRemover().run().catch(console.error);
}

module.exports = DuplicationRemover;
