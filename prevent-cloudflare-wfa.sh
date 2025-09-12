#!/bin/bash
# 💎 DIAMOND CLI - CLOUDFLARE PREVENTION MECHANISM
if command -v wrangler >/dev/null 2>&1; then
    echo "⚠️  WARNING: wrangler detected but WFA deployments go to GCP ONLY"
    echo "💎 Use: diamond deploy wfa (deploys to GCP Cloud Run)"
    echo "🚫 Cloudflare Workers deployment for WFA: DISABLED BY DESIGN"
fi
