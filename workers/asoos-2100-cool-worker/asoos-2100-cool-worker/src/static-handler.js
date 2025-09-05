/**
 * Static File Handler for ASOOS Landing Page
 * Serves the HTML file and handles static assets
 */

// Import the ASOOS landing page HTML content
import indexHtml from '../static/index.html';

export class StaticHandler {
  constructor(env) {
    this.env = env;
  }

  async handleRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Serve the main index.html for root and auth paths
    if (pathname === '/' || pathname === '/auth/callback' || pathname.startsWith('/owner')) {
      return new Response(indexHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=3600', // 5 min browser, 1 hour edge
        },
      });
    }

    // Handle static assets (if we add CSS, JS, images later)
    if (pathname.startsWith('/assets/') || pathname.startsWith('/static/')) {
      // Try to serve from R2 bucket if configured
      if (this.env.STATIC_ASSETS) {
        try {
          const object = await this.env.STATIC_ASSETS.get(pathname.slice(1));
          if (object) {
            const headers = {
              'Cache-Control': 'public, max-age=86400', // 1 day cache for assets
            };

            // Set content type based on file extension
            if (pathname.endsWith('.css')) {
              headers['Content-Type'] = 'text/css';
            } else if (pathname.endsWith('.js')) {
              headers['Content-Type'] = 'application/javascript';
            } else if (pathname.endsWith('.png')) {
              headers['Content-Type'] = 'image/png';
            } else if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
              headers['Content-Type'] = 'image/jpeg';
            }

            return new Response(object.body, { headers });
          }
        } catch (error) {
          console.error('Error fetching static asset:', error);
        }
      }
    }

    // Return null for non-static requests (will be handled by main router)
    return null;
  }
}
