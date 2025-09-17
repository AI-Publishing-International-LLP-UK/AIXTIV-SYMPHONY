#!/bin/bash
echo "🔍 SYSTEM STATUS CHECK"
echo "====================="
if [ -f "REAL_AGENT_ANALYSIS.json" ]; then
  echo "✅ Analysis file exists"
  echo "Content:"
  cat REAL_AGENT_ANALYSIS.json
else
  echo "❌ Analysis file missing"
fi

if [ -d "didc_archives" ]; then
  echo ""
  echo "✅ DIDC archives exist"
  echo "Clusters: $(ls didc_archives | wc -l)"
else
  echo "❌ DIDC archives missing"
fi
