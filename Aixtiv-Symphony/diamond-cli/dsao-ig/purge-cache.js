// Simple cache purge using fetch with cache busting
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/purge-cache') {
      // Force cache invalidation
      const targetUrl = 'https://mcp.aipub.2100.cool';
      
      try {
        // Multiple requests with different cache-busting parameters
        const requests = [
          fetch(targetUrl + '?bust=' + Date.now(), { 
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache, must-revalidate' }
          }),
          fetch(targetUrl + '?v=latest&t=' + Date.now(), {
            method: 'GET', 
            headers: { 'Pragma': 'no-cache' }
          })
        ];
        
        await Promise.all(requests);
        
        return new Response('Cache purge attempted for mcp.aipub.2100.cool', {
          headers: { 'Content-Type': 'text/plain' }
        });
      } catch (error) {
        return new Response('Cache purge failed: ' + error.message, {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }
    
    return new Response('Not found', { status: 404 });
  },
};
