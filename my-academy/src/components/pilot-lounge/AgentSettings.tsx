import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Slider, 
  Switch, 
  FormControlLabel, 
  Button, 
  Divider, 
  Chip,
  Grid,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Save as SaveIcon, 
  CloudSync as CloudSyncIcon,
  Memory as MemoryIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// Define types for agent settings
interface AgentSettings {
  id: string;
  name: string;
  avatar: string;
  memoryCapacity: number;
  contextSlots: number;
  isTransportable: boolean;
  syncSettings: {
    autoSync: boolean;
    syncInterval: number;
  };
  environmentAccess: EnvironmentAccess[];
}

interface EnvironmentAccess {
  id: string;
  name: string;
  type: 'browser' | 'opus' | 'corporate' | 'personal';
  isEnabled: boolean;
  accessLevel: 'read' | 'write' | 'full';
}

interface MemorySettings {
  totalCapacity: number;
  usedCapacity: number;
  longTermAllocation: number;
  shortTermAllocation: number;
  contextualAllocation: number;
}

// Mock data - in a real implementation, this would come from Firebase/Firestore
const mockAgentSettings: AgentSettings = {
  id: 'agent-001',
  name: 'Copilot Alpha',
  avatar: '/assets/agent-avatar.png',
  memoryCapacity: 1024,
  contextSlots: 8,
  isTransportable: true,
  syncSettings: {
    autoSync: true,
    syncInterval: 30, // minutes
  },
  environmentAccess: [
    { id: 'env-1', name: 'Gmail', type: 'personal', isEnabled: true, accessLevel: 'read' },
    { id: 'env-2', name: 'Opus Knowledge Base', type: 'opus', isEnabled: true, accessLevel: 'full' },
    { id: 'env-3', name: 'Corporate Intranet', type: 'corporate', isEnabled: false, accessLevel: 'read' },
    { id: 'env-4', name: 'Web Browser', type: 'browser', isEnabled: true, accessLevel: 'write' },
  ]
};

const mockMemorySettings: MemorySettings = {
  totalCapacity: 1024,
  usedCapacity: 512,
  longTermAllocation: 40, // percentage
  shortTermAllocation: 30, // percentage
  contextualAllocation: 30, // percentage
};

// This would be implemented with Firebase in a real application
const saveAgentSettings = async (settings: AgentSettings) => {
  console.log('Saving agent settings to Firestore:', settings);
  // Simulate API call
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 800);
  });
};

const AgentSettings: React.FC = () => {
  const [settings, setSettings] = useState<AgentSettings>(mockAgentSettings);
  const [memorySettings, setMemorySettings] = useState<MemorySettings>(mockMemorySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleBasicSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    
    if (name === 'isTransportable') {
      setSettings({ ...settings, [name]: checked });
    } else if (name === 'syncSettings.autoSync') {
      setSettings({
        ...settings,
        syncSettings: {
          ...settings.syncSettings,
          autoSync: checked
        }
      });
    } else if (name === 'syncSettings.syncInterval') {
      setSettings({
        ...settings,
        syncSettings: {
          ...settings.syncSettings,
          syncInterval: Number(value)
        }
      });
    } else {
      setSettings({ ...settings, [name]: value });
    }
  };

  const handleMemoryAllocationChange = (type: 'longTerm' | 'shortTerm' | 'contextual', value: number) => {
    const newSettings = { ...memorySettings };
    
    if (type === 'longTerm') {
      newSettings.longTermAllocation = value;
      // Adjust the other allocations to maintain 100% total
      const remaining = 100 - value;
      const ratio = newSettings.shortTermAllocation / (newSettings.shortTermAllocation + newSettings.contextualAllocation);
      newSettings.shortTermAllocation = Math.round(remaining * ratio);
      newSettings.contextualAllocation = 100 - value - newSettings.shortTermAllocation;
    } else if (type === 'shortTerm') {
      newSettings.shortTermAllocation = value;
      // Adjust the other allocations to maintain 100% total
      const remaining = 100 - value;
      const ratio = newSettings.longTermAllocation / (newSettings.longTermAllocation + newSettings.contextualAllocation);
      newSettings.longTermAllocation = Math.round(remaining * ratio);
      newSettings.contextualAllocation = 100 - value - newSettings.longTermAllocation;
    } else {
      newSettings.contextualAllocation = value;
      // Adjust the other allocations to maintain 100% total
      const remaining = 100 - value;
      const ratio = newSettings.longTermAllocation / (newSettings.longTermAllocation + newSettings.shortTermAllocation);
      newSettings.longTermAllocation = Math.round(remaining * ratio);
      newSettings.shortTermAllocation = 100 - value - newSettings.longTermAllocation;
    }
    
    setMemorySettings(newSettings);
  };

  const handleEnvironmentAccessChange = (envId: string, field: 'isEnabled' | 'accessLevel', value: any) => {
    const updatedEnvironments = settings.environmentAccess.map(env => {
      if (env.id === envId) {
        return { ...env, [field]: value };
      }
      return env;
    });
    
    setSettings({
      ...settings,
      environmentAccess: updatedEnvironments
    });
  };

  const addNewEnvironment = () => {
    const newEnv: EnvironmentAccess = {
      id: `env-${settings.environmentAccess.length + 1}`,
      name: 'New Environment',
      type: 'opus',
      isEnabled: false,
      accessLevel: 'read'
    };
    
    setSettings({
      ...settings,
      environmentAccess: [...settings.environmentAccess, newEnv]
    });
  };

  const removeEnvironment = (envId: string) => {
    setSettings({
      ...settings,
      environmentAccess: settings.environmentAccess.filter(env => env.id !== envId)
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await saveAgentSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const memoryUsagePercentage = (memorySettings.usedCapacity / memorySettings.totalCapacity) * 100;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Agent Settings
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Configure your transportable agent, manage memory, and control environment access
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="General Settings" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Memory Management" icon={<MemoryIcon />} iconPosition="start" />
          <Tab label="Environment Access" icon={<SecurityIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* General Settings Tab */}
      {currentTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Agent Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Agent Name"
                  name="name"
                  value={settings.name}
                  onChange={handleBasicSettingsChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Avatar URL"
                  name="avatar"
                  value={settings.avatar}
                  onChange={handleBasicSettingsChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.isTransportable}
                      onChange={handleBasicSettingsChange}
                      name="isTransportable"
                    />
                  }
                  label="Enable Transportable Agent"
                />
                <Typography variant="body2" color="text.secondary">
                  When enabled, your agent can move between different environments and maintain context.
                </Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Synchronization Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.syncSettings.autoSync}
                      onChange={handleBasicSettingsChange}
                      name="syncSettings.autoSync"
                    />
                  }
                  label="Enable Auto-Synchronization"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography id="sync-interval-slider" gutterBottom>
                  Sync Interval (minutes)
                </Typography>
                <Slider
                  value={settings.syncSettings.syncInterval}
                  onChange={(e, value) => 
                    setSettings({
                      ...settings,
                      syncSettings: {
                        ...settings.syncSettings,
                        syncInterval: value as number
                      }
                    })
                  }
                  disabled={!settings.syncSettings.autoSync}
                  aria-labelledby="sync-interval-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={5}
                  max={60}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Memory Management Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Memory Capacity
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    Memory Usage:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {memorySettings.usedCapacity} MB / {memorySettings.totalCapacity} MB
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgressWithLabel value={memoryUsagePercentage} />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Premium Opus purchases add additional memory capacity
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  startIcon={<AddIcon />}
                >
                  Upgrade Memory
                </Button>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Memory Allocation
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography id="long-term-memory-slider" gutterBottom>
                  Long-term Memory: {memorySettings.longTermAllocation}%
                </Typography>
                <Slider
                  value={memorySettings.longTermAllocation}
                  onChange={(e, value) => handleMemoryAllocationChange('longTerm', value as number)}
                  aria-labelledby="long-term-memory-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={10}
                  max={80}
                />
                <Typography variant="body2" color="text.secondary">
                  Permanent knowledge that persists across sessions
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography id="short-term-memory-slider" gutterBottom>
                  Short-term Memory: {memorySettings.shortTermAllocation}%
                </Typography>
                <Slider
                  value={memorySettings.shortTermAllocation}
                  onChange={(e, value) => handleMemoryAllocationChange('shortTerm', value as number)}
                  aria-labelledby="short-term-memory-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={10}
                  max={60}
                />
                <Typography variant="body2" color="text.secondary">
                  Recent conversations and temporary knowledge
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography id="contextual-memory-slider" gutterBottom>
                  Contextual Memory: {memorySettings.contextualAllocation}%
                </Typography>
                <Slider
                  value={memorySettings.contextualAllocation}
                  onChange={(e, value) => handleMemoryAllocationChange('contextual', value as number)}
                  aria-labelledby="contextual-memory-slider"
                  valueLabelDisplay="auto"
                  step

