'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  BarChart3,
  Cable,
  Clock,
  Cog,
  Command,
  Database,
  Gauge,
  HelpCircle,
  Layers,
  LayoutDashboard,
  RefreshCw,
  Shield,
  Settings,
  UserCog,
  Bot,
  Globe,
  Workflow,
} from 'lucide-react';

// Import agent components
import AgentSettings from '@/components/pilot-lounge/AgentSettings';
import EnvironmentManager from '@/components/pilot-lounge/EnvironmentManager';
import AgentEnvironmentTester from '@/components/pilot-lounge/AgentEnvironmentTester';

// Dashboard components
const AgentStatusCard = () => {
  const [statusData, setStatusData] = useState({
    activeAgents: 12,
    status: 'Operational',
    lastSync: '2 mins ago',
    memoryUsage: 64,
    responseTime: 0.8,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserCog className="w-5 h-5 text-indigo-600" />
          Agent Status
        </h3>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">
            Active Agents
          </span>
          <span className="font-medium">{statusData.activeAgents}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">
            System Status
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {statusData.status}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Last Synced</span>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Clock className="w-3 h-3 mr-1" />
            <span className="text-sm">{statusData.lastSync}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">
              Memory Usage
            </span>
            <span className="text-sm">{statusData.memoryUsage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${statusData.memoryUsage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">
            Response Time
          </span>
          <span className="font-medium">{statusData.responseTime}s</span>
        </div>
      </div>

      <div className="mt-5">
        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center dark:text-indigo-400 dark:hover:text-indigo-300">
          View detailed metrics
          <ArrowUpDown className="ml-1 w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const ConnectionsCard = () => {
  const [connections, setConnections] = useState([
    {
      name: 'Anthology',
      status: 'Connected',
      lastSync: '5 mins ago',
      type: 'Content',
    },
    {
      name: 'Coursera',
      status: 'Connected',
      lastSync: '12 mins ago',
      type: 'Courses',
    },
    {
      name: 'User Database',
      status: 'Connected',
      lastSync: '3 mins ago',
      type: 'Users',
    },
    {
      name: 'Payment Gateway',
      status: 'Warning',
      lastSync: '35 mins ago',
      type: 'Commerce',
    },
  ]);

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      Connected:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Warning:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      Syncing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Cable className="w-5 h-5 text-indigo-600" />
          System Connections
        </h3>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Service
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Status
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Last Sync
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {connections.map((connection, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {connection.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {connection.type}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  {getStatusBadge(connection.status)}
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {connection.lastSync}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <button className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 transition-colors">
          Manage Connections
        </button>
      </div>
    </div>
  );
};

const ControlCenterCard = () => {
  const [quickActions, setQuickActions] = useState([
    { name: 'Sync Academy Content', icon: <RefreshCw className="w-4 h-4" /> },
    { name: 'View Agent Logs', icon: <Database className="w-4 h-4" /> },
    { name: 'Manage Permissions', icon: <Shield className="w-4 h-4" /> },
    { name: 'System Settings', icon: <Cog className="w-4 h-4" /> },
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Command className="w-5 h-5 text-indigo-600" />
          Control Center
        </h3>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-lg flex flex-col items-center justify-center transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
              {action.icon}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {action.name}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          System Health
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                CPU Usage
              </span>
              <span className="font-medium">24%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{ width: '24%' }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Memory</span>
              <span className="font-medium">48%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: '48%' }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Storage</span>
              <span className="font-medium">72%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div
                className="bg-yellow-500 h-1.5 rounded-full"
                style={{ width: '72%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsCard = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Agent Analytics
        </h3>
        <div className="flex space-x-2">
          <select className="text-xs border rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 py-1 px-2">
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <div className="text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
          <p>Analytics visualization would appear here</p>
          <p className="text-xs mt-1">Connect data source to view charts</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total Interactions
          </p>
          <p className="text-lg font-semibold mt-1 text-gray-800 dark:text-gray-200">
            14,352
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Success Rate
          </p>
          <p className="text-lg font-semibold mt-1 text-gray-800 dark:text-gray-200">
            92%
          </p>
        </div>
      </div>

      <div className="mt-5">
        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center dark:text-indigo-400 dark:hover:text-indigo-300">
          View detailed analytics
          <ArrowUpDown className="ml-1 w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// Main Pilot's Lounge page component
export default function PilotLounge() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pilot's Lounge</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1 px-3 rounded-md dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
            <Shield className="w-4 h-4" />
            Backup Settings
          </button>
          <button className="flex items-center gap-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded-md">
            <Settings className="w-4 h-4" />
            Global Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('agent-settings')}
            className={`py-2 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'agent-settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Agent Settings
            </div>
          </button>
          <button
            onClick={() => setActiveTab('environment-manager')}
            className={`py-2 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'environment-manager'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Environment Manager
            </div>
          </button>
          <button
            onClick={() => setActiveTab('environment-tester')}
            className={`py-2 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'environment-tester'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Environment Tester
            </div>
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AgentStatusCard />
          <ConnectionsCard />
          <ControlCenterCard />
          <AnalyticsCard />
        </div>
      )}

      {activeTab === 'agent-settings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <AgentSettings />
        </div>
      )}

      {activeTab === 'environment-manager' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <EnvironmentManager />
        </div>
      )}

      {activeTab === 'environment-tester' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <AgentEnvironmentTester />
        </div>
      )}
    </div>
  );
}
