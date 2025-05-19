import axios from 'axios';
import { JIRA_CONFIG } from './jira-config';
import { db } from '../../services/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { getSecretsManager } from '../../services/common/gcp-secrets-client';

// Get secrets manager instance
const secretsManager = getSecretsManager();

/**
 * Jira Service provides methods for interacting with Jira Cloud API
 * This service enables full integration with the Coaching 2100 Jira license system
 */
export class JiraService {
  private baseUrl: string;
  private apiToken: string | null = null;
  private adminUser: string;

  constructor() {
    this.baseUrl = JIRA_CONFIG.baseUrl;
    this.adminUser = JIRA_CONFIG.adminUser;
  }

  /**
   * Initialize the Jira service by retrieving the API token
   */
  async initialize(): Promise<void> {
    if (!this.apiToken) {
      this.apiToken = await this.getApiToken();
    }
  }

  /**
   * Get the API token from Secret Manager
   */
  private async getApiToken(): Promise<string> {
    try {
      // Ensure secrets manager is initialized
      if (!secretsManager.initialized) {
        await secretsManager.initialize();
      }

      // Extract secret name from the full path
      const secretPath = JIRA_CONFIG.secretPaths.apiToken;
      const secretName = secretPath.split('/').pop();

      // Get the secret using the GCPSecretsManager
      return await secretsManager.getSecret(secretName);
    } catch (error) {
      console.error('Error retrieving Jira API token:', error);
      throw new Error('Failed to retrieve Jira API token');
    }
  }

  /**
   * Get headers for Jira API requests
   */
  private async getHeaders(): Promise<Record<string, string>> {
    await this.initialize();

    return {
      'Authorization': `Basic ${Buffer.from(`${this.adminUser}:${this.apiToken}`).toString('base64')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create a new Jira project workspace
   */
  async createProjectWorkspace(
    projectId: string,
    projectName: string,
    projectKey: string
  ): Promise<{ 
    workspaceId: string;
    workspaceKey: string;
    workspaceUrl: string; 
  }> {
    try {
      const headers = await this.getHeaders();
      
      // Create the project in Jira
      const response = await axios.post(
        `${this.baseUrl}/rest/api/3/project`,
        {
          key: projectKey.toUpperCase(),
          name: projectName,
          projectTypeKey: JIRA_CONFIG.projectTemplate.type,
          projectTemplateKey: JIRA_CONFIG.projectTemplate.template,
          leadAccountId: this.adminUser,
          description: {
            version: 1,
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `Project workspace for ${projectName} (ID: ${projectId})`
                  }
                ]
              }
            ]
          }
        },
        { headers }
      );

      const workspaceData = {
        workspaceId: response.data.id,
        workspaceKey: response.data.key,
        workspaceUrl: `${this.baseUrl}/jira/software/projects/${response.data.key}`,
      };

      // Store the workspace data in Firestore
      await this.saveWorkspaceToFirestore(projectId, workspaceData);

      return workspaceData;
    } catch (error) {
      console.error('Error creating Jira project workspace:', error);
      throw new Error('Failed to create Jira project workspace');
    }
  }

  /**
   * Save workspace data to Firestore
   */
  private async saveWorkspaceToFirestore(
    projectId: string, 
    workspaceData: any
  ): Promise<void> {
    try {
      const workspaceRef = doc(collection(db, 'jiraWorkspaces'));
      await setDoc(workspaceRef, {
        projectId,
        ...workspaceData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        invitedUsers: [],
        status: 'active'
      });

      // Update the license status to active
      const licensesRef = collection(db, 'projectLicenses');
      const q = query(
        licensesRef,
        where('projectId', '==', projectId),
        where('licenseType', '==', 'jira')
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const licenseDoc = querySnapshot.docs[0];
        await updateDoc(licenseDoc.ref, {
          status: 'active',
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error saving workspace to Firestore:', error);
      throw new Error('Failed to save workspace data');
    }
  }

  /**
   * Invite a user to a Jira workspace
   */
  async inviteUserToWorkspace(
    workspaceId: string,
    userEmail: string,
    role: string = 'viewer'
  ): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      
      // Check if the user exists in Jira
      const userId = await this.getUserIdByEmail(userEmail);
      
      // If user doesn't exist, create them
      const userAccountId = userId || await this.createJiraUser(userEmail);
      
      // Get the role ID
      const roleId = JIRA_CONFIG.roleMapping[role as keyof typeof JIRA_CONFIG.roleMapping] || 
                    JIRA_CONFIG.roleMapping.viewer;
      
      // Add user to the project role
      await axios.post(
        `${this.baseUrl}/rest/api/3/project/${workspaceId}/role/${roleId}`,
        {
          user: [userAccountId]
        },
        { headers }
      );

      // Update Firestore
      const workspaceRef = doc(collection(db, 'jiraWorkspaces'), workspaceId);
      const workspaceDoc = await getDoc(workspaceRef);
      
      if (workspaceDoc.exists()) {
        const workspace = workspaceDoc.data();
        const invitedUsers = workspace.invitedUsers || [];
        
        if (!invitedUsers.includes(userEmail)) {
          await updateDoc(workspaceRef, {
            invitedUsers: [...invitedUsers, userEmail],
            updatedAt: Timestamp.now()
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error inviting user to Jira workspace:', error);
      throw new Error('Failed to invite user to Jira workspace');
    }
  }

  /**
   * Get user ID by email
   */
  private async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/user/search?query=${encodeURIComponent(email)}`,
        { headers }
      );
      
      if (response.data && response.data.length > 0) {
        return response.data[0].accountId;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user ID by email:', error);
      return null;
    }
  }

  /**
   * Create a new Jira user
   */
  private async createJiraUser(email: string): Promise<string> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.post(
        `${this.baseUrl}/rest/api/3/user`,
        {
          emailAddress: email,
          displayName: email.split('@')[0]
        },
        { headers }
      );
      
      return response.data.accountId;
    } catch (error) {
      console.error('Error creating Jira user:', error);
      throw new Error('Failed to create Jira user');
    }
  }

  /**
   * Create a Jira issue
   */
  async createIssue(
    projectKey: string,
    summary: string,
    description: string,
    issueType: string = 'Task'
  ): Promise<{ 
    issueId: string;
    issueKey: string; 
    issueUrl: string;
  }> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.post(
        `${this.baseUrl}/rest/api/3/issue`,
        {
          fields: {
            project: {
              key: projectKey
            },
            summary,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: description
                    }
                  ]
                }
              ]
            },
            issuetype: {
              name: issueType
            }
          }
        },
        { headers }
      );
      
      return {
        issueId: response.data.id,
        issueKey: response.data.key,
        issueUrl: `${this.baseUrl}/browse/${response.data.key}`
      };
    } catch (error) {
      console.error('Error creating Jira issue:', error);
      throw new Error('Failed to create Jira issue');
    }
  }

  /**
   * Get all issues for a project
   */
  async getProjectIssues(
    projectKey: string,
    maxResults: number = 50
  ): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/search?jql=project=${projectKey}&maxResults=${maxResults}`,
        { headers }
      );
      
      return response.data.issues || [];
    } catch (error) {
      console.error('Error getting project issues:', error);
      throw new Error('Failed to get project issues');
    }
  }
}

// Export an instance of the service
export const jiraService = new JiraService();

// Export default for easy importing
export default jiraService;