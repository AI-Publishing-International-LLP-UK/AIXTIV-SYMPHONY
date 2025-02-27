from DrClaude import DrClaude
from DrCypriot import DrCypriot
from DrGrant import DrGrant
from DrRoark import DrRoark

def check_agent_status(agent_class, agent_name):
    try:
        agent = agent_class()
        ready_status = agent.is_ready() if hasattr(agent, 'is_ready') else False
        return {
            'name': agent_name,
            'initialized': True,
            'ready': ready_status,
            'status': 'OK'
        }
    except Exception as e:
        return {
            'name': agent_name,
            'initialized': False,
            'ready': False,
            'status': f'Error: {str(e)}'
        }

def main():
    agents = [
        (DrClaude, 'DrClaude'),
        (DrCypriot, 'DrCypriot'),
        (DrGrant, 'DrGrant'),
        (DrRoark, 'DrRoark')
    ]

    print("Checking deployment agents status...")
    print("-" * 50)

    all_ready = True
    for agent_class, agent_name in agents:
        status = check_agent_status(agent_class, agent_name)
        print(f"Agent: {status['name']}")
        print(f"Initialized: {'Yes' if status['initialized'] else 'No'}")
        print(f"Ready: {'Yes' if status['ready'] else 'No'}")
        print(f"Status: {status['status']}")
        print("-" * 50)
        
        if not status['ready']:
            all_ready = False

    print(f"\nOverall Status: {'All agents ready' if all_ready else 'Some agents not ready'}")

if __name__ == "__main__":
    main()

