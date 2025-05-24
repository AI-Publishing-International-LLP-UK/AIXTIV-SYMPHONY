"""Setup GCP service accounts and workload identity"""
import yaml
from google.cloud import iam_v1

def setup_service_accounts(config_path: str = 'config/service-accounts.yml'):
    # Load configuration
    with open(config_path) as f:
        config = yaml.safe_load(f)
    
    client = iam_v1.IAMClient()
    
    for sa_name, sa_config in config['service_accounts'].items():
        # Create service account
        sa_path = f'projects/api-for-warp-drive/serviceAccounts/{sa_config["name"]}'
        
        # Set up IAM roles
        for role in sa_config['roles']:
            policy = iam_v1.Policy()
            policy.bindings.append({
                'role': role,
                'members': [f'serviceAccount:{sa_config["name"]}']
            })
            
            client.set_iam_policy(request={
                'resource': sa_path,
                'policy': policy
            })

if __name__ == '__main__':
    setup_service_accounts()