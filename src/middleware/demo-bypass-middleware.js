// Demo bypass middleware for immediate access
const demoBypassMiddleware = (req, res, next) => {
    // Skip authentication when in demo mode
    if (process.env.SKIP_AUTH === 'true' || process.env.DEMO_MODE === 'true') {
        console.log('🚀 DEMO MODE: Bypassing authentication');
        req.user = {
            uid: 'demo-user',
            email: 'demo@2100.cool',
            role: 'admin',
            permissions: ['all']
        };
        req.isAuthenticated = true;
        req.isDemoMode = true;
    }
    next();
};

const generateDemoUrl = () => {
    return 'http://localhost:3333/?demo=true';
};

const getDemoStatus = () => {
    return {
        enabled: process.env.SKIP_AUTH === 'true' || process.env.DEMO_MODE === 'true',
        url: generateDemoUrl()
    };
};

module.exports = {
    demoBypassMiddleware,
    generateDemoUrl,
    getDemoStatus
};
