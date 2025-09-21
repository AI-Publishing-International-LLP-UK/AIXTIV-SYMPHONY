/**
 * JIRA Epic Trigger Packet
 * Heavy Side - Structured Project Initiation
 */

class JiraEpicTriggerPacket {
  render(config) {
    const companyName = config.branding?.companyName || 'ASOOS';
    
    return `
      <div class="unit-panel jira-epic-trigger" data-unit="jira_epic_trigger">
        <div class="unit-header heavy-side">
          <h3>📋 JIRA Epic Trigger</h3>
          <div class="structure-indicator">Heavy Side Control</div>
        </div>
        
        <div class="epic-creation-zone">
          <div class="input-group">
            <label>Epic Title</label>
            <input type="text" id="epicTitle" placeholder="AI System Operation Epic..." />
          </div>
          
          <div class="input-group">
            <label>Project Key</label>
            <select id="projectKey">
              <option value="DIDC">DIDC Archives</option>
              <option value="FMS">FMS Logging</option>
              <option value="GCW">Ground Crew Workflow</option>
              <option value="ANT">Anthology Requests</option>
            </select>
          </div>
          
          <div class="trigger-options">
            <div class="checkbox-group">
              <input type="checkbox" id="autoSwarmTrigger" checked />
              <label for="autoSwarmTrigger">🐝 Auto-trigger Testament Swarm</label>
            </div>
            <div class="checkbox-group">
              <input type="checkbox" id="zeroGlitchMode" checked />
              <label for="zeroGlitchMode">⚡ Zero Glitch Delivery Mode</label>
            </div>
          </div>
          
          <div class="crew-assignment">
            <h4>Ground Crew Setup</h4>
            <div class="crew-grid">
              <div class="crew-role">
                <label>Timeliners</label>
                <select id="timeliners" multiple>
                  <option value="timeline_alpha">Timeline Alpha</option>
                  <option value="timeline_beta">Timeline Beta</option>
                </select>
              </div>
              <div class="crew-role">
                <label>Pressers</label>
                <select id="pressers" multiple>
                  <option value="press_squad_1">Press Squad 1</option>
                  <option value="press_squad_2">Press Squad 2</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="action-buttons">
            <button class="btn-primary" onclick="triggerEpicCreation()">
              🚀 Create Epic & Launch Swarm
            </button>
            <button class="btn-secondary" onclick="previewWorkflow()">
              👁️ Preview Workflow
            </button>
          </div>
        </div>
        
        <div class="tennis-court-visual">
          <div class="court-side heavy">
            <span>Heavy Side</span>
            <div class="structure-bars">||||||||</div>
          </div>
          <div class="net">🎾</div>
          <div class="court-side swarm">
            <span>Swarm Side</span>
            <div class="swarm-particles">🐝🐝🐝</div>
          </div>
        </div>
      </div>
      
      <script>
        function triggerEpicCreation() {
          const epicData = {
            title: document.getElementById('epicTitle').value,
            project: document.getElementById('projectKey').value,
            autoSwarm: document.getElementById('autoSwarmTrigger').checked,
            zeroGlitch: document.getElementById('zeroGlitchMode').checked,
            timeliners: Array.from(document.getElementById('timeliners').selectedOptions).map(o => o.value),
            pressers: Array.from(document.getElementById('pressers').selectedOptions).map(o => o.value)
          };
          
          console.log('🎾 Tennis Court Activated - Heavy Side Trigger:', epicData);
          
          // Connect to MCP endpoint for epic creation
          window.asoos?.testamentSwarm?.triggerFromHeavySide(epicData);
        }
        
        function previewWorkflow() {
          console.log('👁️ Previewing workflow automation...');
          // Show workflow preview
        }
      </script>
      
      <style>
        .jira-epic-trigger {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 2px solid #0bb1bb;
        }
        
        .heavy-side {
          background: rgba(255, 165, 0, 0.1);
          border-left: 4px solid #ffa500;
        }
        
        .structure-indicator {
          font-size: 11px;
          color: #ffa500;
          font-weight: 600;
        }
        
        .tennis-court-visual {
          display: flex;
          align-items: center;
          margin-top: 15px;
          padding: 10px;
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
        }
        
        .court-side {
          flex: 1;
          text-align: center;
          padding: 10px;
        }
        
        .court-side.heavy {
          background: rgba(255, 165, 0, 0.1);
          color: #ffa500;
        }
        
        .court-side.swarm {
          background: rgba(11, 177, 187, 0.1);
          color: #0bb1bb;
        }
        
        .net {
          font-size: 20px;
          margin: 0 15px;
        }
        
        .crew-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 10px;
        }
        
        .crew-role select {
          width: 100%;
          background: #2a2a3e;
          border: 1px solid #0bb1bb;
          color: white;
          padding: 5px;
        }
      </style>
    `;
  }
}

module.exports = JiraEpicTriggerPacket;