#!/bin/bash
# Health check script for MOCOA interface
echo "🔍 Checking MOCOA health..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://mocoa-fixed-859242575175.us-central1.run.app)
if [ "$STATUS" = "200" ]; then
  echo "✅ MOCOA is healthy (HTTP $STATUS)"
else
  echo "❌ MOCOA issues detected (HTTP $STATUS)"
fi
echo "🕐 Last checked: $(date)"

