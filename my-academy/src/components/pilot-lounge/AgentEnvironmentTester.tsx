import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Send,
  Settings,
  Mail,
  Globe,
  Book,
} from 'lucide-react';

interface SimulatedEnvironment {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  history: AgentInteraction[];
}

interface AgentInteraction {
  id: string;
  timestamp: Date;
  userInput?: string;
  agentResponse?: string;
  environment: string;
  metadata?: Record<string, any>;
}

/**
 * AgentEnvironmentTester Component
 *
 * A component for testing agent integration across different environments including
 * Gmail, browser, and other Opus products. This allows users to simulate agent behavior
 * and verify cross-environment functionality.
 */
const AgentEnvironmentTester: React.FC = () => {
  // Environment states
  const [environments, setEnvironments] = useState<SimulatedEnvironment[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-red-100 text-red-800',
      connected: true,
      history: [],
    },
    {
      id: 'browser',
      name: 'Web Browser',
      icon: <Globe className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-800',
      connected: true,
      history: [],
    },
    {
      id: 'opus-academy',
      name: 'Opus Academy',
      icon: <Book className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-800',
      connected: true,
      history: [],
    },
  ]);

  // State for user input and selected environment
  const [userInput, setUserInput] = useState('');
  const [currentEnv, setCurrentEnv] = useState('gmail');
  const [memoryLevel, setMemoryLevel] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);

  // Toggle environment connection
  const toggleConnection = (envId: string) => {
    setEnvironments(
      environments.map(env =>
        env.id === envId ? { ...env, connected: !env.connected } : env
      )
    );
  };

  // Simulate agent response
  const simulateAgentResponse = async () => {
    if (!userInput.trim()) return;

    setIsLoading(true);

    const newUserInteraction: AgentInteraction = {
      id: `user-${Date.now()}`,
      timestamp: new Date(),
      userInput,
      environment: currentEnv,
    };

    // Add user message to history
    const updatedEnvironments = environments.map(env =>
      env.id === currentEnv
        ? { ...env, history: [...env.history, newUserInteraction] }
        : env
    );

    setEnvironments(updatedEnvironments);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate simulated response based on environment
    const envName =
      environments.find(env => env.id === currentEnv)?.name || currentEnv;
    const response = `This is a simulated response from the agent in the ${envName} environment. The agent has analyzed your request: "${userInput}" and would provide relevant assistance based on this context.`;

    const newAgentInteraction: AgentInteraction = {
      id: `agent-${Date.now()}`,
      timestamp: new Date(),
      agentResponse: response,
      environment: currentEnv,
      metadata: {
        memoryUsed: Math.floor(Math.random() * 5) + 1,
        contextSource: currentEnv,
        crossEnvironmentData: isSyncEnabled,
      },
    };

    // Add agent response to history
    setEnvironments(
      updatedEnvironments.map(env =>
        env.id === currentEnv
          ? { ...env, history: [...env.history, newAgentInteraction] }
          : env
      )
    );

    setUserInput('');
    setIsLoading(false);
  };

  // Simulate syncing agent memory across environments
  const syncAgentMemory = async () => {
    setIsLoading(true);

    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Add a system message about the sync to all connected environments
    const syncMessage: AgentInteraction = {
      id: `sync-${Date.now()}`,
      timestamp: new Date(),
      agentResponse:
        'Agent memory synchronized across all connected environments',
      environment: 'system',
      metadata: {
        isSystemMessage: true,
        syncTimestamp: new Date().toISOString(),
      },
    };

    setEnvironments(
      environments.map(env =>
        env.connected ? { ...env, history: [...env.history, syncMessage] } : env
      )
    );

    setIsLoading(false);
  };

  // Clear conversation history for the current environment
  const clearHistory = () => {
    setEnvironments(
      environments.map(env =>
        env.id === currentEnv ? { ...env, history: [] } : env
      )
    );
  };

  // Get the current environment
  const activeEnvironment =
    environments.find(env => env.id === currentEnv) || environments[0];

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-gray-50">
        <CardTitle className="flex items-center justify-between">
          <span>Agent Environment Tester</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={syncAgentMemory}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
              />
              Sync Memory
            </Button>
            <Button variant="outline" size="icon" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Environment Selection Sidebar */}
          <div className="lg:col-span-1 space-y-4 border-r pr-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Test Environments</h3>
              <div className="space-y-2">
                {environments.map(env => (
                  <div
                    key={env.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                      currentEnv === env.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => setCurrentEnv(env.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${env.color}`}>
                        {env.icon}
                      </div>
                      <span className="text-sm font-medium">{env.name}</span>
                    </div>
                    <Switch
                      checked={env.connected}
                      onCheckedChange={() => toggleConnection(env.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Agent Memory</h3>
              <div className="space-y-2">
                <Label
                  htmlFor="memory-slider"
                  className="text-xs flex justify-between"
                >
                  <span>Memory Capacity</span>
                  <span className="text-primary">{memoryLevel}%</span>
                </Label>
                <Slider
                  id="memory-slider"
                  defaultValue={[memoryLevel]}
                  max={100}
                  step={10}
                  onValueChange={value => setMemoryLevel(value[0])}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sync-toggle" className="text-xs">
                  Cross-Environment Sync
                </Label>
                <Switch
                  id="sync-toggle"
                  checked={isSyncEnabled}
                  onCheckedChange={setIsSyncEnabled}
                />
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-4">
            {/* Environment Status */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1 rounded-full ${activeEnvironment.color}`}
                  >
                    {activeEnvironment.icon}
                  </div>
                  <span className="font-medium">{activeEnvironment.name}</span>
                  <Badge
                    variant={
                      activeEnvironment.connected ? 'success' : 'destructive'
                    }
                  >
                    {activeEnvironment.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  Clear History
                </Button>
              </div>
            </div>

            {/* Conversation History */}
            <div className="mb-4 h-[400px] overflow-y-auto border rounded-md p-3 bg-gray-50">
              {activeEnvironment.history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Book className="h-10 w-10 mb-2" />
                  <p>No conversation history yet</p>
                  <p className="text-sm">
                    Start a conversation to test the agent in this environment
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeEnvironment.history.map(interaction => (
                    <div key={interaction.id} className="space-y-2">
                      {interaction.userInput && (
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%]">
                            <p>{interaction.userInput}</p>
                            <p className="text-xs opacity-70 text-right mt-1">
                              {interaction.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {interaction.agentResponse && (
                        <div className="flex justify-start">
                          <div
                            className={`${
                              interaction.metadata?.isSystemMessage
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-white border'
                            } p-3 rounded-lg max-w-[80%]`}
                          >
                            <p>{interaction.agentResponse}</p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center gap-1">
                                {interaction.metadata?.crossEnvironmentData && (
                                  <Badge variant="outline" className="text-xs">
                                    Cross-Env Data
                                  </Badge>
                                )}
                                {interaction.metadata?.memoryUsed && (
                                  <Badge variant="outline" className="text-xs">
                                    Memory: {interaction.metadata.memoryUsed}{' '}
                                    slots
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs opacity-70">
                                {interaction.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2">
              <Input
                placeholder={`Type a message to test in ${activeEnvironment.name}...`}
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                disabled={!activeEnvironment.connected || isLoading}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    simulateAgentResponse();
                  }
                }}
              />
              <Button
                onClick={simulateAgentResponse}
                disabled={
                  !activeEnvironment.connected || !userInput.trim() || isLoading
                }
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentEnvironmentTester;
