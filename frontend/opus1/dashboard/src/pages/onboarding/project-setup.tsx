import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService, db } from '../../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import ProjectTrackingLicense from '../../components/onboarding/ProjectTrackingLicense';

// Step components would be imported here
// import ProjectDetails from '../../components/onboarding/ProjectDetails';
// import TeamMembers from '../../components/onboarding/TeamMembers';
// import ProjectGoals from '../../components/onboarding/ProjectGoals';

// Define step titles
const steps = [
  'Project Details',
  'Team Members',
  'Project Goals',
  'Project Tracking',
  'Review & Create',
];

export default function ProjectSetup() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: null,
    teamMembers: [],
    goals: [],
    projectManagementChoice: '',
    jiraLicenseRequired: false,
  });

  const [tempProjectId, setTempProjectId] = useState<string | null>(null);
  const router = useRouter();
  const { currentUser } = useAuth();

  // This function would be called when a step component updates its data
  const handleStepDataUpdate = (data: any) => {
    setProjectData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    // If we're on the first step, create a temporary project ID to use for the rest
    if (activeStep === 0 && !tempProjectId) {
      createTemporaryProject();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const createTemporaryProject = async () => {
    try {
      setLoading(true);
      
      // Create a new project document with basic information
      const projectsRef = collection(db, 'projects');
      const newProject = await addDoc(projectsRef, {
        title: projectData.title || 'Untitled Project',
        description: projectData.description || '',
        ownerId: currentUser?.uid,
        status: 'draft',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      setTempProjectId(newProject.id);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (error) {
      console.error('Error creating temporary project:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const finalizeProject = async () => {
    if (!tempProjectId) return;
    
    try {
      setLoading(true);
      
      // Update the project with all the data gathered during onboarding
      await firestoreService.updateDocument('projects', tempProjectId, {
        ...projectData,
        status: 'active',
      });
      
      // Redirect to the project dashboard
      router.push(`/projects/${tempProjectId}`);
    } catch (error) {
      console.error('Error finalizing project:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  // Render the current step
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div>
            {/* ProjectDetails component would go here */}
            <Typography>Project Details Form</Typography>
            {/* This is just a placeholder. In a real app, you'd have a proper form component */}
            <Button onClick={() => handleStepDataUpdate({ title: 'Sample Project', description: 'A sample project' })}>
              Set Sample Data
            </Button>
          </div>
        );
      case 1:
        return (
          <div>
            {/* TeamMembers component would go here */}
            <Typography>Team Members Selection</Typography>
          </div>
        );
      case 2:
        return (
          <div>
            {/* ProjectGoals component would go here */}
            <Typography>Project Goals Definition</Typography>
          </div>
        );
      case 3:
        return (
          <ProjectTrackingLicense
            projectId={tempProjectId || ''}
            onComplete={() => handleStepDataUpdate({ completed: true })}
          />
        );
      case 4:
        return (
          <div>
            <Typography variant="h6" gutterBottom>
              Review Project Details
            </Typography>
            <Typography>
              <strong>Title:</strong> {projectData.title}
            </Typography>
            <Typography>
              <strong>Description:</strong> {projectData.description}
            </Typography>
            <Typography>
              <strong>Project Management:</strong>{' '}
              {projectData.jiraLicenseRequired ? 'Coaching 2100 Jira License' : 'Own System Integration'}
            </Typography>
          </div>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Create New Project
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <React.Fragment>
          {activeStep === steps.length ? (
            <React.Fragment>
              <Typography variant="h5" gutterBottom>
                Project created successfully!
              </Typography>
              <Typography variant="subtitle1">
                Your project has been created. You can now access it from your dashboard.
              </Typography>
            </React.Fragment>
          ) : (
            <React.Fragment>
              {getStepContent(activeStep)}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                {activeStep !== 0 && (
                  <Button onClick={handleBack} sx={{ mr: 1 }} disabled={loading}>
                    Back
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={activeStep === steps.length - 1 ? finalizeProject : handleNext}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : activeStep === steps.length - 1 ? (
                    'Create Project'
                  ) : (
                    'Next'
                  )}
                </Button>
              </Box>
            </React.Fragment>
          )}
        </React.Fragment>
      </Paper>
    </Container>
  );
}