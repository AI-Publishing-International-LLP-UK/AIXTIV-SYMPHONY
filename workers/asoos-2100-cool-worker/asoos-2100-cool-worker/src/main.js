/**
 * ASOOS Main Cloudflare Worker
 * Serves the landing page with LLP member access system
 */

import { SecurityHeaders } from './security-headers.js';
import { ErrorHandler } from './error-pages.js';
import { CoachProxy } from './coach-proxy.js';
import { OAuth2CloudConnector } from './oauth2-cloud-connector.js';

// Embedded ASOOS HTML content
const ASOOS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASOOS - Aixtiv Symphony Orchestrating Operating System</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Montserrat', sans-serif;
            background: #0a0a0a;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        /* Subtle particle background */
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.1;
        }

        .particle {
            position: absolute;
            background: white;
            border-radius: 50%;
            animation: float 20s infinite linear;
        }

        @keyframes float {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
        }

        /* Main container */
        .auth-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 40px 35px;
            text-align: center;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
            max-width: 350px;
            width: 90%;
        }

        .logo {
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(135deg, #ffd700 0%, #0bb1bb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
            letter-spacing: 2px;
        }

        .subtitle {
            color: white;
            font-size: 1em;
            font-weight: 300;
            margin-bottom: 8px;
            line-height: 1.3;
        }

        .tagline {
            color: #0bb1bb;
            font-size: 0.9em;
            font-weight: 400;
            margin-bottom: 35px;
        }

        .enter-btn {
            background: linear-gradient(135deg, #00d4aa 0%, #0bb1bb 50%, #00c4a0 100%);
            color: #000;
            border: none;
            padding: 18px 40px;
            border-radius: 50px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(11, 177, 187, 0.3);
            width: 100%;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .enter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(11, 177, 187, 0.4);
        }

        .enter-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .status {
            margin-top: 25px;
            color: #0bb1bb;
            font-size: 0.85em;
            min-height: 20px;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(11, 177, 187, 0.3);
            border-radius: 50%;
            border-top-color: #0bb1bb;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .agent-count {
            margin-top: 20px;
            padding: 15px;
            border-left: 3px solid #0bb1bb;
            background: rgba(11, 177, 187, 0.1);
            border-radius: 6px;
        }

        .agent-count p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.8em;
            line-height: 1.4;
        }

        .agent-count .count {
            color: #ffd700;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <!-- Sacred Headers (invisible) -->
    <!-- X-Sacred-Mission: Aixtiv Symphony Orchestrating Operating System -->
    <!-- X-Divine-Authority: Jesus Christ, Our Lord -->
    <!-- X-Sacred-Frequency: Victory is to Forgive -->
    <!-- X-Palindromic-State: Unconditional Love -->
    
    <!-- Particle background -->
    <div class="particles" id="particles"></div>

    <div class="auth-container">
        <div class="logo">ASOOS</div>
        <div class="subtitle">AIXTIV SYMPHONY ORCHESTRATING OPERATING SYSTEM</div>
        <div class="tagline">AI Publishing International LLP<br>Professional Access Portal</div>
        
        <button class="enter-btn" onclick="initiateAuth()" id="authBtn">
            Enter System
        </button>

        <div class="status" id="status">Ready for ASOOS Owner Interface Access</div>

        <div class="agent-count">
            <p>Welcome to the experience of<br>
            <span class="count">20M Safe Collaborative AI Agents</span><br>
                 Powered by ASOOS<br>
             2025 (c) AI Publishing International LLP &<br>
            The Pilots of Vision Lake * Coaching 2100 * Civilization AI<br>
            ...the impossible made possible every day</p>
        </div>
    </div>

    <script>
        // Create floating particles
        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            for (let i = 0; i < 25; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.width = Math.random() * 3 + 1 + 'px';
                particle.style.height = particle.style.width;
                particle.style.animationDelay = Math.random() * 20 + 's';
                particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
                particlesContainer.appendChild(particle);
            }
        }

        // Generate secure state for OAuth2
        function generateSecureState() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }

        // Update status with loading indicator
        function updateStatus(message, isLoading = false) {
            const statusElement = document.getElementById('status');
            statusElement.innerHTML = isLoading ? 
                '<span class="loading"></span>' + message : 
                message;
        }

        // LLP Member Registry - Known owners and partners
        const LLP_MEMBERS = {
            // Diamond SAO - Supreme Administrative Officer
            'pr@coaching2100.com': {
                name: 'Mr. Phillip Corey Roark',
                title: 'Co-Founder & Chief Vision Officer',
                interface: 'owner',
                permissions: 'diamond_sao',
                access_level: 'diamond_sao',
                wing_access: 'all_wings',
                command_authority: 'supreme',
                sacred_clearance: 'divine_mandate'
            },
            // Emerald EAO - Executive Administrative Officer
            'mo@coaching2100.com': {
                name: 'Morgan O\\'Brien',
                title: 'LLP Partner & Emerald EAO',
                interface: 'owner',
                permissions: 'emerald_eao',
                access_level: 'emerald_eao',
                wing_access: 'wings_1_through_12',
                command_authority: 'executive',
                sacred_clearance: 'divine_executive'
            },
            // Emerald Members - Partnership Level
            'av@coaching2100.com': {
                name: 'Alexander Oliveros',
                title: 'LLP Partner & Emerald Member',
                interface: 'owner',
                permissions: 'emerald_member',
                access_level: 'emerald_member',
                wing_access: 'wings_1_through_8',
                command_authority: 'partner',
                sacred_clearance: 'divine_partner'
            },
            'et@coaching2100.com': {
                name: 'Eduardo Testa',
                title: 'LLP Partner & Emerald Member',
                interface: 'owner',
                permissions: 'emerald_member',
                access_level: 'emerald_member',
                wing_access: 'wings_1_through_8',
                command_authority: 'partner',
                sacred_clearance: 'divine_partner'
            },
            'jg@coaching2100.com': {
                name: 'Joshua Galbreath',
                title: 'LLP Partner & Emerald Member',
                interface: 'owner',
                permissions: 'emerald_member',
                access_level: 'emerald_member',
                wing_access: 'wings_1_through_8',
                command_authority: 'partner',
                sacred_clearance: 'divine_partner'
            },
            // EMEA Emerald UK Administrator
            'uk@coaching2100.com': {
                name: 'UK Administrator',
                title: 'EMEA Emerald UK Administrator',
                interface: 'owner',
                permissions: 'emerald_member',
                access_level: 'emerald_member',
                wing_access: 'wings_1_through_8',
                command_authority: 'partner',
                sacred_clearance: 'divine_partner'
            }
        };

        // Check if user is LLP member and provide direct access
        async function checkLLPMemberAccess() {
            // Try to detect LLP member through various methods
            const userIdentifiers = await gatherUserIdentifiers();
            
            for (const identifier of userIdentifiers) {
                if (LLP_MEMBERS[identifier]) {
                    const member = LLP_MEMBERS[identifier];
                    updateStatus('Welcome ' + member.name + '! Accessing Owner Interface...', true);
                    
                    // Set LLP member session with full permission attributes
                    localStorage.setItem('asoos_llp_member', JSON.stringify({
                        email: identifier,
                        name: member.name,
                        title: member.title,
                        interface: member.interface,
                        permissions: member.permissions,
                        access_level: member.access_level,
                        wing_access: member.wing_access,
                        command_authority: member.command_authority,
                        sacred_clearance: member.sacred_clearance,
                        authenticated_at: Date.now(),
                        session_type: 'llp_owner'
                    }));
                    
                    // Direct access to owner interface
                    setTimeout(() => {
                        window.location.href = 'https://asoos.2100.cool/owner-dashboard';
                    }, 1500);
                    
                    return true;
                }
            }
            
            return false;
        }

        // Gather potential user identifiers for LLP member detection
        async function gatherUserIdentifiers() {
            const identifiers = [];
            
            // Check for existing authentication data
            const existingAuth = localStorage.getItem('asoos_llp_member');
            if (existingAuth) {
                try {
                    const authData = JSON.parse(existingAuth);
                    identifiers.push(authData.email);
                } catch (e) {}
            }
            
            // Check for system-level user identification
            try {
                // This would be populated by your system authentication
                const systemUser = await fetch('/api/auth/current-user', {
                    method: 'GET',
                    headers: {
                        'X-Sacred-Mission': 'LLP Member Detection',
                        'X-Divine-Authority': 'Jesus Christ Our Lord'
                    }
                });
                
                if (systemUser.ok) {
                    const userData = await systemUser.json();
                    if (userData.email) {
                        identifiers.push(userData.email.toLowerCase());
                    }
                }
            } catch (e) {
                // Fallback for local development
                console.log('System user detection failed, checking local environment');
            }
            
            // For development/local testing - you can manually set this
            const devUser = localStorage.getItem('dev_llp_member');
            if (devUser) {
                identifiers.push(devUser);
            }
            
            return identifiers;
        }

        // Main authentication handler - Direct owner interface access
        async function initiateAuth() {
            const authBtn = document.getElementById('authBtn');
            authBtn.disabled = true;
            updateStatus('Checking access credentials...', true);
            
            try {
                // Check if user is an LLP member
                const isLLPMember = await checkLLPMemberAccess();
                
                if (isLLPMember) {
                    return; // LLP member access handled - redirects to owner interface
                }
                
                // If not LLP member, grant general access to owner interface
                updateStatus('Granting access to ASOOS Owner Interface...', true);
                
                // Set general user session
                localStorage.setItem('asoos_user', JSON.stringify({
                    access_type: 'general',
                    authenticated_at: Date.now(),
                    session_type: 'owner_access'
                }));
                
                setTimeout(() => {
                    window.location.href = 'https://asoos.2100.cool/owner-dashboard';
                }, 1500);
                
            } catch (error) {
                console.error('Authentication initialization error:', error);
                updateStatus('Authentication error - please try again');
                authBtn.disabled = false;
            }
        }

        // No LinkedIn OAuth - Direct access only

        // No token exchange - Direct access only

        // No OAuth callbacks to check for

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            createParticles();
            
            // Check if user is already authenticated as LLP member
            const llpMember = localStorage.getItem('asoos_llp_member');
            
            if (llpMember) {
                try {
                    const memberData = JSON.parse(llpMember);
                    updateStatus('Welcome back ' + memberData.name + '! Click to enter');
                } catch (e) {
                    updateStatus('Welcome back! Click to enter ASOOS');
                }
                
                document.getElementById('authBtn').onclick = function() {
                    window.location.href = 'https://asoos.2100.cool/owner-dashboard';
                };
            }
        });

        // Development Helper - Set LLP Member for Testing
        window.setLLPMember = function(email) {
            localStorage.setItem('dev_llp_member', email);
            console.log('🎭 LLP Member set for development: ' + email);
            console.log('Refresh the page and click "Enter System" to test owner interface access');
        };
        
        // Clear LLP member for testing
        window.clearLLPMember = function() {
            localStorage.removeItem('dev_llp_member');
            localStorage.removeItem('asoos_llp_member');
            console.log('🎭 LLP Member access cleared');
        };
        
        // Check current LLP member status
        window.checkLLPStatus = function() {
            const devUser = localStorage.getItem('dev_llp_member');
            const authUser = localStorage.getItem('asoos_llp_member');
            
            console.log('🎭 LLP Member Status:');
            console.log('Dev User:', devUser || 'None');
            if (authUser) {
                try {
                    const parsed = JSON.parse(authUser);
                    console.log('Authenticated User:', parsed.name, '(' + parsed.email + ')');
                } catch (e) {
                    console.log('Authenticated User: Invalid data');
                }
            } else {
                console.log('Authenticated User: None');
            }
        };

        // Sacred mission heartbeat
        setInterval(() => {
            console.log('🙏 Sacred Mission Active: Serving Humanity with Divine Technology');
        }, 60000); // Every minute
    </script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return SecurityHeaders.createCORSResponse();
      }

      // API routes - handle different API endpoints
      if (pathname.startsWith('/api/')) {
        // Diamond SAO OAuth2 endpoints
        if (pathname.startsWith('/api/oauth2/') || pathname.startsWith('/api/diamond-sao/')) {
          const oauth2Connector = new OAuth2CloudConnector(env);
          const response = await oauth2Connector.handleDiamondSAOAuth(request);
          return SecurityHeaders.addSecurityHeaders(response);
        }
        
        // Other API routes - proxy to integration gateway
        const proxy = new CoachProxy(env);
        const response = await proxy.handleRequest(request);
        return SecurityHeaders.addSecurityHeaders(response);
      }

      // Health check endpoint
      if (pathname === '/health' || pathname === '/api/health') {
        const response = new Response(JSON.stringify({
          status: 'healthy',
          service: 'ASOOS Landing Page',
          timestamp: new Date().toISOString(),
          sacred_mission: 'Active'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        return SecurityHeaders.addSecurityHeaders(response);
      }

      // Serve the permanent ASOOS interface with OAuth2 integration
      if (pathname.startsWith('/interface')) {
        // Embedded complete ASOOS Owner Interface with Diamond SAO OAuth2 integration
        const interfaceHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASOOS - Owner Interface</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Montserrat', sans-serif;
            background: #0a0a0a;
            color: white;
            min-height: 100vh;
            overflow: hidden;
        }
        .interface-container {
            position: relative;
            width: 100%;
            height: 100vh;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            display: flex;
            flex-direction: column;
        }
        /* Header */
        .header {
            padding: 20px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.5em;
            font-weight: 700;
            background: linear-gradient(135deg, #ffd700 0%, #0bb1bb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .user-info {
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9em;
        }
        /* Main Content */
        .main-content {
            flex: 1;
            display: flex;
            padding: 20px;
            gap: 20px;
        }
        .left-panel {
            width: 300px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .center-panel {
            flex: 1;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .right-panel {
            width: 300px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        /* Diamond SAO Access Button */
        .diamond-sao-button {
            position: fixed;
            bottom: 30px;
            left: 30px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #ffd700 0%, #ffed4a 100%);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        .diamond-sao-button:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 12px 35px rgba(255, 215, 0, 0.6);
        }
        /* Panel Headers */
        .panel-header {
            color: #0bb1bb;
            font-size: 1.1em;
            font-weight: 600;
            margin-bottom: 15px;
            border-bottom: 1px solid rgba(11, 177, 187, 0.3);
            padding-bottom: 8px;
        }
        /* Welcome Message */
        .welcome-message {
            text-align: center;
            max-width: 600px;
        }
        .welcome-title {
            font-size: 2.5em;
            font-weight: 700;
            background: linear-gradient(135deg, #ffd700 0%, #0bb1bb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
        }
        .welcome-subtitle {
            font-size: 1.2em;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 30px;
            line-height: 1.4;
        }
        .feature-list {
            text-align: left;
            margin: 20px 0;
        }
        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 8px 0;
        }
        .feature-icon {
            color: #ffd700;
            margin-right: 10px;
            font-weight: 600;
        }
        /* Status Indicators */
        .status-indicator {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .status-online {
            background: rgba(80, 200, 120, 0.2);
            color: #50c878;
        }
        .status-offline {
            background: rgba(255, 71, 87, 0.2);
            color: #ff4757;
        }
        /* Notification System */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 2000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        .notification.show {
            transform: translateX(0);
        }
        .notification.success {
            background: rgba(80, 200, 120, 0.9);
        }
        .notification.error {
            background: rgba(255, 71, 87, 0.9);
        }
        .notification.info {
            background: rgba(11, 177, 187, 0.9);
        }
    </style>
</head>
<body>
    <!-- Sacred Headers (invisible) -->
    <!-- X-Sacred-Mission: Aixtiv Symphony Orchestrating Operating System -->
    <!-- X-Divine-Authority: Jesus Christ, Our Lord -->
    <!-- X-Sacred-Frequency: Victory is to Forgive -->
    <!-- X-Palindromic-State: Unconditional Love -->

    <div class="interface-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">ASOOS</div>
            <div class="user-info" id="userInfo">Loading user information...</div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Left Panel - System Status -->
            <div class="left-panel">
                <div class="panel-header">System Status</div>
                <div class="feature-item">
                    <span class="feature-icon">🛡️</span>
                    <span>Diamond SAO:</span>
                    <span class="status-indicator status-online" id="diamondSAOStatus">Ready</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">⚡</span>
                    <span>Elite11:</span>
                    <span class="status-indicator status-offline" id="elite11Status">Inactive</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🎯</span>
                    <span>Mastery33:</span>
                    <span class="status-indicator status-offline" id="mastery33Status">Inactive</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🏆</span>
                    <span>Victory36:</span>
                    <span class="status-indicator status-offline" id="victory36Status">Inactive</span>
                </div>
            </div>

            <!-- Center Panel - Welcome -->
            <div class="center-panel">
                <div class="welcome-message">
                    <div class="welcome-title">Welcome to ASOOS</div>
                    <div class="welcome-subtitle">
                        Aixtiv Symphony Orchestrating Operating System<br>
                        Owner Interface with Diamond SAO OAuth2 Integration
                    </div>
                    
                    <div class="feature-list">
                        <div class="feature-item">
                            <span class="feature-icon">✨</span>
                            <span>Click the Diamond SAO star (bottom-left) to access OAuth2 cloud features</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">🌟</span>
                            <span>Elite11, Mastery33, and Victory36 protocols available</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">🔐</span>
                            <span>Secure cloud-to-cloud authentication with MOCOA and GCP services</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-icon">🙏</span>
                            <span>Sacred Mission: Serving Humanity with Divine Technology</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Panel - Recent Activity -->
            <div class="right-panel">
                <div class="panel-header">Recent Activity</div>
                <div id="recentActivity">
                    <div class="feature-item">
                        <span class="feature-icon">📡</span>
                        <span>OAuth2 integration loaded</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🛡️</span>
                        <span>Diamond SAO features initialized</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✅</span>
                        <span>Sacred mission active</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Diamond SAO Access Button -->
        <button class="diamond-sao-button" onclick="openSettings()" title="Diamond SAO Settings">
            ✨
        </button>
    </div>

    <!-- Notification Container -->
    <div id="notification" class="notification"></div>

    <!-- Diamond SAO OAuth2 Integration Script - Embedded for Permanent Loading -->
    <script src="https://2100.cool/diamond-sao-oauth2.js" defer></script>

    <!-- Main Interface Script -->
    <script>
        // Initialize interface
        document.addEventListener('DOMContentLoaded', function() {
            initializeInterface();
            loadUserInfo();
            
            // Check if OAuth2 integration is enabled
            const oauth2Enabled = localStorage.getItem('diamond_sao_oauth2_enabled');
            if (oauth2Enabled === 'true') {
                console.log('🛡️ Diamond SAO OAuth2 integration enabled');
                // The script will be loaded automatically from the src attribute above
            }
            
            // Sacred mission heartbeat
            setInterval(() => {
                console.log('🙏 Sacred Mission Active: Serving Humanity with Divine Technology');
            }, 60000); // Every minute
        });

        function initializeInterface() {
            console.log('🚀 ASOOS Owner Interface initializing...');
            showNotification('ASOOS Owner Interface loaded successfully', 'success');
        }

        function loadUserInfo() {
            // Load LLP member information if available
            try {
                const llpMember = localStorage.getItem('asoos_llp_member');
                if (llpMember) {
                    const memberData = JSON.parse(llpMember);
                    document.getElementById('userInfo').textContent = 
                        \`\${memberData.name} | \${memberData.access_level || 'Standard'} Access\`;
                } else {
                    document.getElementById('userInfo').textContent = 'Guest Access | General User';
                }
            } catch (error) {
                console.error('Error loading user info:', error);
                document.getElementById('userInfo').textContent = 'User Information Unavailable';
            }
        }

        // Notification system
        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = \`notification \${type} show\`;
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 4000);
        }

        // Settings overlay functions (will be overridden by Diamond SAO OAuth2 integration)
        function openSettings() {
            showNotification('Opening Diamond SAO settings...', 'info');
            createSettingsOverlay();
        }

        function createSettingsOverlay() {
            // This is a fallback function that will be replaced by the OAuth2 integration
            // if it loads successfully. If not, users will see this basic version.
            const overlay = document.createElement('div');
            overlay.id = 'settingsOverlay';
            overlay.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
            \`;

            overlay.innerHTML = \`
                <div style="background: #1a1a1a; border: 2px solid #FFD700; border-radius: 15px; padding: 30px; max-width: 500px; color: white; text-align: center;">
                    <h2 style="color: #FFD700; margin-bottom: 20px;">Diamond SAO Settings</h2>
                    <p style="margin-bottom: 20px; color: rgba(255, 255, 255, 0.8);">
                        OAuth2 cloud integration is loading...<br>
                        If this message persists, the Diamond SAO OAuth2 script may not be available.
                    </p>
                    <div style="margin: 20px 0;">
                        <div style="color: #0bb1bb; margin-bottom: 10px;">Available Features:</div>
                        <div style="text-align: left; margin-left: 20px;">
                            <div>• Elite11 Strategic Oversight</div>
                            <div>• Mastery33 Operational Command</div>
                            <div>• Victory36 Prediction Protocols</div>
                        </div>
                    </div>
                    <button onclick="closeSettingsOverlay()" style="background: #0bb1bb; border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Close
                    </button>
                </div>
            \`;

            document.body.appendChild(overlay);
        }

        function closeSettingsOverlay() {
            const overlay = document.getElementById('settingsOverlay');
            if (overlay) {
                overlay.remove();
            }
        }

        // Placeholder function for SallyPort authentication
        function authenticateWithSallyPort() {
            showNotification('Initiating SallyPort authentication...', 'info');
            // This will be replaced by the OAuth2 integration
        }

        // Update status indicators based on feature activation
        function updateFeatureStatus(feature, active) {
            const statusElement = document.getElementById(\`\${feature}Status\`);
            if (statusElement) {
                statusElement.textContent = active ? 'Active' : 'Inactive';
                statusElement.className = \`status-indicator \${active ? 'status-online' : 'status-offline'}\`;
            }
        }

        // Listen for OAuth2 integration to load and initialize
        window.addEventListener('load', function() {
            setTimeout(() => {
                if (window.diamondSAOCloud && typeof window.diamondSAOCloud.initialize === 'function') {
                    console.log('✅ Diamond SAO OAuth2 integration found and will initialize');
                    showNotification('Diamond SAO OAuth2 integration active', 'success');
                } else {
                    console.log('⚠️ Diamond SAO OAuth2 integration not found, using fallback interface');
                    showNotification('Using basic interface - OAuth2 features unavailable', 'info');
                }
            }, 2000);
        });
    </script>
</body>
</html>`;
        
        return new Response(interfaceHTML, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            'X-Sacred-Mission': 'ASOOS Owner Interface with Diamond SAO OAuth2',
            'X-Divine-Authority': 'Jesus Christ, Our Lord'
          }
        });
      }

      // Private Dashboard Routes - Secure Access Only  
      if (pathname.startsWith('/owner-dashboard') || 
          pathname.startsWith('/dashboard')) {
        
        // Detect system theme preference
        const userAgent = request.headers.get('User-Agent') || '';
        const acceptHeader = request.headers.get('Accept') || '';
        
        // Default to dark mode unless specifically requesting light
        const prefersLight = url.searchParams.get('theme') === 'light' ||
                            userAgent.includes('Light');
        const prefersDark = !prefersLight; // Default to dark mode
        
        // Redirect to enhanced interfaces with OAuth2 integration
        const productionInterface = prefersDark ? 
          'https://2100.cool/interface/' : 
          'https://2100.cool/interface-light/';
        
        return new Response(null, {
          status: 302,
          headers: {
            'Location': productionInterface,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Sacred-Mission': 'Secure Dashboard Access',
            'X-Divine-Authority': 'Protected Content'
          }
        });
      }

      // Serve Diamond SAO OAuth2 integration script
      if (pathname === '/diamond-sao-oauth2.js') {
        const scriptContent = `/**
 * Diamond SAO OAuth2 Cloud Integration
 * Replaces static Diamond SAO settings with real cloud OAuth2 connectivity
 * This script will be injected into the existing interface at https://2100.cool/interface/
 */

class DiamondSAOCloudIntegration {
  constructor() {
    this.baseUrl = 'https://2100.cool/api/oauth2';
    this.diamondSAOUrl = 'https://2100.cool/api/diamond-sao';
    this.currentUser = this.getCurrentLLPMember();
    
    // Services we can authenticate with
    this.services = {
      mocoa_gateway: 'MOCOA Integration Gateway',
      victory36: 'Victory36 Prediction Engine',
      sallyport: 'SallyPort Authentication'
    };
    
    this.featureStatus = {};
    this.oauthTokens = {};
  }

  getCurrentLLPMember() {
    try {
      const memberData = localStorage.getItem('asoos_llp_member');
      return memberData ? JSON.parse(memberData) : null;
    } catch (error) {
      console.error('Error getting LLP member data:', error);
      return null;
    }
  }

  async initialize() {
    console.log('🛡️ Initializing Diamond SAO OAuth2 Cloud Integration...');
    
    // Replace the static functions with real cloud connectivity
    if (typeof window.createSettingsOverlay === 'function') {
      window.createSettingsOverlay = () => this.createRealSettingsOverlay();
    }
    
    if (typeof window.openSettings === 'function') {
      window.openSettings = () => this.openRealSettings();
    }
    
    if (typeof window.authenticateWithSallyPort === 'function') {
      window.authenticateWithSallyPort = () => this.authenticateWithCloud();
    }
    
    await this.loadFeatureStatus();
    console.log('✅ Diamond SAO OAuth2 integration active');
  }

  createRealSettingsOverlay() {
    const existingOverlay = document.getElementById('settingsOverlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'settingsOverlay';
    overlay.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    \`;

    overlay.innerHTML = this.generateRealSettingsHTML();
    document.body.appendChild(overlay);
    this.bindSettingsEventHandlers();
  }

  generateRealSettingsHTML() {
    const userInfo = this.currentUser || { name: 'Unknown User', email: 'unknown@example.com' };

    return \`
      <div style="background: #1a1a1a; border: 2px solid #FFD700; border-radius: 15px; padding: 30px; max-width: 600px; color: white; max-height: 80vh; overflow-y: auto;">
        <h2 style="color: #FFD700; margin-bottom: 20px; text-align: center;">Diamond SAO Cloud Settings</h2>
        
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(11, 177, 187, 0.1); border-radius: 8px;">
          <div style="color: #0bb1bb; font-weight: 600;">Current User:</div>
          <div style="color: white;">\${userInfo.name} (\${userInfo.email})</div>
          <div style="color: #FFD700; font-size: 12px;">\${userInfo.access_level || 'standard'} access level</div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #0bb1bb; margin-bottom: 10px;">Cloud Services Status</h3>
          \${this.generateServiceStatusHTML()}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #FFD700; margin-bottom: 10px;">Feature Activation</h3>
          \${this.generateFeatureActivationHTML()}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #50C878; margin-bottom: 10px;">OAuth2 Authentication</h3>
          \${this.generateOAuth2HTML()}
        </div>

        <div style="text-align: center;">
          <button id="refreshStatusBtn" style="background: #0bb1bb; border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 10px;">
            Refresh Status
          </button>
          <button onclick="closeSettingsOverlay()" style="background: #444; border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Close
          </button>
        </div>
      </div>
    \`;
  }

  generateServiceStatusHTML() {
    let html = '';
    for (const [serviceKey, serviceName] of Object.entries(this.services)) {
      const status = this.featureStatus[serviceKey] || { active: false, error: 'checking...' };
      const statusColor = status.active ? '#50C878' : '#ff4757';
      const statusText = status.active ? 'Connected' : (status.error || 'Disconnected');
      
      html += \`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333;">
          <span style="color: white;">\${serviceName}</span>
          <span style="color: \${statusColor}; font-weight: 600;">\${statusText}</span>
        </div>
      \`;
    }
    return html;
  }

  generateFeatureActivationHTML() {
    const features = ['elite11', 'mastery33', 'victory36'];
    let html = '';

    for (const feature of features) {
      const status = this.featureStatus[feature] || { active: false };
      const statusColor = status.active ? '#50C878' : '#888';
      const statusText = status.active ? 'Active' : 'Inactive';
      
      html += \`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333;">
          <div>
            <span style="color: white; text-transform: capitalize;">\${feature.replace(/(\\d+)/, ' $1')}</span>
            <div style="color: #888; font-size: 11px;">\${this.getFeatureDescription(feature)}</div>
          </div>
          <div>
            <span style="color: \${statusColor}; font-weight: 600; margin-right: 10px;">\${statusText}</span>
            <button class="activateFeatureBtn" data-feature="\${feature}" style="background: #FFD700; border: none; color: black; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
              \${status.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      \`;
    }
    
    return html;
  }

  generateOAuth2HTML() {
    let html = '';
    
    for (const [serviceKey, serviceName] of Object.entries(this.services)) {
      const hasToken = this.oauthTokens[serviceKey] && this.oauthTokens[serviceKey].access_token;
      const buttonText = hasToken ? 'Re-authenticate' : 'Authenticate';
      const statusText = hasToken ? 'Authenticated' : 'Not Authenticated';
      const statusColor = hasToken ? '#50C878' : '#888';
      
      html += \`
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333;">
          <div>
            <span style="color: white;">\${serviceName}</span>
            <div style="color: \${statusColor}; font-size: 11px;">\${statusText}</div>
          </div>
          <button class="authenticateServiceBtn" data-service="\${serviceKey}" style="background: #50C878; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
            \${buttonText}
          </button>
        </div>
      \`;
    }
    
    return html;
  }

  getFeatureDescription(feature) {
    const descriptions = {
      elite11: 'Strategic oversight and macro-level coordination',
      mastery33: 'Operational mastery and wing coordination',
      victory36: 'Protective shields and prediction protocols'
    };
    return descriptions[feature] || 'Advanced AI workflows';
  }

  bindSettingsEventHandlers() {
    const refreshBtn = document.getElementById('refreshStatusBtn');
    if (refreshBtn) {
      refreshBtn.onclick = () => this.refreshStatus();
    }

    const featureButtons = document.querySelectorAll('.activateFeatureBtn');
    featureButtons.forEach(btn => {
      btn.onclick = (e) => this.toggleFeature(e.target.dataset.feature);
    });

    const authButtons = document.querySelectorAll('.authenticateServiceBtn');
    authButtons.forEach(btn => {
      btn.onclick = (e) => this.authenticateService(e.target.dataset.service);
    });
  }

  openRealSettings() {
    if (typeof showNotification === 'function') {
      showNotification('Opening Diamond SAO Cloud Settings...', 'success');
    }
    this.createRealSettingsOverlay();
  }

  async refreshStatus() {
    if (typeof showNotification === 'function') {
      showNotification('Refreshing cloud service status...', 'success');
    }
    await this.loadFeatureStatus();
    this.createRealSettingsOverlay();
    if (typeof showNotification === 'function') {
      showNotification('Status refreshed successfully', 'success');
    }
  }

  async loadFeatureStatus() {
    if (!this.currentUser) {
      console.warn('No current user found for status check');
      return;
    }

    try {
      const response = await fetch(\`\${this.diamondSAOUrl}?action=get_status&member=\${encodeURIComponent(this.currentUser.email)}\`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-LLP-Member': this.currentUser.email
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.featureStatus = data.feature_status || {};
        console.log('✅ Feature status loaded:', this.featureStatus);
      } else {
        console.error('Failed to load feature status:', response.status);
        this.featureStatus = {
          elite11: { active: false, error: 'service_unavailable' },
          mastery33: { active: false, error: 'service_unavailable' },
          victory36: { active: false, error: 'service_unavailable' }
        };
      }
    } catch (error) {
      console.error('Error loading feature status:', error);
      this.featureStatus = {};
    }
  }

  async toggleFeature(feature) {
    if (!this.currentUser) {
      if (typeof showNotification === 'function') {
        showNotification('Authentication required', 'error');
      }
      return;
    }

    const isActive = this.featureStatus[feature] && this.featureStatus[feature].active;
    const action = isActive ? 'deactivate' : 'activate';
    
    if (typeof showNotification === 'function') {
      showNotification(\`\${action === 'activate' ? 'Activating' : 'Deactivating'} \${feature}...\`, 'success');
    }

    try {
      const response = await fetch(\`\${this.diamondSAOUrl}?action=activate_features\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          features: [feature],
          llp_member_email: this.currentUser.email,
          action: action
        })
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.activation_results && data.activation_results[feature];
        
        if (result && result.success) {
          if (typeof showNotification === 'function') {
            showNotification(\`\${feature} \${action}d successfully\`, 'success');
          }
          await this.loadFeatureStatus();
          this.createRealSettingsOverlay();
        } else {
          if (typeof showNotification === 'function') {
            showNotification(\`Failed to \${action} \${feature}: \${result.error || 'Unknown error'}\`, 'error');
          }
        }
      } else {
        if (typeof showNotification === 'function') {
          showNotification(\`Failed to \${action} \${feature}\`, 'error');
        }
      }
    } catch (error) {
      console.error(\`Error \${action}ing \${feature}:\`, error);
      if (typeof showNotification === 'function') {
        showNotification(\`Error \${action}ing \${feature}\`, 'error');
      }
    }
  }

  async authenticateService(service) {
    if (!this.currentUser) {
      if (typeof showNotification === 'function') {
        showNotification('User authentication required', 'error');
      }
      return;
    }

    if (typeof showNotification === 'function') {
      showNotification(\`Initiating OAuth2 flow for \${this.services[service]}...\`, 'success');
    }

    try {
      const response = await fetch(\`\${this.baseUrl}?action=initiate&service=\${service}\`, {
        method: 'GET',
        headers: {
          'X-LLP-Member': this.currentUser.email
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.authorization_url) {
          sessionStorage.setItem(\`oauth2_state_\${service}\`, data.state);
          
          const authWindow = window.open(
            data.authorization_url,
            'oauth2_auth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
          );
          
          this.listenForOAuth2Callback(service, authWindow);
        } else {
          if (typeof showNotification === 'function') {
            showNotification('Failed to initiate OAuth2 flow', 'error');
          }
        }
      } else {
        if (typeof showNotification === 'function') {
          showNotification('Failed to initiate authentication', 'error');
        }
      }
    } catch (error) {
      console.error('OAuth2 initiation error:', error);
      if (typeof showNotification === 'function') {
        showNotification('Authentication error', 'error');
      }
    }
  }

  listenForOAuth2Callback(service, authWindow) {
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        this.checkOAuth2CallbackResult(service);
      }
    }, 1000);
  }

  async checkOAuth2CallbackResult(service) {
    if (typeof showNotification === 'function') {
      showNotification('Checking authentication result...', 'success');
    }
    
    setTimeout(async () => {
      await this.loadFeatureStatus();
      this.createRealSettingsOverlay();
      if (typeof showNotification === 'function') {
        showNotification(\`Authentication with \${this.services[service]} completed\`, 'success');
      }
    }, 2000);
  }

  async authenticateWithCloud() {
    if (!this.currentUser) {
      if (typeof showNotification === 'function') {
        showNotification('Starting SallyPort cloud authentication...', 'success');
      }
    } else {
      if (typeof showNotification === 'function') {
        showNotification(\`Re-authenticating \${this.currentUser.name} with cloud services...\`, 'success');
      }
    }

    await this.authenticateService('sallyport');
  }
}

// Initialize Diamond SAO Cloud Integration
window.diamondSAOCloud = new DiamondSAOCloudIntegration();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.diamondSAOCloud.initialize();
  });
} else {
  window.diamondSAOCloud.initialize();
}

window.initializeDiamondSAOCloud = () => {
  window.diamondSAOCloud.initialize();
};

console.log('🛡️ Diamond SAO OAuth2 Cloud Integration loaded');`;
        
        const response = new Response(scriptContent, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=3600',
            'X-Sacred-Mission': 'Diamond SAO Cloud Integration'
          },
        });

        return SecurityHeaders.addSecurityHeaders(response);
      }

      // Only serve landing page for root and unknown routes
      if (pathname === '/' || pathname === '/index.html') {
        const response = new Response(ASOOS_HTML, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=3600',
          },
        });

        return SecurityHeaders.addSecurityHeaders(response);
      }

      // For other routes, return 404
      return new Response('Page not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return ErrorHandler.handleGenericError(error, request);
    }
  },
};
