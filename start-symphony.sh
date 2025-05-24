#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Symphony Local Environment...${NC}"

# Check if symphony_local directory exists
if [ ! -d "/Users/as/symphony_local" ]; then
    echo -e "${RED}Symphony Local Environment not found at /Users/as/symphony_local${NC}"
    echo -e "${YELLOW}Would you like to create a minimal Symphony environment? (y/n)${NC}"
    read -p "" CREATE_ENV
    
    if [[ $CREATE_ENV == "y" || $CREATE_ENV == "Y" ]]; then
        echo -e "${YELLOW}Creating minimal Symphony environment...${NC}"
        
        # Create symphony_local directory
        mkdir -p /Users/as/symphony_local/api
        mkdir -p /Users/as/symphony_local/frontend/public
        
        # Create API server
        cat > /Users/as/symphony_local/api/server.js << EOF
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3030;

// Enable CORS
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Symphony API is running' });
});

// Get agents endpoint
app.get('/api/agents', (req, res) => {
  const agents = [
    { id: 'agent-001', name: 'Navigator', status: 'active', type: 'pilot' },
    { id: 'agent-002', name: 'Analyzer', status: 'standby', type: 'co-pilot' },
    { id: 'agent-003', name: 'Explorer', status: 'active', type: 'pilot' }
  ];
  res.json(agents);
});

// Start server
app.listen(PORT, () => {
  console.log(\`Symphony API Server running on port \${PORT}\`);
});
EOF
        
        # Create package.json for API
        cat > /Users/as/symphony_local/api/package.json << EOF
{
  "name": "symphony-api",
  "version": "1.0.0",
  "description": "Symphony API Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  }
}
EOF
        
        # Create frontend index.html
        cat > /Users/as/symphony_local/frontend/public/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Symphony Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .header { background: #333; color: white; padding: 15px; text-align: center; }
    .dashboard { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 15px; }
    .agent { display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 10px; border-bottom: 1px solid #eee; }
    .status-active { color: green; }
    .status-standby { color: orange; }
    .status-inactive { color: gray; }
    button { background: #4285f4; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #3b78e7; }
    .dev-panel { display: none; position: fixed; bottom: 0; right: 0; width: 300px; background: #333; color: white; padding: 15px; z-index: 1000; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Symphony Dashboard</h1>
    <p>AIxtiv Symphony Opus - Agent Control Interface</p>
  </div>
  
  <div class="dashboard">
    <div class="card">
      <h2>Agents</h2>
      <div id="agents-list">Loading agents...</div>
    </div>
    
    <div class="card">
      <h2>Mission Control</h2>
      <p>Launch and manage agent missions</p>
      <button onclick="alert('Mission module activated')">Start Mission</button>
    </div>
    
    <div class="card">
      <h2>Performance Metrics</h2>
      <p>System operational at 98% efficiency</p>
      <div style="height: 100px; background: #f8f9fa; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
        [Performance Chart]
      </div>
    </div>
  </div>
  
  <div id="dev-panel" class="dev-panel">
    <h3>Developer Panel</h3>
    <p>Environment: Local</p>
    <p>API: http://localhost:3030</p>
    <button onclick="document.getElementById('dev-panel').style.display = 'none'">Close</button>
  </div>

  <script>
    // Listen for Shift+Ctrl+9
    document.addEventListener('keydown', function(e) {
      if (e.shiftKey && e.ctrlKey && e.key === '(') {
        document.getElementById('dev-panel').style.display = 'block';
      }
    });
    
    // Fetch agents from API
    fetch('http://localhost:3030/api/agents')
      .then(response => response.json())
      .then(agents => {
        const agentsList = document.getElementById('agents-list');
        agentsList.innerHTML = '';
        
        agents.forEach(agent => {
          const agentEl = document.createElement('div');
          agentEl.className = 'agent';
          agentEl.innerHTML = \`
            <div>
              <strong>\${agent.name}</strong> (\${agent.type})
            </div>
            <div class="status-\${agent.status.toLowerCase()}">\${agent.status}</div>
          \`;
          agentsList.appendChild(agentEl);
        });
      })
      .catch(error => {
        document.getElementById('agents-list').innerHTML = 
          'Error connecting to API. Please make sure the API server is running.';
        console.error('Error fetching agents:', error);
      });
  </script>
</body>
</html>
EOF
        
        # Create frontend server
        cat > /Users/as/symphony_local/frontend/server.js << EOF
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Symphony Frontend Server running on port \${PORT}\`);
});
EOF
        
        # Create package.json for frontend
        cat > /Users/as/symphony_local/frontend/package.json << EOF
{
  "name": "symphony-frontend",
  "version": "1.0.0",
  "description": "Symphony Frontend Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF
        
        # Create start.sh
        cat > /Users/as/symphony_local/start.sh << EOF
#!/bin/bash

# Start the API server
cd /Users/as/symphony_local/api
npm install &> /dev/null
echo "Starting Symphony API Server on port 3030..."
node server.js &

# Start the frontend server
cd /Users/as/symphony_local/frontend
npm install &> /dev/null
echo "Starting Symphony Frontend Server on port 3000..."
node server.js &

echo "Symphony Local Environment is running!"
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:3030"
echo "Press Ctrl+C to stop all servers"

# Wait for any key to stop the servers
read -p "Press any key to stop servers..." -n1 -s
echo ""
echo "Stopping servers..."
pkill -f "node /Users/as/symphony_local/api/server.js"
pkill -f "node /Users/as/symphony_local/frontend/server.js"
echo "Servers stopped."
EOF
        
        # Make start.sh executable
        chmod +x /Users/as/symphony_local/start.sh
        
        echo -e "${GREEN}Minimal Symphony environment created!${NC}"
        echo -e "${YELLOW}You can now run /Users/as/symphony_local/start.sh to start the environment.${NC}"
        exit 0
    else
        echo -e "${YELLOW}Exiting without creating environment.${NC}"
        exit 1
    fi
fi

# Check if start.sh exists and is executable
if [ ! -x "/Users/as/symphony_local/start.sh" ]; then
    echo -e "${RED}start.sh not found or not executable in Symphony Local Environment${NC}"
    exit 1
fi

echo -e "${GREEN}Starting Symphony Local Environment...${NC}"
echo -e "${YELLOW}Please open a new terminal window and run:${NC}"
echo -e "${GREEN}cd /Users/as/symphony_local && ./start.sh${NC}"
echo -e ""
echo -e "${YELLOW}Once started, access the environment at:${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}API: http://localhost:3030${NC}"