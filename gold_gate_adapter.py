# gold_gate_adapter.py
# Phase 1: Universal OpenAI MCP Adapter - Project Golden Gate

import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# CONFIG: Replace with actual address of your MCP Gateway (can be local or remote)
MCP_SERVER_URL = "http://localhost:4000"

@app.route("/gold-gate/openai", methods=["POST"])
def openai_to_mcp():
    data = request.json
    
    # Parse OpenAI-style function call
    try:
        func_call = data["function_call"]
        method = func_call["name"]
        params = json.loads(func_call["arguments"])
    except Exception as e:
        return jsonify({"error": f"Invalid format: {e}"}), 400

    # Convert to MCP-style JSON-RPC
    mcp_payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": 1
    }

    try:
        mcp_response = requests.post(MCP_SERVER_URL, json=mcp_payload)
        mcp_result = mcp_response.json()
    except Exception as e:
        return jsonify({"error": f"MCP request failed: {e}"}), 500

    # Send result back to OpenAI agent
    return jsonify({"tool_call_result": mcp_result})

if __name__ == "__main__":
    # In production, consider changing host to "127.0.0.1" for better security
    # and using a reverse proxy with proper authentication
    app.run(host="0.0.0.0", port=8080)

