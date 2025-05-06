"""
Model Context Protocol (MCP) Server for Agent Orchestration
Main application entrypoint

The MCP server acts as a central coordination point for agent context
management within the Aixtiv Symphony Orchestrating Operating System.
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mcp-server")

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
REGION = os.getenv("REGION", "us-west1")
ZONE = os.getenv("ZONE", "us-west1-b")
VERSION = "1.0.0"

# Initialize FastAPI application
app = FastAPI(
    title="ASOoS MCP Server",
    description="Model Context Protocol Service for Agent Orchestration",
    version=VERSION,
    docs_url="/docs" if ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if ENVIRONMENT != "production" else None,
)

# CORS Configuration - restrict in production
allowed_origins = ["*"] if ENVIRONMENT == "development" else [
    "https://console.aixtiv-symphony.com",
    "https://api.aixtiv-symphony.com",
    "https://agents.aixtiv-symphony.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
)

# --- Models ---

class AgentContext(BaseModel):
    """Agent context model for storing active context information"""
    agent_id: str = Field(..., description="Unique identifier for the agent")
    context_type: str = Field(..., description="Type of context (e.g., 'conversation', 'task', 'memory')")
    data: Dict[str, Any] = Field(..., description="Context data payload")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Context creation/update timestamp")
    ttl: Optional[int] = Field(None, description="Time to live in seconds, if applicable")
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "dr-lucy-001",
                "context_type": "conversation",
                "data": {
                    "session_id": "sess_123456",
                    "user_id": "user_789012", 
                    "state": "in_progress",
                    "memory_references": ["mem_345678", "mem_901234"]
                },
                "timestamp": "2025-05-05T12:30:45.123Z",
                "ttl": 3600
            }
        }

class StatusResponse(BaseModel):
    """Standard status response model"""
    status: str
    region: str
    zone: str
    environment: str
    version: str
    timestamp: datetime
    agent_count: int = 0
    active_contexts: int = 0

# In-memory storage (would use proper database in production)
agent_contexts: Dict[str, Dict[str, AgentContext]] = {}

# --- Routes ---

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint returning basic server information"""
    logger.info("Root endpoint accessed")
    return {
        "status": "MCP server online", 
        "message": "Welcome to ASOoS Model Context Protocol Service",
        "docs": "/docs"
    }

@app.get("/status", response_model=StatusResponse)
async def status_check():
    """Check server status and retrieve operational metrics"""
    logger.info("Status check performed")
    
    # Count active contexts
    context_count = sum(len(contexts) for contexts in agent_contexts.values())
    
    return StatusResponse(
        status="ready",
        region=REGION,
        zone=ZONE,
        environment=ENVIRONMENT,
        version=VERSION,
        timestamp=datetime.utcnow(),
        agent_count=len(agent_contexts),
        active_contexts=context_count
    )

@app.post("/agents/{agent_id}/contexts", response_model=AgentContext)
async def create_context(agent_id: str, context: AgentContext):
    """Create a new context for an agent"""
    logger.info(f"Creating context for agent {agent_id}")
    
    if agent_id not in agent_contexts:
        agent_contexts[agent_id] = {}
    
    context_key = f"{context.context_type}_{context.timestamp.isoformat()}"
    agent_contexts[agent_id][context_key] = context
    
    return context

@app.get("/agents/{agent_id}/contexts", response_model=List[AgentContext])
async def get_agent_contexts(agent_id: str, context_type: Optional[str] = None):
    """Retrieve all contexts for an agent, optionally filtered by type"""
    logger.info(f"Retrieving contexts for agent {agent_id}")
    
    if agent_id not in agent_contexts:
        return []
    
    contexts = list(agent_contexts[agent_id].values())
    
    if context_type:
        contexts = [c for c in contexts if c.context_type == context_type]
    
    return contexts

@app.delete("/agents/{agent_id}/contexts", response_model=Dict[str, str])
async def clear_agent_contexts(agent_id: str):
    """Clear all contexts for an agent"""
    logger.info(f"Clearing contexts for agent {agent_id}")
    
    if agent_id not in agent_contexts:
        raise HTTPException(status_code=404, detail=f"No contexts found for agent {agent_id}")
    
    count = len(agent_contexts[agent_id])
    agent_contexts[agent_id] = {}
    
    return {"status": "success", "message": f"Cleared {count} contexts for agent {agent_id}"}

@app.get("/agents/{agent_id}/contexts/{context_type}", response_model=List[AgentContext])
async def get_contexts_by_type(agent_id: str, context_type: str):
    """Get all contexts of a specific type for an agent"""
    logger.info(f"Retrieving {context_type} contexts for agent {agent_id}")
    
    if agent_id not in agent_contexts:
        return []
    
    return [c for c in agent_contexts[agent_id].values() if c.context_type == context_type]

# --- Error Handlers ---

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return {
        "status": "error",
        "message": "An internal server error occurred",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    # This block is for local development only
    import uvicorn
    logger.info(f"Starting MCP server in {ENVIRONMENT} mode")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

