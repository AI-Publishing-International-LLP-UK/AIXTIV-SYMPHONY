// src/components/ConfigurationDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { useAuth } from '../contexts/AuthContext';
import { fetchConfiguration, updateConfiguration } from '../api/configApi';
import ProviderConfiguration from './configuration/ProviderConfiguration';
import DomainExpertiseMapping from './configuration/DomainExpertiseMapping';
import RoutingRulesEditor from './configuration/RoutingRulesEditor';
import CachingSettings from './configuration/CachingSettings';
import SecurityBanner from '../common/SecurityBanner';
import ConfigAuditLog from './configuration/ConfigAuditLog';
import SaveConfigButton from '../common/SaveConfigButton';
import { toast } from 'react-toastify';

const ConfigurationDashboard = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const { currentUser, userCan } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        setLoading(true);
        const configData = await fetchConfiguration();
        setConfig(configData);
      } catch (error) {
        console.error('Failed to load configuration:', error);
        toast.error('Failed to load configuration. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  // Check if user has permission to edit this section
  const canEdit = section => {
    return userCan(`edit:${section}`);
  };

  const handleConfigUpdate = (section, newSectionConfig) => {
    if (!canEdit(section)) {
      toast.error("You don't have permission to edit this section.");
      return;
    }

    setConfig(prevConfig => ({
      ...prevConfig,
      [section]: newSectionConfig,
    }));
  };

  const saveConfiguration = async () => {
    if (!userCan('save:configuration')) {
      toast.error("You don't have permission to save configuration changes.");
      return;
    }

    try {
      setSaveInProgress(true);
      await updateConfiguration(config);
      toast.success('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration. Please try again.');
    } finally {
      setSaveInProgress(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading configuration...</div>;
  }

  if (!config) {
    return (
      <div className="error-message">
        Failed to load configuration. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="configuration-dashboard">
      <SecurityBanner />

      <div className="dashboard-header">
        <h1>LLM Orchestration Configuration</h1>
        <SaveConfigButton
          onClick={saveConfiguration}
          disabled={saveInProgress || !userCan('save:configuration')}
          saving={saveInProgress}
        />
      </div>

      <Tabs selectedIndex={activeTab} onSelect={index => setActiveTab(index)}>
        <TabList>
          <Tab>Provider Settings</Tab>
          <Tab>Domain Expertise</Tab>
          <Tab>Routing Rules</Tab>
          <Tab>Caching</Tab>
          <Tab>Audit Log</Tab>
        </TabList>

        <TabPanel>
          <ProviderConfiguration
            providers={config.providers}
            onUpdate={newProviders =>
              handleConfigUpdate('providers', newProviders)
            }
            readonly={!canEdit('providers')}
          />
        </TabPanel>

        <TabPanel>
          <DomainExpertiseMapping
            domainExpertise={config.advanced?.domain_expertise || {}}
            providers={config.providers}
            onUpdate={newDomainExpertise => {
              const newAdvanced = {
                ...(config.advanced || {}),
                domain_expertise: newDomainExpertise,
              };
              handleConfigUpdate('advanced', newAdvanced);
            }}
            readonly={!canEdit('domain_expertise')}
          />
        </TabPanel>

        <TabPanel>
          <RoutingRulesEditor
            routingConfig={config.orchestration?.content_routing || {}}
            providers={config.providers}
            onUpdate={newRouting => {
              const newOrchestration = {
                ...config.orchestration,
                content_routing: newRouting,
              };
              handleConfigUpdate('orchestration', newOrchestration);
            }}
            readonly={!canEdit('routing_rules')}
          />
        </TabPanel>

        <TabPanel>
          <CachingSettings
            cachingConfig={config.cache || {}}
            onUpdate={newCache => handleConfigUpdate('cache', newCache)}
            readonly={!canEdit('caching')}
          />
        </TabPanel>

        <TabPanel>
          <ConfigAuditLog />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default ConfigurationDashboard;
