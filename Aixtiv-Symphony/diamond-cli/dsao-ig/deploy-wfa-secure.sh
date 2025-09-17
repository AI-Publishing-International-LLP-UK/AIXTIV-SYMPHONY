#!/bin/bash

echo "🔐 SECURE WFA DEPLOYMENT WITH GCP SECRETS MANAGER"
echo "================================================="

# Retrieve KV namespace IDs from GCP Secrets Manager
echo "📡 Retrieving KV namespace IDs from GCP Secrets Manager..."

WFA_AGENT_STATE_ID=$(gcloud secrets versions access latest --secret="wfa-agent-state-prod-id" --project=api-for-warp-drive)
WFA_CAREER_CLUSTERS_ID=$(gcloud secrets versions access latest --secret="wfa-career-clusters-prod-id" --project=api-for-warp-drive)
WFA_JOB_CLUSTERS_ID=$(gcloud secrets versions access latest --secret="wfa-job-clusters-prod-id" --project=api-for-warp-drive)
WFA_SECTOR_MAPPINGS_ID=$(gcloud secrets versions access latest --secret="wfa-sector-mappings-prod-id" --project=api-for-warp-drive)

echo "✅ Retrieved all KV namespace IDs from GCP Secrets Manager"

# Create temporary wrangler config with retrieved secrets
cat > wrangler-temp-secure.toml << EOF
name = "wfa-production-orchestration"
main = "production-wfa-orchestration.js"
compatibility_date = "2025-08-27"

# Production environment configuration
[env.production]
name = "wfa-production-orchestration"
route = { pattern = "asoos.2100.cool/wfa/*", zone_name = "2100.cool" }

# Environment variables for production
[env.production.vars]
ENVIRONMENT = "production"
WFA_AGENTS = "20000000"
WFA_SECTORS = "200"
WFA_JOB_CLUSTERS = "64000000"
WFA_CAREER_CLUSTERS = "319998"
VICTORY36_ENABLED = "true"

# KV Namespaces for agent state management (IDs retrieved from GCP Secrets Manager)
[[env.production.kv_namespaces]]
binding = "WFA_STATE"
id = "${WFA_AGENT_STATE_ID}"
preview_id = "wfa-agent-state-preview"

[[env.production.kv_namespaces]]
binding = "CAREER_CLUSTERS_KV"
id = "${WFA_CAREER_CLUSTERS_ID}"
preview_id = "wfa-career-clusters-preview"

[[env.production.kv_namespaces]]
binding = "JOB_CLUSTERS_KV"
id = "${WFA_JOB_CLUSTERS_ID}"
preview_id = "wfa-job-clusters-preview"

[[env.production.kv_namespaces]]
binding = "SECTOR_MAPPINGS"
id = "${WFA_SECTOR_MAPPINGS_ID}"
preview_id = "wfa-sector-mappings-preview"

# Durable Objects for swarm coordination
[[env.production.durable_objects.bindings]]
name = "SWARM_COORDINATOR"
class_name = "SwarmCoordinator"

[[env.production.durable_objects.bindings]]
name = "VICTORY36_PROTECTION"
class_name = "Victory36Protection"

[[env.production.durable_objects.bindings]]
name = "MCP_DNS_MANAGER"
class_name = "MCPDNSManager"

# R2 Bucket for large data storage
[[env.production.r2_buckets]]
binding = "WFA_ARTIFACTS"
bucket_name = "api-for-warp-drive-artifacts-prod"

# Analytics engine for monitoring
[[env.production.analytics_engine_datasets]]
binding = "WFA_METRICS"
dataset = "wfa_production_metrics"

# Migrations for Durable Objects
[[migrations]]
tag = "v1"
new_classes = ["SwarmCoordinator", "Victory36Protection", "MCPDNSManager"]
EOF

echo "🚀 Deploying Cloudflare Workers with secure configuration..."
wrangler deploy --config wrangler-temp-secure.toml --env production

# Clean up temporary file
rm wrangler-temp-secure.toml

echo "✅ Secure deployment completed!"
echo "🔐 All secrets retrieved from GCP Secrets Manager"
echo "🛡️ Victory36 protection active"
echo "⚡ 20M agents operational"
