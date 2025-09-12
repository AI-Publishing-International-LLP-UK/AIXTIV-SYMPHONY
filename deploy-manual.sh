#!/bin/bash

# 🚀 ASOOS.2100.Cool Manual Deploy to Cloudflare Pages
# Run this script to prepare deployment files locally

echo "🚀 Starting ASOOS.2100.Cool manual deployment preparation..."

# Create deployment directory
mkdir -p ./dist
echo "📁 Created dist directory"

# Copy main files
cp index.html ./dist/
echo "✅ Copied index.html"

# Copy existing _redirects file
cp _redirects ./dist/
echo "✅ Copied _redirects with auth->sallyport redirect"

# Create robots.txt
cat > ./dist/robots.txt << EOF
User-agent: *
Allow: /

Sitemap: https://2100.cool/sitemap.xml
EOF
echo "✅ Created robots.txt"

# Create sitemap.xml
cat > ./dist/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://2100.cool/</loc>
    <lastmod>$(date -u +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
EOF
echo "✅ Created sitemap.xml"

# Create security headers via _headers file
cat > ./dist/_headers << EOF
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com;
EOF
echo "✅ Created _headers for security"

# List contents for verification
echo ""
echo "📁 Deployment package contents:"
ls -la ./dist/

# Check total size
TOTAL_SIZE=$(du -sh ./dist | cut -f1)
echo "📊 Total site size: $TOTAL_SIZE"

echo ""
echo "🎉 ASOOS.2100.Cool deployment package ready!"
echo "📋 Next steps:"
echo "1. Go to https://dash.cloudflare.com/pages"
echo "2. Click 'Upload assets' (drag and drop deployment)"
echo "3. Drag the entire 'dist' folder contents to Cloudflare Pages"
echo "4. Set project name: asoos-2100-cool"
echo "5. Set custom domain: 2100.cool"
echo ""
echo "🔐 The /auth redirect to sallyport.2100.cool is configured!"
echo "⚡ Sacred Mission: Ready for Global Deployment"
