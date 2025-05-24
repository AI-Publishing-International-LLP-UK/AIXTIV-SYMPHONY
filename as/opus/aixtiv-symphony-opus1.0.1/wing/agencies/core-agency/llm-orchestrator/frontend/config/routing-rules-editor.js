// src/components/configuration/RoutingRulesEditor.jsx
import React, { useState } from 'react';
import {
  Form,
  Button,
  Card,
  ListGroup,
  InputGroup,
  Alert,
  Modal,
} from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  PlusCircle,
  Trash,
  GripVertical,
  ExclamationTriangle,
  QuestionCircle,
} from 'react-bootstrap-icons';
import CodeEditor from '@monaco-editor/react';

const RoutingRulesEditor = ({
  routingConfig,
  providers,
  onUpdate,
  readonly,
}) => {
  const [rules, setRules] = useState(routingConfig.rules || []);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [showRuleDetails, setShowRuleDetails] = useState(null);

  const handleToggleRouting = checked => {
    if (readonly) return;

    onUpdate({
      ...routingConfig,
      enabled: checked,
    });
  };

  const handleRuleChange = (index, field, value) => {
    if (readonly) return;

    const updatedRules = [...rules];
    updatedRules[index][field] = value;
    setRules(updatedRules);

    onUpdate({
      ...routingConfig,
      rules: updatedRules,
    });
  };

  const addNewRule = () => {
    if (readonly) return;

    const newRule = {
      pattern: '',
      provider:
        Object.keys(providers).find(key => providers[key].enabled) || '',
      model: '',
      description: 'New routing rule',
    };

    const updatedRules = [...rules, newRule];
    setRules(updatedRules);

    onUpdate({
      ...routingConfig,
      rules: updatedRules,
    });

    // Focus on the new rule
    setShowRuleDetails(updatedRules.length - 1);
  };

  const removeRule = index => {
    if (readonly) return;

    const updatedRules = [...rules];
    updatedRules.splice(index, 1);
    setRules(updatedRules);

    onUpdate({
      ...routingConfig,
      rules: updatedRules,
    });

    // If we're showing details for this rule, hide the details
    if (showRuleDetails === index) {
      setShowRuleDetails(null);
    } else if (showRuleDetails > index) {
      // If we're showing details for a rule after this one, adjust the index
      setShowRuleDetails(showRuleDetails - 1);
    }
  };

  const handleDragEnd = result => {
    if (!result.destination || readonly) return;

    const reorderedRules = [...rules];
    const [movedRule] = reorderedRules.splice(result.source.index, 1);
    reorderedRules.splice(result.destination.index, 0, movedRule);

    setRules(reorderedRules);

    onUpdate({
      ...routingConfig,
      rules: reorderedRules,
    });

    // Update the showRuleDetails index if necessary
    if (showRuleDetails === result.source.index) {
      setShowRuleDetails(result.destination.index);
    } else if (
      (showRuleDetails > result.source.index &&
        showRuleDetails <= result.destination.index) ||
      (showRuleDetails < result.source.index &&
        showRuleDetails >= result.destination.index)
    ) {
      // Adjust the index if the rule we're showing details for has moved
      const offset = result.source.index < result.destination.index ? -1 : 1;
      setShowRuleDetails(showRuleDetails + offset);
    }
  };

  const testRoutingRules = () => {
    // Implementation of the pattern matching logic
    const matchRule = (prompt, rules) => {
      for (const rule of rules) {
        if (!rule.pattern) continue;
        try {
          const regex = new RegExp(rule.pattern, 'i');
          if (regex.test(prompt)) {
            return {
              matched: true,
              rule,
              provider: rule.provider,
              model:
                rule.model ||
                (providers[rule.provider]
                  ? providers[rule.provider].default_model
                  : 'unknown'),
            };
          }
        } catch (e) {
          console.error(`Invalid regex pattern: ${rule.pattern}`, e);
        }
      }

      // No match, use default provider
      const defaultProvider =
        routingConfig.default_provider ||
        Object.keys(providers).find(key => providers[key].enabled) ||
        '';
      return {
        matched: false,
        rule: null,
        provider: defaultProvider,
        model: providers[defaultProvider]
          ? providers[defaultProvider].default_model
          : 'unknown',
      };
    };

    const result = matchRule(testPrompt, rules);
    setTestResult(result);
  };

  return (
    <div className="routing-rules-editor">
      <h2>Content Routing Rules</h2>

      {readonly && (
        <Alert variant="warning">
          You are in read-only mode. Contact an administrator to make changes.
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="enable-content-routing"
                label="Enable Content-Based Routing"
                checked={routingConfig.enabled}
                onChange={e => handleToggleRouting(e.target.checked)}
                disabled={readonly}
              />
              <Form.Text className="text-muted">
                When enabled, prompts will be routed to different providers
                based on content patterns
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-between mb-3">
              <Button
                variant="outline-secondary"
                onClick={() => setShowTestModal(true)}
                disabled={!routingConfig.enabled}
              >
                Test Routing Rules
              </Button>

              <Button
                variant="primary"
                onClick={addNewRule}
                disabled={readonly || !routingConfig.enabled}
              >
                <PlusCircle className="me-1" /> Add Rule
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {routingConfig.enabled && (
        <div className="rules-list-container">
          <Card>
            <Card.Header>
              Routing Rules (Processed from top to bottom)
            </Card.Header>
            <Card.Body>
              {rules.length === 0 ? (
                <Alert variant="info">
                  No routing rules defined. The default provider will be used
                  for all prompts.
                </Alert>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="routing-rules">
                    {provided => (
                      <ListGroup
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="routing-rules-list"
                      >
                        {rules.map((rule, index) => (
                          <Draggable
                            key={`rule-${index}`}
                            draggableId={`rule-${index}`}
                            index={index}
                            isDragDisabled={readonly}
                          >
                            {provided => (
                              <ListGroup.Item
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`rule-item ${showRuleDetails === index ? 'expanded' : ''}`}
                              >
                                <div className="rule-item-header">
                                  <div className="d-flex align-items-center">
                                    {!readonly && (
                                      <div
                                        {...provided.dragHandleProps}
                                        className="drag-handle me-2"
                                      >
                                        <GripVertical />
                                      </div>
                                    )}
                                    <span className="rule-number">
                                      {index + 1}.
                                    </span>
                                    <span className="rule-description ms-2">
                                      {rule.description ||
                                        `Pattern: ${rule.pattern}`}
                                    </span>
                                  </div>
                                  <div className="rule-actions">
                                    <Button
                                      variant="link"
                                      className="details-toggle"
                                      onClick={() =>
                                        setShowRuleDetails(
                                          showRuleDetails === index
                                            ? null
                                            : index
                                        )
                                      }
                                    >
                                      {showRuleDetails === index
                                        ? 'Hide Details'
                                        : 'Show Details'}
                                    </Button>
                                    {!readonly && (
                                      <Button
                                        variant="link"
                                        className="text-danger"
                                        onClick={() => removeRule(index)}
                                      >
                                        <Trash />
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {showRuleDetails === index && (
                                  <div className="rule-details mt-3">
                                    <Form.Group className="mb-3">
                                      <Form.Label>Description</Form.Label>
                                      <Form.Control
                                        type="text"
                                        value={rule.description || ''}
                                        onChange={e =>
                                          handleRuleChange(
                                            index,
                                            'description',
                                            e.target.value
                                          )
                                        }
                                        placeholder="Rule description"
                                        disabled={readonly}
                                      />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                      <Form.Label>
                                        Pattern (Regex)
                                        <span
                                          className="ms-2 text-muted"
                                          title="Regular expression pattern to match against user prompts"
                                        >
                                          <QuestionCircle />
                                        </span>
                                      </Form.Label>
                                      <Form.Control
                                        type="text"
                                        value={rule.pattern || ''}
                                        onChange={e =>
                                          handleRuleChange(
                                            index,
                                            'pattern',
                                            e.target.value
                                          )
                                        }
                                        placeholder="e.g. code|programming|function"
                                        disabled={readonly}
                                      />
                                      <Form.Text className="text-muted">
                                        Regular expression patterns are
                                        case-insensitive
                                      </Form.Text>
                                    </Form.Group>

                                    <div className="row">
                                      <div className="col-md-6">
                                        <Form.Group className="mb-3">
                                          <Form.Label>Provider</Form.Label>
                                          <Form.Select
                                            value={rule.provider || ''}
                                            onChange={e =>
                                              handleRuleChange(
                                                index,
                                                'provider',
                                                e.target.value
                                              )
                                            }
                                            disabled={readonly}
                                          >
                                            <option value="">
                                              Select Provider
                                            </option>
                                            {Object.keys(providers)
                                              .filter(
                                                key => providers[key].enabled
                                              )
                                              .map(key => (
                                                <option key={key} value={key}>
                                                  {key.toUpperCase()}
                                                </option>
                                              ))}
                                          </Form.Select>
                                        </Form.Group>
                                      </div>
                                      <div className="col-md-6">
                                        <Form.Group className="mb-3">
                                          <Form.Label>
                                            Model (Optional)
                                          </Form.Label>
                                          <Form.Control
                                            type="text"
                                            value={rule.model || ''}
                                            onChange={e =>
                                              handleRuleChange(
                                                index,
                                                'model',
                                                e.target.value
                                              )
                                            }
                                            placeholder="Leave blank for default"
                                            disabled={
                                              readonly || !rule.provider
                                            }
                                          />
                                          <Form.Text className="text-muted">
                                            Default:{' '}
                                            {rule.provider &&
                                            providers[rule.provider]
                                              ? providers[rule.provider]
                                                  .default_model
                                              : 'N/A'}
                                          </Form.Text>
                                        </Form.Group>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </ListGroup.Item>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ListGroup>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Test Routing Modal */}
      <Modal
        show={showTestModal}
        onHide={() => setShowTestModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Test Routing Rules</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Enter a test prompt to see which provider and model would be
                used:
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                placeholder="e.g. Write a function to calculate Fibonacci numbers"
              />
            </Form.Group>

            <Button variant="primary" onClick={testRoutingRules}>
              Test Routing
            </Button>

            {testResult && (
              <div className="test-results mt-4">
                <Alert variant={testResult.matched ? 'success' : 'info'}>
                  <div className="d-flex align-items-start">
                    <div className="flex-grow-1">
                      <h5>Routing Result</h5>
                      <p>
                        <strong>Provider:</strong>{' '}
                        {testResult.provider.toUpperCase()}
                        <br />
                        <strong>Model:</strong> {testResult.model}
                        <br />
                        {testResult.matched ? (
                          <>
                            <strong>Matched Rule:</strong>{' '}
                            {testResult.rule.description ||
                              testResult.rule.pattern}
                            <br />
                            <strong>Pattern:</strong> {testResult.rule.pattern}
                          </>
                        ) : (
                          <em>
                            No matching rule found. Using default provider.
                          </em>
                        )}
                      </p>
                    </div>
                  </div>
                </Alert>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTestModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RoutingRulesEditor;
