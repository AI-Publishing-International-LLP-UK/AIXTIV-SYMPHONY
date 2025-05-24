"""Setup organization permissions and roles"""
import os
from google.cloud import resourcemanager_v3

def setup_permissions():
    client = resourcemanager_v3.ProjectsClient()
    
    # Setup project permissions
    project = client.get_project(name=f'projects/api-for-warp-drive')
    
    # Setup IAM roles
    owner_binding = {
        'role': 'roles/owner',
        'members': [f'user:pr@coaching2100.com']
    }
    
    editor_binding = {
        'role': 'roles/editor',
        'members': [f'user:dk@coaching2100.com']
    }
    
    # Apply permissions
    policy = client.get_iam_policy(request={'resource': project.name})
    policy.bindings.extend([owner_binding, editor_binding])
    client.set_iam_policy(request={'resource': project.name, 'policy': policy})

if __name__ == '__main__':
    setup_permissions()