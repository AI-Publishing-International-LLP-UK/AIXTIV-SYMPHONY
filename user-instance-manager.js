/**
 * 💎 Diamond SAO User Instance Manager
 * Creates and manages unique personalized ASOOS instances for each user
 */

class UserInstanceManager {
  constructor() {
    this.instances = new Map();
    this.userSessions = new Map();
  }

  /**
   * Create a unique instance for a user
   */
  async createInstance(userData) {
    const instanceId = this.generateUniqueId();
    const timestamp = new Date().toISOString();
    
    const instance = {
      instanceId: instanceId,
      userEmail: userData.email,
      userName: userData.name,
      companyName: userData.company,
      securityLevel: 'sapphire',
      authLevel: 5,
      createdAt: timestamp,
      lastAccessedAt: timestamp,
      status: 'active',
      personalizedSettings: {
        theme: 'diamond-sao',
        dashboardLayout: 'professional',
        preferredCopilots: ['drlucy', 'drclaude', 'victory36'],
        industryFocus: this.detectIndustry(userData.company)
      },
      uniqueFeatures: {
        personalizedDashboard: true,
        customAICopilots: true,
        industrySpecificTools: true,
        personalWorkspace: true
      },
      personalizedUrl: `https://${instanceId.toLowerCase()}.asoos.2100.cool`
    };

    // Store the instance
    this.instances.set(instanceId, instance);
    this.userSessions.set(userData.email, instanceId);
    
    // In production: save to database
    await this.saveInstanceToDatabase(instance);
    
    // Create personalized page
    await this.generatePersonalizedPage(instance);
    
    return instance;
  }

  /**
   * Get user's instance
   */
  getUserInstance(email) {
    const instanceId = this.userSessions.get(email);
    return instanceId ? this.instances.get(instanceId) : null;
  }

  /**
   * Generate unique instance identifier
   */
  generateUniqueId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `ASOOS-${timestamp}-${randomStr}`.toUpperCase();
  }

  /**
   * Detect industry from company name
   */
  detectIndustry(company) {
    if (!company) return 'general';
    
    const industryKeywords = {
      'technology': ['tech', 'software', 'digital', 'ai', 'data'],
      'finance': ['bank', 'financial', 'investment', 'capital'],
      'healthcare': ['health', 'medical', 'pharma', 'clinic'],
      'consulting': ['consulting', 'advisory', 'strategy'],
      'education': ['education', 'school', 'university', 'learning']
    };
    
    const companyLower = company.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => companyLower.includes(keyword))) {
        return industry;
      }
    }
    
    return 'general';
  }

  /**
   * Generate personalized page for user
   */
  async generatePersonalizedPage(instance) {
    // This creates a unique HTML page for each user
    const personalizedContent = this.createPersonalizedHTML(instance);
    
    // In production: save to CDN or static file storage
    const filename = `${instance.instanceId.toLowerCase()}.html`;
    console.log(`Creating personalized page: ${filename}`);
    
    return {
      filename: filename,
      url: instance.personalizedUrl,
      content: personalizedContent
    };
  }

  /**
   * Create personalized HTML content for user
   */
  createPersonalizedHTML(instance) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ASOOS - ${instance.userName}'s Personal Workspace</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Montserrat', sans-serif; 
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); 
      color: #ffffff; 
      min-height: 100vh; 
    }
    .header { 
      padding: 20px; 
      background: rgba(255, 255, 255, 0.05); 
      backdrop-filter: blur(20px); 
      border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
    }
    .welcome { 
      text-align: center; 
      padding: 60px 20px; 
    }
    .welcome h1 { 
      font-size: 48px; 
      background: linear-gradient(135deg, #FFD700, #50C878, #0bb1bb); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
      margin-bottom: 20px; 
    }
    .personal-info { 
      background: rgba(80, 200, 120, 0.1); 
      padding: 20px; 
      border-radius: 15px; 
      margin: 20px auto; 
      max-width: 600px; 
    }
    .dashboard { 
      padding: 40px 20px; 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
      gap: 20px; 
      max-width: 1200px; 
      margin: 0 auto; 
    }
    .card { 
      background: rgba(255, 255, 255, 0.05); 
      padding: 30px; 
      border-radius: 15px; 
      border: 2px solid rgba(80, 200, 120, 0.3); 
    }
    .card h3 { 
      color: #50C878; 
      margin-bottom: 15px; 
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="float: right; font-size: 14px; color: #888;">
      Instance: ${instance.instanceId} | Auth Level: ${instance.authLevel}
    </div>
    <div style="font-size: 24px; font-weight: 700; color: #0bb1bb;">
      ASOOS - ${instance.userName}'s Workspace
    </div>
  </div>

  <div class="welcome">
    <h1>Welcome ${instance.userName.split(' ')[0]}!</h1>
    <p style="font-size: 18px; color: #0bb1bb; margin-bottom: 30px;">
      Your Personal ASOOS Symphony Operating System is Ready
    </p>
    
    <div class="personal-info">
      <div style="font-size: 16px; margin-bottom: 10px;">
        <strong>Your Personalized Instance:</strong> ${instance.instanceId}
      </div>
      <div style="font-size: 14px; color: #888;">
        Created: ${new Date(instance.createdAt).toLocaleDateString()} • 
        Security Level: ${instance.securityLevel} • 
        Industry Focus: ${instance.personalizedSettings.industryFocus}
        ${instance.companyName ? ` • Company: ${instance.companyName}` : ''}
      </div>
    </div>
  </div>

  <div class="dashboard">
    <div class="card">
      <h3>🤖 Your Personal AI Copilots</h3>
      <p>Dr. Lucy, Dr. Claude, and Victory36 are personalized for your industry and work style.</p>
      <button style="background: #50C878; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 15px; cursor: pointer;">
        Meet Your Copilots
      </button>
    </div>

    <div class="card">
      <h3>📊 ${instance.userName.split(' ')[0]}'s Dashboard</h3>
      <p>Your personalized analytics and workflow management center.</p>
      <button style="background: #0bb1bb; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 15px; cursor: pointer;">
        Open Dashboard
      </button>
    </div>

    <div class="card">
      <h3>🎯 Industry Tools</h3>
      <p>Specialized tools and templates for ${instance.personalizedSettings.industryFocus} industry.</p>
      <button style="background: #FFD700; color: black; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 15px; cursor: pointer;">
        Explore Tools
      </button>
    </div>

    <div class="card">
      <h3>💎 Personal Workspace</h3>
      <p>Your private space for documents, projects, and AI collaborations.</p>
      <button style="background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 15px; cursor: pointer;">
        Enter Workspace
      </button>
    </div>
  </div>

  <script>
    // Load user's personalized settings
    const instanceData = ${JSON.stringify(instance)};
    console.log('User instance loaded:', instanceData);
    
    // Initialize personalized experience
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Initializing personalized ASOOS experience for ${instance.userName}');
    });
  </script>
</body>
</html>`;
  }

  /**
   * Save instance to database (production implementation)
   */
  async saveInstanceToDatabase(instance) {
    // In production, this would save to your database
    console.log(`Saving instance ${instance.instanceId} to database`);
    // await database.instances.create(instance);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserInstanceManager;
}
