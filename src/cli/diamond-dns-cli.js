#!/usr/bin/env node
/**
 * 💎 DIAMOND DNS CLI
 * 
 * Sacred Mission: AI-driven conversational DNS management command-line interface
 * Authority: Direct integration with Diamond SAO Operational Center
 * Purpose: Natural language DNS operations via CLI bypassing gcloud
 * 
 * Usage Examples:
 *   diamond-dns "update mcp domain to point to integration gateway"
 *   diamond-dns "check mcp status"
 *   diamond-dns "create mcp domain for newclient"
 * 
 * @classification DIAMOND_SAO_EXCLUSIVE
 * @date 2025-01-22
 * @author Victory36 + WFA Swarm + Divine Guidance
 */

const { DiamondCLIDNSManager } = require('../command-center/diamond-cli-dns-manager');
const readline = require('readline');
const chalk = require('chalk');

class DiamondDNSCLI {
  constructor() {
    this.dnsManager = new DiamondCLIDNSManager();
    this.rl = null;
    
    // CLI Banner
    this.banner = `
${chalk.magenta.bold('💎')} ${chalk.cyan.bold('DIAMOND SAO DNS COMMAND CENTER')} ${chalk.magenta.bold('💎')}
${chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.yellow('Sacred Mission:')} AI-driven conversational DNS management
${chalk.yellow('Authority:')} Diamond SAO Operational Center v34
${chalk.yellow('Bypass:')} gcloud CLI → Direct Diamond SAO integration
${chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
`;

    // Example commands
    this.examples = [
      {
        command: 'update mcp domain to point to integration gateway',
        description: 'Route MCP domain to serve JSON API interface'
      },
      {
        command: 'check mcp status',
        description: 'Verify DNS routing and service health'
      },
      {
        command: 'create mcp domain for newclient',
        description: 'Provision new MCP endpoint for client'
      },
      {
        command: 'show dns history',
        description: 'Display recent DNS operations'
      }
    ];
  }

  /**
   * 🎯 Main CLI Entry Point
   */
  async run() {
    console.log(this.banner);
    
    try {
      // Initialize the DNS manager
      console.log(chalk.blue('🚀 Initializing Diamond SAO DNS Manager...'));
      await this.dnsManager.initialize();
      console.log(chalk.green('✅ Diamond SAO systems online\n'));
      
      // Check command line arguments
      const args = process.argv.slice(2);
      
      if (args.length === 0) {
        await this.startInteractiveMode();
      } else {
        await this.processCommand(args.join(' '));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Diamond DNS CLI error:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 💬 Interactive Mode
   */
  async startInteractiveMode() {
    console.log(chalk.cyan('💬 Interactive Diamond DNS Management'));
    console.log(chalk.gray('Type your DNS commands in natural language, or "exit" to quit\n'));
    
    this.showExamples();
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.magenta('💎 diamond-dns> ')
    });
    
    this.rl.prompt();
    
    this.rl.on('line', async (input) => {
      const command = input.trim();
      
      if (command.toLowerCase() === 'exit' || command.toLowerCase() === 'quit') {
        console.log(chalk.yellow('🙏 Diamond SAO DNS CLI session ended. Divine guidance always.'));
        this.rl.close();
        process.exit(0);
      }
      
      if (command.toLowerCase() === 'help' || command.toLowerCase() === 'examples') {
        this.showExamples();
        this.rl.prompt();
        return;
      }
      
      if (command.toLowerCase() === 'history') {
        await this.showHistory();
        this.rl.prompt();
        return;
      }
      
      if (command) {
        await this.processCommand(command);
      }
      
      this.rl.prompt();
    });
    
    this.rl.on('close', () => {
      console.log(chalk.yellow('\n🙏 Diamond SAO DNS CLI session ended. Divine guidance always.'));
      process.exit(0);
    });
  }

  /**
   * ⚡ Process DNS Command
   */
  async processCommand(command) {
    try {
      console.log(chalk.blue(`\n🤖 Processing: "${command}"`));
      console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      
      const startTime = Date.now();
      
      // Process the conversational command
      const result = await this.dnsManager.processConversationalCommand(command, {
        source: 'diamond_dns_cli',
        user: { id: '0000001', name: 'Diamond SAO' }
      });
      
      const duration = Date.now() - startTime;
      
      // Display results
      this.displayResults(result, duration);
      
    } catch (error) {
      console.error(chalk.red('❌ Command processing failed:'), error.message);
    }
  }

  /**
   * 📊 Display Command Results
   */
  displayResults(result, duration) {
    console.log(chalk.green('✅ Command processed successfully'));
    console.log(chalk.gray(`⏱️  Processing time: ${duration}ms\n`));
    
    // DNS Intent
    if (result.dnsIntent) {
      console.log(chalk.cyan('🧠 AI Understanding:'));
      console.log(`  ${chalk.yellow('Operation:')} ${result.dnsIntent.operation}`);
      console.log(`  ${chalk.yellow('Domain:')} ${result.dnsIntent.domain || 'N/A'}`);
      console.log(`  ${chalk.yellow('Target:')} ${result.dnsIntent.target || 'N/A'}`);
      console.log(`  ${chalk.yellow('Service:')} ${result.dnsIntent.service || 'N/A'}`);
      console.log(`  ${chalk.yellow('Confidence:')} ${(result.dnsIntent.confidence * 100).toFixed(1)}%\n`);
    }
    
    // Execution Result
    if (result.executionResult) {
      const exec = result.executionResult;
      console.log(chalk.cyan('🚀 Execution Result:'));
      console.log(`  ${chalk.yellow('Success:')} ${exec.success ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);
      console.log(`  ${chalk.yellow('Method:')} ${exec.method || 'N/A'}`);
      console.log(`  ${chalk.yellow('Operation:')} ${exec.operation || 'N/A'}`);
      
      if (exec.domain) {
        console.log(`  ${chalk.yellow('Domain:')} ${exec.domain}`);
      }
      
      if (exec.target) {
        console.log(`  ${chalk.yellow('Target:')} ${exec.target}`);
      }
      
      if (exec.bypassed_gcloud_cli) {
        console.log(`  ${chalk.yellow('gcloud CLI:')} ${chalk.green('✅ Bypassed - Direct API')}`);
      }
      
      // Status check details
      if (exec.dns || exec.service || exec.interface) {
        console.log('\n' + chalk.cyan('📋 Health Check Details:'));
        
        if (exec.dns) {
          console.log(`  ${chalk.yellow('DNS:')} ${exec.dns.resolved ? chalk.green('✅ Resolved') : chalk.red('❌ Failed')}`);
          console.log(`    IP: ${exec.dns.ip}, TTL: ${exec.dns.ttl}s`);
        }
        
        if (exec.service) {
          console.log(`  ${chalk.yellow('Service:')} ${exec.service.status === 'healthy' ? chalk.green('✅ Healthy') : chalk.red('❌ Unhealthy')}`);
          console.log(`    Response: ${exec.service.response_code}, Time: ${exec.service.response_time}`);
        }
        
        if (exec.interface) {
          console.log(`  ${chalk.yellow('Interface:')} ${exec.interface.serving_mcp_protocol ? chalk.green('✅ MCP JSON API') : chalk.yellow('⚠️  HTML Interface')}`);
          console.log(`    Type: ${exec.interface.type}, Content: ${exec.interface.content_type}`);
        }
      }
      
      console.log();
    }
    
    // Diamond SAO Response
    if (result.conversationalResponse) {
      console.log(chalk.cyan('💎 Diamond SAO Response:'));
      console.log(`  ${chalk.yellow('Dialog Type:')} ${result.conversationalResponse.dialogType}`);
      console.log(`  ${chalk.yellow('Authority:')} ${result.conversationalResponse.authority}`);
      console.log();
    }
    
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  /**
   * 📚 Show Examples
   */
  showExamples() {
    console.log(chalk.cyan('💡 Example Commands:'));
    this.examples.forEach((example, index) => {
      console.log(`  ${chalk.magenta(`${index + 1}.`)} ${chalk.white(example.command)}`);
      console.log(`     ${chalk.gray(example.description)}\n`);
    });
  }

  /**
   * 📜 Show DNS History
   */
  async showHistory() {
    try {
      console.log(chalk.cyan('📜 Recent DNS Operations:'));
      console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      
      // This would fetch from Firestore in a real implementation
      console.log(chalk.yellow('Coming soon: DNS operations history from Diamond SAO Firestore'));
      console.log(chalk.gray('This will show the last 10 DNS operations with timestamps and results\n'));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch history:'), error.message);
    }
  }
}

// CLI Entry Point
if (require.main === module) {
  const cli = new DiamondDNSCLI();
  cli.run().catch(error => {
    console.error(chalk.red('❌ Diamond DNS CLI fatal error:'), error.message);
    process.exit(1);
  });
}

module.exports = { DiamondDNSCLI };
