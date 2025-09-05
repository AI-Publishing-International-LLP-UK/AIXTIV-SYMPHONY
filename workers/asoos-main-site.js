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
            'Content-Security-Policy': "default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
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
    <title>ASOOS - Aixtiv Symphony Orchestrating Operating System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #ffffff;
            overflow-x: hidden;
        }
        
        /* Navigation */
        nav {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            padding: 20px 50px;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(45deg, #0bb1bb, #50C878);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .auth-button {
            background: linear-gradient(45deg, #0bb1bb, #50C878);
            color: #000;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }
        
        .auth-button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(11, 177, 187, 0.5);
        }
        
        /* Hero Section */
        .hero {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at center, rgba(11, 177, 187, 0.1) 0%, transparent 70%);
            position: relative;
        }
        
        .hero-content {
            text-align: center;
            max-width: 1200px;
            padding: 0 20px;
        }
        
        h1 {
            font-size: 72px;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #0bb1bb, #50C878, #0bb1bb);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradient 3s ease infinite;
        }
        
        @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .subtitle {
            font-size: 24px;
            color: #888;
            margin-bottom: 40px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin: 60px 0;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 30px;
            border-radius: 15px;
            border: 1px solid rgba(11, 177, 187, 0.3);
            transition: all 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            border-color: #0bb1bb;
            box-shadow: 0 10px 30px rgba(11, 177, 187, 0.2);
        }
        
        .stat-number {
            font-size: 36px;
            font-weight: bold;
            color: #0bb1bb;
        }
        
        .stat-label {
            font-size: 16px;
            color: #888;
            margin-top: 10px;
        }
        
        /* Features */
        .features {
            padding: 100px 50px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .feature {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin-bottom: 100px;
            align-items: center;
        }
        
        .feature:nth-child(even) {
            direction: rtl;
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
    <!-- Auth Loading Overlay -->
    <div class="auth-loading" id="authLoading">
        <div class="spinner"></div>
    </div>

    <!-- Navigation -->
    <nav>
        <div class="logo">ASOOS</div>
        <a href="#" class="auth-button" onclick="authenticate()">🔐 Diamond SAO Login</a>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content fade-in">
            <h1>ASOOS</h1>
            <p class="subtitle">Aixtiv Symphony Orchestrating Operating System</p>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">20M+</div>
                    <div class="stat-label">AI Agents</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">64M</div>
                    <div class="stat-label">Jobs Mapped</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">200</div>
                    <div class="stat-label">Industry Sectors</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">98%</div>
                    <div class="stat-label">Future Prediction</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">10M+</div>
                    <div class="stat-label">Daily Prompts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">2M+</div>
                    <div class="stat-label">Workflows</div>
                </div>
            </div>
        </div>
    </section>

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
