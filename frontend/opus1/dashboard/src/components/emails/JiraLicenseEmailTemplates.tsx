import React from 'react';

interface WorkspaceConfirmationProps {
  projectName: string;
  workspaceUrl: string;
}

export const JiraWorkspaceConfirmationEmail: React.FC<WorkspaceConfirmationProps> = ({ 
  projectName, 
  workspaceUrl 
}) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Your Jira Workspace is Ready!</h2>
      <p>We've successfully set up your Jira workspace for <strong>{projectName}</strong>.</p>
      <p>You can access it by clicking the button below:</p>
      <p style={{ textAlign: 'center' }}>
        <a 
          href={workspaceUrl} 
          style={{
            display: 'inline-block',
            backgroundColor: '#0052CC',
            color: 'white',
            padding: '10px 20px',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Access Your Workspace
        </a>
      </p>
      <p>
        This workspace is configured to work seamlessly with your project and all Coaching 2100 agents,
        including Claude, XO Pilot, and FMS S01-S03.
      </p>
      <p>
        Your monthly license fee of $5 will appear on your next invoice.
      </p>
      <p>
        <em>The Coaching 2100 Team</em>
      </p>
    </div>
  );
};

interface JiraInvitationProps {
  workspaceName: string;
  workspaceUrl: string;
  role: 'viewer' | 'editor' | 'admin';
}

export const JiraInvitationEmail: React.FC<JiraInvitationProps> = ({ 
  workspaceName, 
  workspaceUrl, 
  role 
}) => {
  const roleText = {
    'viewer': 'view and comment on',
    'editor': 'edit and update',
    'admin': 'administer'
  }[role] || 'access';
  
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2>You've Been Invited!</h2>
      <p>You've been invited to {roleText} the Jira workspace for <strong>{workspaceName}</strong>.</p>
      <p>Click the button below to access the workspace:</p>
      <p style={{ textAlign: 'center' }}>
        <a 
          href={workspaceUrl} 
          style={{
            display: 'inline-block',
            backgroundColor: '#0052CC',
            color: 'white',
            padding: '10px 20px',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Access Workspace
        </a>
      </p>
      <p>
        This workspace is managed by Coaching 2100 and provides full integration with AI agents
        and project tracking tools.
      </p>
      <p>
        <em>The Coaching 2100 Team</em>
      </p>
    </div>
  );
};

interface InvoiceEmailProps {
  invoiceNumber: string;
  invoiceDate: string;
  projectName: string;
  amount: number;
}

export const JiraInvoiceEmail: React.FC<InvoiceEmailProps> = ({ 
  invoiceNumber, 
  invoiceDate, 
  projectName, 
  amount 
}) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Jira License Invoice</h2>
      <p>Invoice #: <strong>{invoiceNumber}</strong></p>
      <p>Date: {invoiceDate}</p>
      <p>Project: {projectName}</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Monthly Jira License</td>
            <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', fontWeight: 'bold', textAlign: 'right' }}>Total</td>
            <td style={{ padding: '10px', fontWeight: 'bold', textAlign: 'right' }}>${amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <p>
        This amount will be automatically charged to your account. 
        For any billing questions, please contact billing@coaching2100.com.
      </p>
      
      <p>
        Thank you for using Coaching 2100's Jira Project System!
      </p>
      
      <p>
        <em>The Coaching 2100 Team</em>
      </p>
    </div>
  );
};

export default {
  JiraWorkspaceConfirmationEmail,
  JiraInvitationEmail,
  JiraInvoiceEmail
};