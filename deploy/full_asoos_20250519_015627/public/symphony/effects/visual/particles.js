// Particles.js effect - minimalist version
document.addEventListener('DOMContentLoaded', function() {
  const particlesContainer = document.createElement('div');
  particlesContainer.id = 'particles-js';
  document.body.prepend(particlesContainer);
  
  class Particle {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.speedY = Math.random() * 0.5 - 0.25;
      this.color = `rgba(11, 177, 187, ${Math.random() * 0.5 + 0.2})`;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.x > this.canvas.width) this.x = 0;
      if (this.x < 0) this.x = this.canvas.width;
      if (this.y > this.canvas.height) this.y = 0;
      if (this.y < 0) this.y = this.canvas.height;
    }
    
    draw() {
      this.ctx.fillStyle = this.color;
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  class ParticleSystem {
    constructor() {
      this.canvas = document.createElement('canvas');
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      document.getElementById('particles-js').appendChild(this.canvas);
      
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.particleCount = Math.min(window.innerWidth / 10, 100);
      
      this.init();
      this.animate();
      
      window.addEventListener('resize', () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      });
    }
    
    init() {
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push(new Particle(this.canvas));
      }
    }
    
    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      for (let particle of this.particles) {
        particle.update();
        particle.draw();
      }
      
      requestAnimationFrame(this.animate.bind(this));
    }
  }
  
  window.particleSystem = new ParticleSystem();
});
