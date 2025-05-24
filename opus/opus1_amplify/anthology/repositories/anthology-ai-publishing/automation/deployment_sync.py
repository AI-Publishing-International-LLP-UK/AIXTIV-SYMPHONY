from google.cloud import aiplatform
from google.cloud import run_v2
from jira import JIRA
import yaml
import os

class DeploymentSynchronizer:
    def __init__(self):
        self.project_id = "api-for-warp-drive"
        self.region = "us-west1"
        self._init_clients()

    def _init_clients(self):
        """Initialize API clients"""
        # Initialize Jira client
        jira_token = os.environ.get('JIRA_API_TOKEN')
        self.jira = JIRA(
            server='https://c2100pcr.atlassian.net',
            token_auth=jira_token
        )
        
        # Initialize GCP clients
        self.run_client = run_v2.ServicesClient()
        aiplatform.init(project=self.project_id, location=self.region)

    def sync_deployment_status(self, service_name, status):
        """Sync deployment status with Jira"""
        with open('automation/jira-sync.yaml', 'r') as f:
            config = yaml.safe_load(f)

        # Create or update Jira issue
        issue_data = {
            'project': {'key': config['jira']['project_key']},
            'summary': f'Deployment Status: {service_name}',
            'issuetype': {'name': 'Task'},
            'components': [{'name': 'Deployment'}],
            'labels': ['automated-deployment', service_name]
        }

        # Find existing issue or create new one
        issues = self.jira.search_issues(
            f'project={config["jira"]["project_key"]} AND labels=automated-deployment AND labels={service_name}',
            maxResults=1
        )

        if issues:
            issue = issues[0]
            self.jira.add_comment(issue.key, f'Deployment status updated: {status}')
            if status == 'COMPLETE':
                self.jira.transition_issue(issue, 'Done')
        else:
            self.jira.create_issue(fields=issue_data)

    def verify_agent_status(self):
        """Verify and sync AI agent status"""
        agent_manager = AgentManager()
        status = agent_manager.verify_all_agents()
        
        if status:
            self.sync_deployment_status('ai-agents', 'COMPLETE')
        else:
            self.sync_deployment_status('ai-agents', 'ERROR')

    def verify_vision_lake(self):
        """Verify Vision Lake connectivity"""
        try:
            bucket = storage.Client().bucket('vision-lake-main')
            if bucket.exists():
                self.sync_deployment_status('vision-lake', 'COMPLETE')
            else:
                self.sync_deployment_status('vision-lake', 'ERROR')
        except Exception as e:
            self.sync_deployment_status('vision-lake', f'ERROR: {str(e)}')

def main():
    synchronizer = DeploymentSynchronizer()
    synchronizer.verify_agent_status()
    synchronizer.verify_vision_lake()

if __name__ == '__main__':
    main()