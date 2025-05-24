/**
 * Navigation System for ASOOS Platform
 * Handles side navigation, bottom panels, and integrations
 */

class NavigationSystem {
  /**
   * Initialize the navigation system
   */
  constructor() {
    // Navigation sections
    this.sideNavIcons = [
      { id: 'anthology', name: "Anthology", icon: 'fa-book-open' },
      { id: 'bidsuite', name: 'BidSuite', icon: 'fa-briefcase' },
      { id: 'roi', name: 'ROI', icon: 'fa-chart-line' },
      { id: 'wishvision', name: 'WishVision', icon: 'fa-cloud-sun' },
      { id: 'academy', name: 'Academy', icon: 'fa-graduation-cap' }
    ];
    
    this.bottomLeftIcons = [
      { id: 'giftshop', name: 'Gift Shop', icon: 'fa-gift' },
      { id: 'pilots-lounge', name: 'Pilots Lounge', icon: 'fa-users' },
      { id: 'social-pub', name: 'Social-Pub', icon: 'fa-share-nodes' },
      { id: 'settings', name: 'Settings', icon: 'fa-gear' }
    ];
    
    this.bottomRightIcons = [
      { id: 'integrations', name: 'Integrations', icon: 'fa-puzzle-piece' }
    ];
    
    // Active section
    this.activeSection = null;
    
    // Track user authentication status
    this.authenticated = false;
    this.userPermissions = [];
    
    // Initialize UI when DOM is ready
    document.addEventListener('DOMContentLoaded', () => this.init());
  }
  
  /**
   * Initialize the navigation UI
   */
  init() {
    // Create navigation elements
    this._createSideNav();
    this._createBottomNav();
    
    // Initialize hover effects and click handlers
    this._initInteractions();
    
    // Check authentication state
    this._checkAuthentication();
    
    console.log('Navigation system initialized');
  }
  
  /**
   * Create the side navigation panel
   * @private
   */
  _createSideNav() {
    // Create side navigation container if it doesn't exist
    let sideNav = document.getElementById('side-nav');
    if (!sideNav) {
      sideNav = document.createElement('div');
      sideNav.id = 'side-nav';
      document.body.appendChild(sideNav);
    }
    
    // Clear existing content
    sideNav.innerHTML = '';
    
    // Create icons
    this.sideNavIcons.forEach(item => {
      const iconElement = document.createElement('div');
      iconElement.className = 'nav-icon';
      iconElement.dataset.id = item.id;
      iconElement.dataset.name = item.name;
      
      const icon = document.createElement('i');
      icon.className = `fas ${item.icon}`;
      
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip';
      tooltip.textContent = item.name;
      
      iconElement.appendChild(icon);
      iconElement.appendChild(tooltip);
      sideNav.appendChild(iconElement);
    });
  }
  
  /**
   * Create the bottom navigation bar
   * @private
   */
  _createBottomNav() {
    // Create bottom navigation container if it doesn't exist
    let bottomNav = document.getElementById('bottom-nav');
    if (!bottomNav) {
      bottomNav = document.createElement('div');
      bottomNav.id = 'bottom-nav';
      document.body.appendChild(bottomNav);
    }
    
    // Clear existing content
    bottomNav.innerHTML = '';
    
    // Create left section
    const leftSection = document.createElement('div');
    leftSection.className = 'nav-section left';
    
    this.bottomLeftIcons.forEach(item => {
      const iconElement = document.createElement('div');
      iconElement.className = 'nav-icon';
      iconElement.dataset.id = item.id;
      iconElement.dataset.name = item.name;
      
      const icon = document.createElement('i');
      icon.className = `fas ${item.icon}`;
      
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip bottom';
      tooltip.textContent = item.name;
      
      iconElement.appendChild(icon);
      iconElement.appendChild(tooltip);
      leftSection.appendChild(iconElement);
    });
    
    // Create right section
    const rightSection = document.createElement('div');
    rightSection.className = 'nav-section right';
    
    this.bottomRightIcons.forEach(item => {
      const iconElement = document.createElement('div');
      iconElement.className = 'nav-icon';
      iconElement.dataset.id = item.id;
      iconElement.dataset.name = item.name;
      
      const icon = document.createElement('i');
      icon.className = `fas ${item.icon}`;
      
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltip bottom';
      tooltip.textContent = item.name;
      
      iconElement.appendChild(icon);
      iconElement.appendChild(tooltip);
      rightSection.appendChild(iconElement);
    });
    
    // Add sections to bottom nav
    bottomNav.appendChild(leftSection);
    bottomNav.appendChild(rightSection);
  }
  
  /**
   * Initialize hover effects and click handlers
   * @private
   */
  _initInteractions() {
    // Get all navigation icons
    const allIcons = document.querySelectorAll('.nav-icon');
    
    // Add event listeners to each icon
    allIcons.forEach(icon => {
      // Hover effect
      icon.addEventListener('mouseenter', () => {
        this._showTooltip(icon);
      });
      
      icon.addEventListener('mouseleave', () => {
        this._hideTooltip(icon);
      });
      
      // Click handler
      icon.addEventListener('click', () => {
        this._handleNavClick(icon);
      });
    });
  }
  
  /**
   * Show tooltip on hover
   * @param {Element} icon - The icon element being hovered
   * @private
   */
  _showTooltip(icon) {
    const tooltip = icon.querySelector('.tooltip');
    if (tooltip) {
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
    }
  }
  
  /**
   * Hide tooltip when not hovering
   * @param {Element} icon - The icon element no longer being hovered
   * @private
   */
  _hideTooltip(icon) {
    const tooltip = icon.querySelector('.tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    }
  }
  
  /**
   * Handle navigation icon click
   * @param {Element} icon - The icon element that was clicked
   * @private
   */
  _handleNavClick(icon) {
    const sectionId = icon.dataset.id;
    
    // Check if user has permission to access this section
    if (!this._hasPermission(sectionId)) {
      this._showAccessDenied(icon.dataset.name);
      return;
    }
    
    // Handle special case for Anthology toggle
    if (sectionId === 'anthology') {
      this._toggleAnthology();
      return;
    }
    
    // Update active section
    this._setActiveSection(sectionId);
    
    // Trigger section change event for application to handle
    this._triggerSectionChange(sectionId);
  }
  
  /**
   * Set the active navigation section
   * @param {String} sectionId - ID of the section to activate
   * @private
   */
  _setActiveSection(sectionId) {
    // Remove active class from all icons
    document.querySelectorAll('.nav-icon').forEach(icon => {
      icon.classList.remove('active');
    });
    
    // Add active class to selected icon
    const activeIcon = document.querySelector(`.nav-icon[data-id="${sectionId}"]`);
    if (activeIcon) {
      activeIcon.classList.add('active');
    }
    
    this.activeSection = sectionId;
  }
  
  /**
   * Toggle Dr. Memoria's Anthology interface
   * @private
   */
  _toggleAnthology() {
    console.log("Toggling Anthology");

    const anthologyIcon = document.querySelector('.nav-icon[data-id="anthology"]');
    const isActive = !anthologyIcon.classList.contains('active');

    // Create custom event
    const event = new CustomEvent('toggleAnthology', {
      detail: {
        active: isActive,
        transitionState: 'start'
      }
    });

    // Dispatch event for application to handle
    document.dispatchEvent(event);

    // Toggle active state
    anthologyIcon.classList.toggle('active');

    // Change icon temporarily during activation
    if (isActive) {
      const originalIcon = anthologyIcon.querySelector('i').className;
      anthologyIcon.dataset.originalIcon = originalIcon;
      anthologyIcon.querySelector('i').className = 'fas fa-spinner fa-spin';

      // After animation completes, restore icon with a special effect
      setTimeout(() => {
        anthologyIcon.querySelector('i').className = 'fas fa-book-open anthology-active';

        // Notify that transition is complete
        document.dispatchEvent(new CustomEvent('toggleAnthology', {
          detail: {
            active: isActive,
            transitionState: 'complete'
          }
        }));
      }, 1200);
    } else {
      // When deactivating, restore original icon
      anthologyIcon.querySelector('i').className = 'fas fa-book-open';
    }
  }
  
  /**
   * Trigger section change event
   * @param {String} sectionId - ID of the section to change to
   * @private
   */
  _triggerSectionChange(sectionId) {
    // Create custom event
    const event = new CustomEvent('sectionChange', {
      detail: {
        section: sectionId,
        name: document.querySelector(`.nav-icon[data-id="${sectionId}"]`).dataset.name
      }
    });
    
    // Dispatch event for application to handle
    document.dispatchEvent(event);
  }
  
  /**
   * Check if user has permission to access section
   * @param {String} sectionId - ID of the section to check
   * @returns {Boolean} - Whether user has permission
   * @private
   */
  _hasPermission(sectionId) {
    // If not authenticated, only allow certain sections
    if (!this.authenticated) {
      return ['academy', 'settings'].includes(sectionId);
    }
    
    // Check permissions array
    return this.userPermissions.includes(sectionId) || 
           this.userPermissions.includes('all') ||
           ['settings', 'academy'].includes(sectionId);
  }
  
  /**
   * Show access denied message
   * @param {String} sectionName - Name of the section being accessed
   * @private
   */
  _showAccessDenied(sectionName) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
      <i class="fas fa-lock"></i>
      <span>Access Denied: You don't have permission to access ${sectionName}</span>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }
  
  /**
   * Check authentication state
   * @private
   */
  _checkAuthentication() {
    // Use SallyPort to check authentication if available
    if (window.sallyPortAuth) {
      window.sallyPortAuth.onAuthStateChanged(user => {
        this.authenticated = !!user;
        
        if (user) {
          // Get permissions from user
          this.userPermissions = user.permissions || [];
        } else {
          this.userPermissions = [];
        }
        
        // Update UI based on auth state
        this._updateUIForAuthState();
      });
    } else {
      console.warn('SallyPort authentication not available');
      
      // For development only - simulate authentication
      if (window.location.hostname === 'localhost') {
        this.authenticated = true;
        this.userPermissions = ['all'];
        this._updateUIForAuthState();
      }
    }
  }
  
  /**
   * Update UI based on authentication state
   * @private
   */
  _updateUIForAuthState() {
    // Update navigation icons based on permissions
    document.querySelectorAll('.nav-icon').forEach(icon => {
      const sectionId = icon.dataset.id;
      
      if (!this._hasPermission(sectionId)) {
        icon.classList.add('locked');
      } else {
        icon.classList.remove('locked');
      }
    });
  }
  
  /**
   * Set user permissions manually (for testing)
   * @param {Array} permissions - Array of permission strings
   */
  setPermissions(permissions) {
    this.userPermissions = permissions;
    this._updateUIForAuthState();
  }
  
  /**
   * Set authentication state manually (for testing)
   * @param {Boolean} authenticated - Whether user is authenticated
   */
  setAuthenticated(authenticated) {
    this.authenticated = authenticated;
    this._updateUIForAuthState();
  }
}

// Create and export navigation instance
const navigation = new NavigationSystem();

// Make available globally
window.navigation = navigation;