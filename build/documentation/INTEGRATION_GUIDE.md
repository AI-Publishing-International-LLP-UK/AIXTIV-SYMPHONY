# FOMC Research Agent Integration Guide

## Overview
This document provides technical guidance for integrating the FOMC Research Agent into the Aixtiv Symphony ecosystem.

## System Architecture Integration

### 1. RSS XML Integration
```
[Industry RSS Feeds] → [FOMC Research Agent] → [Analysis Reports]
                      ↓
               [Core Symphony Database]
```

- Configure industry research RSS feeds in `deployment/config/rss_sources.json`
- Set up scheduled jobs to pull data using `fomc_research/tools/fetch_page_tool.py`
- Store results in the Symphony database using standard agent tracking protocols

### 2. Dream Commander Integration

```
[FOMC Analysis] → [Dream Commander API] → [Prediction Models]
       ↑                                          ↓
[Market Data] ←-------------------------------- [Forecasts]
```

- Use the `/core-protocols/dream-commander/api.js` interface
- Configure model mapping in `deployment/dream_commander_config.yaml`
- Implement callback handlers in `fomc_research/callbacks/dream_commander_callback.py`

### 3. Agent Tracking Integration

```javascript
// Add to fomc_research/tools/base_tool.py
from aixtiv_agent_tracking import logAgentAction

async def execute(self, *args, **kwargs):
    await logAgentAction('fomc_analysis', {
        'action': self.__class__.__name__,
        'parameters': kwargs
    })
    # Existing execution code
```

### 4. Wing Component Integration

The Wing orchestration layer needs these components:

1. Agent configuration in `wing/agencies/delegations/fomc_research.yaml`
2. Tool registration in `wing/jet-port/dispatching/tool_registry.js`
3. Squadron assignment in `wing/agencies/squadron_mapping.json`

## Deployment Process

1. **Local Testing**
   ```bash
   cd /Users/as/asoos/vls/solutions/research-analytics/fomc-agent
   poetry install
   poetry run python -m fomc_research.test_runner
   ```

2. **GCP Deployment**
   ```bash
   cd /Users/as/asoos/vls/solutions/research-analytics/fomc-agent/deployment
   python deploy.py --project=api-for-warp-drive --region=us-west1
   ```

3. **Integration Testing**
   ```bash
   aixtiv test:integration --agent=fomc-research --suite=basic
   ```

## Data Flow Diagrams

See `FOMC_Research_Agent_Workflow.png` for the complete workflow visualization.

## Security Considerations

- API keys should be stored in GCP Secret Manager
- All data access should use the Symphony integration gateway
- BigQuery permissions must be properly configured for the agent service account

## Additional Resources

- Full ADK Documentation: https://github.com/google/agent-development-kit
- FOMC Website: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- Symphony Integration Patterns: `/Users/as/asoos/docs/integration_patterns.md`
