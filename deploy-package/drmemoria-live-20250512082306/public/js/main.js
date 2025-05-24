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
