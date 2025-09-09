/**
 * 2100.Cool Primary Platform - Main Application
 * Core functionality for the primary 2100.Cool interface
 */

class Platform2100 {
  constructor() {
    this.version = '1.0.0';
    this.environment = 'production';
    this.init();
  }

  init() {
    console.log('🚀 2100.Cool Primary Platform v' + this.version);
    console.log('🌐 Environment:', this.environment);
        
    this.setupEventListeners();
    this.loadComponents();
  }

  setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ Platform initialized');
      this.initializeInterface();
    });

    // Handle navigation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) {
        this.handleNavigation(e);
      }
    });
  }

  initializeInterface() {
    // Initialize any dynamic components
    this.createParticleBackground();
    this.setupScrollEffects();
  }

  createParticleBackground() {
    // Add subtle particle effect if container exists
    const particleContainer = document.getElementById('particles');
    if (particleContainer) {
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
                    position: absolute;
                    width: ${Math.random() * 3 + 1}px;
                    height: ${Math.random() * 3 + 1}px;
                    background: linear-gradient(135deg, #0bb1bb, #50C878);
                    border-radius: 50%;
                    opacity: 0.1;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    animation: float ${10 + Math.random() * 10}s infinite linear;
                `;
        particleContainer.appendChild(particle);
      }
    }
  }

  setupScrollEffects() {
    // Add smooth scrolling and reveal animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe elements with fade-in class
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  handleNavigation(e) {
    e.preventDefault();
    const target = e.target.getAttribute('href');
        
    if (target && target.startsWith('#')) {
      const element = document.querySelector(target);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }

  loadComponents() {
    // Load interface components dynamically
    this.loadInterface();
    this.loadCoachingIntegration();
  }

  async loadInterface() {
    try {
      // Interface will be loaded when needed
      console.log('🔧 Interface components ready');
    } catch (error) {
      console.error('❌ Error loading interface:', error);
    }
  }

  async loadCoachingIntegration() {
    try {
      // Coaching2100 integration
      console.log('🎯 Coaching integration ready');
    } catch (error) {
      console.error('❌ Error loading coaching integration:', error);
    }
  }

  // Utility methods
  static smoothTransition(element, property, value, duration = 300) {
    element.style.transition = `${property} ${duration}ms ease`;
    element.style[property] = value;
  }

  static async fetchAPI(endpoint) {
    try {
      const response = await fetch(endpoint);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  }
}

// Global platform instance
const platform = new Platform2100();

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Platform2100;
}

// Global utility functions
function loadInterface() {
  console.log('🚀 Loading interface...');
  window.location.href = 'interface/index.html';
}

function loadCoaching() {
  console.log('🎯 Loading Coaching2100...');
  window.location.href = 'coaching2100-com/index.html';
}

function subscribe() {
  console.log('📧 Loading subscription...');
  window.location.href = 'subscribe.html';
}
