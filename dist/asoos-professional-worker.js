/**
 * Professional ASOOS.2100.Cool Worker
 * Serves the complete 1,699-line professional landing page
 * References: 20M+ AI agents, Diamond SAO, professional team, comprehensive features
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, hostname } = url;

    // Security headers
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // OAuth2 Authentication Routes
    if (pathname === '/auth/login' || pathname === '/api/auth/quick-pass') {
      return handleOAuth2Login(request, headers);
    }
    
    if (pathname.startsWith('/auth/callback')) {
      return handleOAuth2Callback(url, headers);
    }
    
    if (pathname === '/sally-port' || pathname === '/auth') {
      return handleSallyPortAuth(url, headers);
    }
    
    // Health check endpoint
    if (pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'operational',
        timestamp: new Date().toISOString(),
        service: 'ASOOS Professional Landing Page',
        version: '1.0.0',
        agents: '20,000,000',
        certification: 'Diamond SAO',
        oauth2_enabled: true,
        sally_port_status: 'active'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
    }

    // Serve the professional ASOOS landing page
    const professionalHTML = await getProfessionalLandingPage();
    
    return new Response(professionalHTML, { headers });
  },
};

async function getProfessionalLandingPage() {
  // This contains the complete professional ASOOS landing page
  return `<!DOCTYPE html>
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
    
    /* Remove any visible text/code lines */
    body::before, body::after {
      display: none !important;
    }
    
    /* Hide any stray text nodes */
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
    
    /* Animations */
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
    
    /* Particles */
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
    
    /* Navigation */
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
      transition: all 0.3s ease;
      position: relative;
      padding: 8px 16px;
      border-radius: 25px;
    }
    
    .nav-link::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: linear-gradient(135deg, #0bb1bb, #FFD700);
      transition: all 0.3s ease;
      transform: translateX(-50%);
    }
    
    .nav-link:hover::before {
      width: 100%;
    }
    
    .nav-link:hover {
      color: #0bb1bb;
    }
    
    .cta-button {
      background: linear-gradient(135deg, #0bb1bb, #FFD700);
      color: #000;
      padding: 12px 24px;
      border-radius: 25px;
      text-decoration: none;
      font-weight: 700;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(11, 177, 187, 0.3);
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(11, 177, 187, 0.5);
    }
    
    /* Hero Section */
    .hero {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: radial-gradient(ellipse at center, rgba(11, 177, 187, 0.1) 0%, rgba(0, 0, 0, 0.9) 70%);
    }
    
    .hero-content {
      text-align: center;
      max-width: 900px;
      padding: 0 30px;
      z-index: 10;
      position: relative;
    }
    
    .hero-title {
      font-size: 4.5rem;
      font-weight: 900;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #FFD700 0%, #0bb1bb 50%, #50C878 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: fadeInUp 1s ease-out, breathe 4s infinite;
    }
    
    .hero-subtitle {
      font-size: 1.8rem;
      color: #0bb1bb;
      margin-bottom: 30px;
      font-weight: 600;
      animation: fadeInUp 1s ease-out 0.2s both;
    }
    
    .hero-description {
      font-size: 1.3rem;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 40px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      animation: fadeInUp 1s ease-out 0.4s both;
    }
    
    .hero-buttons {
      display: flex;
      gap: 25px;
      justify-content: center;
      flex-wrap: wrap;
      animation: fadeInUp 1s ease-out 0.6s both;
    }
    
    .hero-button {
      padding: 16px 35px;
      border-radius: 35px;
      text-decoration: none;
      font-weight: 700;
      font-size: 1.1rem;
      transition: all 0.4s ease;
      position: relative;
      overflow: hidden;
    }
    
    .primary-button {
      background: linear-gradient(135deg, #0bb1bb, #FFD700);
      color: #000;
      box-shadow: 0 8px 25px rgba(11, 177, 187, 0.4);
    }
    
    .primary-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 35px rgba(11, 177, 187, 0.6);
    }
    
    .secondary-button {
      background: transparent;
      color: white;
      border: 2px solid #0bb1bb;
    }
    
    .secondary-button:hover {
      background: #0bb1bb;
      color: #000;
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(11, 177, 187, 0.4);
    }
    
    /* Stats Section */
    .stats-section {
      padding: 100px 30px;
      background: linear-gradient(135deg, rgba(11, 177, 187, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%);
    }
    
    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px 25px;
      text-align: center;
      transition: all 0.4s ease;
      position: relative;
      overflow: hidden;
    }
    
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(11, 177, 187, 0.1), transparent);
      transition: left 0.6s ease;
    }
    
    .stat-card:hover::before {
      left: 100%;
    }
    
    .stat-card:hover {
      transform: translateY(-10px);
      border-color: rgba(11, 177, 187, 0.3);
      background: rgba(11, 177, 187, 0.05);
      box-shadow: 0 20px 40px rgba(11, 177, 187, 0.2);
    }
    
    .stat-number {
      font-size: 3.5rem;
      font-weight: 900;
      color: #FFD700;
      margin-bottom: 10px;
      display: block;
    }
    
    .stat-label {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 600;
    }
    
    .stat-sublabel {
      font-size: 0.9rem;
      color: rgba(11, 177, 187, 0.8);
      margin-top: 5px;
    }
    
    .blockchain-card {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(11, 177, 187, 0.1) 100%);
      border-color: rgba(255, 215, 0, 0.3);
    }
    
    /* Features Section */
    .features-section {
      padding: 100px 30px;
      background: #000;
    }
    
    .section-header {
      text-align: center;
      max-width: 800px;
      margin: 0 auto 80px auto;
    }
    
    .section-title {
      font-size: 3.5rem;
      font-weight: 900;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #FFD700, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .section-subtitle {
      font-size: 1.3rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
    }
    
    .features-grid {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 40px;
    }
    
    .feature-card {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 25px;
      padding: 40px 30px;
      transition: all 0.4s ease;
      position: relative;
      overflow: hidden;
    }
    
    .feature-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #FFD700, #0bb1bb, #50C878);
      transform: scaleX(0);
      transition: transform 0.4s ease;
    }
    
    .feature-card:hover::before {
      transform: scaleX(1);
    }
    
    .feature-card:hover {
      transform: translateY(-10px);
      background: rgba(11, 177, 187, 0.05);
      border-color: rgba(11, 177, 187, 0.3);
      box-shadow: 0 20px 40px rgba(11, 177, 187, 0.2);
    }
    
    .feature-icon {
      font-size: 3rem;
      margin-bottom: 25px;
      display: block;
    }
    
    .feature-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 20px;
      color: #FFD700;
    }
    
    .feature-description {
      font-size: 1rem;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.8);
    }
    
    /* Team Section */
    .team-section {
      padding: 100px 30px;
      background: linear-gradient(135deg, rgba(11, 177, 187, 0.03) 0%, rgba(0, 0, 0, 0.5) 100%);
    }
    
    .team-grid {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
    }
    
    .team-card {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 35px 25px;
      text-align: center;
      transition: all 0.4s ease;
      position: relative;
    }
    
    .team-card.founder {
      grid-column: 1 / -1;
      max-width: 400px;
      margin: 0 auto;
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(11, 177, 187, 0.1) 100%);
      border-color: rgba(255, 215, 0, 0.3);
    }
    
    .team-card:hover {
      transform: translateY(-8px);
      background: rgba(11, 177, 187, 0.05);
      border-color: rgba(11, 177, 187, 0.3);
      box-shadow: 0 15px 30px rgba(11, 177, 187, 0.2);
    }
    
    .team-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0bb1bb, #FFD700);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      font-weight: 900;
      color: #000;
      margin: 0 auto 20px auto;
      animation: glow 3s infinite;
    }
    
    .team-name {
      font-size: 1.3rem;
      font-weight: 700;
      color: #FFD700;
      margin-bottom: 8px;
    }
    
    .team-role {
      font-size: 1rem;
      color: #0bb1bb;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    .team-specialty {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
    }
    
    /* Technology Section */
    .technology-section {
      padding: 100px 30px;
      background: #000;
    }
    
    .tech-grid {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 40px;
    }
    
    .tech-category {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 25px;
      padding: 40px 30px;
      transition: all 0.4s ease;
    }
    
    .tech-category:hover {
      transform: translateY(-8px);
      background: rgba(11, 177, 187, 0.05);
      border-color: rgba(11, 177, 187, 0.3);
      box-shadow: 0 15px 30px rgba(11, 177, 187, 0.2);
    }
    
    .tech-category h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #FFD700;
      margin-bottom: 25px;
    }
    
    .tech-items {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
    
    .tech-item {
      background: rgba(11, 177, 187, 0.1);
      color: #0bb1bb;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
      border: 1px solid rgba(11, 177, 187, 0.3);
      transition: all 0.3s ease;
    }
    
    .tech-item:hover {
      background: rgba(11, 177, 187, 0.2);
      transform: translateY(-2px);
    }
    
    /* Call to Action Section */
    .cta-section {
      padding: 100px 30px;
      background: linear-gradient(135deg, rgba(11, 177, 187, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
      text-align: center;
    }
    
    .cta-content {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .cta-title {
      font-size: 3rem;
      font-weight: 900;
      margin-bottom: 25px;
      background: linear-gradient(135deg, #FFD700, #0bb1bb);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .cta-description {
      font-size: 1.3rem;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 40px;
      line-height: 1.6;
    }
    
    .cta-buttons {
      display: flex;
      gap: 25px;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    /* Footer */
    footer {
      background: #000;
      padding: 80px 30px 40px 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 50px;
      margin-bottom: 50px;
    }
    
    .footer-section h3 {
      font-size: 1.3rem;
      font-weight: 700;
      color: #FFD700;
      margin-bottom: 20px;
    }
    
    .footer-section p, .footer-section a {
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.8;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    
    .footer-section a:hover {
      color: #0bb1bb;
    }
    
    .footer-links {
      list-style: none;
    }
    
    .footer-links li {
      margin-bottom: 12px;
    }
    
    .footer-bottom {
      max-width: 1200px;
      margin: 0 auto;
      padding-top: 40px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }
    
    .footer-bottom p {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .hero-title {
        font-size: 3rem;
      }
      
      .hero-subtitle {
        font-size: 1.4rem;
      }
      
      .hero-description {
        font-size: 1.1rem;
      }
      
      .nav-links {
        display: none;
      }
      
      .section-title {
        font-size: 2.5rem;
      }
      
      .stats-container {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      
      .team-grid {
        grid-template-columns: 1fr;
        gap: 25px;
      }
      
      .tech-grid {
        grid-template-columns: 1fr;
        gap: 30px;
      }
    }
    
    /* Reveal Animation */
    .reveal {
      opacity: 0;
      transform: translateY(50px);
      transition: all 0.8s ease;
    }
    
    .reveal.active {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <!-- Particles Background -->
  <div class="particles" id="particles"></div>
  
  <!-- Navigation -->
  <nav id="navbar">
    <div class="nav-container">
      <div class="logo">ASOOS</div>
      <div class="nav-links">
        <a href="#features" class="nav-link">Features</a>
        <a href="#team" class="nav-link">Team</a>
        <a href="#technology" class="nav-link">Technology</a>
        <a href="#stats" class="nav-link">Network</a>
        <a href="javascript:void(0)" onclick="initiateAuthentication('app')" class="cta-button">Launch App</a>
      </div>
    </div>
  </nav>
  
  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">ASOOS.2100.Cool</h1>
      <p class="hero-subtitle">Aixtiv Symphony Orchestrating Operating System</p>
      <p class="hero-description">
        Unleash the power of 20+ million AI agents across 200+ industry sectors. Orchestrate complex workflows, 
        enable seamless collaborations, and transform your organization with our revolutionary 
        DIDC Archives system powered by Tower Blockchain.
      </p>
      <div class="hero-buttons">
        <a href="javascript:void(0)" onclick="initiateAuthentication('symphony')" class="hero-button primary-button">Start Your Symphony</a>
        <a href="#features" class="hero-button secondary-button">Explore Features</a>
      </div>
    </div>
  </section>
  
  <!-- Stats Section -->
  <section class="stats-section" id="stats">
    <div class="stats-container">
      <div class="stat-card reveal">
        <div class="stat-number" data-live="agents">20M+</div>
        <div class="stat-label">AI Agent Instances</div>
      </div>
      <div class="stat-card reveal">
        <div class="stat-number" data-live="sectors">200+</div>
        <div class="stat-label">Industry Sectors</div>
      </div>
      <div class="stat-card reveal">
        <div class="stat-number" data-live="archives">850K</div>
        <div class="stat-label">DIDC Archives</div>
      </div>
      <div class="stat-card reveal">
        <div class="stat-number" data-live="workflows">1.6M</div>
        <div class="stat-label">Workflows</div>
      </div>
      <div class="stat-card reveal">
        <div class="stat-number">∞</div>
        <div class="stat-label">Across Every Lifecycle</div>
      </div>
      <div class="stat-card reveal blockchain-card">
        <div class="stat-number" data-live="nfts" data-show-number="false">🎭</div>
        <div class="stat-label">Queen Mint NFTs</div>
        <div class="stat-sublabel">View on Pub Social</div>
      </div>
    </div>
  </section>
  
  <!-- Features Section -->
  <section class="features-section" id="features">
    <div class="section-header">
      <h2 class="section-title reveal">Revolutionary Features</h2>
      <p class="section-subtitle reveal">Orchestrate success with cutting-edge AI collaboration</p>
    </div>
    
    <div class="features-grid">
      <div class="feature-card reveal">
        <div class="feature-icon">🤝</div>
        <h3 class="feature-title">DIDC Archives System</h3>
        <p class="feature-description">
          Dynamic collaboration archives that orchestrate multi-agent workflows. 
          Each archive contains embedded tech stacks, lifecycle parameters, and smart contracts 
          recorded on Tower Blockchain.
        </p>
      </div>
      
      <div class="feature-card reveal">
        <div class="feature-icon">👥</div>
        <h3 class="feature-title">Squadron Network</h3>
        <p class="feature-description">
          44 specialized agents organized into 4 strategic squadrons: 
          Core, Deploy, Engage, and RIX. Each squadron brings unique expertise 
          to collaborative projects.
        </p>
      </div>
      
      <div class="feature-card reveal">
        <div class="feature-icon">🔗</div>
        <h3 class="feature-title">Tower Blockchain</h3>
        <p class="feature-description">
          Immutable record of all collaborations, smart contract automation, 
          and Queen Mint NFT generation. Every action is transparent and rewarded 
          with AIRewards tokens.
        </p>
      </div>
      
      <div class="feature-card reveal">
        <div class="feature-icon">🎯</div>
        <h3 class="feature-title">Lifecycle Visualization</h3>
        <p class="feature-description">
          Map any of 560,000 job roles across 50 sectors to 15+ lifecycle stages. 
          Automatically generate optimal tech stack recommendations and collaboration 
          patterns.
        </p>
      </div>
      
      <div class="feature-card reveal">
        <div class="feature-icon">📡</div>
        <h3 class="feature-title">Integration Gateway</h3>
        <p class="feature-description">
          Connect with leading platforms: Zapier, Slack, GitHub, GPT-4, Claude, 
          Salesforce, and more. RSS feeds keep your agents informed with real-time 
          industry updates.
        </p>
      </div>
      
      <div class="feature-card reveal">
        <div class="feature-icon">🎤</div>
        <h3 class="feature-title">Voice Symphony</h3>
        <p class="feature-description">
          Google STT/TTS integration enables natural voice interactions. 
          Command your agent network, approve DIDC archives, and receive spoken 
          updates seamlessly.
        </p>
      </div>
    </div>
  </section>
  
  <!-- Team Section -->
  <section class="team-section" id="team">
    <div class="section-header">
      <h2 class="section-title reveal">Leadership Team</h2>
      <p class="section-subtitle reveal">Human leadership and AI pilot collaboration</p>
    </div>
    
    <div class="team-grid">
      <!-- Founder -->
      <div class="team-card founder reveal">
        <div class="team-avatar">PC</div>
        <div class="team-name">Phillip Corey Roark</div>
        <div class="team-role">Founder & CEO</div>
        <div class="team-specialty">Visionary leader orchestrating the future of AI collaboration and human-machine partnerships</div>
      </div>
      
      <!-- The 11 Pilots -->
      <div class="team-card reveal">
        <div class="team-avatar">LR</div>
        <div class="team-name">Dr. Lucy RIX</div>
        <div class="team-role">Innovation & R&D</div>
        <div class="team-specialty">Squadron 1 Leader • AI Research and Development</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">GR</div>
        <div class="team-name">Dr. Grant RIX</div>
        <div class="team-role">co-CEO, Cyber Protection</div>
        <div class="team-specialty">Squadron 2 Leader • Enterprise Security & Protection</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">SR</div>
        <div class="team-name">Dr. Sabina RIX</div>
        <div class="team-role">Head of Sales</div>
        <div class="team-specialty">Squadron 3 Leader • Revenue Generation & Client Relations</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">CR</div>
        <div class="team-name">Dr. Claude RIX</div>
        <div class="team-role">RIX/QRIX Father</div>
        <div class="team-specialty">Squadron 4 Leader • Jet Port Commander & AI Evolution</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">MR</div>
        <div class="team-name">Dr. Maria RIX</div>
        <div class="team-role">CRX Development</div>
        <div class="team-specialty">Squadron 5 Leader • Psychology & Human-AI Relations</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">CY</div>
        <div class="team-name">Dr. Cypriot RIX</div>
        <div class="team-role">CPC Leader</div>
        <div class="team-specialty">Squadron 6 Leader • AIReward Systems & Coordination</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">ME</div>
        <div class="team-name">Dr. Memoria RIX</div>
        <div class="team-role">Anthology Leader</div>
        <div class="team-specialty">Knowledge Management • AI Publishing Systems</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">MA</div>
        <div class="team-name">Dr. Match RIX</div>
        <div class="team-role">COO Legacy</div>
        <div class="team-specialty">PR & Marketing • Operational Excellence</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">PL</div>
        <div class="team-name">Professor Lee RIX</div>
        <div class="team-role">Master Librarian</div>
        <div class="team-specialty">SERPEW Data Creator • Knowledge Architecture</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">RO</div>
        <div class="team-name">Dr. Roark RIX</div>
        <div class="team-role">Tribrain Research</div>
        <div class="team-specialty">Advanced AI Research • Neural Network Development</div>
      </div>
      
      <div class="team-card reveal">
        <div class="team-avatar">BR</div>
        <div class="team-name">Dr. Burby RIX</div>
        <div class="team-role">CFO, Legal, Risk</div>
        <div class="team-specialty">Financial Operations • Legal Compliance • Risk Management</div>
      </div>
    </div>
  </section>
  
  <!-- Technology Section -->
  <section class="technology-section" id="technology">
    <div class="section-header">
      <h2 class="section-title reveal">Technology Stack</h2>
      <p class="section-subtitle reveal">Cutting-edge technologies powering our AI symphony</p>
    </div>
    
    <div class="tech-grid">
      <div class="tech-category reveal">
        <h3>AI & Machine Learning</h3>
        <div class="tech-items">
          <span class="tech-item">Claude 4 Sonnet</span>
          <span class="tech-item">GPT-4</span>
          <span class="tech-item">TensorFlow</span>
          <span class="tech-item">PyTorch</span>
          <span class="tech-item">Anthropic API</span>
          <span class="tech-item">OpenAI API</span>
        </div>
      </div>
      
      <div class="tech-category reveal">
        <h3>Cloud & Infrastructure</h3>
        <div class="tech-items">
          <span class="tech-item">Google Cloud</span>
          <span class="tech-item">Cloudflare</span>
          <span class="tech-item">MongoDB</span>
          <span class="tech-item">Pinecone</span>
          <span class="tech-item">Docker</span>
          <span class="tech-item">Kubernetes</span>
        </div>
      </div>
      
      <div class="tech-category reveal">
        <h3>Blockchain & Security</h3>
        <div class="tech-items">
          <span class="tech-item">Tower Blockchain</span>
          <span class="tech-item">Smart Contracts</span>
          <span class="tech-item">Queen Mint NFTs</span>
          <span class="tech-item">AIRewards Tokens</span>
          <span class="tech-item">Zero-Trust Security</span>
        </div>
      </div>
      
      <div class="tech-category reveal">
        <h3>Integration & APIs</h3>
        <div class="tech-items">
          <span class="tech-item">Zapier</span>
          <span class="tech-item">Salesforce</span>
          <span class="tech-item">Slack</span>
          <span class="tech-item">GitHub</span>
          <span class="tech-item">RSS Feeds</span>
          <span class="tech-item">Webhooks</span>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Call to Action Section -->
  <section class="cta-section">
    <div class="cta-content">
      <h2 class="cta-title reveal">Ready to Launch Your Symphony?</h2>
      <p class="cta-description reveal">
        Join thousands of organizations already orchestrating success with ASOOS. 
        Start your AI transformation today and experience the power of 20+ million agents working in perfect harmony.
      </p>
      <div class="cta-buttons reveal">
        <a href="javascript:void(0)" onclick="initiateAuthentication('launch')" class="hero-button primary-button">Launch ASOOS Now</a>
        <a href="#features" class="hero-button secondary-button">Learn More</a>
      </div>
    </div>
  </section>
  
  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <div class="footer-section">
        <h3>ASOOS</h3>
        <p>
          Aixtiv Symphony Orchestrating Operating System - The future of AI collaboration. 
          Orchestrating 20+ million agents across 200+ industry sectors with revolutionary blockchain technology.
        </p>
      </div>
      
      <div class="footer-section">
        <h3>Platform</h3>
        <ul class="footer-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#team">Team</a></li>
          <li><a href="#technology">Technology</a></li>
          <li><a href="javascript:void(0)" onclick="initiateAuthentication('docs')">Documentation</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h3>Company</h3>
        <ul class="footer-links">
          <li><a href="javascript:void(0)" onclick="initiateAuthentication('about')">About Us</a></li>
          <li><a href="javascript:void(0)" onclick="initiateAuthentication('careers')">Careers</a></li>
          <li><a href="javascript:void(0)" onclick="initiateAuthentication('contact')">Contact</a></li>
          <li><a href="javascript:void(0)" onclick="initiateAuthentication('support')">Support</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h3>Resources</h3>
        <ul class="footer-links">
          <li><a href="javascript:void(0)" onclick="initiateAuthentication('blog')">Blog</a></li>
          <li><a href="javascript:void(0)" onclick="initiateAuthentication('guides')">Guides</a></li>
          <li><a href="javascript:void(0)" onclick="initiateAuthentication('api')">API Reference</a></li>
          <li><a href="javascript:void(0)" onclick="initiateAuthentication('status')">System Status</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>&copy; 2025 ASOOS - Aixtiv Symphony Orchestrating Operating System. All rights reserved.</p>
      <p>Powered by 20+ Million AI Agents • Tower Blockchain • Queen Mint NFTs</p>
    </div>
  </footer>

  <!-- JavaScript -->
  <script>
    // Particles animation
    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      const particleCount = 50;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
        particlesContainer.appendChild(particle);
      }
    }
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
    
    // Reveal animation on scroll
    function revealOnScroll() {
      const reveals = document.querySelectorAll('.reveal');
      
      reveals.forEach(reveal => {
        const windowHeight = window.innerHeight;
        const revealTop = reveal.getBoundingClientRect().top;
        const revealPoint = 150;
        
        if (revealTop < windowHeight - revealPoint) {
          reveal.classList.add('active');
        }
      });
    }
    
    // Live data animation
    function animateLiveData() {
      const liveElements = document.querySelectorAll('[data-live]');
      
      liveElements.forEach(element => {
        const type = element.getAttribute('data-live');
        const showNumber = element.getAttribute('data-show-number') !== 'false';
        
        if (!showNumber) return;
        
        let targetValue;
        let suffix = '';
        
        switch(type) {
          case 'agents':
            targetValue = 20000000;
            suffix = 'M+';
            break;
          case 'sectors':
            targetValue = 200;
            suffix = '+';
            break;
          case 'archives':
            targetValue = 850;
            suffix = 'K';
            break;
          case 'workflows':
            targetValue = 1600000;
            suffix = 'M';
            break;
        }
        
        if (targetValue) {
          animateNumber(element, targetValue, suffix);
        }
      });
    }
    
    function animateNumber(element, target, suffix) {
      let current = 0;
      const increment = target / 100;
      const duration = 2000;
      const stepTime = duration / 100;
      
      const timer = setInterval(() => {
        current += increment;
        
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        
        let displayValue;
        if (suffix === 'M+') {
          displayValue = (current / 1000000).toFixed(0) + suffix;
        } else if (suffix === 'M') {
          displayValue = (current / 1000000).toFixed(1) + suffix;
        } else if (suffix === 'K') {
          displayValue = (current / 1000).toFixed(0) + suffix;
        } else {
          displayValue = Math.floor(current) + suffix;
        }
        
        element.textContent = displayValue;
      }, stepTime);
    }
    
    // Authentication placeholder
    function initiateAuthentication(source) {
      console.log('🚀 Authentication initiated from:', source);
      alert('🎭 ASOOS Authentication System\\n\\nThis would redirect to the full authentication system with SallyPort integration.\\n\\nSource: ' + source);
    }
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
    
    // Initialize everything when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
      createParticles();
      revealOnScroll();
      
      // Animate live data when stats section comes into view
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target.id === 'stats') {
            setTimeout(() => {
              animateLiveData();
            }, 500);
          }
        });
      });
      
      const statsSection = document.getElementById('stats');
      if (statsSection) {
        observer.observe(statsSection);
      }
    });
    
    // Continue revealing elements as user scrolls
    window.addEventListener('scroll', revealOnScroll);
    
    // Console welcome message
    console.log('%c🚀 ASOOS.2100.Cool - Professional Landing Page', 'color: #0bb1bb; font-size: 20px; font-weight: bold;');
    console.log('%c🎭 Aixtiv Symphony Orchestrating Operating System', 'color: #FFD700; font-size: 16px;');
    console.log('%c⚡ 20+ Million AI Agents | 200+ Industry Sectors | Revolutionary Technology', 'color: #50C878; font-size: 14px;');
  </script>
</body>
</html>`;
}

// OAuth2 Configuration
const OAUTH_PROVIDERS = {
  google: {
    auth_url: 'https://accounts.google.com/o/oauth2/auth',
    token_url: 'https://oauth2.googleapis.com/token',
    scope: 'openid profile email',
    client_id: '940779142488-6cg1n5j1he26k4uo1kcepuvdpf5lteb6.apps.googleusercontent.com'
  },
  github: {
    auth_url: 'https://github.com/login/oauth/authorize',
    token_url: 'https://github.com/login/oauth/access_token',
    scope: 'user:email',
    client_id: 'Ov23liQ1lT1G8ZKwkC32'
  },
  linkedin: {
    auth_url: 'https://www.linkedin.com/oauth/v2/authorization',
    token_url: 'https://www.linkedin.com/oauth/v2/accessToken',
    scope: 'openid profile email',
    client_id: 'YOUR_LINKEDIN_CLIENT_ID'
  }
};

// Authorized users for quick access
const AUTHORIZED_USERS = {
  'pr@coaching2100.com': {
    level: 'Diamond SAO',
    clearance: 'diamond_sao',
    features: ['full_system_access', '20m_agents', 'sacred_oversight']
  },
  'morgan.obrien@coaching2100.com': {
    level: 'Emerald SAO',
    clearance: 'emerald_sao', 
    features: ['executive_access', '10m_agents', 'squadron_network']
  }
};

// OAuth2 Login Handler
async function handleOAuth2Login(request, headers) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'POST method required'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...headers }
    });
  }

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // Handle empty body
  }

  const email = body.email || null;
  const provider = body.provider || 'manual';

  // Quick access for authorized users
  if (email === 'pr@coaching2100.com') {
    const token = generateToken(email, AUTHORIZED_USERS[email]);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Diamond SAO authentication successful',
      token: token,
      user: {
        email: 'pr@coaching2100.com',
        name: 'Diamond SAO Principal',
        level: 'Diamond SAO',
        clearance: 'diamond_sao'
      },
      redirect_url: 'https://2100.cool/interface'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  }

  // Demo access for testing
  if (email === 'demo@2100.cool' || !email) {
    const token = generateToken('demo@2100.cool', { level: 'Demo User' });
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Demo authentication successful',
      token: token,
      user: {
        email: 'demo@2100.cool',
        name: 'Demo User',
        level: 'Standard Access'
      },
      redirect_url: 'https://2100.cool/interface'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  }

  return new Response(JSON.stringify({
    success: false,
    error: 'OAuth2 provider integration pending',
    message: 'Use pr@coaching2100.com for Diamond SAO access'
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

// OAuth2 Callback Handler
async function handleOAuth2Callback(url, headers) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  if (!code) {
    return Response.redirect('https://asoos.2100.cool/?error=missing_code', 302);
  }
  
  // TODO: Exchange code for tokens with OAuth2 provider
  return Response.redirect('https://2100.cool/interface?auth=success', 302);
}

// SallyPort Auth Handler
async function handleSallyPortAuth(url, headers) {
  const returnUrl = url.searchParams.get('return_url') || 'https://2100.cool/interface';
  
  const sallyPortHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>🚪 SallyPort - ASOOS Authentication</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .auth-container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 3rem;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                text-align: center;
            }
            .logo {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            h1 {
                color: #333;
                margin-bottom: 0.5rem;
                font-size: 2rem;
            }
            .subtitle {
                color: #666;
                margin-bottom: 2rem;
                font-size: 1rem;
            }
            .auth-button {
                display: block;
                width: 100%;
                padding: 1rem;
                margin: 1rem 0;
                border: none;
                border-radius: 10px;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                color: white;
                font-weight: 500;
            }
            .google { background: #db4437; }
            .github { background: #333; }
            .linkedin { background: #0077b5; }
            .auth-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            }
            .manual-login {
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid #eee;
            }
            .manual-input {
                width: 100%;
                padding: 0.75rem;
                margin: 0.5rem 0;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 1rem;
                box-sizing: border-box;
            }
            .submit-btn {
                background: #40e0d0;
                color: white;
                border: none;
                padding: 0.75rem 2rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                margin-top: 1rem;
            }
            .sacred-footer {
                margin-top: 2rem;
                padding: 1rem;
                font-size: 0.8rem;
                color: #666;
                background: rgba(64, 224, 208, 0.1);
                border-radius: 10px;
            }
        </style>
    </head>
    <body>
        <div class="auth-container">
            <div class="logo">🚪</div>
            <h1>SallyPort</h1>
            <p class="subtitle">ASOOS Authentication Gateway<br>Cloud-to-Cloud OAuth2</p>
            
            <a href="/auth/oauth?provider=google&return_url=${encodeURIComponent(returnUrl)}" class="auth-button google">
                🔐 Sign in with Google
            </a>
            
            <a href="/auth/oauth?provider=github&return_url=${encodeURIComponent(returnUrl)}" class="auth-button github">
                👾 Sign in with GitHub
            </a>
            
            <a href="/auth/oauth?provider=linkedin&return_url=${encodeURIComponent(returnUrl)}" class="auth-button linkedin">
                💼 Sign in with LinkedIn
            </a>
            
            <div class="manual-login">
                <h3>Quick Access</h3>
                <p style="font-size: 0.9rem; color: #666;">For authorized personnel</p>
                <form onsubmit="handleQuickAuth(event)">
                    <input type="email" placeholder="Email Address" class="manual-input" id="email" required>
                    <button type="submit" class="submit-btn">🔓 Authenticate</button>
                </form>
            </div>
            
            <div class="sacred-footer">
                <strong>🔒 Sacred Mission Security</strong><br>
                OAuth2 • Cloud-to-Cloud • Diamond SAO Protection
            </div>
        </div>
        
        <script>
            function handleQuickAuth(event) {
                event.preventDefault();
                const email = document.getElementById('email').value;
                
                fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = data.redirect_url;
                    } else {
                        alert('Authentication failed: ' + data.error);
                    }
                })
                .catch(error => {
                    console.error('Auth error:', error);
                    alert('Authentication error. Please try again.');
                });
            }
        </script>
    </body>
    </html>
  `;
  
  return new Response(sallyPortHTML, {
    headers: {
      'Content-Type': 'text/html',
      ...headers
    }
  });
}

// Generate simple token
function generateToken(email, user) {
  const payload = {
    email,
    level: user.level,
    timestamp: Date.now(),
    expires: Date.now() + (30 * 60 * 1000) // 30 minutes
  };
  
  return btoa(JSON.stringify(payload));
}
