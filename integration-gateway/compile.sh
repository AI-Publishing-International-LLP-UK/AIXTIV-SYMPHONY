#!/bin/bash

# 🔧 SEVEN SERVICES SALLYPORT COMPILATION SCRIPT
# Compiles modular components for dynamic loading into owner interface

set -e

echo "🔧 Starting Seven Services SallyPort Compilation..."

# Create compilation directories
mkdir -p compiled/modules
mkdir -p compiled/assets
mkdir -p compiled/bundles

echo "📦 Compiling core orchestrator..."
# Core orchestrator - always loaded
node sallyport-compiler.js --module=orchestrator --output=compiled/modules/orchestrator.min.js

echo "🎨 Compiling service panels..."
# Individual service panels - loaded on demand
for service in communications bidsuite customer-services workflows roi-tracking wish-vision academy; do
    echo "  → Compiling ${service} panel..."
    node sallyport-compiler.js --module=services/${service}-panel.js --output=compiled/modules/${service}.min.js
done

echo "📊 Compiling detail components..."
# Right-panel detail views - lazy loaded
for detail in bidsuite-details communications-details roi-charts; do
    echo "  → Compiling ${detail}..."
    node sallyport-compiler.js --module=details/${detail}.js --output=compiled/modules/${detail}.min.js
done

echo "💾 Compiling storage adapters..."
# Storage partition adapters
for partition in {1..12}; do
    echo "  → Compiling partition ${partition} adapter..."
    node sallyport-compiler.js --module=storage/partition-${partition}.js --output=compiled/modules/partition-${partition}.min.js
done

echo "🎯 Creating dynamic loader manifest..."
cat > compiled/load-manifest.json << EOF
{
  "coreModules": ["orchestrator.min.js"],
  "servicePanels": {
    "1": "communications.min.js",
    "2": "bidsuite.min.js", 
    "3": "customer-services.min.js",
    "4": "workflows.min.js",
    "5": "roi-tracking.min.js",
    "6": "wish-vision.min.js",
    "7": "academy.min.js"
  },
  "detailComponents": {
    "bidsuite": "bidsuite-details.min.js",
    "communications": "communications-details.min.js",
    "roi": "roi-charts.min.js"
  },
  "storageAdapters": {
    "partitions": [1,2,3,4,5,6,7,8,9,10,11,12]
  },
  "loadStrategy": "sallyport-dynamic"
}
EOF

echo "🚀 Generating SallyPort injection code..."
cat > compiled/sallyport-inject.js << 'EOF'
// SallyPort Dynamic Module Injector
class SevenServicesLoader {
  constructor(sallyportInstance) {
    this.sallyport = sallyportInstance;
    this.loadedModules = new Map();
    this.loadPromises = new Map();
  }

  async loadServicePanel(serviceId) {
    const moduleName = this.getServiceModule(serviceId);
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    if (this.loadPromises.has(moduleName)) {
      return this.loadPromises.get(moduleName);
    }

    const promise = this.dynamicLoad(moduleName);
    this.loadPromises.set(moduleName, promise);
    
    const module = await promise;
    this.loadedModules.set(moduleName, module);
    this.loadPromises.delete(moduleName);
    
    return module;
  }

  async dynamicLoad(moduleName) {
    // SallyPort secure module loading
    return this.sallyport.secureLoad(`/compiled/modules/${moduleName}`);
  }

  getServiceModule(serviceId) {
    const manifest = {
      1: 'communications.min.js',
      2: 'bidsuite.min.js',
      3: 'customer-services.min.js', 
      4: 'workflows.min.js',
      5: 'roi-tracking.min.js',
      6: 'wish-vision.min.js',
      7: 'academy.min.js'
    };
    return manifest[serviceId];
  }
}

// Auto-inject into owner interface when ready
window.SevenServicesLoader = SevenServicesLoader;
EOF

echo "✅ Compilation complete!"
echo "📁 Output directory: ./compiled/"
echo "🔗 Ready for SallyPort dynamic injection"

# Generate size report
echo "📊 Bundle sizes:"
find compiled/modules -name "*.min.js" -exec ls -lh {} \; | awk '{print $9 ": " $5}'

echo "🎼 Seven Services compiled and ready for dynamic loading!"