/**
 * 🐳 DOCKER SCOUT SIMPLE TEST - Victory36 Protected
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Simple CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Victory36-Protected': 'true'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        if (url.pathname === '/test') {
            return new Response('Docker Scout Gateway Test - SUCCESS!', { 
                headers: { ...headers, 'Content-Type': 'text/plain' }
            });
        }

        if (url.pathname === '/docker-scout/health') {
            return new Response(JSON.stringify({
                status: 'Sacred and ready',
                gateway: 'Docker Scout Test Gateway',
                timestamp: new Date().toISOString(),
                environment: env.ENVIRONMENT || 'staging',
                victory36: true
            }), { 
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        return new Response('Docker Scout Test Gateway - Not Found', { 
            status: 404,
            headers: { ...headers, 'Content-Type': 'text/plain' }
        });
    }
};
