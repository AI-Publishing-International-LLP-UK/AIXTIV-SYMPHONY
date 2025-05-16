import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { JIRA_CONFIG } from '../integrations/jira/jira-config';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  Timestamp,
  query,
  where,
  getDocs 
} from 'firebase/firestore';

// Secret Manager client
const secretManagerClient = new SecretManagerServiceClient();

// Cache for the webhook secret
let webhookSecret: string | null = null;

/**
 * Get the webhook secret from Secret Manager
 */
async function getWebhookSecret(): Promise<string> {
  if (webhookSecret) {
    return webhookSecret;
  }

  try {
    const [version] = await secretManagerClient.accessSecretVersion({
      name: JIRA_CONFIG.secretPaths.webhookSecret,
    });

    if (!version.payload || !version.payload.data) {
      throw new Error('Failed to retrieve Jira webhook secret');
    }

    webhookSecret = version.payload.data.toString();
    return webhookSecret;
  } catch (error) {
    console.error('Error retrieving Jira webhook secret:', error);
    throw new Error('Failed to retrieve Jira webhook secret');
  }
}

/**
 * Verify the webhook signature
 */
async function verifyWebhookSignature(req: Request): Promise<boolean> {
  try {
    const secret = await getWebhookSecret();
    const signature = req.headers['x-jira-signature'];
    
    if (!signature) {
      return false;
    }
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(req.body));
    const calculatedSignature = hmac.digest('base64');
    
    return calculatedSignature === signature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Handle issue created webhook
 */
export async function handleIssueCreated(req: Request, res: Response): Promise<void> {
  try {
    // Verify the webhook signature
    const isValid = await verifyWebhookSignature(req);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
    
    const { issue, project } = req.body;
    
    if (!issue || !project) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }
    
    // Log the issue creation event
    await addDoc(collection(db, 'jiraEvents'), {
      type: 'issue_created',
      issueId: issue.id,
      issueKey: issue.key,
      projectId: project.id,
      projectKey: project.key,
      summary: issue.fields?.summary || '',
      timestamp: Timestamp.now(),
      payload: req.body
    });
    
    // Find associated project in Firestore
    const workspacesRef = collection(db, 'jiraWorkspaces');
    const q = query(
      workspacesRef,
      where('workspaceKey', '==', project.key)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const workspaceDoc = querySnapshot.docs[0];
      const projectId = workspaceDoc.data().projectId;
      
      // Create task notification
      await addDoc(collection(db, 'projectNotifications'), {
        projectId,
        title: 'New Jira Issue Created',
        message: `A new issue "${issue.fields?.summary}" has been created in your Jira workspace.`,
        type: 'jira_issue',
        issueKey: issue.key,
        issueId: issue.id,
        createdAt: Timestamp.now(),
        read: false
      });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling issue created webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle issue updated webhook
 */
export async function handleIssueUpdated(req: Request, res: Response): Promise<void> {
  try {
    // Verify the webhook signature
    const isValid = await verifyWebhookSignature(req);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
    
    const { issue, project, changelog } = req.body;
    
    if (!issue || !project || !changelog) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }
    
    // Log the issue update event
    await addDoc(collection(db, 'jiraEvents'), {
      type: 'issue_updated',
      issueId: issue.id,
      issueKey: issue.key,
      projectId: project.id,
      projectKey: project.key,
      summary: issue.fields?.summary || '',
      changelog: changelog,
      timestamp: Timestamp.now(),
      payload: req.body
    });
    
    // Check for status changes
    const statusChange = changelog.items.find((item: any) => item.field === 'status');
    if (statusChange) {
      // Find associated project in Firestore
      const workspacesRef = collection(db, 'jiraWorkspaces');
      const q = query(
        workspacesRef,
        where('workspaceKey', '==', project.key)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const workspaceDoc = querySnapshot.docs[0];
        const projectId = workspaceDoc.data().projectId;
        
        // Create status change notification
        await addDoc(collection(db, 'projectNotifications'), {
          projectId,
          title: 'Jira Issue Status Updated',
          message: `Issue "${issue.fields?.summary}" status changed from "${statusChange.fromString}" to "${statusChange.toString}".`,
          type: 'jira_status_change',
          issueKey: issue.key,
          issueId: issue.id,
          oldStatus: statusChange.fromString,
          newStatus: statusChange.toString,
          createdAt: Timestamp.now(),
          read: false
        });
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling issue updated webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle comment added webhook
 */
export async function handleCommentAdded(req: Request, res: Response): Promise<void> {
  try {
    // Verify the webhook signature
    const isValid = await verifyWebhookSignature(req);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
    
    const { issue, project, comment } = req.body;
    
    if (!issue || !project || !comment) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }
    
    // Log the comment event
    await addDoc(collection(db, 'jiraEvents'), {
      type: 'comment_added',
      issueId: issue.id,
      issueKey: issue.key,
      projectId: project.id,
      projectKey: project.key,
      commentId: comment.id,
      commenter: comment.author?.displayName || 'Unknown',
      timestamp: Timestamp.now(),
      payload: req.body
    });
    
    // Find associated project in Firestore
    const workspacesRef = collection(db, 'jiraWorkspaces');
    const q = query(
      workspacesRef,
      where('workspaceKey', '==', project.key)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const workspaceDoc = querySnapshot.docs[0];
      const projectId = workspaceDoc.data().projectId;
      
      // Create comment notification
      await addDoc(collection(db, 'projectNotifications'), {
        projectId,
        title: 'New Comment on Jira Issue',
        message: `${comment.author?.displayName || 'Someone'} commented on "${issue.fields?.summary}".`,
        type: 'jira_comment',
        issueKey: issue.key,
        issueId: issue.id,
        commentId: comment.id,
        commenter: comment.author?.displayName || 'Unknown',
        createdAt: Timestamp.now(),
        read: false
      });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling comment added webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export the webhook handlers
export default {
  handleIssueCreated,
  handleIssueUpdated,
  handleCommentAdded
};