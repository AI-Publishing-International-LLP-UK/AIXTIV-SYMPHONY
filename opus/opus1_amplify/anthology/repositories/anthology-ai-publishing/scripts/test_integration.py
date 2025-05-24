import os
import sys
import yaml

def verify_integrations():
    # Verify AI agent configurations
    if not os.path.exists('config/ai_agents.yml'):
        print('Warning: AI agent configuration missing')
        return False
        
    # Verify API configurations
    if not os.path.exists('config/synthesia_api_config.yml'):
        print('Warning: Synthesia API configuration missing')
        return False
        
    return True

if __name__ == '__main__':
    success = verify_integrations()
    sys.exit(0 if success else 1)