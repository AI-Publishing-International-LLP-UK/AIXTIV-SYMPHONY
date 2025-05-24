const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize SendGrid
sgMail.setApiKey(functions.config().sendgrid.key);

// Reference to Firestore
const db = admin.firestore();

/**
 * Cloud Function to set up a new Jira workspace for a project
 */
exports.setupJiraWorkspace = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to set up a Jira workspace'
    );
  }

  const { projectId, projectName } = data;
  
  if (!projectId || !projectName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Project ID and name are required'
    );
  }

  try {
    // Check if license exists
    const licensesRef = db.collection('projectLicenses');
    const licenseQuery = await licensesRef
      .where('projectId', '==', projectId)
      .where('licenseType', '==', 'jira')
      .limit(1)
      .get();

    if (licenseQuery.empty) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No Jira license found for this project'
      );
    }

    // Check if workspace already exists
    const workspacesRef = db.collection('jiraWorkspaces');
    const workspaceQuery = await workspacesRef
      .where('projectId', '==', projectId)
      .limit(1)
      .get();

    if (!workspaceQuery.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        'A Jira workspace already exists for this project'
      );
    }

    // Create workspace in Jira
    // In a real implementation, this would call the Jira API to create a workspace
    // For this example, we'll simulate it
    const workspaceId = `jira-${projectId.substring(0, 8)}`;
    const workspaceUrl = `https://coaching2100.atlassian.net/jira/projects/${workspaceId}`;

    // Create workspace record in Firestore
    await workspacesRef.add({
      projectId,
      workspaceId,
      workspaceName: `${projectName} Workspace`,
      workspaceUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      invitedUsers: [context.auth.token.email],
      status: 'active'
    });

    // Update license status
    const licenseDoc = licenseQuery.docs[0];
    await licenseDoc.ref.update({
      status: 'active',
      nextBillingDate: calculateNextBillingDate(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send confirmation email
    await sendWorkspaceConfirmationEmail(
      context.auth.token.email,
      projectName,
      workspaceUrl
    );

    return {
      success: true,
      workspaceUrl,
      message: 'Jira workspace successfully created'
    };
  } catch (error) {
    console.error('Error setting up Jira workspace:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to set up Jira workspace',
      error.message
    );
  }
});

/**
 * Cloud Function to invite a user to a Jira workspace
 */
exports.inviteToJiraWorkspace = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to invite users to a Jira workspace'
    );
  }

  const { workspaceId, userEmail, role } = data;
  
  if (!workspaceId || !userEmail) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Workspace ID and user email are required'
    );
  }

  try {
    // Get workspace from Firestore
    const workspaceDoc = await db.collection('jiraWorkspaces').doc(workspaceId).get();
    
    if (!workspaceDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Jira workspace not found'
      );
    }
    
    const workspaceData = workspaceDoc.data();
    
    // In a real implementation, this would call the Jira API to invite the user
    // For this example, we'll just update our Firestore record
    
    // Update invitedUsers list if the user isn't already in it
    if (!workspaceData.invitedUsers.includes(userEmail)) {
      await workspaceDoc.ref.update({
        invitedUsers: admin.firestore.FieldValue.arrayUnion(userEmail),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Send invitation email
    await sendJiraInvitationEmail(
      userEmail,
      workspaceData.workspaceName,
      workspaceData.workspaceUrl,
      role || 'viewer'
    );
    
    return {
      success: true,
      message: `Invitation sent to ${userEmail}`
    };
  } catch (error) {
    console.error('Error inviting user to Jira workspace:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to invite user to Jira workspace',
      error.message
    );
  }
});

/**
 * Cloud Function to process monthly Jira license billing
 */
exports.processJiraLicenseBilling = functions.pubsub
  .schedule('0 0 1 * *')  // Run at midnight on the 1st of every month
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const now = admin.firestore.Timestamp.now();
      const licensesRef = db.collection('projectLicenses');
      
      // Get all active Jira licenses
      const licensesQuery = await licensesRef
        .where('licenseType', '==', 'jira')
        .where('status', '==', 'active')
        .get();
      
      const billingPromises = [];
      
      licensesQuery.forEach(doc => {
        const licenseData = doc.data();
        
        // Create a billing record
        const billingPromise = db.collection('licenseBillings').add({
          licenseId: doc.id,
          projectId: licenseData.projectId,
          userId: licenseData.userId,
          licenseType: 'jira',
          amount: licenseData.monthlyFee,
          billingDate: now,
          status: 'pending',
          invoiceNumber: generateInvoiceNumber()
        });
        
        // Update the license with next billing date
        const updatePromise = doc.ref.update({
          lastBillingDate: now,
          nextBillingDate: calculateNextBillingDate(now),
          updatedAt: now
        });
        
        billingPromises.push(billingPromise);
        billingPromises.push(updatePromise);
      });
      
      await Promise.all(billingPromises);
      
      console.log(`Processed ${licensesQuery.size} Jira licenses for billing`);
      return null;
    } catch (error) {
      console.error('Error processing Jira license billing:', error);
      return null;
    }
  });

/**
 * Cloud Function to send license invoices to users
 */
exports.sendLicenseInvoices = functions.firestore
  .document('licenseBillings/{billingId}')
  .onCreate(async (snapshot, context) => {
    try {
      const billingData = snapshot.data();
      
      if (billingData.status !== 'pending') {
        return null;
      }
      
      // Get user info
      const userDoc = await admin.auth().getUser(billingData.userId);
      const userEmail = userDoc.email;
      
      if (!userEmail) {
        console.error(`No email found for user ${billingData.userId}`);
        return null;
      }
      
      // Get project info
      const projectDoc = await db.collection('projects').doc(billingData.projectId).get();
      const projectData = projectDoc.exists ? projectDoc.data() : { name: 'Unknown Project' };
      
      // Send invoice email
      await sendInvoiceEmail(
        userEmail,
        billingData,
        projectData.name
      );
      
      // Update billing status
      await snapshot.ref.update({
        status: 'invoiced',
        invoicedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    } catch (error) {
      console.error('Error sending license invoice:', error);
      return null;
    }
  });

/**
 * Helper function to calculate the next billing date
 */
function calculateNextBillingDate(fromDate = null) {
  const date = fromDate ? new Date(fromDate.toDate()) : new Date();
  date.setMonth(date.getMonth() + 1);
  return admin.firestore.Timestamp.fromDate(date);
}

/**
 * Helper function to generate an invoice number
 */
function generateInvoiceNumber() {
  const prefix = 'INV';
  const timestamp = Date.now().toString().substring(4);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Helper function to send workspace confirmation email
 */
async function sendWorkspaceConfirmationEmail(userEmail, projectName, workspaceUrl) {
  const msg = {
    to: userEmail,
    from: 'licensing@coaching2100.com',
    subject: `Jira Workspace Ready for ${projectName}`,
    text: `Your Jira workspace for ${projectName} has been created. You can access it at: ${workspaceUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Jira Workspace is Ready!</h2>
        <p>We've successfully set up your Jira workspace for <strong>${projectName}</strong>.</p>
        <p>You can access it by clicking the button below:</p>
        <p style="text-align: center;">
          <a href="${workspaceUrl}" style="display: inline-block; background-color: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
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
    `,
  };
  
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending workspace confirmation email:', error);
  }
}

/**
 * Helper function to send Jira invitation email
 */
async function sendJiraInvitationEmail(userEmail, workspaceName, workspaceUrl, role) {
  const roleText = {
    'viewer': 'view and comment on',
    'editor': 'edit and update',
    'admin': 'administer'
  }[role] || 'access';
  
  const msg = {
    to: userEmail,
    from: 'licensing@coaching2100.com',
    subject: `You've been invited to ${workspaceName}`,
    text: `You've been invited to ${roleText} the Jira workspace for ${workspaceName}. Access it at: ${workspaceUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've Been Invited!</h2>
        <p>You've been invited to ${roleText} the Jira workspace for <strong>${workspaceName}</strong>.</p>
        <p>Click the button below to access the workspace:</p>
        <p style="text-align: center;">
          <a href="${workspaceUrl}" style="display: inline-block; background-color: #0052CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
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
    `,
  };
  
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending Jira invitation email:', error);
  }
}

/**
 * Helper function to send invoice email
 */
async function sendInvoiceEmail(userEmail, billingData, projectName) {
  const invoiceDate = billingData.billingDate.toDate().toLocaleDateString();
  
  const msg = {
    to: userEmail,
    from: 'billing@coaching2100.com',
    subject: `Invoice ${billingData.invoiceNumber} for Jira License`,
    text: `Your monthly invoice for Jira license usage for ${projectName}. Amount: $${billingData.amount}. Invoice date: ${invoiceDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Jira License Invoice</h2>
        <p>Invoice #: <strong>${billingData.invoiceNumber}</strong></p>
        <p>Date: ${invoiceDate}</p>
        <p>Project: ${projectName}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #ddd;">Monthly Jira License</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${billingData.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; text-align: right;">Total</td>
              <td style="padding: 10px; font-weight: bold; text-align: right;">$${billingData.amount.toFixed(2)}</td>
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
    `,
  };
  
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending invoice email:', error);
  }
}