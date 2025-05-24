import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  deleteDoc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

export interface JiraLicense {
  id?: string;
  projectId: string;
  userId: string;
  licenseType: 'jira';
  monthlyFee: number;
  status: 'pending_activation' | 'active' | 'suspended' | 'canceled';
  createdAt: string;
  billingStart: string;
  billingEnd?: string;
  lastBillingDate?: string;
  nextBillingDate?: string;
}

export interface JiraWorkspace {
  id: string;
  projectId: string;
  workspaceUrl: string;
  createdAt: string;
  invitedUsers: string[];
}

/**
 * Get all Jira licenses for a user
 */
export const getUserJiraLicenses = async (userId: string): Promise<JiraLicense[]> => {
  const licensesRef = collection(db, 'projectLicenses');
  const q = query(
    licensesRef,
    where('userId', '==', userId),
    where('licenseType', '==', 'jira')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() 
  } as JiraLicense));
};

/**
 * Get all Jira licenses for a project
 */
export const getProjectJiraLicenses = async (projectId: string): Promise<JiraLicense[]> => {
  const licensesRef = collection(db, 'projectLicenses');
  const q = query(
    licensesRef,
    where('projectId', '==', projectId),
    where('licenseType', '==', 'jira')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data() 
  } as JiraLicense));
};

/**
 * Get a specific Jira license by ID
 */
export const getJiraLicense = async (licenseId: string): Promise<JiraLicense | null> => {
  const licenseRef = doc(db, 'projectLicenses', licenseId);
  const licenseDoc = await getDoc(licenseRef);
  
  if (!licenseDoc.exists()) {
    return null;
  }
  
  return {
    id: licenseDoc.id,
    ...licenseDoc.data()
  } as JiraLicense;
};

/**
 * Create a new Jira license
 */
export const createJiraLicense = async (projectId: string): Promise<string> => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const licenseRef = collection(db, 'projectLicenses');
  const newLicense = await addDoc(licenseRef, {
    projectId,
    userId: user.uid,
    licenseType: 'jira',
    monthlyFee: 5,
    status: 'pending_activation',
    createdAt: new Date().toISOString(),
    billingStart: new Date().toISOString()
  });
  
  return newLicense.id;
};

/**
 * Cancel a Jira license
 */
export const cancelJiraLicense = async (licenseId: string): Promise<void> => {
  const licenseRef = doc(db, 'projectLicenses', licenseId);
  
  await updateDoc(licenseRef, {
    status: 'canceled',
    billingEnd: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

/**
 * Get Jira workspace for a project
 */
export const getJiraWorkspace = async (projectId: string): Promise<JiraWorkspace | null> => {
  const workspacesRef = collection(db, 'jiraWorkspaces');
  const q = query(workspacesRef, where('projectId', '==', projectId));
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  
  const workspaceDoc = querySnapshot.docs[0];
  return {
    id: workspaceDoc.id,
    ...workspaceDoc.data()
  } as JiraWorkspace;
};

/**
 * Request Jira workspace setup for a project
 * This triggers a Cloud Function that will handle the actual workspace creation
 */
export const requestJiraWorkspaceSetup = async (projectId: string, projectName: string): Promise<void> => {
  const setupJiraWorkspace = httpsCallable(functions, 'setupJiraWorkspace');
  
  await setupJiraWorkspace({
    projectId,
    projectName
  });
};

/**
 * Invite a user to a Jira workspace
 */
export const inviteUserToJiraWorkspace = async (
  workspaceId: string, 
  userEmail: string, 
  role: 'viewer' | 'editor' | 'admin' = 'viewer'
): Promise<void> => {
  const inviteToJiraWorkspace = httpsCallable(functions, 'inviteToJiraWorkspace');
  
  await inviteToJiraWorkspace({
    workspaceId,
    userEmail,
    role
  });
};