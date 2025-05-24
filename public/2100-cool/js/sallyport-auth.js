/**
 * SallyPort Authentication Script
 * Provides authentication flow for ASOOS interface with SallyPort security
 */

(function() {
    // SallyPort Authentication State
    const sallyPortState = {
        isAuthenticated: false,
        userInfo: null,
        token: null,
        sessionExpiry: null,
        isLoading: false,
        error: null
    };

    // Configuration (should be provided globally)
    const config = window.sallyPortConfig || {
        apiUrl: 'https://api.sallyport.aixtiv.dev',
        appId: 'asoos-2100-cool',
        redirectUri: window.location.origin + '/auth-callback'
    };

    // Check if there's a stored session
    function checkSession() {
        try {
            const sessionData = localStorage.getItem('sallyport_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session && session.token && new Date(session.expiry) > new Date()) {
                    sallyPortState.isAuthenticated = true;
                    sallyPortState.userInfo = session.userInfo;
                    sallyPortState.token = session.token;
                    sallyPortState.sessionExpiry = new Date(session.expiry);
                    
                    // Auto-refresh token if it's close to expiry
                    const timeToExpiry = new Date(session.expiry) - new Date();
                    if (timeToExpiry < 300000) { // Less than 5 minutes
                        refreshToken(session.token);
                    }
                    
                    return true;
                } else {
                    // Session expired, clear it
                    localStorage.removeItem('sallyport_session');
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
        
        return false;
    }

    // Authenticate with username and password
    async function authenticate(username, password) {
        try {
            sallyPortState.isLoading = true;
            sallyPortState.error = null;
            
            // In a real implementation, this would call the SallyPort API
            // For now, simulate a successful login for any provided credentials
            const response = await simulateAuthApiCall(username, password);
            
            if (response.success) {
                sallyPortState.isAuthenticated = true;
                sallyPortState.userInfo = response.user;
                sallyPortState.token = response.token;
                sallyPortState.sessionExpiry = new Date(response.expiry);
                
                // Store session
                localStorage.setItem('sallyport_session', JSON.stringify({
                    token: response.token,
                    userInfo: response.user,
                    expiry: response.expiry
                }));
                
                sallyPortState.isLoading = false;
                return true;
            } else {
                sallyPortState.error = response.error || 'Authentication failed';
                sallyPortState.isLoading = false;
                return false;
            }
        } catch (error) {
            sallyPortState.error = error.message || 'Authentication error';
            sallyPortState.isLoading = false;
            console.error('Authentication error:', error);
            return false;
        }
    }

    // Refresh token
    async function refreshToken(token) {
        try {
            sallyPortState.isLoading = true;
            
            // In a real implementation, this would call the SallyPort API
            const response = await simulateTokenRefreshCall(token);
            
            if (response.success) {
                sallyPortState.token = response.token;
                sallyPortState.sessionExpiry = new Date(response.expiry);
                
                // Update stored session
                const sessionData = JSON.parse(localStorage.getItem('sallyport_session') || '{}');
                sessionData.token = response.token;
                sessionData.expiry = response.expiry;
                localStorage.setItem('sallyport_session', JSON.stringify(sessionData));
                
                sallyPortState.isLoading = false;
                return true;
            } else {
                // Token refresh failed, log out
                logout();
                sallyPortState.isLoading = false;
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
            sallyPortState.isLoading = false;
            return false;
        }
    }

    // Logout
    function logout() {
        sallyPortState.isAuthenticated = false;
        sallyPortState.userInfo = null;
        sallyPortState.token = null;
        sallyPortState.sessionExpiry = null;
        localStorage.removeItem('sallyport_session');
    }

    // Simulate authentication API call
    function simulateAuthApiCall(username, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Always succeed for demo
                resolve({
                    success: true,
                    token: 'sally-port-token-' + Math.random().toString(36).substring(2),
                    user: {
                        id: 'user-' + Math.random().toString(36).substring(2),
                        username: username,
                        name: 'ASOOS User',
                        roles: ['user', 'copilot_access', 'executive_access']
                    },
                    expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
                });
            }, 1000);
        });
    }

    // Simulate token refresh API call
    function simulateTokenRefreshCall(token) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Always succeed for demo
                resolve({
                    success: true,
                    token: 'sally-port-refresh-token-' + Math.random().toString(36).substring(2),
                    expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
                });
            }, 500);
        });
    }

    // Check for existing session on load
    document.addEventListener('DOMContentLoaded', function() {
        const hasSession = checkSession();
        
        if (hasSession) {
            console.log('Active SallyPort session found');
            
            // Hide login screen
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                loginScreen.classList.remove('active');
            }
            
            // Show main interface
            const platformInterface = document.getElementById('platform-interface');
            if (platformInterface) {
                platformInterface.classList.remove('hidden');
            }
            
            // Activate Copilot panel
            const copilotPanel = document.getElementById('copilot-panel');
            if (copilotPanel) {
                copilotPanel.classList.add('active');
            }
            
            // Show welcome back notification
            if (window.showNotification) {
                window.showNotification(
                    'Welcome Back', 
                    `Session restored. Welcome back, ${sallyPortState.userInfo?.name || 'User'}.`, 
                    'success'
                );
            }
        }
        
        // Hook up login form with SallyPort authentication
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
            loginButton.addEventListener('click', async function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                if (!username || !password) {
                    if (window.showNotification) {
                        window.showNotification('Login Failed', 'Please enter both username and password.', 'error');
                    }
                    return;
                }
                
                // Show loading state
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
                this.disabled = true;
                
                // Authenticate with SallyPort
                const success = await authenticate(username, password);
                
                if (success) {
                    // Hide login screen
                    const loginScreen = document.getElementById('login-screen');
                    if (loginScreen) {
                        loginScreen.classList.remove('active');
                    }
                    
                    // Show main interface
                    const platformInterface = document.getElementById('platform-interface');
                    if (platformInterface) {
                        platformInterface.classList.remove('hidden');
                    }
                    
                    // Activate Copilot panel
                    const copilotPanel = document.getElementById('copilot-panel');
                    if (copilotPanel) {
                        copilotPanel.classList.add('active');
                    }
                    
                    // Show welcome notification
                    if (window.showNotification) {
                        window.showNotification(
                            'Welcome to ASOOS', 
                            `Login successful. Welcome, ${sallyPortState.userInfo?.name || 'User'}.`, 
                            'success'
                        );
                    }
                } else {
                    // Reset button
                    this.innerHTML = 'Login';
                    this.disabled = false;
                    
                    // Show error notification
                    if (window.showNotification) {
                        window.showNotification('Authentication Failed', sallyPortState.error || 'Invalid credentials', 'error');
                    }
                }
            });
        }
    });

    // Export SallyPort authentication API
    window.SallyPortAuth = {
        authenticate,
        logout,
        refreshToken,
        getState: () => ({ ...sallyPortState }), // Return copy of state
        isAuthenticated: () => sallyPortState.isAuthenticated,
        getUserInfo: () => sallyPortState.userInfo,
        getToken: () => sallyPortState.token
    };
})();