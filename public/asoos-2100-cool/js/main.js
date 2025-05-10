// 2100.cool Main JavaScript File

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            
            // Skip if it's just "#"
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Account for header height
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form submission handler (placeholder)
    const contactForm = document.querySelector('#contact form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = this.querySelector('#name');
            const emailInput = this.querySelector('#email');
            const messageInput = this.querySelector('#message');
            
            // Simple validation
            if (!nameInput.value || !emailInput.value || !messageInput.value) {
                alert('Please fill out all fields');
                return;
            }
            
            // Here you would normally send the form data to your server
            // For now, just show a success message
            alert('Thank you for your message! We will get back to you soon.');
            this.reset();
        });
    }

    // Mobile navigation toggle (for responsive design)
    const setupMobileNav = () => {
        const header = document.querySelector('header');
        if (!header) return;
        
        // Create mobile nav toggle button if it doesn't exist
        if (!document.querySelector('.mobile-nav-toggle')) {
            const navToggle = document.createElement('button');
            navToggle.classList.add('mobile-nav-toggle');
            navToggle.innerHTML = '<i class="fas fa-bars"></i>';
            navToggle.style.display = 'none'; // Hide by default
            
            // Add toggle functionality
            navToggle.addEventListener('click', () => {
                const nav = document.querySelector('nav');
                if (nav) {
                    nav.classList.toggle('active');
                    navToggle.innerHTML = nav.classList.contains('active') 
                        ? '<i class="fas fa-times"></i>' 
                        : '<i class="fas fa-bars"></i>';
                }
            });
            
            header.querySelector('.container').appendChild(navToggle);
        }
        
        // Handle responsive navigation based on screen size
        const handleResponsiveNav = () => {
            const nav = document.querySelector('nav');
            const navToggle = document.querySelector('.mobile-nav-toggle');
            
            if (window.innerWidth <= 768) {
                if (navToggle) navToggle.style.display = 'block';
                if (nav) nav.classList.add('mobile-nav');
            } else {
                if (navToggle) navToggle.style.display = 'none';
                if (nav) {
                    nav.classList.remove('mobile-nav');
                    nav.classList.remove('active');
                }
            }
        };
        
        // Initial call and window resize listener
        handleResponsiveNav();
        window.addEventListener('resize', handleResponsiveNav);
    };
    
    // Initialize mobile navigation
    setupMobileNav();
});