#!/bin/bash
# ASOOS 2100.Cool - Shared Build Script
# Used by both GitHub Pages and Cloudflare Pages deployments

set -e

DEPLOYMENT_TYPE="${1:-github-pages}"
DIST_DIR="${2:-./dist}"

echo "📦 Building site package for $DEPLOYMENT_TYPE deployment..."

# Create deployment directory
mkdir -p "$DIST_DIR"

# Copy main files
cp index.html "$DIST_DIR/"
cp *.html "$DIST_DIR/" 2>/dev/null || echo "No additional HTML files found"
cp README.md "$DIST_DIR/" 2>/dev/null || echo "README.md not found, skipping"

# Create robots.txt
cat > "$DIST_DIR/robots.txt" << EOF
User-agent: *
Allow: /

Sitemap: https://2100.cool/sitemap.xml
EOF

# Create sitemap.xml
cat > "$DIST_DIR/sitemap.xml" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://2100.cool/</loc>
    <lastmod>$(date -u +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://2100.cool/auth</loc>
    <lastmod>$(date -u +%Y-%m-%d)</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
EOF

# Create security.txt for responsible disclosure
mkdir -p "$DIST_DIR/.well-known"
cat > "$DIST_DIR/.well-known/security.txt" << EOF
Contact: mailto:security@2100.cool
Expires: $(date -d '+1 year' -u +%Y-%m-%dT%H:%M:%S.000Z)
Preferred-Languages: en
Canonical: https://2100.cool/.well-known/security.txt
Policy: https://2100.cool/security-policy
EOF

# Create manifest.json for PWA support
cat > "$DIST_DIR/manifest.json" << EOF
{
  "name": "ASOOS.2100.Cool - Aixtiv Symphony Orchestrating Operating System",
  "short_name": "ASOOS.2100.Cool",
  "description": "Aixtiv Symphony Orchestrating Operating System - Where Intelligence Meets Love",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0bb1bb",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "32x32",
      "type": "image/x-icon"
    }
  ]
}
EOF

# Deployment-specific files
if [[ "$DEPLOYMENT_TYPE" == "github-pages" ]]; then
  echo "🔧 Adding GitHub Pages specific files..."
  
  # Create CNAME file for custom domain
  echo "2100.cool" > "$DIST_DIR/CNAME"
  
  # Create .nojekyll to prevent Jekyll processing
  touch "$DIST_DIR/.nojekyll"
  
  # Create custom 404 page
  cat > "$DIST_DIR/404.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found | ASOOS.2100.Cool</title>
  <style>
    body { 
      font-family: 'Montserrat', sans-serif; 
      background: #0a0a0a; 
      color: #fff; 
      text-align: center; 
      padding: 50px; 
    }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { color: #0bb1bb; font-size: 3em; margin-bottom: 20px; }
    p { font-size: 1.2em; margin-bottom: 30px; }
    a { 
      color: #0bb1bb; 
      text-decoration: none; 
      border: 2px solid #0bb1bb; 
      padding: 10px 20px; 
      border-radius: 5px; 
      display: inline-block;
      transition: all 0.3s;
    }
    a:hover { background: #0bb1bb; color: #000; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>The page you're looking for doesn't exist in the ASOOS universe.</p>
    <a href="/">Return to ASOOS.2100.Cool</a>
  </div>
</body>
</html>
EOF

elif [[ "$DEPLOYMENT_TYPE" == "cloudflare-pages" ]]; then
  echo "🔧 Adding Cloudflare Pages specific files..."
  
  # Create _redirects file for Cloudflare Pages
  cat > "$DIST_DIR/_redirects" << EOF
# Authentication routing
/auth https://auth.2100.cool/auth 200
/interface https://auth.2100.cool/interface 200

# Fallback to main page
/* /index.html 200
EOF

  # Create security headers via _headers file
  cat > "$DIST_DIR/_headers" << EOF
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com;
EOF
fi

echo "✅ Site package built successfully for $DEPLOYMENT_TYPE"

# List contents for verification
echo "📁 Site contents:"
ls -la "$DIST_DIR/"

# Check total size
TOTAL_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
echo "📊 Total site size: $TOTAL_SIZE"

# Validate required files
echo "🔍 Validating build..."

if [[ ! -f "$DIST_DIR/index.html" ]]; then
  echo "❌ index.html missing from build"
  exit 1
fi

if [[ ! -f "$DIST_DIR/sitemap.xml" ]]; then
  echo "❌ sitemap.xml missing from build"
  exit 1
fi

if [[ ! -f "$DIST_DIR/robots.txt" ]]; then
  echo "❌ robots.txt missing from build"
  exit 1
fi

if [[ "$DEPLOYMENT_TYPE" == "github-pages" ]] && [[ ! -f "$DIST_DIR/CNAME" ]]; then
  echo "❌ CNAME missing from GitHub Pages build"
  exit 1
fi

if [[ "$DEPLOYMENT_TYPE" == "cloudflare-pages" ]] && [[ ! -f "$DIST_DIR/_redirects" ]]; then
  echo "❌ _redirects missing from Cloudflare Pages build"
  exit 1
fi

echo "✅ Build validation passed"
echo "🚀 Ready for deployment!"
