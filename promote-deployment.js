#!/usr/bin/env node

/**
 * Cloudflare Pages Deployment Promotion Script
 * Promotes deployment 554e2c69-47c4-4fdb-9406-0be9c4ff4096 to production
 * Uses OAuth authentication from wrangler configuration
 */

import { execSync } from 'child_process';
import https from 'https';
import fs from 'fs';
import os from 'os';

const ACCOUNT_ID = 'aef30d920913c188b9b6048cc7f42951';
const PROJECT_NAME = '2100-cool-primary';
const DEPLOYMENT_ID = '554e2c69-47c4-4fdb-9406-0be9c4ff4096';

async function promoteDeployment() {
    console.log('🚀 Promoting Cloudflare Pages deployment via OAuth...');
    console.log(`📦 Deployment ID: ${DEPLOYMENT_ID}`);
    console.log(`🎯 Project: ${PROJECT_NAME}`);
    
    try {
        // Try to get the OAuth token from wrangler
        console.log('🔑 Retrieving OAuth authentication...');
        
        // Method 1: Try wrangler config
        let authToken = '';
        try {
            const configPath = os.homedir() + '/.wrangler/config/default.toml';
            if (fs.existsSync(configPath)) {
                const config = fs.readFileSync(configPath, 'utf8');
                const tokenMatch = config.match(/api_token\s*=\s*"([^"]+)"/);
                if (tokenMatch) {
                    authToken = tokenMatch[1];
                    console.log('✅ Found API token in wrangler config');
                }
            }
        } catch (e) {
            console.log('⚠️ Could not read wrangler config');
        }
        
        if (!authToken) {
            console.log('❌ No OAuth token found.');
            console.log('💡 Please ensure wrangler is authenticated with: wrangler auth login');
            process.exit(1);
        }
        
        // Make the promotion API call
        const postData = JSON.stringify({
            deployment_trigger: {
                type: 'production_promotion'
            }
        });
        
        const options = {
            hostname: 'api.cloudflare.com',
            port: 443,
            path: `/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments/${DEPLOYMENT_ID}`,
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        console.log('📡 Making promotion API call...');
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.success) {
                        console.log('🎉 SUCCESS! Deployment promoted to production!');
                        console.log('🌐 Production URL: https://2100.cool');
                        console.log('📦 Preview URL: https://554e2c69.2100-cool-primary.pages.dev');
                        console.log('✅ Deployment is now live and serving the domain');
                        
                        // Now we need to remove Cloudflare Access protection
                        console.log('\n🔓 Next step: Remove Cloudflare Access protection...');
                        console.log('💡 Run: wrangler pages project edit 2100-cool-primary --access-policy=none');
                        
                    } else {
                        console.error('❌ API Error:', response);
                        if (response.errors) {
                            response.errors.forEach(error => {
                                console.error(`  - ${error.message}`);
                            });
                        }
                    }
                } catch (e) {
                    console.error('❌ Failed to parse API response:', data);
                }
            });
        });
        
        req.on('error', (e) => {
            console.error('❌ Request failed:', e.message);
        });
        
        req.write(postData);
        req.end();
        
    } catch (error) {
        console.error('❌ Promotion failed:', error.message);
        process.exit(1);
    }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    promoteDeployment();
}
