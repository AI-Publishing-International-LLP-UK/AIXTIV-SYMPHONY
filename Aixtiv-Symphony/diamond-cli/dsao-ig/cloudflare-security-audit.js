#!/usr/bin/env node

/**
 * Cloudflare Security Consolidation Script
 * Diamond Quantum Speed Operations - Phase 4
 * 
 * Purpose: Audit Cloudflare resources, consolidate security, prepare for 10K company MCP structure
 * Authority: Diamond SAO Command Center Integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`💎 CLOUDFLARE SECURITY AUDIT & CONSOLIDATION`);
console.log(`🏛️  Authority: Diamond SAO Command Center Integration`);
console.log(`🔐 Evolution Path: Multi-tenant → Unified Security Architecture`);
console.log(``);

const auditResults = {
    kvNamespaces: [],
    emptyKVs: [],
    securityRisks: [],
    pagesProjects: [],
    duplicateProjects: [],
    productionDomains: {
        protected: [],
        needsAttention: [],
        mcpDomains: []
    },
    recommendations: []
};

// Get all KV namespaces
function auditKVNamespaces() {
    console.log(`🔍 [${new Date().toISOString()}] 📊 Auditing KV Namespaces...`);
    
    try {
        const kvList = JSON.parse(execSync('wrangler kv namespace list', { encoding: 'utf8' }));
        auditResults.kvNamespaces = kvList;
        
        console.log(`✅ Found ${kvList.length} KV namespaces`);
        
        // Check each namespace for content and security risks
        for (const kv of kvList) {
            console.log(`   🔍 Checking: ${kv.title}`);
            
            try {
                const keys = JSON.parse(execSync(`wrangler kv key list --namespace-id=${kv.id} --preview`, { encoding: 'utf8' }));
                
                if (keys.length === 0) {
                    auditResults.emptyKVs.push(kv);
                    console.log(`      📭 Empty namespace: ${kv.title}`);
                }
                
                // Security risk assessment
                const securityKeywords = ['token', 'secret', 'key', 'auth', 'password', 'oauth'];
                if (securityKeywords.some(keyword => kv.title.toLowerCase().includes(keyword))) {
                    auditResults.securityRisks.push({
                        namespace: kv,
                        keyCount: keys.length,
                        risk: keys.length > 0 ? 'HIGH - Contains keys in security-sensitive namespace' : 'LOW - Empty security namespace'
                    });
                }
                
            } catch (error) {
                console.log(`      ⚠️  Could not audit keys for ${kv.title}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error(`❌ KV namespace audit failed: ${error.message}`);
    }
}

// Audit Pages projects for duplicates and security
function auditPagesProjects() {
    console.log(`🔍 [${new Date().toISOString()}] 📄 Auditing Cloudflare Pages Projects...`);
    
    try {
        const output = execSync('wrangler pages project list', { encoding: 'utf8' });
        
        // Parse the table output (simplified - in production would use proper parsing)
        const lines = output.split('\n');
        const projectLines = lines.filter(line => line.includes('.pages.dev'));
        
        for (const line of projectLines) {
            // Extract project info from table format
            const match = line.match(/│\s*([^│]+?)\s*│\s*([^│]+?)\s*│/);
            if (match) {
                const projectName = match[1].trim();
                const domains = match[2].trim();
                
                auditResults.pagesProjects.push({
                    name: projectName,
                    domains: domains,
                    raw: line
                });
                
                // Identify potential duplicates
                const duplicatePatterns = ['asoos-2100-cool', '2100-cool', 'coaching2100'];
                for (const pattern of duplicatePatterns) {
                    if (projectName.includes(pattern)) {
                        auditResults.duplicateProjects.push(projectName);
                    }
                }
            }
        }
        
        console.log(`✅ Found ${auditResults.pagesProjects.length} Pages projects`);
        console.log(`⚠️  Found ${auditResults.duplicateProjects.length} potential duplicate projects`);
        
    } catch (error) {
        console.error(`❌ Pages project audit failed: ${error.message}`);
    }
}

// Test production domain health
function testProductionDomains() {
    console.log(`🔍 [${new Date().toISOString()}] 🌐 Testing Production Domain Health...`);
    
    const criticalDomains = [
        '2100.cool',
        'asoos.2100.cool',
        'mcp.aipub.2100.cool',
        'mcp.asoos.2100.cool',
        'mcp.company.2100.cool',
        'coach.2100.cool',
        'coaching2100.com',
        'sallyport.2100.cool'
    ];
    
    for (const domain of criticalDomains) {
        try {
            console.log(`   🔍 Testing: ${domain}`);
            const result = execSync(`curl -sI https://${domain}`, { encoding: 'utf8', timeout: 10000 });
            const statusMatch = result.match(/HTTP\/\d+\s+(\d+)/);
            const status = statusMatch ? parseInt(statusMatch[1]) : 0;
            
            if (status >= 200 && status < 300) {
                auditResults.productionDomains.protected.push(domain);
                console.log(`      ✅ ${domain} - Status: ${status}`);
            } else {
                auditResults.productionDomains.needsAttention.push({ domain, status });
                console.log(`      ⚠️  ${domain} - Status: ${status || 'Connection failed'}`);
            }
            
            // Check for MCP headers
            if (domain.startsWith('mcp.')) {
                auditResults.productionDomains.mcpDomains.push({
                    domain,
                    status,
                    isMCP: result.includes('x-diamond-sao') || result.includes('x-mcp-source')
                });
            }
            
        } catch (error) {
            auditResults.productionDomains.needsAttention.push({ 
                domain, 
                status: 'ERROR', 
                error: error.message 
            });
            console.log(`      ❌ ${domain} - Error: ${error.message}`);
        }
    }
}

// Generate security recommendations
function generateRecommendations() {
    console.log(`🔍 [${new Date().toISOString()}] 💡 Generating Security Recommendations...`);
    
    // KV cleanup recommendations
    if (auditResults.emptyKVs.length > 0) {
        auditResults.recommendations.push({
            priority: 'LOW',
            category: 'Cleanup',
            action: `Delete ${auditResults.emptyKVs.length} empty KV namespaces`,
            details: auditResults.emptyKVs.map(kv => kv.title)
        });
    }
    
    // Security risk recommendations
    if (auditResults.securityRisks.length > 0) {
        const highRiskNamespaces = auditResults.securityRisks.filter(risk => risk.keyCount > 0);
        if (highRiskNamespaces.length > 0) {
            auditResults.recommendations.push({
                priority: 'HIGH',
                category: 'Security',
                action: 'Migrate sensitive tokens to GCP Secret Manager',
                details: highRiskNamespaces.map(risk => `${risk.namespace.title} (${risk.keyCount} keys)`)
            });
        }
    }
    
    // Duplicate project recommendations
    if (auditResults.duplicateProjects.length > 0) {
        auditResults.recommendations.push({
            priority: 'MEDIUM',
            category: 'Consolidation',
            action: 'Remove duplicate/test Pages projects',
            details: [...new Set(auditResults.duplicateProjects)] // Remove duplicates
        });
    }
    
    // Domain health recommendations
    if (auditResults.productionDomains.needsAttention.length > 0) {
        auditResults.recommendations.push({
            priority: 'HIGH',
            category: 'Domain Health',
            action: 'Fix broken production domains',
            details: auditResults.productionDomains.needsAttention.map(d => `${d.domain} (${d.status})`)
        });
    }
}

// Generate comprehensive audit report
function generateAuditReport() {
    console.log(`📊 [${new Date().toISOString()}] 📋 Generating Comprehensive Audit Report...`);
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalKVNamespaces: auditResults.kvNamespaces.length,
            emptyKVNamespaces: auditResults.emptyKVs.length,
            securityRisks: auditResults.securityRisks.length,
            totalPagesProjects: auditResults.pagesProjects.length,
            duplicateProjects: [...new Set(auditResults.duplicateProjects)].length,
            protectedDomains: auditResults.productionDomains.protected.length,
            brokenDomains: auditResults.productionDomains.needsAttention.length,
            mcpDomains: auditResults.productionDomains.mcpDomains.length,
            totalRecommendations: auditResults.recommendations.length
        },
        results: auditResults,
        securityScore: calculateSecurityScore(),
        nextSteps: [
            'Review and implement HIGH priority recommendations immediately',
            'Plan migration of sensitive tokens to GCP Secret Manager',
            'Remove duplicate/test projects after domain verification',
            'Monitor MCP domain health and DNS propagation',
            'Schedule regular security audits'
        ]
    };
    
    // Write detailed report
    const reportPath = path.join(__dirname, 'cloudflare-security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`✅ Comprehensive audit report saved to: ${reportPath}`);
    return report;
}

function calculateSecurityScore() {
    let score = 100;
    
    // Deduct for security risks
    score -= auditResults.securityRisks.filter(risk => risk.keyCount > 0).length * 20;
    
    // Deduct for broken domains
    score -= auditResults.productionDomains.needsAttention.length * 10;
    
    // Deduct for too many duplicates
    score -= Math.min([...new Set(auditResults.duplicateProjects)].length * 5, 30);
    
    return Math.max(score, 0);
}

// Main execution
async function main() {
    try {
        console.log(`🚀 [${new Date().toISOString()}] Starting Diamond Quantum Security Audit...`);
        
        auditKVNamespaces();
        auditPagesProjects();
        testProductionDomains();
        generateRecommendations();
        
        const report = generateAuditReport();
        
        console.log(`\\n💎 AUDIT COMPLETE - DIAMOND QUANTUM SECURITY STATUS`);
        console.log(`==============================================`);
        console.log(`🔐 Security Score: ${report.securityScore}/100`);
        console.log(`📊 Total KV Namespaces: ${report.summary.totalKVNamespaces}`);
        console.log(`🗑️  Empty KV Namespaces: ${report.summary.emptyKVNamespaces}`);
        console.log(`⚠️  Security Risks: ${report.summary.securityRisks}`);
        console.log(`📄 Pages Projects: ${report.summary.totalPagesProjects}`);
        console.log(`🔄 Duplicate Projects: ${report.summary.duplicateProjects}`);
        console.log(`✅ Protected Domains: ${report.summary.protectedDomains}`);
        console.log(`❌ Broken Domains: ${report.summary.brokenDomains}`);
        console.log(`🌐 MCP Domains: ${report.summary.mcpDomains}`);
        console.log(`📋 Recommendations: ${report.summary.totalRecommendations}`);
        
        console.log(`\\n🎯 HIGH PRIORITY ACTIONS:`);
        const highPriorityActions = auditResults.recommendations.filter(rec => rec.priority === 'HIGH');
        if (highPriorityActions.length > 0) {
            highPriorityActions.forEach((action, index) => {
                console.log(`${index + 1}. ${action.category}: ${action.action}`);
            });
        } else {
            console.log(`✅ No high priority security issues found`);
        }
        
        console.log(`\\n✅ [${new Date().toISOString()}] Diamond Quantum Security Audit completed successfully`);
        
    } catch (error) {
        console.error(`❌ [${new Date().toISOString()}] Audit failed: ${error.message}`);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = {
    auditKVNamespaces,
    auditPagesProjects,
    testProductionDomains,
    generateRecommendations,
    generateAuditReport,
    main
};
