// ASOOS.2100.Cool Worker - Proxy to Pages Deployment
// Redirects all traffic to the new Pages deployment

const PAGES_DEPLOYMENT_URL = 'https://production.asoos-2100-cool-landing.pages.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Create the target URL for Pages deployment
    const targetUrl = new URL(url.pathname + url.search, PAGES_DEPLOYMENT_URL);
    
    try {
      // Fetch content from Pages deployment
      const response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      // Clone the response and add custom headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      
      // Add custom headers to identify this as coming from Worker
      newResponse.headers.set('X-ASOOS-Source', 'Worker-Proxy');
      newResponse.headers.set('X-ASOOS-Status', 'operational');
      newResponse.headers.set('X-ASOOS-Version', 'pages-proxy');
      
      return newResponse;
      
    } catch (error) {
      console.error('Error proxying to Pages deployment:', error);
      
      // Fallback: direct redirect if proxy fails
      return Response.redirect(targetUrl.toString(), 302);
    }
  }
};
