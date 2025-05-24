from integrations_gateway import IntegrationsGateway, IntegrationStatus

def main():
    try:
        gateway = IntegrationsGateway()
        print("Attempting to connect all applications...")
        
        results = gateway.reauthenticate_all_agents()
        
        print("\nConnection Results:")
        for service, status in results.items():
            print(f"{service}: {'Connected' if status else 'Failed'}")
        
        print("\nDetailed Status:")
        status_dict = gateway.get_integration_status()
        for service, status in status_dict.items():
            print(f"{service}: {status.value}")
        
        return results
    except Exception as e:
        print(f"Error during integration: {str(e)}")
        return False

if __name__ == "__main__":
    main()

