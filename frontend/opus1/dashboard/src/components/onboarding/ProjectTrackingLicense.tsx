import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  FormControl, 
  FormControlLabel, 
  Radio, 
  RadioGroup, 
  Typography, 
  Alert,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

interface ProjectTrackingLicenseProps {
  onComplete: () => void;
  projectId: string;
}

const ProjectTrackingLicense: React.FC<ProjectTrackingLicenseProps> = ({ onComplete, projectId }) => {
  const [trackingChoice, setTrackingChoice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingChoice(event.target.value);
  };

  const handleSubmit = async () => {
    if (!trackingChoice) {
      setError('Please select an option to continue');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Create or update the project with tracking choice
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        projectManagementChoice: trackingChoice,
        jiraLicenseRequired: trackingChoice === 'license',
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });

      // If licensing Jira, create a license record
      if (trackingChoice === 'license') {
        const licenseRef = doc(db, 'projectLicenses', `${projectId}_jira`);
        await setDoc(licenseRef, {
          projectId,
          userId: currentUser.uid,
          licenseType: 'jira',
          monthlyFee: 5,
          status: 'pending_activation',
          createdAt: new Date().toISOString(),
          billingStart: new Date().toISOString()
        });
      }

      onComplete();
    } catch (err) {
      console.error('Error saving project tracking choice:', err);
      setError('Failed to save your selection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Project Management Tracking
        </Typography>
        
        <Typography variant="body1" paragraph>
          For optimal 2SDO compliance and agent collaboration, please select your preferred project tracking approach:
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <RadioGroup
            aria-label="project-tracking-options"
            name="project-tracking"
            value={trackingChoice}
            onChange={handleChange}
          >
            <Card variant="outlined" sx={{ mb: 2, border: trackingChoice === 'own' ? '2px solid #3f51b5' : '1px solid #e0e0e0' }}>
              <CardContent>
                <FormControlLabel
                  value="own"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        I will integrate my own system
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Connect your existing ClickUp, Jira, or other PM software
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ border: trackingChoice === 'license' ? '2px solid #3f51b5' : '1px solid #e0e0e0' }}>
              <CardContent>
                <FormControlLabel
                  value="license"
                  control={<Radio />}
                  label={
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          License Coaching 2100 Jira Access
                        </Typography>
                        <Chip 
                          size="small" 
                          label="$5/month per user" 
                          color="primary" 
                          variant="outlined" 
                        />
                      </Stack>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Let us manage your project tracking for you
                      </Typography>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Typography variant="body2" mt={1}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                          <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1, mt: 0.3 }} />
                          <Typography variant="body2">Transparent task visibility</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                          <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1, mt: 0.3 }} />
                          <Typography variant="body2">2SDO-compliant project progress tracking</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <CheckCircleIcon color="success" fontSize="small" sx={{ mr: 1, mt: 0.3 }} />
                          <Typography variant="body2">Full agent operability (Claude, XO Pilot, FMS S01–S03)</Typography>
                        </Box>
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit} 
            disabled={!trackingChoice || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectTrackingLicense;