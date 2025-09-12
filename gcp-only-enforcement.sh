#!/bin/bash
# 💎 DIAMOND CLI - GCP DEPLOYMENT ENFORCEMENT
# Authority: Mr. Phillip Corey Roark (0000001)
# Mission: ALL WFA swarms deploy ONLY to GCP Cloud Run

echo "💎 DIAMOND CLI ENFORCEMENT: GCP DEPLOYMENTS ONLY"
echo "🚫 Cloudflare Workers deployments PERMANENTLY DISABLED"
echo "🎯 ALL swarm activity → GCP Cloud Run"
echo ""
echo "✅ Current GCP services:"
gcloud run services list --region=us-west1 --filter="metadata.name:wfa*" --format="table(metadata.name,status.url,status.conditions[0].status)" 2>/dev/null || echo "   Run 'diamond deploy wfa' to deploy to GCP"
echo ""
echo "🏛️  For deployment, use: diamond deploy wfa"
echo "⚡ Authority: Diamond SAO Command Center"
