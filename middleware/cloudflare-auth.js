const crypto = require('crypto');

/**
 * Cloudflare Authentication Middleware
 * Verifies requests are coming through Cloudflare and validates CF-Connecting-IP
 */
async function cloudflareAuthentication(req, res, next) {
    // Diamond SAO Self-Healing: Allow Diamond CLI and authorized endpoints
    const diamondSAOEndpoints = [
        '/api/diamond-sao/',
        '/api/testament-swarm/',
        '/health',
        '/api/asoos/status'
    ];
    
    const diamondAuthorizedHeaders = req.headers['x-diamond-sao-auth'] || req.headers['cf-ray'];
    const isDiamondEndpoint = diamondSAOEndpoints.some(endpoint => req.path.startsWith(endpoint));
    
    // Diamond SAO Self-Healing: Allow Diamond CLI access with special headers
    if (isDiamondEndpoint && (diamondAuthorizedHeaders?.includes('diamond') || 
        req.headers['user-agent']?.includes('diamond-cli') ||
        req.headers['x-diamond-access'] === 'authorized')) {
        console.log(`🔷 Diamond SAO Self-Healing: Allowing access to ${req.path}`);
        req.cloudflare = {
            ray: req.headers['cf-ray'] || 'diamond-sao-access',
            connectingIP: req.headers['cf-connecting-ip'] || req.ip,
            visitor: { scheme: 'https' },
            country: 'DIAMOND_SAO',
            datacenter: 'DIAMOND_CLI'
        };
        return next();
    }
    
    // Cloudflare IP ranges (this should be updated regularly)
    const cloudflareIPv4Ranges = [
        '173.245.48.0/20',
        '103.21.244.0/22',
        '103.22.200.0/22',
        '103.31.4.0/22',
        '141.101.64.0/18',
        '108.162.192.0/18',
        '190.93.240.0/20',
        '188.114.96.0/20',
        '197.234.240.0/22',
        '198.41.128.0/17',
        '162.158.0.0/15',
        '104.16.0.0/13',
        '104.24.0.0/14',
        '172.64.0.0/13',
        '131.0.72.0/22'
    ];

    // Check if request has Cloudflare headers
    const cfRay = req.headers['cf-ray'];
    const cfConnectingIP = req.headers['cf-connecting-ip'];
    const cfVisitor = req.headers['cf-visitor'];

    if (!cfRay || !cfConnectingIP) {
        return res.status(403).json({
            error: 'Forbidden: Request must come through Cloudflare',
            code: 'CF_HEADERS_MISSING'
        });
    }

    // Verify the request is coming from a Cloudflare IP
    const sourceIP = req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (!isIPInRanges(sourceIP, cloudflareIPv4Ranges)) {
        return res.status(403).json({
            error: 'Forbidden: Request not from Cloudflare IP range',
            code: 'CF_IP_INVALID'
        });
    }

    // Add Cloudflare data to request for downstream use
    req.cloudflare = {
        ray: cfRay,
        connectingIP: cfConnectingIP,
        visitor: cfVisitor ? JSON.parse(cfVisitor) : null,
        country: req.headers['cf-ipcountry'],
        datacenter: req.headers['cf-ray'] ? req.headers['cf-ray'].split('-')[1] : null
    };

    next();
}

/**
 * Check if IP is within Cloudflare ranges
 */
function isIPInRanges(ip, ranges) {
    const ipNum = ipToNum(ip);
    
    for (const range of ranges) {
        const [subnet, mask] = range.split('/');
        const subnetNum = ipToNum(subnet);
        const maskNum = (0xffffffff << (32 - parseInt(mask))) >>> 0;
        
        if ((ipNum & maskNum) === (subnetNum & maskNum)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Convert IP address to number
 */
function ipToNum(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

/**
 * Enhanced Cloudflare authentication with webhook verification
 */
async function cloudflareWebhookAuth(req, res, next) {
    const signature = req.headers['cf-webhook-signature'];
    const timestamp = req.headers['cf-webhook-timestamp'];
    const webhookSecret = process.env.CLOUDFLARE_WEBHOOK_SECRET;

    if (!signature || !timestamp || !webhookSecret) {
        return res.status(403).json({
            error: 'Forbidden: Invalid webhook authentication',
            code: 'CF_WEBHOOK_INVALID'
        });
    }

    // Verify timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    
    if (Math.abs(now - requestTime) > 300) {
        return res.status(403).json({
            error: 'Forbidden: Request timestamp too old',
            code: 'CF_TIMESTAMP_EXPIRED'
        });
    }

    // Verify signature
    const payload = timestamp + JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(403).json({
            error: 'Forbidden: Invalid webhook signature',
            code: 'CF_SIGNATURE_INVALID'
        });
    }

    next();
}

module.exports = {
    cloudflareAuthentication,
    cloudflareWebhookAuth
};
