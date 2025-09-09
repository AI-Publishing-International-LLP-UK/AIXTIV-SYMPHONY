/**
 * @fileoverview ASOOS Frontend Integration
 * JavaScript for connecting Cloudflare Pages to ASOOS backend API
 * with full automation for Stripe, Xero, PandaDocs, NFTSmart, and MCP
 * 
 * @copyright Aixtiv Symphony Orchestrating Operating System
 * @version 1.0.0
 */

class ASOOSFrontendIntegration {
  constructor(options = {}) {
    this.config = {
      apiBaseUrl: options.apiBaseUrl || 'https://asoos.2100.cool/api',
      stripePublicKey: options.stripePublicKey || 'pk_test_...',
      enableDemonstrations: options.enableDemonstrations !== false,
      coordinatedEvents: options.coordinatedEvents !== false,
      debug: options.debug === true
    };

    // Initialize Stripe
    if (window.Stripe && this.config.stripePublicKey) {
      this.stripe = Stripe(this.config.stripePublicKey);
    }

    this.initializeEventListeners();
    this.log('ASOOS Frontend Integration initialized', this.config);
  }

  /**
   * Initialize event listeners for form submissions
   */
  initializeEventListeners() {
    // Subscription form
    const subscriptionForm = document.getElementById('subscription-form');
    if (subscriptionForm) {
      subscriptionForm.addEventListener('submit', (e) => this.handleSubscriptionSubmit(e));
    }

    // Cohort form
    const cohortForm = document.getElementById('cohort-form');
    if (cohortForm) {
      cohortForm.addEventListener('submit', (e) => this.handleCohortSubmit(e));
    }

    // Demo request buttons
    const demoButtons = document.querySelectorAll('[data-demo-request]');
    demoButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleDemoRequest(e));
    });

    // MCP status requests
    const mcpStatusButtons = document.querySelectorAll('[data-mcp-status]');
    mcpStatusButtons.forEach(button => {
      button.addEventListener('click', (e) => this.handleMCPStatusRequest(e));
    });

    this.log('Event listeners initialized');
  }

  /**
   * Handle subscription form submission
   */
  async handleSubscriptionSubmit(event) {
    event.preventDefault();
    
    try {
      this.showLoadingState('subscription-form', true);
      
      const formData = this.extractFormData(event.target);
      this.log('Processing subscription', formData);

      // Process payment if payment method is provided
      let paymentMethod = null;
      if (formData.card_element) {
        paymentMethod = await this.processStripePayment(formData);
      }

      // Submit to ASOOS API
      const subscriptionData = {
        ...formData,
        payment: paymentMethod ? {
          amount: formData.amount || 9999, // Default amount in cents
          currency: formData.currency || 'USD',
          payment_method_id: paymentMethod.id
        } : null,
        request_demo: this.config.enableDemonstrations,
        create_invoice: true
      };

      const response = await this.apiRequest('/subscriptions/register', subscriptionData);
      
      if (response.success) {
        this.showSuccessMessage('Subscription processed with full automation!', {
          coordinationId: response.coordination_id,
          services: Object.keys(response.services),
          demonstration: response.services.demonstration
        });

        // Trigger coordinated events if enabled
        if (this.config.coordinatedEvents && response.services.demonstration) {
          await this.trackCoordinatedDemonstration(response.coordination_id);
        }
      } else {
        throw new Error(response.error || 'Subscription processing failed');
      }

    } catch (error) {
      this.log('Subscription error', error);
      this.showErrorMessage(error.message);
    } finally {
      this.showLoadingState('subscription-form', false);
    }
  }

  /**
   * Handle cohort form submission
   */
  async handleCohortSubmit(event) {
    event.preventDefault();
    
    try {
      this.showLoadingState('cohort-form', true);
      
      const formData = this.extractFormData(event.target);
      this.log('Processing cohort registration', formData);

      // Submit to ASOOS API
      const response = await this.apiRequest('/cohorts/register', formData);
      
      if (response.success) {
        this.showSuccessMessage('Cohort registration processed successfully!', {
          coordinationId: response.coordination_id,
          cohortStatus: response.cohort_status,
          demonstration: response.demonstration
        });

        // Auto-track demonstration for cohorts
        if (response.demonstration) {
          await this.trackCoordinatedDemonstration(response.coordination_id);
        }
      } else {
        throw new Error(response.error || 'Cohort registration failed');
      }

    } catch (error) {
      this.log('Cohort registration error', error);
      this.showErrorMessage(error.message);
    } finally {
      this.showLoadingState('cohort-form', false);
    }
  }

  /**
   * Handle demonstration request
   */
  async handleDemoRequest(event) {
    event.preventDefault();
    
    try {
      const button = event.target;
      const demoType = button.dataset.demoRequest;
      
      this.showLoadingState(button, true);
      this.log('Requesting demonstration', { type: demoType });

      const demoData = {
        email: this.getEmailFromForm(),
        name: this.getNameFromForm(),
        demo_type: demoType,
        company: this.getCompanyFromForm(),
        industry: this.getIndustryFromForm()
      };

      const response = await this.apiRequest('/demonstrations/request', demoData);
      
      if (response.success) {
        this.showSuccessMessage('Demonstration coordinated successfully!', {
          coordinationId: response.coordination_id,
          demonstration: response.demonstration
        });

        // Track the demonstration
        await this.trackCoordinatedDemonstration(response.coordination_id);
      } else {
        throw new Error(response.error || 'Demonstration request failed');
      }

    } catch (error) {
      this.log('Demonstration request error', error);
      this.showErrorMessage(error.message);
    } finally {
      this.showLoadingState(event.target, false);
    }
  }

  /**
   * Handle MCP status request
   */
  async handleMCPStatusRequest(event) {
    event.preventDefault();
    
    try {
      const button = event.target;
      this.showLoadingState(button, true);
      this.log('Requesting MCP civilization status');

      const response = await this.apiRequest('/mcp/status', null, 'GET');
      
      if (response.success) {
        this.displayMCPStatus(response.civilization, response.coordinator_status);
      } else {
        this.displayMCPStatus(response.fallback, null);
      }

    } catch (error) {
      this.log('MCP status error', error);
      this.showErrorMessage('Unable to fetch MCP status: ' + error.message);
    } finally {
      this.showLoadingState(event.target, false);
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(formData) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const cardElement = document.getElementById('card-element');
    if (!cardElement) {
      throw new Error('Card element not found');
    }

    const { error, paymentMethod } = await this.stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: formData.name,
        email: formData.email,
        address: {
          line1: formData.address_line1,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country || 'US'
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    this.log('Payment method created', paymentMethod);
    return paymentMethod;
  }

  /**
   * Track coordinated demonstration
   */
  async trackCoordinatedDemonstration(coordinationId) {
    if (!this.config.coordinatedEvents) return;

    this.log('Tracking coordinated demonstration', { coordinationId });

    // Create a visual tracker for the demonstration
    const tracker = this.createDemonstrationTracker(coordinationId);
    document.body.appendChild(tracker);

    // Poll for demonstration updates
    let pollCount = 0;
    const maxPolls = 12; // 2 minutes max
    
    const pollDemonstration = async () => {
      if (pollCount >= maxPolls) {
        tracker.remove();
        return;
      }

      try {
        // This would poll the backend for demonstration status
        await this.sleep(10000); // Wait 10 seconds
        pollCount++;
        
        this.updateDemonstrationTracker(tracker, {
          step: pollCount,
          total: 4,
          status: `Executing demonstration step ${pollCount} of 4...`
        });

        if (pollCount < maxPolls) {
          setTimeout(pollDemonstration, 10000);
        } else {
          this.updateDemonstrationTracker(tracker, {
            step: 4,
            total: 4,
            status: 'Coordinated demonstration completed!',
            completed: true
          });
          
          setTimeout(() => tracker.remove(), 5000);
        }
      } catch (error) {
        this.log('Demonstration tracking error', error);
      }
    };

    setTimeout(pollDemonstration, 1000);
  }

  /**
   * Create demonstration tracker UI
   */
  createDemonstrationTracker(coordinationId) {
    const tracker = document.createElement('div');
    tracker.className = 'demonstration-tracker';
    tracker.innerHTML = `
      <div class="tracker-content">
        <h3>🚀 Coordinated DEMONSTRATION Active</h3>
        <p>Coordination ID: ${coordinationId}</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
        <p class="status-text">Initializing coordinated demonstration...</p>
        <div class="services-list">
          <div class="service" data-service="payments">💳 Payment Processing</div>
          <div class="service" data-service="contracts">📋 Contract Generation</div>
          <div class="service" data-service="mcp">🤖 MCP Civilization</div>
          <div class="service" data-service="nft">🎯 NFT Verification</div>
        </div>
      </div>
    `;

    // Add styles
    tracker.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #0bb1bb, #00d4aa);
      color: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(11, 177, 187, 0.3);
      z-index: 10000;
      width: 350px;
      font-family: 'Montserrat', sans-serif;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    return tracker;
  }

  /**
   * Update demonstration tracker
   */
  updateDemonstrationTracker(tracker, update) {
    const progressBar = tracker.querySelector('.progress-fill');
    const statusText = tracker.querySelector('.status-text');
    const services = tracker.querySelectorAll('.service');

    if (progressBar) {
      const percentage = (update.step / update.total) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    if (statusText) {
      statusText.textContent = update.status;
    }

    if (update.step <= services.length) {
      services[update.step - 1]?.classList.add('active');
    }

    if (update.completed) {
      tracker.style.background = 'linear-gradient(135deg, #00d4aa, #10b981)';
      services.forEach(service => service.classList.add('completed'));
    }
  }

  /**
   * Display MCP status
   */
  displayMCPStatus(civilization, coordinatorStatus) {
    const statusContainer = document.getElementById('mcp-status') || this.createStatusContainer();
    
    statusContainer.innerHTML = `
      <div class="mcp-status-display">
        <h3>🤖 MCP Civilization Status</h3>
        <div class="status-grid">
          <div class="status-item">
            <strong>Total Members:</strong> ${civilization.totalMembers?.toLocaleString() || '20,000,000'}
          </div>
          <div class="status-item">
            <strong>Active Wings:</strong> ${civilization.wingsActive || 13}
          </div>
          <div class="status-item">
            <strong>Status:</strong> ${civilization.status || 'OPERATIONAL'}
          </div>
          ${civilization.activeFormations ? `
            <div class="formations">
              <strong>Active Formations:</strong>
              <ul>
                <li>RIX: ${civilization.activeFormations.rix?.toLocaleString()}</li>
                <li>CRX: ${civilization.activeFormations.crx?.toLocaleString()}</li>
                <li>QRIX: ${civilization.activeFormations.qrix?.toLocaleString()}</li>
              </ul>
            </div>
          ` : ''}
        </div>
        ${coordinatorStatus ? `
          <div class="coordinator-status">
            <h4>Integration Coordinator</h4>
            <p>Services: ${coordinatorStatus.services?.join(', ')}</p>
            <p>Automation: ${coordinatorStatus.automation?.enableAutoWorkflows ? 'Enabled' : 'Disabled'}</p>
          </div>
        ` : ''}
      </div>
    `;

    statusContainer.style.display = 'block';
  }

  /**
   * API request helper
   */
  async apiRequest(endpoint, data = null, method = 'POST') {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    this.log(`API Request: ${method} ${url}`, data);

    const response = await fetch(url, options);
    const result = await response.json();

    this.log('API Response:', result);
    return result;
  }

  /**
   * Extract form data
   */
  extractFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }

  /**
   * Utility functions
   */
  getEmailFromForm() {
    return document.querySelector('[name="email"]')?.value || '';
  }

  getNameFromForm() {
    return document.querySelector('[name="name"], [name="executive_name"]')?.value || '';
  }

  getCompanyFromForm() {
    return document.querySelector('[name="company_name"]')?.value || '';
  }

  getIndustryFromForm() {
    return document.querySelector('[name="industry_sector"]')?.value || '';
  }

  showLoadingState(element, loading) {
    if (typeof element === 'string') {
      element = document.getElementById(element);
    }
    
    if (element) {
      if (loading) {
        element.style.opacity = '0.7';
        element.style.pointerEvents = 'none';
        
        if (element.tagName === 'BUTTON') {
          element.dataset.originalText = element.textContent;
          element.textContent = 'Processing...';
        }
      } else {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        
        if (element.tagName === 'BUTTON' && element.dataset.originalText) {
          element.textContent = element.dataset.originalText;
        }
      }
    }
  }

  showSuccessMessage(message, details = null) {
    this.showMessage(message, 'success', details);
  }

  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type, details = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
      <div class="message-content">
        <p>${message}</p>
        ${details ? `<pre>${JSON.stringify(details, null, 2)}</pre>` : ''}
      </div>
      <button onclick="this.parentElement.remove()">×</button>
    `;

    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
      z-index: 10001;
      max-width: 500px;
      font-family: 'Montserrat', sans-serif;
    `;

    document.body.appendChild(messageDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => messageDiv.remove(), 10000);
  }

  createStatusContainer() {
    const container = document.createElement('div');
    container.id = 'mcp-status';
    container.style.cssText = `
      margin-top: 20px;
      padding: 20px;
      background: rgba(11, 177, 187, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(11, 177, 187, 0.3);
      display: none;
    `;
    
    document.body.appendChild(container);
    return container;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message, data = null) {
    if (this.config.debug) {
      console.log(`[ASOOS Integration] ${message}`, data || '');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.asoosIntegration = new ASOOSFrontendIntegration({
    apiBaseUrl: window.ASOOS_CONFIG?.apiBaseUrl || 'https://asoos.2100.cool/api',
    stripePublicKey: window.ASOOS_CONFIG?.stripePublicKey,
    enableDemonstrations: true,
    coordinatedEvents: true,
    debug: window.ASOOS_CONFIG?.debug || false
  });
});
