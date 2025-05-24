// src/components/configuration/ProviderConfiguration.jsx
import React, { useState } from 'react';
import { Card, Button, Form, Alert, Accordion } from 'react-bootstrap';
import {
  LockFill,
  UnlockFill,
  PlusCircle,
  TrashFill,
} from 'react-bootstrap-icons';
import { encryptApiKey, testProviderConnection } from '../../api/providerApi';
import SecureInput from '../../common/SecureInput';

const ProviderConfiguration = ({ providers, onUpdate, readonly }) => {
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const handleProviderChange = (providerKey, field, value) => {
    if (readonly) return;

    const updatedProviders = {
      ...providers,
      [providerKey]: {
        ...providers[providerKey],
        [field]: value,
      },
    };
    onUpdate(updatedProviders);
  };

  const handleToggleEnabled = providerKey => {
    if (readonly) return;

    handleProviderChange(
      providerKey,
      'enabled',
      !providers[providerKey].enabled
    );
  };

  const handleModelChange = (providerKey, modelField, value) => {
    if (readonly) return;

    const updatedProviders = {
      ...providers,
      [providerKey]: {
        ...providers[providerKey],
        [modelField]: value,
      },
    };
    onUpdate(updatedProviders);
  };

  const handleApiKeyChange = async (providerKey, value) => {
    if (readonly) return;

    try {
      // Only encrypt if it's a new or changed key (not the placeholder)
      if (value && !value.startsWith('••••')) {
        // In a real implementation, you'd encrypt on the server side
        // This is a placeholder for the client-side encryption
        const encryptedKey = await encryptApiKey(value);

        handleProviderChange(providerKey, 'api_key', encryptedKey);
      }
    } catch (error) {
      console.error('Failed to securely store API key:', error);
    }
  };

  const testConnection = async providerKey => {
    setIsTestingConnection(true);
    setTestResults({
      ...testResults,
      [providerKey]: { status: 'testing' },
    });

    try {
      const result = await testProviderConnection(
        providerKey,
        providers[providerKey]
      );
      setTestResults({
        ...testResults,
        [providerKey]: {
          status: result.success ? 'success' : 'error',
          message: result.message,
        },
      });
    } catch (error) {
      setTestResults({
        ...testResults,
        [providerKey]: {
          status: 'error',
          message: error.message || 'Connection test failed',
        },
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // List of available providers
  const availableProviders = Object.keys(providers).sort();

  return (
    <div className="provider-configuration">
      <h2>Provider Configuration</h2>

      {readonly && (
        <Alert variant="warning">
          <LockFill className="me-2" />
          You are in read-only mode. Contact an administrator to make changes.
        </Alert>
      )}

      <div className="provider-cards">
        <Accordion activeKey={expandedProvider}>
          {availableProviders.map(providerKey => {
            const provider = providers[providerKey];
            const isExpanded = expandedProvider === providerKey;
            const testResult = testResults[providerKey];

            return (
              <Card
                key={providerKey}
                className={`provider-card ${provider.enabled ? 'enabled' : 'disabled'}`}
              >
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Form.Check
                        type="switch"
                        id={`provider-${providerKey}-toggle`}
                        label={`${providerKey.toUpperCase()}`}
                        checked={provider.enabled}
                        onChange={() => handleToggleEnabled(providerKey)}
                        disabled={readonly}
                      />
                    </div>
                    <div>
                      <Button
                        variant="link"
                        onClick={() =>
                          setExpandedProvider(isExpanded ? null : providerKey)
                        }
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </div>
                </Card.Header>

                <Accordion.Collapse eventKey={providerKey}>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>API Key</Form.Label>
                        <SecureInput
                          type="password"
                          placeholder={
                            provider.api_key
                              ? '••••••••••••••••••••••'
                              : 'Enter API key'
                          }
                          onChange={e =>
                            handleApiKeyChange(providerKey, e.target.value)
                          }
                          disabled={readonly || !provider.enabled}
                        />
                        <Form.Text className="text-muted">
                          API keys are encrypted at rest and in transit
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Default Model</Form.Label>
                        <Form.Control
                          type="text"
                          value={provider.default_model || ''}
                          onChange={e =>
                            handleModelChange(
                              providerKey,
                              'default_model',
                              e.target.value
                            )
                          }
                          disabled={readonly || !provider.enabled}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Timeout (seconds)</Form.Label>
                        <Form.Control
                          type="number"
                          value={provider.timeout || 60}
                          onChange={e =>
                            handleModelChange(
                              providerKey,
                              'timeout',
                              parseInt(e.target.value)
                            )
                          }
                          min={1}
                          max={300}
                          disabled={readonly || !provider.enabled}
                        />
                      </Form.Group>

                      <div className="d-flex justify-content-between">
                        <Button
                          variant="outline-primary"
                          onClick={() => testConnection(providerKey)}
                          disabled={
                            isTestingConnection || readonly || !provider.enabled
                          }
                        >
                          {isTestingConnection &&
                          providerKey ===
                            Object.keys(testResults).find(
                              key => testResults[key].status === 'testing'
                            )
                            ? 'Testing...'
                            : 'Test Connection'}
                        </Button>

                        {testResult && (
                          <Alert
                            variant={
                              testResult.status === 'success'
                                ? 'success'
                                : 'danger'
                            }
                            className="ms-3 mb-0 py-2"
                          >
                            {testResult.message}
                          </Alert>
                        )}
                      </div>
                    </Form>
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
};

export default ProviderConfiguration;
