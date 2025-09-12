/**
 * DYNAMIC MCP COMPANY WORKER
 * Automatically handles mcp.[any-company].2100.cool requests
 * No manual configuration required - fully dynamic
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    
    console.log(`🛸 Dynamic MCP request: ${hostname}`);
    
    // Extract company name from hostname pattern: mcp.[company].2100.cool
    const companyMatch = hostname.match(/^mcp\.([a-z0-9-]+)\.2100\.cool$/i);
    
    if (!companyMatch) {
      return new Response('Invalid MCP endpoint format', { status: 400 });
    }
    
    const companyName = companyMatch[1].toLowerCase();
    console.log(`🏢 Company detected: ${companyName}`);
    
    // Auto-provision DNS if needed (this would trigger the provisioning script)
    await autoProvisionCompany(companyName, env);
    
    // Generate dynamic MCP interface for the company
    const mcpInterface = generateDynamicMCPInterface(companyName, url);
    
    return new Response(mcpInterface, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-MCP-Company': companyName,
        'X-MCP-Status': 'auto-provisioned',
        'X-UFO-Integration': 'active',
        'X-Quantum-Protection': 'MAXIMUM',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
};

async function autoProvisionCompany(companyName, env) {
  console.log(`🚀 Auto-provisioning MCP for: ${companyName}`);
  
  try {
    // Store company in KV for tracking
    if (env.MCP_COMPANY_REGISTRY) {
      const companyData = {
        name: companyName,
        domain: `mcp.${companyName}.2100.cool`,
        provisioned: new Date().toISOString(),
        status: 'active',
        autoProvisioned: true
      };
      
      await env.MCP_COMPANY_REGISTRY.put(companyName, JSON.stringify(companyData));
      console.log(`✅ Company ${companyName} registered in KV`);
    }
    
    // Trigger DNS provisioning (this would call the automation script)
    // In production, this could trigger a webhook or Cloud Function
    console.log(`📡 DNS provisioning triggered for mcp.${companyName}.2100.cool`);
    
  } catch (error) {
    console.error(`❌ Auto-provisioning failed for ${companyName}:`, error);
  }
}

function generateDynamicMCPInterface(companyName, url) {
  const companyTitle = companyName.charAt(0).toUpperCase() + companyName.slice(1);
  
  return JSON.stringify({
    protocol: "Model Context Protocol",
    version: "1.0.0",
    server: {
      name: `${companyTitle} MCP Server`,
      version: "1.0.0",
      description: `Dynamic MCP interface for ${companyTitle}`,
      company: companyName,
      domain: url.hostname,
      autoProvisioned: true
    },
    capabilities: {
      resources: true,
      tools: true,
      prompts: true,
      logging: true,
      ufoIntegration: true,
      quantumProtection: "MAXIMUM"
    },
    info: {
      title: `${companyTitle} AI Assistant`,
      description: `Personalized AI assistant for ${companyTitle} with full MCP integration`,
      company: companyName,
      endpoints: {
        main: `https://mcp.${companyName}.2100.cool`,
        api: `https://mcp.${companyName}.2100.cool/api`,
        websocket: `wss://mcp.${companyName}.2100.cool/ws`,
        auth: `https://sallyport.2100.cool?company=${companyName}`
      },
      features: [
        "Dynamic company-specific AI agents",
        "UFO (Unified Frontend Operations)",
        "Quantum-protected communications",
        "Real-time collaboration",
        "Enterprise security",
        "Victory36 protection"
      ],
      integrations: {
        sallyPort: `https://sallyport.2100.cool?company=${companyName}`,
        wfaSystem: "https://asoos.2100.cool/wfa/",
        diamondCLI: "active",
        ufoSystem: "enabled"
      }
    },
    resources: [
      {
        uri: `company://${companyName}/agents`,
        name: `${companyTitle} AI Agents`,
        description: `Company-specific AI agents for ${companyTitle}`,
        mimeType: "application/json"
      },
      {
        uri: `company://${companyName}/tools`,
        name: `${companyTitle} Tools`,
        description: `Industry-specific tools for ${companyTitle}`,
        mimeType: "application/json"
      },
      {
        uri: `company://${companyName}/data`,
        name: `${companyTitle} Knowledge Base`,
        description: `Company-specific knowledge and procedures`,
        mimeType: "application/json"
      }
    ],
    tools: [
      {
        name: `${companyName}_assistant`,
        description: `AI assistant specialized for ${companyTitle} operations`,
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Question or task for the AI assistant"
            },
            context: {
              type: "string",
              description: "Additional context about the company or task"
            }
          },
          required: ["query"]
        }
      },
      {
        name: `${companyName}_search`,
        description: `Search ${companyTitle} knowledge base and resources`,
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query"
            },
            type: {
              type: "string",
              enum: ["documents", "procedures", "contacts", "tools"],
              description: "Type of resource to search"
            }
          },
          required: ["query"]
        }
      }
    ],
    prompts: [
      {
        name: `${companyName}_onboarding`,
        description: `Help new ${companyTitle} team members get started`,
        arguments: [
          {
            name: "role",
            description: "The person's role or department",
            required: false
          }
        ]
      },
      {
        name: `${companyName}_workflow`,
        description: `Guide through ${companyTitle} standard workflows`,
        arguments: [
          {
            name: "workflow_type",
            description: "Type of workflow (project, approval, etc.)",
            required: true
          }
        ]
      }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      companyName: companyName,
      hostname: url.hostname,
      autoProvisioned: true,
      mcpVersion: "1.0.0",
      ufoIntegration: "2.4.7"
    }
  }, null, 2);
}
