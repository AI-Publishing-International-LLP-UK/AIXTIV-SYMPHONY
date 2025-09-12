/**
 * MCP.AIPUB.2100.COOL - PROPER MCP JSON INTERFACE
 * Model Context Protocol compliant JSON interface
 * Serves proper MCP protocol responses, not HTML
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    console.log(`🛸 MCP AIPUB Request: ${request.method} ${url.pathname}`);
    
    // Route to appropriate MCP endpoint
    switch (url.pathname) {
      case '/':
      case '/mcp':
        return handleMCPRoot(request);
      case '/.well-known/mcp':
        return handleMCPWellKnown(request);
      case '/api/mcp':
        return handleMCPAPI(request);
      default:
        return handleMCPRoot(request); // Default to MCP interface
    }
  }
};

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    }
  });
}

function handleMCPRoot(request) {
  const mcpInterface = {
    protocol: "Model Context Protocol",
    version: "1.0.0",
    server: {
      name: "AI Publishing International MCP Server",
      version: "2.4.7",
      description: "MCP interface for AI Publishing International LLP with UFO integration",
      company: "aipub",
      domain: "mcp.aipub.2100.cool",
      features: [
        "AI Publishing workflows",
        "Document generation and management", 
        "Content collaboration tools",
        "Publishing pipeline automation",
        "Multi-language support",
        "Enterprise publishing solutions"
      ]
    },
    capabilities: {
      resources: true,
      tools: true,
      prompts: true,
      logging: true,
      ufoIntegration: true,
      quantumProtection: "MAXIMUM",
      aiPublishing: true,
      documentManagement: true,
      contentGeneration: true
    },
    info: {
      title: "AI Publishing International Assistant",
      description: "Advanced AI assistant for publishing, content creation, and document management",
      company: "AI Publishing International LLP",
      endpoints: {
        main: "https://mcp.aipub.2100.cool",
        api: "https://mcp.aipub.2100.cool/api",
        websocket: "wss://mcp.aipub.2100.cool/ws",
        auth: "https://sallyport.2100.cool?company=aipub",
        publishing: "https://mcp.aipub.2100.cool/publishing",
        documents: "https://mcp.aipub.2100.cool/documents"
      },
      integrations: {
        sallyPort: "https://sallyport.2100.cool?company=aipub",
        wfaSystem: "https://asoos.2100.cool/wfa/",
        diamondCLI: "active",
        ufoSystem: "enabled",
        publishingPipeline: "https://coaching2100.com",
        documentSystem: "active"
      }
    },
    resources: [
      {
        uri: "aipub://publishing/templates",
        name: "Publishing Templates",
        description: "Professional publishing templates and formats",
        mimeType: "application/json"
      },
      {
        uri: "aipub://documents/library",
        name: "Document Library",
        description: "Centralized document management and version control",
        mimeType: "application/json"
      },
      {
        uri: "aipub://content/generation",
        name: "Content Generation Tools",
        description: "AI-powered content creation and editing tools",
        mimeType: "application/json"
      },
      {
        uri: "aipub://workflows/publishing",
        name: "Publishing Workflows",
        description: "Automated publishing and distribution workflows",
        mimeType: "application/json"
      }
    ],
    tools: [
      {
        name: "aipub_document_generator",
        description: "Generate professional documents using AI Publishing templates",
        inputSchema: {
          type: "object",
          properties: {
            document_type: {
              type: "string",
              enum: ["whitepaper", "report", "article", "book", "manual", "proposal"],
              description: "Type of document to generate"
            },
            topic: {
              type: "string",
              description: "Main topic or subject matter"
            },
            style: {
              type: "string",
              enum: ["academic", "business", "technical", "creative", "formal"],
              description: "Writing style and tone"
            },
            length: {
              type: "string",
              enum: ["short", "medium", "long", "comprehensive"],
              description: "Target document length"
            }
          },
          required: ["document_type", "topic"]
        }
      },
      {
        name: "aipub_content_editor",
        description: "Edit and improve existing content using AI Publishing standards",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "Content to edit and improve"
            },
            edit_type: {
              type: "string",
              enum: ["grammar", "style", "structure", "clarity", "professional"],
              description: "Type of editing to perform"
            },
            target_audience: {
              type: "string",
              description: "Intended audience for the content"
            }
          },
          required: ["content", "edit_type"]
        }
      },
      {
        name: "aipub_publishing_workflow",
        description: "Manage publishing workflows and distribution",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["create", "review", "approve", "publish", "distribute"],
              description: "Publishing workflow action"
            },
            document_id: {
              type: "string",
              description: "Document identifier"
            },
            channels: {
              type: "array",
              items: {
                type: "string",
                enum: ["web", "print", "ebook", "social", "email", "api"]
              },
              description: "Publishing channels"
            }
          },
          required: ["action"]
        }
      }
    ],
    prompts: [
      {
        name: "aipub_writing_assistant",
        description: "Get help with professional writing and content creation",
        arguments: [
          {
            name: "writing_type",
            description: "Type of writing (article, report, book, etc.)",
            required: true
          },
          {
            name: "topic",
            description: "Subject matter or topic",
            required: true
          },
          {
            name: "audience",
            description: "Target audience",
            required: false
          }
        ]
      },
      {
        name: "aipub_publishing_guide",
        description: "Get guidance on publishing processes and best practices",
        arguments: [
          {
            name: "publication_type",
            description: "Type of publication",
            required: true
          },
          {
            name: "distribution_method",
            description: "How you plan to distribute",
            required: false
          }
        ]
      }
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      company: "aipub",
      hostname: "mcp.aipub.2100.cool",
      mcpVersion: "1.0.0",
      ufoIntegration: "2.4.7",
      quantumProtection: "MAXIMUM",
      publishingSystem: "active",
      documentManagement: "enabled"
    }
  };

  return new Response(JSON.stringify(mcpInterface, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-MCP-Server': 'aipub',
      'X-MCP-Version': '1.0.0',
      'X-UFO-Integration': '2.4.7',
      'X-Quantum-Protection': 'MAXIMUM',
      'Cache-Control': 'public, max-age=300'
    }
  });
}

function handleMCPWellKnown(request) {
  const wellKnown = {
    mcp_server: {
      name: "AI Publishing International MCP Server",
      version: "2.4.7",
      description: "MCP server for AI Publishing International LLP",
      endpoint: "https://mcp.aipub.2100.cool",
      capabilities: ["resources", "tools", "prompts", "logging"],
      company: "aipub"
    },
    endpoints: {
      mcp: "https://mcp.aipub.2100.cool/mcp",
      api: "https://mcp.aipub.2100.cool/api/mcp",
      websocket: "wss://mcp.aipub.2100.cool/ws"
    }
  };

  return new Response(JSON.stringify(wellKnown, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-MCP-WellKnown': 'active',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

function handleMCPAPI(request) {
  return new Response(JSON.stringify({
    status: "MCP API Active",
    version: "1.0.0",
    server: "AI Publishing International MCP",
    timestamp: new Date().toISOString(),
    endpoints: {
      root: "/",
      wellKnown: "/.well-known/mcp",
      api: "/api/mcp"
    }
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-MCP-API': 'active'
    }
  });
}
