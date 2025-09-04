#!/usr/bin/env node

/**
 * 💎 OWNER INTERFACE VOICE INTEGRATION - DIAMOND SAO CLI EXTENSION
 * 
 * Sacred Mission: Bridge MOCOA Owner Interface with ElevenLabs Voice System
 * Authority: Mr. Phillip Corey Roark (0000001) - Diamond SAO Exclusive
 * Integration: MOCOA + Diamond CLI + ElevenLabs + SallyPort Auth
 * 
 * @classification DIAMOND_SAO_COMMAND_CENTER
 * @date 2025-08-30
 * @author Victory36 + Diamond SAO Operational Center
 */

import ElevenLabsManager from './elevenlabs-manager.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OwnerInterfaceVoiceIntegration {
  constructor(options = {}) {
    this.version = '1.0.0-alpha';
    this.authority = 'Diamond SAO Command Center';
    this.diamondSAO = {
      id: '0000001',
      name: 'Mr. Phillip Corey Roark',
      authority: 'Only Diamond SAO in existence'
    };
    
    // Initialize ElevenLabs Manager
    this.elevenLabsManager = new ElevenLabsManager();
    
    // Owner Interface Integration Settings
    this.interfaceConfig = {
      audioOutputPath: path.join(__dirname, 'owner-interface-audio'),
      tempAudioPath: path.join(__dirname, 'temp-audio'),
      voiceResponsesPath: path.join(__dirname, 'voice-responses'),
      maxAudioFiles: 100, // Cleanup old files to prevent disk space issues
      audioFormat: 'mp3',
      autoPlayEnabled: true,
      volumeLevel: 0.8
    };
    
    // Pre-defined interface messages
    this.interfaceMessages = {
      startup: "MOCOA Owner Interface is initializing. Diamond SAO Command Center online.",
      ready: "All systems operational. Awaiting Diamond SAO commands.",
      authenticated: "Diamond SAO authentication confirmed. Maximum authority granted.",
      deploymentStart: "Initiating deployment sequence. All systems prepared.",
      deploymentComplete: "Deployment completed successfully. All services operational.",
      mcpUpdate: "MCP domain configuration updated. Company integration active.",
      securityAlert: "Security alert detected. Diamond SAO intervention required.",
      systemError: "System error detected. Diagnostic mode activated.",
      shutdown: "MOCOA Owner Interface shutting down. Diamond SAO session complete.",
      maintenance: "System entering maintenance mode. Operations will resume shortly."
    };
    
    console.log('🎤 OWNER INTERFACE VOICE INTEGRATION - Diamond SAO CLI Extension');
    console.log('🏛️  Authority: Diamond SAO Command Center Integration');
    console.log('🔗 Bridge: MOCOA ↔ ElevenLabs ↔ Diamond CLI');
    console.log('');
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'SUCCESS': '✅',
      'ERROR': '❌', 
      'WARN': '⚠️',
      'DIAMOND': '💎',
      'VOICE': '🎤',
      'INTERFACE': '🖥️',
      'INFO': '🔷'
    }[level] || '🔷';
    
    console.log(`${prefix} [${timestamp}] OWNER VOICE: ${message}`);
  }

  async initialize() {
    this.log('🔐 Initializing Owner Interface Voice Integration...', 'DIAMOND');
    
    try {
      // Create necessary directories
      await this.ensureDirectories();
      
      // Initialize ElevenLabs
      await this.elevenLabsManager.initializeClient();
      
      // Pre-generate common interface messages
      await this.preGenerateCommonMessages();
      
      this.log('✅ Owner Interface Voice Integration initialized successfully', 'SUCCESS');
      
      return true;
      
    } catch (error) {
      this.log(`❌ Initialization failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async ensureDirectories() {
    const dirs = [
      this.interfaceConfig.audioOutputPath,
      this.interfaceConfig.tempAudioPath,
      this.interfaceConfig.voiceResponsesPath
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    this.log('📁 Audio directories created/verified', 'SUCCESS');
  }

  async preGenerateCommonMessages() {
    this.log('🔄 Pre-generating common interface messages...', 'VOICE');
    
    const generated = [];
    
    for (const [key, message] of Object.entries(this.interfaceMessages)) {
      try {
        const audioResult = await this.elevenLabsManager.generateOwnerInterfaceVoice(message);
        const filename = `interface-${key}.${this.interfaceConfig.audioFormat}`;
        const filepath = path.join(this.interfaceConfig.voiceResponsesPath, filename);
        
        await fs.writeFile(filepath, audioResult.audioBuffer);
        
        generated.push({ key, filename, filepath });
        this.log(`💾 Generated: ${key}`, 'SUCCESS');
        
      } catch (error) {
        this.log(`⚠️  Failed to pre-generate ${key}: ${error.message}`, 'WARN');
      }
    }
    
    this.log(`✅ Pre-generated ${generated.length} common messages`, 'SUCCESS');
    return generated;
  }

  async generateVoiceForInterface(text, options = {}) {
    this.log('🎤 Generating voice for owner interface...', 'VOICE');
    
    try {
      const voiceType = options.voiceType || 'owner';
      const priority = options.priority || 'normal';
      
      let audioResult;
      
      switch (voiceType.toLowerCase()) {
        case 'diamond':
        case 'sao':
          audioResult = await this.elevenLabsManager.generateDiamondSAOVoice(text, options);
          break;
        
        case 'moca':
        case 'mocoa':
          audioResult = await this.elevenLabsManager.generateMocaVoice(text, options);
          break;
        
        default:
        case 'owner':
        case 'interface':
          audioResult = await this.elevenLabsManager.generateOwnerInterfaceVoice(text, options);
          break;
      }
      
      // Save with appropriate naming for interface use
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `interface-${priority}-${timestamp}.${this.interfaceConfig.audioFormat}`;
      const filepath = path.join(this.interfaceConfig.audioOutputPath, filename);
      
      await fs.writeFile(filepath, audioResult.audioBuffer);
      
      this.log(`✅ Voice generated for interface: ${filename}`, 'SUCCESS');
      
      return {
        success: true,
        text: text,
        voiceType: voiceType,
        filename: filename,
        filepath: filepath,
        audioBuffer: audioResult.audioBuffer,
        size: audioResult.audioBuffer.length,
        timestamp: new Date().toISOString(),
        authority: 'Diamond SAO Command Center'
      };
      
    } catch (error) {
      this.log(`❌ Voice generation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async speakInterfaceMessage(messageKey, data = {}) {
    this.log(`🔊 Speaking interface message: ${messageKey}`, 'INTERFACE');
    
    try {
      // Check if pre-generated message exists
      const preGeneratedPath = path.join(
        this.interfaceConfig.voiceResponsesPath, 
        `interface-${messageKey}.${this.interfaceConfig.audioFormat}`
      );
      
      try {
        await fs.access(preGeneratedPath);
        this.log(`🎵 Using pre-generated message: ${messageKey}`, 'SUCCESS');
        
        return {
          success: true,
          messageKey: messageKey,
          filepath: preGeneratedPath,
          preGenerated: true,
          timestamp: new Date().toISOString()
        };
        
      } catch {
        // Pre-generated doesn't exist, generate dynamically
        this.log(`🔄 Generating dynamic message: ${messageKey}`, 'VOICE');
        
        const messageText = this.interfaceMessages[messageKey] || data.customText || `Interface message: ${messageKey}`;
        const result = await this.generateVoiceForInterface(messageText, {
          voiceType: 'owner',
          priority: 'high'
        });
        
        return {
          ...result,
          messageKey: messageKey,
          preGenerated: false
        };
      }
      
    } catch (error) {
      this.log(`❌ Failed to speak interface message: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async generateCustomInterfaceResponse(action, data = {}) {
    this.log(`🎤 Generating custom interface response: ${action}`, 'INTERFACE');
    
    try {
      // Use ElevenLabs Manager's template system
      const audioResult = await this.elevenLabsManager.generateSpeechForOwnerInterface(action, data);
      
      // Save for interface use
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `custom-${action}-${timestamp}.${this.interfaceConfig.audioFormat}`;
      const filepath = path.join(this.interfaceConfig.audioOutputPath, filename);
      
      await fs.writeFile(filepath, audioResult.audioBuffer);
      
      this.log(`✅ Custom response generated: ${action}`, 'SUCCESS');
      
      return {
        success: true,
        action: action,
        data: data,
        filename: filename,
        filepath: filepath,
        audioBuffer: audioResult.audioBuffer,
        timestamp: new Date().toISOString(),
        authority: 'Diamond SAO Command Center'
      };
      
    } catch (error) {
      this.log(`❌ Custom response generation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async cleanupOldAudioFiles() {
    this.log('🧹 Cleaning up old audio files...', 'INFO');
    
    try {
      const directories = [
        this.interfaceConfig.audioOutputPath,
        this.interfaceConfig.tempAudioPath
      ];
      
      let cleanedCount = 0;
      
      for (const dir of directories) {
        try {
          const files = await fs.readdir(dir);
          const audioFiles = files.filter(file => 
            file.endsWith('.mp3') || file.endsWith('.wav')
          );
          
          if (audioFiles.length > this.interfaceConfig.maxAudioFiles) {
            // Sort by modification time and remove oldest
            const fileStats = await Promise.all(
              audioFiles.map(async file => {
                const filepath = path.join(dir, file);
                const stats = await fs.stat(filepath);
                return { file, filepath, mtime: stats.mtime };
              })
            );
            
            fileStats.sort((a, b) => a.mtime - b.mtime);
            
            const filesToDelete = fileStats.slice(0, audioFiles.length - this.interfaceConfig.maxAudioFiles);
            
            for (const fileInfo of filesToDelete) {
              await fs.unlink(fileInfo.filepath);
              cleanedCount++;
            }
          }
        } catch (error) {
          this.log(`⚠️  Error cleaning directory ${dir}: ${error.message}`, 'WARN');
        }
      }
      
      this.log(`✅ Cleaned up ${cleanedCount} old audio files`, 'SUCCESS');
      return cleanedCount;
      
    } catch (error) {
      this.log(`❌ Cleanup failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async getInterfaceVoiceStatus() {
    this.log('📊 Getting interface voice status...', 'INFO');
    
    try {
      const audioStats = {
        outputFiles: 0,
        tempFiles: 0,
        preGeneratedFiles: 0,
        totalSize: 0
      };
      
      // Count files in each directory
      const directories = [
        { path: this.interfaceConfig.audioOutputPath, key: 'outputFiles' },
        { path: this.interfaceConfig.tempAudioPath, key: 'tempFiles' },
        { path: this.interfaceConfig.voiceResponsesPath, key: 'preGeneratedFiles' }
      ];
      
      for (const { path: dir, key } of directories) {
        try {
          const files = await fs.readdir(dir);
          const audioFiles = files.filter(file => 
            file.endsWith('.mp3') || file.endsWith('.wav')
          );
          audioStats[key] = audioFiles.length;
          
          // Calculate total size
          for (const file of audioFiles) {
            try {
              const stats = await fs.stat(path.join(dir, file));
              audioStats.totalSize += stats.size;
            } catch {}
          }
        } catch {}
      }
      
      return {
        success: true,
        initialized: this.elevenLabsManager.initialized,
        audioStats: audioStats,
        config: this.interfaceConfig,
        preGeneratedMessages: Object.keys(this.interfaceMessages),
        authority: 'Diamond SAO Command Center',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.log(`❌ Status check failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  // Web Interface Integration Methods
  async getVoiceResponseForWeb(messageKey, data = {}) {
    this.log(`🌐 Getting voice response for web interface: ${messageKey}`, 'INTERFACE');
    
    try {
      const result = await this.speakInterfaceMessage(messageKey, data);
      
      // Return web-compatible response
      return {
        success: true,
        messageKey: messageKey,
        audioUrl: `/audio/${path.basename(result.filepath)}`,
        preGenerated: result.preGenerated || false,
        timestamp: result.timestamp,
        authority: 'Diamond SAO Command Center'
      };
      
    } catch (error) {
      this.log(`❌ Web voice response failed: ${error.message}`, 'ERROR');
      return {
        success: false,
        error: error.message,
        messageKey: messageKey
      };
    }
  }

  async generateVoiceForWebInterface(text, options = {}) {
    this.log('🌐 Generating voice for web interface...', 'INTERFACE');
    
    try {
      const result = await this.generateVoiceForInterface(text, {
        voiceType: options.voiceType || 'owner',
        priority: 'web-interface',
        ...options
      });
      
      return {
        success: true,
        text: text,
        audioUrl: `/audio/${path.basename(result.filepath)}`,
        filename: result.filename,
        size: result.size,
        timestamp: result.timestamp,
        authority: 'Diamond SAO Command Center'
      };
      
    } catch (error) {
      this.log(`❌ Web interface voice generation failed: ${error.message}`, 'ERROR');
      return {
        success: false,
        error: error.message,
        text: text
      };
    }
  }
}

export default OwnerInterfaceVoiceIntegration;
