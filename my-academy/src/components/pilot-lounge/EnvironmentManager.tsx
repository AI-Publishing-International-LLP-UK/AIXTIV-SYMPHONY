import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  Switch, 
  FormControlLabel, 
  Divider, 
  IconButton, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LaptopIcon from '@mui/icons-material/Laptop';
import BusinessIcon from '@mui/icons-material/Business';
import MailIcon from '@mui/icons-material/Mail';
import ExtensionIcon from '@mui/icons-material/Extension';

// Define environment types
type EnvironmentType = 'browser' | 'gmail' | 'corporate' | 'opus';

// Define environment data structure
interface Environment {
  id: string;
  name: string;
  type: EnvironmentType;
  connected: boolean;
  lastSync?: Date;
  permissions: string[];
  url?: string;
  apiKey?: string;
  status: 'active' | 'pending' | 'error';
  errorMessage?: string;
}

// Mock function to get environments - replace with actual API call
const fetchEnvironments = async (): Promise<Environment[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data
  return [
    {
      id: '1',
      name: 'Chrome Extension',
      type: 'browser',
      connected: true,
      lastSync: new Date(),
      permissions: ['read', 'write', 'execute'],
      status: 'active',
    },
    {
      id: '2',
      name: 'Gmail Integration',
      type: 'gmail',
      connected: true,
      lastSync: new Date(Date.now() - 86400000), // 1 day ago
      permissions: ['read', 'send'],
      status: 'active',
    },
    {
      id: '3',
      name: 'Corporate Portal',
      type: 'corporate',
      connected: false,
      permissions: [],
      url: 'https://corporate.example.com',
      status: 'pending',
    },
    {
      id: '4',
      name: 'Opus Learning',
      type: 'opus',
      connected: true,
      lastSync: new Date(),
      permissions: ['full_access'],
      status: 'active',
    },
    {
      id: '5',
      name: 'Opus Publishing',
      type: 'opus',
      connected: false,
      permissions: [],
      status: 'error',
      errorMessage: 'API key expired',
    },
  ];
};

// Mock function to connect environment - replace with actual API call
const connectEnvironment = async (id: string): Promise<{ success: boolean }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return success for demo
  return { success: true };
};

// Mock function to disconnect environment - replace with actual API call
const disconnectEnvironment = async (id: string): Promise<{ success: boolean }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return success for demo
  return { success: true };
};

// Mock function to update environment - replace with actual API call
const updateEnvironment = async (environment: Environment): Promise<{ success: boolean }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Return success for demo
  return { success: true };
};

// Mock function to add environment - replace with actual API call
const addEnvironment = async (environment: Omit<Environment, 'id'>): Promise<{ success: boolean, id: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return success with mock ID
  return { success: true, id: Math.random().toString(36).substring(7) };
};

// Mock function to delete environment - replace with actual API call
const deleteEnvironment = async (id: string): Promise<{ success: boolean }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return success for demo
  return { success: true };
};

// Environment icon mapper
const EnvironmentIcon = ({ type }: { type: EnvironmentType }) => {
  switch (type) {
    case 'browser':
      return <LaptopIcon />;
    case 'gmail':
      return <MailIcon />;
    case 'corporate':
      return <BusinessIcon />;
    case 'opus':
      return <ExtensionIcon />;
    default:
      return <ExtensionIcon />;
  }
};

// Main Environment Manager Component
export default function EnvironmentManager() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment | null>(null);
  const [formData, setFormData] = useState<Partial<Environment>>({
    name: '',
    type: 'browser',
    permissions: [],
    url: '',
    apiKey: '',
    connected: false,
    status: 'pending'
  });
  const [processing, setProcessing] = useState<string | null>(null);

  // Load environments on mount
  useEffect(() => {
    const loadEnvironments = async () => {
      try {
        setLoading(true);
        const data = await fetchEnvironments();
        setEnvironments(data);
        setError(null);
      } catch (err) {
        setError('Failed to load environments. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadEnvironments();
  }, []);

  // Handle dialog open for adding
  const handleAddEnvironment = () => {
    setDialogMode('add');
    setFormData({
      name: '',
      type: 'browser',
      permissions: [],
      url: '',
      apiKey: '',
      connected: false,
      status: 'pending'
    });
    setOpenDialog(true);
  };

  // Handle dialog open for editing
  const handleEditEnvironment = (env: Environment) => {
    setDialogMode('edit');
    setCurrentEnvironment(env);
    setFormData({
      name: env.name,
      type: env.type,
      permissions: [...env.permissions],
      url: env.url,
      apiKey: env.apiKey,
      connected: env.connected,
      status: env.status
    });
    setOpenDialog(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle permissions change (simplified for demo)
  const handlePermissionsChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setFormData({
      ...formData,
      permissions: e.target.value as string[]
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setProcessing(dialogMode === 'add' ? 'adding' : 'updating');
      
      if (dialogMode === 'add') {
        const result = await addEnvironment(formData as Omit<Environment, 'id'>);
        if (result.success) {
          const newEnvironment = {
            ...formData,
            id: result.id,
          } as Environment;
          
          setEnvironments([...environments, newEnvironment]);
        }
      } else if (dialogMode === 'edit' && currentEnvironment) {
        const updatedEnvironment = {
          ...currentEnvironment,
          ...formData
        } as Environment;
        
        const result = await updateEnvironment(updatedEnvironment);
        if (result.success) {
          setEnvironments(environments.map(env => 
            env.id === currentEnvironment.id ? updatedEnvironment : env
          ));
        }
      }
      
      setOpenDialog(false);
      setCurrentEnvironment(null);
    } catch (err) {
      setError('Failed to save environment. Please try again.');
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  // Handle environment connection
  const handleConnect = async (id: string) => {
    try {
      setProcessing(`connecting-${id}`);
      const result = await connectEnvironment(id);
      
      if (result.success) {
        setEnvironments(environments.map(env => 
          env.id === id 
            ? { ...env, connected: true, status: 'active', lastSync: new Date() } 
            : env
        ));
      }
    } catch (err) {
      setError(`Failed to connect environment. Please try again.`);
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  // Handle environment disconnection
  const handleDisconnect = async (id: string) => {
    try {
      setProcessing(`disconnecting-${id}`);
      const result = await disconnectEnvironment(id);
      
      if (result.success) {
        setEnvironments(environments.map(env => 
          env.id === id 
            ? { ...env, connected: false, status: 'pending' } 
            : env
        ));
      }
    } catch (err) {
      setError(`Failed to disconnect environment. Please try again.`);
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  // Handle environment deletion
  const handleDelete = async (id: string) => {
    try {
      setProcessing(`deleting-${id}`);
      const result = await deleteEnvironment(id);
      
      if (result.success) {
        setEnvironments(environments.filter(env => env.id !== id));
      }
    } catch (err) {
      setError(`Failed to delete environment. Please try again.`);
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  // Available permissions based on environment type
  const getAvailablePermissions = (type: EnvironmentType) => {
    switch (type) {
      case 'browser':
        return ['cookies', 'history', 'bookmarks', 'tabs', 'downloads'];
      case 'gmail':
        return ['read', 'send', 'drafts', 'labels', 'settings'];
      case 'corporate':
        return ['read', 'write', 'admin', 'reports', 'users'];
      case 'opus':
        return ['read', 'write', 'admin', 'full_access', 'content', 'users'];
      default:
        return [];
    }
  };

  // Generate a status chip for an environment
  const StatusChip = ({ status }: { status: Environment['status'] }) => {
    switch (status) {
      case 'active':
        return <Chip 
          icon={<CheckCircleIcon />} 
          label="Active" 
          color="success" 
          size="small" 
        />;
      case 'pending':
        return <Chip 
          icon={<LinkIcon />} 
          label="Pending" 
          color="warning" 
          size="small" 
        />;
      case 'error':
        return <Chip 
          icon={<ErrorIcon />} 
          label="Error" 
          color="error" 
          size="small" 
        />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Environment Manager
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddEnvironment}
          disabled={loading}
        >
          Add Environment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {environments.map((env) => (
            <Grid item xs={12} md={6} lg={4} key={env.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  borderLeft: 6,
                  borderColor: env.connected ? 'success.main' : 'grey.300',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Box mr={1} display="flex" alignItems="center" color="primary.main">
                        <EnvironmentIcon type={env.type} />
                      </Box>
                      <Typography variant="h6" component="h2">
                        {env.name}
                      </Typography>
                    </Box>
                    <StatusChip status={env.status} />
                  </Box>
                  
                  <Typography color="textSecondary" gutterBottom>
                    Type: {env.type.charAt(0).toUpperCase() + env.type.slice(1)}
                  </Typography>
                  
                  {env.url && (
                    <Typography variant="body2" color="textSecondary" noWrap>
                      URL: {env.url}
                    </Typography>
                  )}
                  
                  {env.lastSync && (
                    <Typography variant="body2" color="textSecondary">
                      Last Sync: {env.lastSync.toLocaleString()}
                    </Typography>
                  )}

                  <Box mt={2}>
                    <Typography variant="body2" color="textSecondary">
                      Permissions:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {env.

