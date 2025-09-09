export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle main site requests
    if (url.hostname === 'asoos.2100.cool') {
      // Serve the main site HTML
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const html = await getMainSiteHTML();
        
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=3600',
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Security-Policy': 'default-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com https://cdnjs.cloudflare.com; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com;'
          }
        });
      }

      // Handle auth redirect
      if (url.pathname.startsWith('/auth')) {
        return Response.redirect('https://auth.asoos.2100.cool' + url.pathname, 307);
      }

      // Handle API docs request
      if (url.pathname === '/api-docs') {
        return new Response('API Documentation - Coming Soon', {
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Handle dashboard request
      if (url.pathname === '/dashboard') {
        return new Response('Dashboard - Authentication Required', {
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Handle 404
      return new Response('Not Found', { status: 404 });
    }
    
    // Default response for other domains
    return new Response('Service Not Available', { status: 404 });
  }
};

async function getMainSiteHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASOOS.2100.Cool - Aixtiv Symphony Orchestrating Operating System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            color: #ffffff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        .hero {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 20px;
            position: relative;
        }
        .logo {
            font-size: 4rem;
            font-weight: 900;
            background: linear-gradient(135deg, #00ff88, #0bb1bb, #ffd700);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
            animation: glow 3s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { filter: drop-shadow(0 0 20px rgba(0, 255, 136, 0.3)); }
            to { filter: drop-shadow(0 0 40px rgba(0, 255, 136, 0.6)); }
        }
        .tagline {
            font-size: 1.5rem;
            margin-bottom: 40px;
            opacity: 0.9;
            max-width: 800px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin: 40px 0;
            max-width: 1000px;
            width: 100%;
        }
        .stat {
            background: rgba(255, 255, 255, 0.05);
            padding: 30px;
            border-radius: 15px;
            border: 1px solid rgba(0, 255, 136, 0.2);
            backdrop-filter: blur(10px);
        }
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 10px;
        }
        .stat-label {
            font-size: 1rem;
            opacity: 0.8;
        }
        .cta-buttons {
            display: flex;
            gap: 20px;
            margin-top: 40px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .btn {
            padding: 15px 30px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 1rem;
        }
        .btn-primary {
            background: linear-gradient(135deg, #00ff88, #0bb1bb);
            color: #000;
        }
        .btn-secondary {
            background: transparent;
            color: #00ff88;
            border: 2px solid #00ff88;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }
        .nav {
            position: absolute;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 20px;
        }
        .nav a {
            color: #fff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        .nav a:hover {
            background: rgba(0, 255, 136, 0.2);
        }
        .fix-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid rgba(0, 255, 0, 0.3);
            padding: 10px 15px;
            border-radius: 8px;
            color: #00ff00;
            font-size: 0.8rem;
            font-weight: bold;
        }
        @media (max-width: 768px) {
            .logo { font-size: 2.5rem; }
            .tagline { font-size: 1.2rem; }
            .stats { grid-template-columns: 1fr 1fr; }
            .cta-buttons { flex-direction: column; align-items: center; }
            .nav { position: static; justify-content: center; margin-bottom: 20px; }
        }
        
        .feature:nth-child(even) .feature-content {
            direction: ltr;
        }
        
        .feature-content h3 {
            font-size: 32px;
            margin-bottom: 20px;
            color: #0bb1bb;
        }
        
        .feature-content p {
            font-size: 18px;
            line-height: 1.6;
            color: #ccc;
        }
        
        .feature-visual {
            background: rgba(11, 177, 187, 0.1);
            border-radius: 20px;
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 64px;
            border: 1px solid rgba(11, 177, 187, 0.3);
        }
        
        /* CTA Section */
        .cta {
            text-align: center;
            padding: 100px 20px;
            background: linear-gradient(180deg, transparent, rgba(11, 177, 187, 0.1), transparent);
        }
        
        .cta h2 {
            font-size: 48px;
            margin-bottom: 30px;
        }
        
        .cta-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn-primary {
            background: linear-gradient(45deg, #0bb1bb, #50C878);
            color: #000;
            padding: 15px 40px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            transition: all 0.3s;
        }
        
        .btn-secondary {
            border: 2px solid #0bb1bb;
            color: #0bb1bb;
            padding: 15px 40px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            transition: all 0.3s;
        }
        
        .btn-primary:hover, .btn-secondary:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(11, 177, 187, 0.5);
        }
        
        /* Animation */
        .fade-in {
            opacity: 0;
            transform: translateY(30px);
            animation: fadeIn 0.8s forwards;
        }
        
        @keyframes fadeIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Loading overlay for auth */
        .auth-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .auth-loading.active {
            display: flex;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(11, 177, 187, 0.3);
            border-top-color: #0bb1bb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* OAuth Authentication Section */
        .oauth-section {
            background: rgba(255, 255, 255, 0.02);
            border-top: 1px solid rgba(11, 177, 187, 0.2);
            padding: 40px 20px;
            margin-top: 50px;
        }

        .oauth-container {
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
        }

        .oauth-title {
            font-size: 24px;
            color: #0bb1bb;
            margin-bottom: 15px;
        }

        .oauth-description {
            color: #888;
            margin-bottom: 30px;
            font-size: 16px;
        }

        .oauth-button {
            background: linear-gradient(45deg, #FFD700, #0bb1bb);
            color: #000;
            padding: 15px 40px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            transition: all 0.3s;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }

        .oauth-button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }

        @media (max-width: 768px) {
            nav { padding: 15px 20px; }
            .logo { font-size: 20px; }
            h1 { font-size: 48px; }
            .stats { grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .features { padding: 50px 20px; }
            .feature { grid-template-columns: 1fr; gap: 30px; }
            .feature:nth-child(even) { direction: ltr; }
        }
    </style>
</head>
<body>
    <div class="hero">
        <nav class="nav">
            <a href="https://sallyport.2100.cool">SallyPort Gateway</a>
            <a href="https://mcp.aipub.2100.cool">MCP Console</a>
        </nav>
        
        <div class="logo">ASOOS.2100.Cool</div>
        <div class="tagline">Aixtiv Symphony Orchestrating Operating System<br>Unleash the power of 20+ million AI agents across 200+ industry sectors</div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">20M+</div>
                <div class="stat-label">AI Agent Instances</div>
            </div>
            <div class="stat">
                <div class="stat-number">200+</div>
                <div class="stat-label">Industry Sectors</div>
            </div>
            <div class="stat">
                <div class="stat-number">850K</div>
                <div class="stat-label">DIDC Archives</div>
            </div>
            <div class="stat">
                <div class="stat-number">1.6M</div>
                <div class="stat-label">Workflows</div>
            </div>
        </div>
        
        <div class="cta-buttons">
            <a href="https://sallyport.2100.cool" class="btn btn-primary">Access Security Gateway</a>
            <a href="https://mcp.aipub.2100.cool" class="btn btn-secondary">Owner Console</a>
        </div>
        
        <div style="margin-top: 60px; max-width: 1000px; text-align: left;">
            <h2 style="color: #00ff88; text-align: center; margin-bottom: 40px;">🚀 Revolutionary Features</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                <div style="background: rgba(255, 255, 255, 0.03); padding: 25px; border-radius: 15px;">
                    <h3 style="color: #00ff88; margin-bottom: 15px;">🤝 DIDC Archives System</h3>
                    <p>Dynamic collaboration archives that orchestrate multi-agent workflows with embedded tech stacks and smart contracts on Tower Blockchain.</p>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.03); padding: 25px; border-radius: 15px;">
                    <h3 style="color: #00ff88; margin-bottom: 15px;">👥 Squadron Network</h3>
                    <p>44 specialized agents organized into 4 strategic squadrons: Core, Deploy, Engage, and RIX. Each brings unique expertise.</p>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.03); padding: 25px; border-radius: 15px;">
                    <h3 style="color: #00ff88; margin-bottom: 15px;">🎯 Lifecycle Visualization</h3>
                    <p>Map any of 560,000 job roles across 50 sectors to 15+ lifecycle stages with optimal tech stack recommendations.</p>
                </div>
            </div>
        </div>
    </div>
    
    <div class="fix-status">
        ✅ ROUTING FIXED - Serving ASOOS Main Site
    </div>

    <!-- Features Section -->
    <section class="features">
        <div class="feature fade-in">
            <div class="feature-content">
                <h3>🧠 Dream Commander</h3>
                <p>Orchestrating 10M+ daily prompts through intelligent routing to Personal Co-Pilots. DIDC Archives maintain the complete history of how 64M jobs are performed, enabling 98% accuracy in future predictions.</p>
            </div>
            <div class="feature-visual">🎭</div>
        </div>

        <div class="feature fade-in">
            <div class="feature-content">
                <h3>🚁 20 Million AI Agents</h3>
                <p>Distributed across 13 Wings with specialized squadrons. From Elite11 executive decisions to Victory36 protective operations, each agent is positioned for maximum impact.</p>
            </div>
            <div class="feature-visual">🤖</div>
        </div>

        <div class="feature fade-in">
            <div class="feature-content">
                <h3>🔮 HQRIX Predictions</h3>
                <p>98% accuracy 90 days into the future. Position agents, route prompts, and orchestrate workflows based on what's coming, not just what's happening.</p>
            </div>
            <div class="feature-visual">📊</div>
        </div>

        <div class="feature fade-in">
            <div class="feature-content">
                <h3>🔐 Sally Port Security</h3>
                <p>Diamond SAO tier authentication with LinkedIn verification, SERPEW validation, and CE-UUID generation. Zero API exposure with complete orchestration control.</p>
            </div>
            <div class="feature-visual">💎</div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
        <h2>Ready to Orchestrate the Future?</h2>
        <p class="subtitle">Join Mr. Phillip Corey Roark and the Vision Lake team</p>
        <div class="cta-buttons">
            <a href="#" class="btn-primary" onclick="authenticate()">Access Dashboard</a>
            <a href="#" class="btn-secondary" onclick="showAPI()">View API</a>
        </div>
    </section>

    <!-- OAuth Authentication Section -->
    <section class="oauth-section">
        <div class="oauth-container">
            <h3 class="oauth-title">🔐 Secure Authentication</h3>
            <p class="oauth-description">
                Access your Diamond SAO account through our secure OAuth2 authentication system
            </p>
            <button class="oauth-button" onclick="authenticate()">
                🚀 Authenticate with Sally Port
            </button>
        </div>
    </section>

    <script>
        // Authentication function
        async function authenticate() {
            const authLoading = document.getElementById('authLoading');
            authLoading.classList.add('active');
            
            try {
                // Check if already authenticated
                const token = localStorage.getItem('asoos_token');
                if (token) {
                    // Verify token
                    const response = await fetch('/api/auth/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${token}\`
                        },
                        body: JSON.stringify({ email: 'pr@coaching2100.com' })
                    });
                    
                    if (response.ok) {
                        window.location.href = '/dashboard';
                        return;
                    }
                }
                
                // Redirect to OAuth2 authentication
                window.location.href = 'https://auth.asoos.2100.cool/auth/login?redirect=' + 
                                      encodeURIComponent(window.location.origin + '/auth/callback');
            } catch (error) {
                console.error('Auth error:', error);
                // Fallback to OAuth page
                window.location.href = 'https://auth.asoos.2100.cool/auth/login';
            } finally {
                authLoading.classList.remove('active');
            }
        }
        
        // Show API documentation
        function showAPI() {
            window.location.href = '/api-docs';
        }
        
        // Animate elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = '0.2s';
                    entry.target.style.animationFillMode = 'forwards';
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });
        
        // Handle auth callback
        if (window.location.pathname === '/auth/callback') {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            if (code) {
                // Exchange code for token
                fetch('/api/auth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                }).then(response => response.json())
                  .then(data => {
                      if (data.token) {
                          localStorage.setItem('asoos_token', data.token);
                          window.location.href = '/dashboard';
                      }
                  });
            }
        }
    </script>
</body>
</html>`;
}
