/**
 * ASOOS Navigation System
 * Handles side navigation, bottom navigation, and panel interactions
 */

(function() {
    // Initialize navigation when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initNavigation();
    });

    // Initialize navigation components
    function initNavigation() {
        setupSideNav();
        setupBottomNav();
        setupPanelInteractions();
        initializeTooltips();
    }

    // Set up side navigation
    function setupSideNav() {
        const sideNav = document.getElementById('side-nav');
        if (!sideNav) return;

        // Add navigation icons dynamically if they don't exist
        if (sideNav.children.length === 0) {
            const navItems = [
                { id: 'wing-command', icon: 'plane', tooltip: 'Wing Command' },
                { id: 'copilot', icon: 'user-astronaut', tooltip: 'Copilot' },
                { id: 'executive', icon: 'chart-line', tooltip: 'Executive' },
                { id: 'agents', icon: 'robot', tooltip: 'Agents' },
                { id: 'sally-port', icon: 'shield-alt', tooltip: 'SallyPort' }
            ];

            navItems.forEach(item => {
                const navIcon = document.createElement('div');
                navIcon.className = 'nav-icon';
                navIcon.setAttribute('data-id', item.id);
                navIcon.setAttribute('title', item.tooltip);
                
                navIcon.innerHTML = `
                    <i class="fas fa-${item.icon}"></i>
                    <div class="tooltip">${item.tooltip}</div>
                `;
                
                sideNav.appendChild(navIcon);
            });
        }

        // Set up click handlers
        sideNav.querySelectorAll('.nav-icon').forEach(icon => {
            icon.addEventListener('click', handleNavClick);
        });
    }

    // Set up bottom navigation
    function setupBottomNav() {
        const bottomNav = document.getElementById('bottom-nav');
        if (!bottomNav) return;

        // Add navigation icons dynamically if they don't exist
        if (bottomNav.children.length === 0) {
            const navSections = [
                {
                    items: [
                        { id: 'search', icon: 'search', tooltip: 'Search' },
                        { id: 'settings', icon: 'cog', tooltip: 'Settings' }
                    ]
                },
                {
                    items: [
                        { id: 'notifications', icon: 'bell', tooltip: 'Notifications' },
                        { id: 'user', icon: 'user', tooltip: 'Profile', active: true }
                    ]
                }
            ];

            navSections.forEach(section => {
                const navSection = document.createElement('div');
                navSection.className = 'nav-section';
                
                section.items.forEach(item => {
                    const navIcon = document.createElement('div');
                    navIcon.className = 'nav-icon';
                    if (item.active) navIcon.classList.add('active');
                    navIcon.setAttribute('data-id', item.id);
                    navIcon.setAttribute('title', item.tooltip);
                    
                    navIcon.innerHTML = `
                        <i class="fas fa-${item.icon}"></i>
                        <div class="tooltip bottom">${item.tooltip}</div>
                    `;
                    
                    navSection.appendChild(navIcon);
                });
                
                bottomNav.appendChild(navSection);
            });
        }

        // Set up click handlers
        bottomNav.querySelectorAll('.nav-icon').forEach(icon => {
            icon.addEventListener('click', handleNavClick);
        });
    }

    // Set up panel interactions
    function setupPanelInteractions() {
        // Ensure platform interface exists
        const platformInterface = document.getElementById('platform-interface');
        if (!platformInterface) return;

        // Set up drag-and-drop for panels if needed
        document.querySelectorAll('.interface-panel').forEach(panel => {
            // Add any panel-specific initializations here
            
            // Example: Make panels draggable
            if (panel.classList.contains('draggable')) {
                makeDraggable(panel);
            }
        });
    }

    // Initialize tooltips
    function initializeTooltips() {
        document.querySelectorAll('.tooltip').forEach(tooltip => {
            const parent = tooltip.parentElement;
            
            // Mouse enter - show tooltip
            parent.addEventListener('mouseenter', function() {
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
            });
            
            // Mouse leave - hide tooltip
            parent.addEventListener('mouseleave', function() {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            });
        });
    }

    // Handle navigation click
    function handleNavClick(event) {
        const navIcon = event.currentTarget;
        const navId = navIcon.getAttribute('data-id');
        
        // Get all navigation items
        const allNavItems = [
            ...document.querySelectorAll('#side-nav .nav-icon'),
            ...document.querySelectorAll('#bottom-nav .nav-icon')
        ];
        
        // Remove active class from all items
        allNavItems.forEach(item => item.classList.remove('active'));
        
        // Add active class to clicked item
        navIcon.classList.add('active');
        
        // Hide all panels
        document.querySelectorAll('.interface-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Show the selected panel
        const panel = document.getElementById(`${navId}-panel`);
        if (panel) {
            panel.classList.add('active');
            
            // Trigger panel transition effect
            panel.classList.add('transition');
            setTimeout(() => panel.classList.remove('transition'), 500);
        }
        
        // Dispatch custom event
        const customEvent = new CustomEvent('navigationChange', {
            detail: {
                panel: navId,
                title: navIcon.getAttribute('title') || navId
            }
        });
        document.dispatchEvent(customEvent);
    }

    // Make an element draggable (utility function)
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        // Get the header element, or create one if it doesn't exist
        const header = element.querySelector('.panel-header');
        if (header) {
            header.onmousedown = dragMouseDown;
        } else {
            element.onmousedown = dragMouseDown;
        }
        
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            
            // Get mouse position
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Set z-index to bring to front
            element.style.zIndex = 1000;
            
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            
            // Calculate new positions
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Set element's new position
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }
        
        function closeDragElement() {
            // Stop moving element
            document.onmouseup = null;
            document.onmousemove = null;
            
            // Reset z-index
            setTimeout(() => {
                element.style.zIndex = "";
            }, 100);
        }
    }

    // Export navigation utilities
    window.ASOOSNavigation = {
        activatePanel: function(panelId) {
            const navIcon = document.querySelector(`.nav-icon[data-id="${panelId}"]`);
            if (navIcon) {
                navIcon.click();
                return true;
            }
            return false;
        },
        
        addNotification: function(count) {
            const notificationIcon = document.querySelector('.nav-icon[data-id="notifications"]');
            if (notificationIcon) {
                let badge = notificationIcon.querySelector('.notification-badge');
                
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'notification-badge';
                    notificationIcon.appendChild(badge);
                }
                
                badge.textContent = count || '!';
                badge.classList.add('pulse');
                
                setTimeout(() => badge.classList.remove('pulse'), 1000);
                
                return true;
            }
            return false;
        },
        
        clearNotifications: function() {
            const badge = document.querySelector('.nav-icon[data-id="notifications"] .notification-badge');
            if (badge) {
                badge.remove();
                return true;
            }
            return false;
        }
    };
})();