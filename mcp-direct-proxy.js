// MCP DIRECT PROXY - NO COMPLEXITY, JUST WORKS
// Diamond SAO approved simple solution

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // DIAMOND SAO DIRECT ACCESS - Commander Phillip Corey Roark
    if (url.pathname === '/') {
      // Force personalization for Diamond SAO Commander
      const mcpUrl = `https://mocoa-859242575175.us-west1.run.app${url.pathname}${url.search}?user=pr@coaching2100.com&role=ceo-diamond-sao&force_personalization=true`;
      
      try {
        const mcpResponse = await fetch(mcpUrl, {
          headers: {
            'X-User-Email': 'pr@coaching2100.com',
            'X-User-Role': 'ceo-diamond-sao',
            'X-Diamond-SAO': 'COMMANDER',
            'X-Force-Personalization': 'true'
          }
        });
        
        if (mcpResponse.ok) {
          let mcpHtml = await mcpResponse.text();
          
          // Remove all Morgan references completely - he is EAO not CEO
          mcpHtml = mcpHtml.replace(/Morgan O'Brien/g, '');
          mcpHtml = mcpHtml.replace(/Mr\. Morgan/g, '');
          mcpHtml = mcpHtml.replace(/Morgan/g, '');
          // Clean up any double spaces or empty elements
          mcpHtml = mcpHtml.replace(/\s+/g, ' ');
          mcpHtml = mcpHtml.replace(/<[^>]*>\s*<\/[^>]*>/g, '');
          
          return new Response(mcpHtml, {
            status: 200,
            headers: {
              'Content-Type': 'text/html;charset=UTF-8',
              'X-MCP-Source': 'Diamond-SAO-Direct',
              'X-Diamond-SAO': 'COMMANDER-ROARK',
              'X-Personalization': 'FORCED-CEO',
              'Cache-Control': 'no-cache, no-store'
            }
          });
        }
      } catch (error) {
        console.log('Direct MCP fetch failed, using fallback');
      }
    }
    
    // Fallback to existing MOCOA service for API endpoints
    const targetUrl = `https://mocoa-yutylytffa-uw.a.run.app${url.pathname}${url.search}`;
    
    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          'X-MCP-Proxy': 'DIRECT',
          'X-Diamond-SAO': 'APPROVED',
          'X-Simple-Solution': 'TRUE'
        }
      });
    } catch (error) {
      // Simple fallback
      return new Response(JSON.stringify({
        message: 'MCP Direct Access',
        status: 'Service temporarily unavailable',
        timestamp: new Date().toISOString(),
        diamond_sao: 'approved_simple_solution'
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Diamond-SAO': 'FALLBACK'
        }
      });
    }
  }
};
