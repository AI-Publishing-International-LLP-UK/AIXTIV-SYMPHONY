#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     DEPLOYING DR. MEMORIA'S ANTHOLOGY TO DRMEMORIA.LIVE  ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Create timestamp for unique deployments
TIMESTAMP=$(date +%Y%m%d%H%M%S)
DEPLOY_DIR="/Users/as/asoos/deploy-package/drmemoria-live-${TIMESTAMP}"

# Create deployment directory
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/public"
mkdir -p "$DEPLOY_DIR/functions"

# Step 1: Copy Dr. Memoria's Anthology files
echo -e "${YELLOW}Step 1: Preparing Dr. Memoria's Anthology files...${NC}"

# Copy source files from Dr. Memoria Deploy directory
cp -r /Users/as/asoos/dr-memoria-deploy/* "$DEPLOY_DIR/" 2>/dev/null || true

# Create core directories
mkdir -p "$DEPLOY_DIR/public/images"
mkdir -p "$DEPLOY_DIR/public/css"
mkdir -p "$DEPLOY_DIR/public/js"
mkdir -p "$DEPLOY_DIR/public/giftshop"
mkdir -p "$DEPLOY_DIR/public/sallyport"

# Step 2: Create landing page with SallyPort entrance and proper branding
echo -e "${YELLOW}Step 2: Creating properly branded landing page with SallyPort entrance...${NC}"

# Create main landing page with proper branding and SallyPort entrance
cat > "$DEPLOY_DIR/public/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dr. Memoria's Anthology | The Art of Collective Memory</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="icon" type="image/png" href="images/favicon.png">
    <meta name="description" content="Dr. Memoria's Anthology - A curated collection of memories, stories, and knowledge preserved through advanced AI and human collaboration.">
</head>
<body>
    <div class="stars"></div>
    <div class="twinkling"></div>
    <div class="clouds"></div>
    
    <header>
        <nav>
            <div class="logo">
                <img src="images/dr-memoria-logo.png" alt="Dr. Memoria's Anthology Logo">
            </div>
            <ul class="nav-links">
                <li><a href="#about">About</a></li>
                <li><a href="#anthology">The Anthology</a></li>
                <li><a href="#story">Our Story</a></li>
                <li><a href="#giftshop">Gift Shop</a></li>
                <li><a href="sallyport/" class="sallyport-btn">SallyPort Access</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <div class="hero-content">
                <h1>Dr. Memoria's Anthology</h1>
                <h2>Preserving Collective Memory Through Time</h2>
                <p>A curated collection of memories, stories, and knowledge preserved through the collaboration of human insight and advanced AI.</p>
                <div class="hero-cta">
                    <a href="#anthology" class="primary-btn">Explore The Anthology</a>
                    <a href="sallyport/" class="secondary-btn">SallyPort Access</a>
                </div>
            </div>
        </section>

        <section id="about" class="about">
            <div class="container">
                <h2>About Dr. Memoria's Anthology</h2>
                <div class="about-content">
                    <div class="about-text">
                        <p>Dr. Memoria's Anthology represents a convergence of human creativity and artificial intelligence, designed to preserve and enhance our collective wisdom. Through our unique Roark 5.0 Authorship Framework, we carefully curate and authenticate each contribution to ensure its authenticity and value.</p>
                        <p>Every memory, story, and insight in our collection undergoes rigorous verification and receives a Creative Passport - a blockchain-secured certificate of authenticity that records both human and AI contributions to maintain ethical standards in the age of advanced generative systems.</p>
                    </div>
                    <div class="about-image">
                        <img src="images/anthology-visualization.jpg" alt="Visual representation of Dr. Memoria's Anthology">
                    </div>
                </div>
            </div>
        </section>

        <section id="anthology" class="anthology">
            <div class="container">
                <h2>The Anthology Collection</h2>
                <div class="anthology-grid">
                    <div class="anthology-item">
                        <div class="anthology-icon">📚</div>
                        <h3>Written Works</h3>
                        <p>Essays, articles, and literary pieces that capture human knowledge and experience.</p>
                        <a href="sallyport/" class="item-link">Access Collection</a>
                    </div>
                    <div class="anthology-item">
                        <div class="anthology-icon">🎬</div>
                        <h3>Visual Stories</h3>
                        <p>Visual narratives and multimedia presentations that bring memories to life.</p>
                        <a href="sallyport/" class="item-link">Access Collection</a>
                    </div>
                    <div class="anthology-item">
                        <div class="anthology-icon">🎙️</div>
                        <h3>Oral Histories</h3>
                        <p>Spoken accounts and conversations that preserve voices and perspectives.</p>
                        <a href="sallyport/" class="item-link">Access Collection</a>
                    </div>
                    <div class="anthology-item">
                        <div class="anthology-icon">🧠</div>
                        <h3>Knowledge Repository</h3>
                        <p>Structured information and insights organized for educational purposes.</p>
                        <a href="sallyport/" class="item-link">Access Collection</a>
                    </div>
                </div>
            </div>
        </section>

        <section id="story" class="story">
            <div class="container">
                <h2>Our Story</h2>
                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-marker">2023</div>
                        <div class="timeline-content">
                            <h3>The Genesis</h3>
                            <p>Dr. Memoria's Anthology began with a vision to create a system that could preserve human knowledge and memories in an era of rapid technological change.</p>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker">2024</div>
                        <div class="timeline-content">
                            <h3>Development</h3>
                            <p>The Roark 5.0 Authorship Framework was developed, establishing ethical guidelines for human-AI collaboration in creating meaningful content.</p>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker">2025</div>
                        <div class="timeline-content">
                            <h3>Launch</h3>
                            <p>Dr. Memoria's Anthology officially launched, opening its collection to selected contributors and subscribers.</p>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker">Future</div>
                        <div class="timeline-content">
                            <h3>Vision</h3>
                            <p>Our goal is to create the most comprehensive and authentic repository of human knowledge and experience, accessible to future generations.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="giftshop" class="giftshop">
            <div class="container">
                <h2>Gift Shop</h2>
                <p class="giftshop-intro">Explore our collection of exclusive items inspired by Dr. Memoria's Anthology.</p>
                <div class="product-grid">
                    <div class="product-item">
                        <img src="images/anthology-book.jpg" alt="Limited Edition Anthology Volume">
                        <h3>Limited Edition Anthology Volume</h3>
                        <p class="price">$79.95</p>
                        <a href="giftshop/anthology-book" class="product-btn">View Details</a>
                    </div>
                    <div class="product-item">
                        <img src="images/memory-crystal.jpg" alt="Memory Crystal">
                        <h3>Memory Crystal</h3>
                        <p class="price">$125.00</p>
                        <a href="giftshop/memory-crystal" class="product-btn">View Details</a>
                    </div>
                    <div class="product-item">
                        <img src="images/creative-passport.jpg" alt="Creative Passport">
                        <h3>Creative Passport NFT</h3>
                        <p class="price">$199.95</p>
                        <a href="giftshop/creative-passport" class="product-btn">View Details</a>
                    </div>
                    <div class="product-item">
                        <img src="images/anthology-subscription.jpg" alt="Annual Subscription">
                        <h3>Annual Subscription</h3>
                        <p class="price">$249.00/year</p>
                        <a href="giftshop/subscription" class="product-btn">View Details</a>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-logo">
                    <img src="images/dr-memoria-logo-small.png" alt="Dr. Memoria's Anthology">
                </div>
                <div class="footer-links">
                    <div class="footer-column">
                        <h4>Explore</h4>
                        <ul>
                            <li><a href="#about">About</a></li>
                            <li><a href="#anthology">The Anthology</a></li>
                            <li><a href="#story">Our Story</a></li>
                            <li><a href="#giftshop">Gift Shop</a></li>
                        </ul>
                    </div>
                    <div class="footer-column">
                        <h4>Resources</h4>
                        <ul>
                            <li><a href="sallyport/faq">FAQ</a></li>
                            <li><a href="sallyport/support">Support</a></li>
                            <li><a href="sallyport/terms">Terms of Service</a></li>
                            <li><a href="sallyport/privacy">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div class="footer-column">
                        <h4>Connect</h4>
                        <ul class="social-links">
                            <li><a href="#" class="social-icon twitter">Twitter</a></li>
                            <li><a href="#" class="social-icon instagram">Instagram</a></li>
                            <li><a href="#" class="social-icon youtube">YouTube</a></li>
                            <li><a href="#" class="social-icon linkedin">LinkedIn</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Dr. Memoria's Anthology. All rights reserved.</p>
                <p>A product of the Aixtiv Symphony ecosystem.</p>
            </div>
        </div>
    </footer>

    <script src="js/main.js"></script>
</body>
</html>
EOF

# Create main CSS file
cat > "$DEPLOY_DIR/public/css/style.css" << 'EOF'
/* Dr. Memoria's Anthology - Main Stylesheet */

:root {
  --primary-color: #5d65e0;
  --secondary-color: #f97f51;
  --dark-color: #2c3e50;
  --light-color: #ecf0f1;
  --accent-color: #9b59b6;
  --font-primary: 'Playfair Display', serif;
  --font-secondary: 'Source Sans Pro', sans-serif;
  --transition: all 0.3s ease;
}

/* Import Fonts */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+Pro:wght@300;400;600&display=swap');

/* Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-secondary);
  line-height: 1.6;
  color: var(--dark-color);
  background-color: #050a1f;
  overflow-x: hidden;
  position: relative;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Cosmic Background */
.stars, .twinkling, .clouds {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: -1;
}

.stars {
  background: #000 url(../images/stars.png) repeat top center;
}

.twinkling {
  background: transparent url(../images/twinkling.png) repeat top center;
  animation: move-twinkle 200s linear infinite;
}

.clouds {
  background: transparent url(../images/clouds.png) repeat top center;
  animation: move-clouds 150s linear infinite;
}

@keyframes move-twinkle {
  from {background-position: 0 0;}
  to {background-position: -10000px 5000px;}
}

@keyframes move-clouds {
  from {background-position: 0 0;}
  to {background-position: 10000px -5000px;}
}

/* Header & Navigation */
header {
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  background: rgba(5, 10, 31, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(93, 101, 224, 0.2);
  z-index: 1000;
  padding: 1rem 0;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.logo img {
  height: 50px;
}

.nav-links {
  display: flex;
  list-style: none;
}

.nav-links li {
  margin-left: 2rem;
}

.nav-links a {
  color: var(--light-color);
  text-decoration: none;
  font-weight: 600;
  position: relative;
  transition: var(--transition);
}

.nav-links a:hover {
  color: var(--primary-color);
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--primary-color);
  transition: var(--transition);
}

.nav-links a:hover::after {
  width: 100%;
}

.sallyport-btn {
  background-color: var(--primary-color);
  color: white !important;
  padding: 0.5rem 1rem;
  border-radius: 5px;
}

.sallyport-btn:hover {
  background-color: #4550d1;
  transform: translateY(-2px);
}

/* Hero Section */
.hero {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 2rem;
  background: linear-gradient(to bottom, rgba(5, 10, 31, 0.7), rgba(5, 10, 31, 0.9));
}

.hero-content {
  max-width: 800px;
}

.hero h1 {
  font-family: var(--font-primary);
  font-size: 3.5rem;
  color: white;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 10px rgba(93, 101, 224, 0.5);
}

.hero h2 {
  font-family: var(--font-primary);
  font-size: 1.8rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
}

.hero p {
  font-size: 1.2rem;
  color: var(--light-color);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-cta {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.primary-btn, .secondary-btn {
  display: inline-block;
  padding: 0.8rem 1.8rem;
  border-radius: 5px;
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
}

.secondary-btn {
  background-color: transparent;
  color: var(--light-color);
  border: 2px solid var(--primary-color);
}

.primary-btn:hover {
  background-color: #4550d1;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(93, 101, 224, 0.3);
}

.secondary-btn:hover {
  background-color: rgba(93, 101, 224, 0.1);
  transform: translateY(-2px);
}

/* About Section */
.about {
  background-color: white;
  padding: 5rem 0;
}

.about h2, .anthology h2, .story h2, .giftshop h2 {
  font-family: var(--font-primary);
  font-size: 2.5rem;
  color: var(--dark-color);
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.about h2::after, .anthology h2::after, .story h2::after, .giftshop h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background-color: var(--primary-color);
}

.about-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.about-text {
  flex: 1;
}

.about-text p {
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.about-image {
  flex: 1;
}

.about-image img {
  max-width: 100%;
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* Anthology Section */
.anthology {
  background-color: #f5f7fa;
  padding: 5rem 0;
}

.anthology-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.anthology-item {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: var(--transition);
  text-align: center;
}

.anthology-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.anthology-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.anthology-item h3 {
  font-family: var(--font-primary);
  margin-bottom: 1rem;
  color: var(--dark-color);
}

.anthology-item p {
  margin-bottom: 1.5rem;
  color: #666;
}

.item-link {
  display: inline-block;
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
  position: relative;
  transition: var(--transition);
}

.item-link::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--primary-color);
  transition: var(--transition);
}

.item-link:hover::after {
  width: 100%;
}

/* Story Section */
.story {
  background-color: white;
  padding: 5rem 0;
}

.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline::after {
  content: '';
  position: absolute;
  width: 4px;
  background-color: var(--primary-color);
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.timeline-item {
  position: relative;
  margin-bottom: 3rem;
}

.timeline-marker {
  position: absolute;
  width: 80px;
  height: 80px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  line-height: 80px;
  font-weight: bold;
  font-size: 1.2rem;
  z-index: 1;
}

.timeline-content {
  position: relative;
  width: 45%;
  padding: 1.5rem;
  background-color: #f5f7fa;
  border-radius: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.timeline-item:nth-child(odd) .timeline-content {
  left: 0;
}

.timeline-item:nth-child(even) .timeline-content {
  left: 55%;
}

.timeline-content h3 {
  font-family: var(--font-primary);
  color: var(--dark-color);
  margin-bottom: 1rem;
}

/* Gift Shop Section */
.giftshop {
  background-color: #f5f7fa;
  padding: 5rem 0;
}

.giftshop-intro {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 3rem;
  font-size: 1.1rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.product-item {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: var(--transition);
}

.product-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.product-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-item h3 {
  padding: 1rem 1rem 0.5rem;
  font-family: var(--font-primary);
  font-size: 1.2rem;
}

.price {
  padding: 0 1rem;
  color: var(--secondary-color);
  font-weight: bold;
  margin-bottom: 1rem;
}

.product-btn {
  display: block;
  background-color: var(--primary-color);
  color: white;
  text-align: center;
  padding: 0.8rem;
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition);
}

.product-btn:hover {
  background-color: #4550d1;
}

/* Footer */
footer {
  background-color: #0a1025;
  color: var(--light-color);
  padding: 3rem 0 1.5rem;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.footer-logo img {
  height: 60px;
}

.footer-links {
  display: flex;
  gap: 3rem;
}

.footer-column h4 {
  font-family: var(--font-primary);
  margin-bottom: 1.5rem;
  color: white;
}

.footer-column ul {
  list-style: none;
}

.footer-column ul li {
  margin-bottom: 0.8rem;
}

.footer-column ul li a {
  color: var(--light-color);
  text-decoration: none;
  transition: var(--transition);
}

.footer-column ul li a:hover {
  color: var(--primary-color);
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-icon {
  font-size: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: var(--transition);
}

.social-icon:hover {
  background-color: var(--primary-color);
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
}

.footer-bottom p {
  margin-bottom: 0.5rem;
}

/* SallyPort Section */
.sallyport {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to right, #0a1025, #1a2a52);
}

.sallyport-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sallyport-logo {
  text-align: center;
  margin-bottom: 2rem;
}

.sallyport-logo img {
  height: 80px;
}

.sallyport-form h2 {
  font-family: var(--font-primary);
  color: white;
  text-align: center;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--light-color);
}

.form-group input {
  width: 100%;
  padding: 1rem;
  border: none;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 5px;
  color: white;
  font-size: 1rem;
  outline: none;
  transition: var(--transition);
}

.form-group input:focus {
  background-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 2px var(--primary-color);
}

.sallyport-btn {
  width: 100%;
  padding: 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.sallyport-btn:hover {
  background-color: #4550d1;
}

.sallyport-links {
  margin-top: 1.5rem;
  text-align: center;
}

.sallyport-links a {
  color: var(--light-color);
  text-decoration: none;
  transition: var(--transition);
}

.sallyport-links a:hover {
  color: var(--primary-color);
}

/* Responsive */
@media (max-width: 992px) {
  .about-content {
    flex-direction: column;
  }
  
  .timeline::after {
    left: 40px;
  }
  
  .timeline-marker {
    left: 40px;
  }
  
  .timeline-content {
    width: calc(100% - 90px);
    left: 90px !important;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 2rem;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  
  .hero h1 {
    font-size: 2.5rem;
  }
  
  .hero h2 {
    font-size: 1.5rem;
  }
  
  .hero-cta {
    flex-direction: column;
  }
}
EOF

# Create JavaScript for interactive elements
cat > "$DEPLOY_DIR/public/js/main.js" << 'EOF'
// Dr. Memoria's Anthology - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.style.padding = '0.5rem 0';
            header.style.background = 'rgba(5, 10, 31, 0.95)';
        } else {
            header.style.padding = '1rem 0';
            header.style.background = 'rgba(5, 10, 31, 0.85)';
        }
    });

    // Create SallyPort access page
    if (window.location.pathname.includes('/sallyport/')) {
        createSallyPortPage();
    }

    // Simple animation for elements
    const animateElements = document.querySelectorAll('.anthology-item, .product-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    animateElements.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(element);
    });
});

// Create SallyPort login page
function createSallyPortPage() {
    // Clear existing content
    document.body.innerHTML = '';
    
    // Create SallyPort container
    const sallyportContainer = document.createElement('div');
    sallyportContainer.className = 'sallyport';
    
    sallyportContainer.innerHTML = `
        <div class="stars"></div>
        <div class="twinkling"></div>
        <div class="clouds"></div>
        
        <div class="sallyport-container">
            <div class="sallyport-logo">
                <img src="../images/dr-memoria-logo.png" alt="Dr. Memoria's Anthology Logo">
            </div>
            <div class="sallyport-form">
                <h2>SallyPort Access</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="sallyport-btn">Access Anthology</button>
                </form>
                <div class="sallyport-links">
                    <p><a href="#" id="forgot-password">Forgot Password?</a> | <a href="/" id="back-to-home">Back to Main Site</a></p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(sallyportContainer);
    
    // Add event listener to the form
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('SallyPort authentication is currently in development. Please check back soon!');
    });
    
    // Add event listener to the back to home link
    document.getElementById('back-to-home').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/';
    });
    
    // Add event listener to the forgot password link
    document.getElementById('forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Password recovery system is currently in development. Please contact support for assistance.');
    });
}
EOF

# Create SallyPort directory and entrance page
mkdir -p "$DEPLOY_DIR/public/sallyport"
cat > "$DEPLOY_DIR/public/sallyport/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SallyPort Access | Dr. Memoria's Anthology</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="icon" type="image/png" href="../images/favicon.png">
</head>
<body>
    <div class="stars"></div>
    <div class="twinkling"></div>
    <div class="clouds"></div>
    
    <div class="sallyport">
        <div class="sallyport-container">
            <div class="sallyport-logo">
                <img src="../images/dr-memoria-logo.png" alt="Dr. Memoria's Anthology Logo">
            </div>
            <div class="sallyport-form">
                <h2>SallyPort Access</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="sallyport-btn">Access Anthology</button>
                </form>
                <div class="sallyport-links">
                    <p><a href="#" id="forgot-password">Forgot Password?</a> | <a href="/" id="back-to-home">Back to Main Site</a></p>
                </div>
            </div>
        </div>
    </div>

    <script src="../js/main.js"></script>
</body>
</html>
EOF

# Create a placeholder image directory structure
mkdir -p "$DEPLOY_DIR/public/images"

# Step 3: Create Firebase configuration
echo -e "${YELLOW}Step 3: Creating Firebase configuration...${NC}"

# Create firebase.json
cat > "$DEPLOY_DIR/firebase.json" << EOF
{
  "hosting": {
    "site": "drmemoria-live",
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/sallyport/**",
        "destination": "/sallyport/index.html"
      },
      {
        "source": "/giftshop/**",
        "destination": "/index.html"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css|eot|otf|ttf|ttc|woff|woff2|font.css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=86400"
          }
        ]
      }
    ]
  },
  "functions": {
    "source": "functions"
  }
}
EOF

# Create .firebaserc
cat > "$DEPLOY_DIR/.firebaserc" << EOF
{
  "projects": {
    "default": "api-for-warp-drive"
  },
  "targets": {
    "api-for-warp-drive": {
      "hosting": {
        "anthology": [
          "drmemoria-live"
        ]
      }
    }
  }
}
EOF

# Step 4: Create minimal Firebase Functions setup
echo -e "${YELLOW}Step 4: Setting up minimal Firebase Functions...${NC}"

# Create package.json for Functions
cat > "$DEPLOY_DIR/functions/package.json" << EOF
{
  "name": "dr-memoria-anthology-functions",
  "description": "Firebase Functions for Dr. Memoria's Anthology",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "16"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^10.0.2",
    "firebase-functions": "^3.18.0"
  },
  "private": true
}
EOF

# Create index.js for Functions
cat > "$DEPLOY_DIR/functions/index.js" << 'EOF'
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Hello World function
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.json({
    message: "Hello from Dr. Memoria's Anthology!",
    timestamp: new Date().toISOString()
  });
});

// SallyPort authentication (placeholder)
exports.sallyPortAuth = functions.https.onCall((data, context) => {
  // This would normally authenticate a user
  // For now, it's just a placeholder
  return {
    success: false,
    message: "SallyPort authentication is not yet implemented."
  };
});

// Get featured anthology items (placeholder)
exports.getFeaturedItems = functions.https.onRequest((request, response) => {
  response.json({
    items: [
      {
        id: "item1",
        title: "The Memory Palace",
        description: "A curated collection of historical memories.",
        type: "written"
      },
      {
        id: "item2",
        title: "Echoes of Tomorrow",
        description: "Visual stories of future predictions.",
        type: "visual"
      },
      {
        id: "item3",
        title: "Voices of the Past",
        description: "Oral histories from different cultures.",
        type: "oral"
      }
    ]
  });
});
EOF

# Step 5: Create deployment script
echo -e "${YELLOW}Step 5: Creating deployment script...${NC}"

cat > "$DEPLOY_DIR/deploy.sh" << 'EOF'
#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     DEPLOYING DR. MEMORIA'S ANTHOLOGY TO FIREBASE        ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install --prefix functions

# Step 2: Create Firebase hosting site if it doesn't exist
echo -e "${YELLOW}Step 2: Ensuring Firebase hosting site exists...${NC}"
firebase hosting:sites:create drmemoria-live --project api-for-warp-drive || true

# Step 3: Deploy to Firebase
echo -e "${YELLOW}Step 3: Deploying to Firebase...${NC}"
firebase deploy --only hosting:anthology --project api-for-warp-drive

# Step 4: Output results
echo -e "${GREEN}✅ Dr. Memoria's Anthology has been deployed!${NC}"
echo -e "${YELLOW}Your site is now available at:${NC}"
echo -e "  - https://drmemoria-live.web.app"
echo -e "  - https://drmemoria-live.firebaseapp.com"

echo -e "${BLUE}=========================================================${NC}"
EOF

chmod +x "$DEPLOY_DIR/deploy.sh"

# Step 6: Create a custom domain setup script for drmemoria.live
echo -e "${YELLOW}Step 6: Creating custom domain setup script...${NC}"

cat > "$DEPLOY_DIR/setup-drmemoria-live-domain.sh" << 'EOF'
#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     CONNECTING DR.MEMORIA.LIVE DOMAIN TO FIREBASE        ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Step 1: Connect custom domain to Firebase hosting
echo -e "${YELLOW}Step 1: Connecting drmemoria.live to Firebase hosting...${NC}"
firebase hosting:sites:update drmemoria-live --project api-for-warp-drive
firebase hosting:sites:update drmemoria-live --set-domain drmemoria.live --project api-for-warp-drive

# Step 2: Output results and next steps
echo -e "${GREEN}✅ Domain connection initiated!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Configure DNS records for drmemoria.live as shown above"
echo -e "2. Wait for DNS propagation (may take 24-48 hours)"
echo -e "3. Firebase will automatically provision SSL certificates"
echo -e "4. Once complete, your site will be available at https://drmemoria.live"

echo -e "${BLUE}=========================================================${NC}"
EOF

chmod +x "$DEPLOY_DIR/setup-drmemoria-live-domain.sh"

# Step 7: Copy all files needed to complete the implementation
echo -e "${YELLOW}Step 7: Copying implementation files...${NC}"

# Set up the structure for the giftshop
mkdir -p "$DEPLOY_DIR/public/giftshop/anthology-book"
mkdir -p "$DEPLOY_DIR/public/giftshop/memory-crystal"
mkdir -p "$DEPLOY_DIR/public/giftshop/creative-passport"
mkdir -p "$DEPLOY_DIR/public/giftshop/subscription"

# Copy relevant implementation files from dr-memoria-deploy
find /Users/as/asoos/dr-memoria-deploy -name "drm-content-*.py" -exec cp {} "$DEPLOY_DIR/functions/" \; 2>/dev/null || true
find /Users/as/asoos/dr-memoria-deploy -name "drm-memoria-anthology-*.py" -exec cp {} "$DEPLOY_DIR/functions/" \; 2>/dev/null || true
find /Users/as/asoos/dr-memoria-deploy -name "drm-data-models.py" -exec cp {} "$DEPLOY_DIR/functions/" \; 2>/dev/null || true

# Step 8: Deploy to Firebase
echo -e "${YELLOW}Step 8: Deploying to Firebase...${NC}"
cd "$DEPLOY_DIR" && ./deploy.sh

# Step 9: Final output
echo -e "${GREEN}✅ Dr. Memoria's Anthology deployment package has been created!${NC}"
echo -e "${YELLOW}Deployment package location:${NC} $DEPLOY_DIR"
echo -e "${YELLOW}Your site is now available at:${NC}"
echo -e "  - https://drmemoria-live.web.app"
echo -e "  - https://drmemoria-live.firebaseapp.com"
echo -e ""
echo -e "${YELLOW}To set up the custom domain:${NC}"
echo -e "  cd $DEPLOY_DIR && ./setup-drmemoria-live-domain.sh"
echo -e ""
echo -e "${BLUE}=========================================================${NC}"