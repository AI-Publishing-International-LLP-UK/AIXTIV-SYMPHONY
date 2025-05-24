import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LinkIcon from '@mui/icons-material/Link';

import { useAuth } from '../../contexts/AuthContext';
import { 
  getProjectJiraLicenses, 
  JiraLicense, 
  getJiraWorkspace, 
  JiraWorkspace,
  requestJiraWorkspaceSetup,
  inviteUserToJiraWorkspace
} from '../../services/jiraLicenseService';

interface JiraLicenseManagementProps {
  projectId: string;
  projectName: string;
}

const JiraLicenseManagement: React.FC<JiraLicenseManagementProps> = ({ projectId, projectName }) => {
  const [licenses, setLicenses] = useState<JiraLicense[]>([]);
  const [workspace, setWorkspace] = useState<JiraWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [setupInProgress, setSetupInProgress] = useState(false);
  const { currentUser } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch licenses
      const projectLicenses = await getProjectJiraLicenses(projectId);
      setLicenses(projectLicenses);
      
      // Fetch workspace
      const projectWorkspace = await getJiraWorkspace(projectId);
      setWorkspace(projectWorkspace);
    } catch (err) {
      console.error('Error loading Jira license data:', err);
      setError('Failed to load license information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const handleSetupWorkspace = async () => {
    try {
      setSetupInProgress(true);
      setError(null);
      
      await requestJiraWorkspaceSetup(projectId, projectName);
      
      setSuccessMessage('Jira workspace setup request submitted. This may take a few minutes to complete.');
      
      // Wait 5 seconds then refresh to check for workspace
      setTimeout(() => {
        loadData();
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Error setting up Jira workspace:', err);
      setError('Failed to set up Jira workspace. Please try again.');
    } finally {
      setSetupInProgress(false);
    }
  };

  const handleOpenInviteDialog = () => {
    setInviteDialogOpen(true);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setUserEmail('');
  };

  const handleInviteUser = async () => {
    if (!workspace) return;
    
    try {
      await inviteUserToJiraWorkspace(workspace.id, userEmail, 'viewer');
      setSuccessMessage(`Invitation sent to ${userEmail}`);
      handleCloseInviteDialog();
      
      // Refresh data after a short delay
      setTimeout(() => {
        loadData();
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      console.error('Error inviting user:', err);
      setError('Failed to send invitation. Please try again.');
    }
  };

  const getLicenseStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip size="small" label="Active" color="success" />;
      case 'pending_activation':
        return <Chip size="small" label="Pending Activation" color="warning" />;
      case 'suspended':
        return <Chip size="small" label="Suspended" color="error" />;
      case 'canceled':
        return <Chip size="small" label="Canceled" color="default" />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Jira License Management</Typography>
          <IconButton onClick={loadData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>License Details</Typography>
              <Divider sx={{ mb: 2 }} />
              
              {licenses.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>Monthly Fee</TableCell>
                        <TableCell>Billing Start</TableCell>
                        <TableCell>Next Billing</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {licenses.map((license) => (
                        <TableRow key={license.id}>
                          <TableCell>{getLicenseStatusChip(license.status)}</TableCell>
                          <TableCell>${license.monthlyFee}</TableCell>
                          <TableCell>{formatDate(license.billingStart)}</TableCell>
                          <TableCell>
                            {license.nextBillingDate ? formatDate(license.nextBillingDate) : 'Not set'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">No licenses found for this project.</Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Jira Workspace</Typography>
              <Divider sx={{ mb: 2 }} />
              
              {workspace ? (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography>Workspace is set up and ready to use</Typography>
                  </Box>
                  
                  <Button 
                    variant="outlined" 
                    startIcon={<LinkIcon />}
                    href={workspace.workspaceUrl}
                    target="_blank"
                    sx={{ mb: 2 }}
                  >
                    Open Jira Workspace
                  </Button>
                  
                  <Typography variant="subtitle2" gutterBottom>Invited Users:</Typography>
                  {workspace.invitedUsers && workspace.invitedUsers.length > 0 ? (
                    <Box mb={2}>
                      {workspace.invitedUsers.map((user, index) => (
                        <Chip key={index} label={user} size="small" sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </Box>
                  ) : (
                    <Typography color="textSecondary" variant="body2" mb={2}>
                      No users invited yet.
                    </Typography>
                  )}
                  
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenInviteDialog}
                  >
                    Invite User
                  </Button>
                </>
              ) : (
                <>
                  <Typography paragraph>
                    No Jira workspace has been set up for this project yet.
                  </Typography>
                  
                  <Button
                    variant="contained"
                    onClick={handleSetupWorkspace}
                    disabled={setupInProgress}
                  >
                    {setupInProgress ? 'Setting up...' : 'Set up Jira Workspace'}
                  </Button>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Invite User Dialog */}
        <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog}>
          <DialogTitle>Invite User to Jira Workspace</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter the email address of the user you want to invite to this Jira workspace.
              They will receive view and comment privileges.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseInviteDialog} startIcon={<CancelIcon />}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteUser} 
              variant="contained" 
              disabled={!userEmail}
              startIcon={<PersonAddIcon />}
            >
              Send Invitation
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default JiraLicenseManagement;