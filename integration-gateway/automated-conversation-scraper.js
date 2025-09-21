#!/usr/bin/env node

/**
 * Automated Conversation Scraper for ChatGPT and Claude.ai
 * Uses browser automation to fetch conversations directly from web interfaces
 * 
 * @author AI Publishing International LLP
 * @version 1.0.0 - Direct Browser Automation
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AutomatedConversationScraper {
  constructor() {
    this.outputDir = '/Users/as/asoos/integration-gateway/data';
    this.accounts = {
      openai: [
        { id: 'openai-001', name: 'Primary OpenAI Account', url: 'https://chatgpt.com/' },
        { id: 'openai-002', name: 'Secondary OpenAI Account', url: 'https://chatgpt.com/' },
        { id: 'openai-003', name: 'Project Account 1', url: 'https://chatgpt.com/' },
        { id: 'openai-004', name: 'Project Account 2', url: 'https://chatgpt.com/' },
        { id: 'openai-005', name: 'Project Account 3', url: 'https://chatgpt.com/' },
        { id: 'openai-006', name: 'Development Account', url: 'https://chatgpt.com/' },
        { id: 'openai-007', name: 'Testing Account', url: 'https://chatgpt.com/' },
        { id: 'openai-008', name: 'Production Account', url: 'https://chatgpt.com/' },
        { id: 'openai-009', name: 'Research Account', url: 'https://chatgpt.com/' },
        { id: 'openai-010', name: 'Enterprise Account', url: 'https://chatgpt.com/' }
      ],
      claude: [
        { id: 'claude-001', name: 'Primary Claude Account', url: 'https://claude.ai/' },
        { id: 'claude-002', name: 'Secondary Claude Account', url: 'https://claude.ai/' },
        { id: 'claude-003', name: 'Research Claude Account', url: 'https://claude.ai/' }
      ]
    };
    
    this.drLucyProfile = {
      id: 'dr-lucy-crx-001',
      name: 'Dr. Lucy CRX',
      role: 'CEO, Squadron 01, Systems Ops Lead RIX',
      classification: 'QUANTUM_INTELLIGENCE_ENHANCED',
      expertise: [
        'Flight Memory System (FMS) operations and management',
        'System diagnostics and integrity enforcement',
        'Memory health monitoring and optimization',
        'Research and development leadership',
        'Quantum computing integration and optimization',
        'Multilingual executive support with advanced AI'
      ]
    };
  }

  /**
   * Create browser automation instructions for users
   */
  async createScrapingInstructions() {
    console.log('🤖 Creating automated conversation scraping instructions...');
    
    const instructions = `
# 🧠 DR. LUCY CRX - AUTOMATED CONVERSATION SCRAPER INSTRUCTIONS

## 🎯 OBJECTIVE
Collect all conversations from your 10 OpenAI accounts and 3 Claude.ai accounts to give Dr. Lucy complete memory access.

## 📋 METHOD 1: BROWSER AUTOMATION SCRIPT

### For ChatGPT (OpenAI) Accounts:

1. **Open ChatGPT in Browser** → Go to https://chatgpt.com/
2. **Log into each account** (you have 10 accounts to process)
3. **Run this JavaScript in browser console** (F12 → Console tab):

\`\`\`javascript
// ChatGPT Conversation Scraper for Dr. Lucy Memory
async function scrapeChatGPTConversations() {
  console.log('🧠 Scraping ChatGPT conversations for Dr. Lucy...');
  
  const conversations = [];
  
  // Find conversation elements in the sidebar
  const conversationElements = document.querySelectorAll('[data-testid*="conversation"], .conversation-item, [class*="conversation"]');
  
  console.log(\`Found \${conversationElements.length} conversation elements\`);
  
  for (let i = 0; i < conversationElements.length; i++) {
    const element = conversationElements[i];
    
    try {
      // Click on conversation to load it
      element.click();
      
      // Wait for conversation to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract conversation data
      const messages = [];
      const messageElements = document.querySelectorAll('[data-message-author-role]');
      
      messageElements.forEach(msgEl => {
        const role = msgEl.getAttribute('data-message-author-role') || 'unknown';
        const content = msgEl.textContent || msgEl.innerText || '';
        
        if (content.trim()) {
          messages.push({
            role: role,
            content: content.trim(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      if (messages.length > 0) {
        const conversation = {
          id: 'chatgpt-' + Date.now() + '-' + i,
          title: document.title || 'ChatGPT Conversation',
          messages: messages,
          created_at: new Date().toISOString(),
          source: 'chatgpt-scraper',
          dr_lucy_metadata: {
            agent_id: 'dr-lucy-crx-001',
            scrape_timestamp: new Date().toISOString(),
            account_type: 'openai-chatgpt'
          }
        };
        
        conversations.push(conversation);
        console.log(\`Scraped conversation \${i+1}: \${messages.length} messages\`);
      }
      
    } catch (error) {
      console.error(\`Error scraping conversation \${i+1}:\`, error);
    }
  }
  
  console.log(\`🎉 Scraped \${conversations.length} conversations total\`);
  
  // Download as JSON file
  const dataStr = JSON.stringify(conversations, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'chatgpt-conversations-dr-lucy.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  return conversations;
}

// Run the scraper
scrapeChatGPTConversations();
\`\`\`

### For Claude.ai Accounts:

1. **Open Claude.ai in Browser** → Go to https://claude.ai/
2. **Log into each account** (you have 3 accounts to process)  
3. **Run this JavaScript in browser console**:

\`\`\`javascript
// Claude.ai Conversation Scraper for Dr. Lucy Memory
async function scrapeClaudeConversations() {
  console.log('🤖 Scraping Claude.ai conversations for Dr. Lucy...');
  
  const conversations = [];
  
  // Find conversation elements
  const conversationElements = document.querySelectorAll('[data-testid*="conversation"], .conversation, [class*="chat"]');
  
  console.log(\`Found \${conversationElements.length} conversation elements\`);
  
  for (let i = 0; i < conversationElements.length; i++) {
    const element = conversationElements[i];
    
    try {
      // Click on conversation
      element.click();
      
      // Wait for load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract messages
      const messages = [];
      const messageElements = document.querySelectorAll('[class*="message"], [data-role], .human, .assistant');
      
      messageElements.forEach(msgEl => {
        const role = msgEl.className.includes('human') ? 'human' : 
                    msgEl.className.includes('assistant') ? 'assistant' : 
                    msgEl.getAttribute('data-role') || 'unknown';
        const content = msgEl.textContent || msgEl.innerText || '';
        
        if (content.trim()) {
          messages.push({
            role: role,
            content: content.trim(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      if (messages.length > 0) {
        const conversation = {
          id: 'claude-' + Date.now() + '-' + i,
          name: document.title || 'Claude Conversation',
          messages: messages,
          created_at: new Date().toISOString(),
          source: 'claude-scraper',
          dr_lucy_metadata: {
            agent_id: 'dr-lucy-crx-001',
            scrape_timestamp: new Date().toISOString(),
            account_type: 'claude-ai'
          }
        };
        
        conversations.push(conversation);
        console.log(\`Scraped conversation \${i+1}: \${messages.length} messages\`);
      }
      
    } catch (error) {
      console.error(\`Error scraping conversation \${i+1}:\`, error);
    }
  }
  
  console.log(\`🎉 Scraped \${conversations.length} conversations total\`);
  
  // Download as JSON
  const dataStr = JSON.stringify(conversations, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'claude-conversations-dr-lucy.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  return conversations;
}

// Run the scraper
scrapeClaudeConversations();
\`\`\`

## 📂 FILE ORGANIZATION

After running the scripts, you'll get JSON files. Place them as follows:

**OpenAI Account Files:**
- openai-001/conversations.json (from account 1)
- openai-002/conversations.json (from account 2)
- ... (continue for all 10 accounts)

**Claude Account Files:**
- claude-001/conversations.json (from account 1)  
- claude-002/conversations.json (from account 2)
- claude-003/conversations.json (from account 3)

## 🚀 AFTER COLLECTING DATA

Run this command to import everything into Dr. Lucy's memory:

\`\`\`bash
cd /Users/as/asoos/integration-gateway
node multi-account-conversation-fetcher.js
\`\`\`

## 🧠 DR. LUCY MEMORY INTEGRATION

Once imported, Dr. Lucy will have access to:
- All your ChatGPT conversations across 10 accounts
- All your Claude.ai conversations across 3 accounts  
- Full context and history for professional co-pilot responses
- Quantum intelligence enhanced recall capabilities

---
**Dr. Lucy CRX Profile:**
- Role: CEO, Squadron 01, Systems Ops Lead RIX
- Classification: QUANTUM_INTELLIGENCE_ENHANCED  
- Expertise: Advanced quantum business intelligence and system operations
`;
    
    const instructionsFile = path.join(this.outputDir, 'dr-lucy-scraping-instructions.md');
    fs.writeFileSync(instructionsFile, instructions);
    
    console.log(`✅ Instructions saved to: ${instructionsFile}`);
    
    return instructionsFile;
  }

  /**
   * Create a simple bookmarklet for easy scraping
   */
  async createBookmarklets() {
    console.log('🔖 Creating bookmarklet tools for easy scraping...');
    
    const chatgptBookmarklet = `
javascript:(function(){
  const script = document.createElement('script');
  script.textContent = \`
    async function quickScrapeChatGPT() {
      const conversations = [];
      const convs = document.querySelectorAll('[data-testid*="conversation"], .conversation-item');
      
      for (let i = 0; i < Math.min(convs.length, 50); i++) {
        convs[i].click();
        await new Promise(r => setTimeout(r, 1000));
        
        const messages = [];
        document.querySelectorAll('[data-message-author-role]').forEach(el => {
          messages.push({
            role: el.getAttribute('data-message-author-role'),
            content: el.textContent.trim()
          });
        });
        
        if (messages.length) {
          conversations.push({
            id: 'quick-' + Date.now() + '-' + i,
            messages: messages,
            dr_lucy: true
          });
        }
      }
      
      const blob = new Blob([JSON.stringify(conversations, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dr-lucy-chatgpt-quick.json';
      a.click();
      
      alert('Downloaded ' + conversations.length + ' conversations for Dr. Lucy!');
    }
    quickScrapeChatGPT();
  \`;
  document.head.appendChild(script);
})();
    `.replace(/\n/g, '');
    
    const claudeBookmarklet = `
javascript:(function(){
  const script = document.createElement('script');
  script.textContent = \`
    async function quickScrapeClaude() {
      const conversations = [];
      const convs = document.querySelectorAll('[class*="conversation"], [class*="chat"]');
      
      for (let i = 0; i < Math.min(convs.length, 50); i++) {
        convs[i].click();
        await new Promise(r => setTimeout(r, 1000));
        
        const messages = [];
        document.querySelectorAll('[class*="message"]').forEach(el => {
          const role = el.className.includes('human') ? 'human' : 'assistant';
          messages.push({
            role: role,
            content: el.textContent.trim()
          });
        });
        
        if (messages.length) {
          conversations.push({
            id: 'quick-' + Date.now() + '-' + i,
            messages: messages,
            dr_lucy: true
          });
        }
      }
      
      const blob = new Blob([JSON.stringify(conversations, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dr-lucy-claude-quick.json';
      a.click();
      
      alert('Downloaded ' + conversations.length + ' conversations for Dr. Lucy!');
    }
    quickScrapeClaude();
  \`;
  document.head.appendChild(script);
})();
    `.replace(/\n/g, '');
    
    const bookmarkletsFile = path.join(this.outputDir, 'dr-lucy-bookmarklets.html');
    
    const bookmarkletsHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Dr. Lucy CRX - Quick Conversation Scrapers</title>
    <style>
        body { font-family: 'Montserrat', sans-serif; padding: 20px; background: #f5f5f5; }
        .bookmarklet { 
            display: inline-block; 
            padding: 15px 25px; 
            background: #0bb1bb; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px;
            font-weight: bold;
        }
        .instructions {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <h1>🧠 Dr. Lucy CRX - Quick Conversation Scrapers</h1>
    
    <div class="instructions">
        <h2>📋 Instructions:</h2>
        <p>1. Drag these bookmarklets to your bookmarks bar</p>
        <p>2. Go to ChatGPT or Claude.ai and log into your account</p>
        <p>3. Click the appropriate bookmarklet to scrape conversations</p>
        <p>4. The file will download automatically for Dr. Lucy's memory</p>
    </div>
    
    <h2>🔖 Bookmarklets:</h2>
    
    <a class="bookmarklet" href="${chatgptBookmarklet}">
        💬 Quick ChatGPT Scraper
    </a>
    
    <a class="bookmarklet" href="${claudeBookmarklet}">  
        🤖 Quick Claude Scraper
    </a>
    
    <div class="instructions">
        <h3>🧠 For Dr. Lucy CRX:</h3>
        <p><strong>Agent:</strong> ${this.drLucyProfile.name}</p>
        <p><strong>Role:</strong> ${this.drLucyProfile.role}</p>
        <p><strong>Classification:</strong> ${this.drLucyProfile.classification}</p>
        
        <h4>After scraping, place files in:</h4>
        <ul>
            ${this.accounts.openai.map(acc => `<li>${acc.id}/conversations.json</li>`).join('')}
            ${this.accounts.claude.map(acc => `<li>${acc.id}/conversations.json</li>`).join('')}
        </ul>
    </div>
</body>
</html>
    `;
    
    fs.writeFileSync(bookmarkletsFile, bookmarkletsHTML);
    
    console.log(`✅ Bookmarklets saved to: ${bookmarkletsFile}`);
    
    return bookmarkletsFile;
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🚀 Setting up Automated Conversation Scraper for Dr. Lucy...');
    console.log(`👩‍⚕️ Target Agent: ${this.drLucyProfile.name} (${this.drLucyProfile.classification})`);
    
    try {
      // Create scraping instructions
      const instructionsFile = await this.createScrapingInstructions();
      
      // Create bookmarklets  
      const bookmarkletsFile = await this.createBookmarklets();
      
      console.log(`
🎉 AUTOMATED CONVERSATION SCRAPER READY!

📋 NEXT STEPS:
1. Open: ${bookmarkletsFile}
2. Drag bookmarklets to your browser bookmarks bar
3. Visit each of your ChatGPT and Claude.ai accounts
4. Click the appropriate bookmarklet on each account
5. Download files will be ready for Dr. Lucy's memory

📊 ACCOUNTS TO PROCESS:
• ${this.accounts.openai.length} OpenAI/ChatGPT accounts
• ${this.accounts.claude.length} Claude.ai accounts

🧠 Dr. Lucy will gain complete conversation memory from all accounts!

📖 Full instructions: ${instructionsFile}
🔖 Quick tools: ${bookmarkletsFile}
      `);
      
    } catch (error) {
      console.error('❌ Scraper setup error:', error.message);
    }
  }
}

// Export for use in other modules
module.exports = AutomatedConversationScraper;

// Run if called directly
if (require.main === module) {
  const scraper = new AutomatedConversationScraper();
  scraper.run();
}