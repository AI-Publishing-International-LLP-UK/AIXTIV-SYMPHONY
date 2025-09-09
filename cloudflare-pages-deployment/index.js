// ASOOS.2100.Cool Landing Page Worker
// Serves the professional landing page for Aixtiv Symphony Orchestrating Operating System

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Handle owner interface redirect
    if (url.pathname === '/owner' || url.pathname === '/dashboard') {
      return Response.redirect('https://owner.2100.cool', 302);
    }
    
    // Handle health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'ASOOS.2100.Cool Landing Page',
        timestamp: new Date().toISOString(),
        version: '1.0.1',
        owner_interface: 'https://owner.2100.cool'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle robots.txt
    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /cdn-cgi/\nAllow: /\n\nSitemap: https://asoos.2100.cool/sitemap.xml', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Read the landing page HTML from the same directory
    try {
      // In Cloudflare Workers, we'll use a simple fetch to get the HTML
      // For now, serve a loading page that redirects to proper deployment
      // Serve the complete ASOOS landing page directly
      const landingPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASOOS.2100.Cool - Aixtiv Symphony Orchestrating Operating System</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body::before, body::after {
      display: none !important;
    }
    
    .hidden-text {
      display: none !important;
      visibility: hidden !important;
    }
    
    body {
      font-family: 'Montserrat', sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      overflow-x: hidden;
      scroll-behavior: smooth;
    }
    
    @keyframes float {
      0%, 100% {
        transform: translateY(0) translateX(0) rotate(0deg);
      }
      33% {
        transform: translateY(-10px) translateX(5px) rotate(5deg);
      }
      66% {
        transform: translateY(5px) translateX(-5px) rotate(-5deg);
      }
    }
    
    @keyframes glow {
      0%, 100% {
        box-shadow: 0 0 5px rgba(11, 177, 187, 0.8), 0 0 20px rgba(11, 177, 187, 0.4);
      }
      50% {
        box-shadow: 0 0 20px rgba(11, 177, 187, 1), 0 0 40px rgba(11, 177, 187, 0.6);
      }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
    
    @keyframes typeWriter {
      from {
        width: 0;
      }
      to {
        width: 100%;
      }
    }
    
    @keyframes blink {
      0%, 50% {
        border-right-color: #0bb1bb;
      }
      51%, 100% {
        border-right-color: transparent;
      }
    }
    
    @keyframes rotateGlow {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    @keyframes breathe {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.02);
      }
    }
    
    @keyframes progressBar {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 100%; }
    }
    
    .particles {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    }
    
    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(11, 177, 187, 0.6);
      border-radius: 50%;
      animation: float 8s infinite ease-in-out;
    }
    
    nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }
    
    nav.scrolled {
      background: rgba(0, 0, 0, 0.95);
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    }
    
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 10px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 900;
      background: linear-gradient(135deg, #FFD700, #c7b299, #50C878, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 2px;
      animation: breathe 3s infinite;
    }
    
    .nav-links {
      display: flex;
      gap: 30px;
      align-items: center;
    }
    
    .nav-link {
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s;
      position: relative;
    }
    
    .nav-link::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #0bb1bb, #50C878);
      transition: width 0.3s;
    }
    
    .nav-link:hover::after {
      width: 100%;
    }
    
    .cta-button {
      padding: 12px 24px;
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      border: none;
      border-radius: 25px;
      color: black;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-block;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(11, 177, 187, 0.5);
    }
    
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 10;
      padding: 50px 20px 50px;
      overflow: hidden;
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(11, 177, 187, 0.1) 0%, transparent 70%);
      animation: rotateGlow 20s linear infinite;
    }
    
    .hero-content {
      text-align: center;
      max-width: 1000px;
      animation: fadeInUp 1s ease;
      position: relative;
    }
    
    .hero-title {
      font-size: clamp(40px, 8vw, 80px);
      font-weight: 900;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #FFD700, #c7b299, #50C878, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 2px;
      line-height: 1.1;
      position: relative;
      display: inline-block;
    }
    
    .hero-title::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, transparent, #0bb1bb, transparent);
      animation: shimmer 3s infinite;
    }
    
    .hero-subtitle {
      font-size: clamp(18px, 3vw, 28px);
      color: #aaa;
      margin-bottom: 40px;
      font-weight: 300;
      overflow: hidden;
      white-space: nowrap;
      border-right: 3px solid transparent;
      width: 0;
      display: inline-block;
      animation: typeWriter 4s steps(45) 2s forwards, blink 1s infinite 2s;
    }
    
    .hero-description {
      font-size: 18px;
      color: #ccc;
      margin-bottom: 50px;
      line-height: 1.6;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .hero-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .hero-button {
      padding: 15px 40px;
      font-size: 18px;
      border-radius: 30px;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-block;
      font-weight: 600;
    }
    
    .primary-button {
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      color: black;
      border: none;
    }
    
    .primary-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(11, 177, 187, 0.5);
    }
    
    .secondary-button {
      background: transparent;
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .secondary-button:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: #0bb1bb;
      transform: translateY(-3px);
    }
    
    .stats-section {
      padding: 80px 20px;
      background: rgba(255, 255, 255, 0.02);
      position: relative;
      z-index: 100;
    }
    
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 25px;
    }
    
    @media (max-width: 968px) {
      .stats-container {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 640px) {
      .stats-container {
        grid-template-columns: 1fr;
      }
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      transition: all 0.3s;
      animation: fadeInUp 1s ease;
      position: relative;
      z-index: 10;
    }
    
    .stat-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 20px 40px rgba(11, 177, 187, 0.3);
      border-color: rgba(11, 177, 187, 0.5);
    }
    
    .stat-number {
      font-size: 48px;
      font-weight: 900;
      background: linear-gradient(135deg, #0bb1bb, #50C878);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }
    
    .stat-label {
      font-size: 18px;
      color: #aaa;
    }
    
    .stat-sublabel {
      font-size: 14px;
      color: #888;
      margin-top: 5px;
      font-style: italic;
    }
    
    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }
      
      .hero-buttons {
        flex-direction: column;
        align-items: center;
      }
    }
    
    .reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s ease;
    }
    
    .reveal.active {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="particles" id="particles"></div>
  
  <nav id="navbar">
    <div class="nav-container">
      <div class="logo">ASOOS</div>
      <div class="nav-links">
        <a href="#stats" class="nav-link">Network</a>
        <a href="#features" class="nav-link">Features</a>
        <a href="#team" class="nav-link">Team</a>
        <a href="/owner" class="cta-button">💎 Owner Portal</a>
      </div>
    </div>
  </nav>
  
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">ASOOS.2100.Cool</h1>
      <p class="hero-subtitle">Aixtiv Symphony Orchestrating Operating System</p>
      <p class="hero-description">
        Unleash the power of 560,000 AI agents across 50 sectors. Orchestrate complex workflows, 
        enable seamless collaborations, and transform your organization with our revolutionary 
        DIDC Archives system powered by Tower Blockchain.
      </p>
      <div class="hero-buttons">
        <a href="/owner" class="hero-button primary-button">💎 Diamond SAO Portal</a>
        <a href="#stats" class="hero-button secondary-button">Explore Network</a>
      </div>
    </div>
  </section>
  
  <section class="stats-section" id="stats">
    <div class="stats-container">
      <div class="stat-card reveal">
        <div class="stat-number">560K</div>
        <div class="stat-label">AI Agent Instances</div>
      </div>
      <div class="stat-card reveal">
        <div class="stat-number">50</div>
        <div class="stat-label">Industry Sectors</div>
      </div>
      <div class="stat-card reveal">
        <div class="stat-number">850K</div>
        <div class="stat-label">DIDC Archives</div>
      </div>
      <div class="stat-card reveal">
        <div class="stat-number">1.6M</div>
        <div class="stat-label">Workflows</div>
      </div>
      <div class="stat-card reveal">
        <div class="stat-number">∞</div>
        <div class="stat-label">Across Every Lifecycle</div>
      </div>
      <div class="stat-card reveal">
        <div class="stat-number">🏛️</div>
        <div class="stat-label">Queen Mint NFTs</div>
        <div class="stat-sublabel">View on Pub Social</div>
      </div>
    </div>
  </section>
  
  <script>
    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
        particlesContainer.appendChild(particle);
      }
    }
    
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    
    function reveal() {
      const reveals = document.querySelectorAll('.reveal');
      reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    }
    
    window.addEventListener('scroll', reveal);
    reveal();
    createParticles();
  </script>
</body>
</html>`;
      
      return new Response(landingPageHTML, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=1800', // 30 minutes cache
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Content-Security-Policy': 'default-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com https://cdnjs.cloudflare.com; img-src \'self\' data: https:; script-src \'self\' \'unsafe-inline\';'
        }
      });
    } catch (error) {
      // Fallback error page
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>ASOOS.2100.Cool - Loading...</title>
          <meta http-equiv="refresh" content="2;url=https://coaching2100.com">
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0a0a0a; color: white;">
          <h1 style="color: #0bb1bb;">ASOOS.2100.Cool</h1>
          <p>Redirecting to the Aixtiv Symphony Orchestrating Operating System...</p>
          <p>If you are not redirected, <a href="https://coaching2100.com" style="color: #0bb1bb;">click here</a>.</p>
        </body>
        </html>`,
        {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }
  }
};
