/**
 * SlackService.js
 * Handles Slack integration for the gateway, including OAuth, Webhooks, and API
 */
const { WebClient } = require('@slack/web-api');
const { InstallProvider } = require('@slack/oauth');
const { createEventAdapter } = require('@slack/events-api');
const logger = require('winston');

class SlackService {
  constructor(config = {}) {
    this.config = {
              clientId: process.env.SLACK_CLIENT_ID,
              clientSecret: process.env.SLACK_CLIENT_SECRET,
              signingSecret: process.env.SLACK_SIGNING_SECRET,
              // Use environment variable for security, with warning fallback for development
              stateSecret: process.env.SLACK_STATE_SECRET || (console.warn('WARNING: SLACK_STATE_SECRET not set, using default value for development only'), 'dev-state-secret'),
              redirectUri: process.env.SLACK_REDIRECT_URI || 'https://integration-gateway-production-yutylytffa-uw.a.run.app/api/slack/oauth_redirect',
      scopes: ['incoming-webhook', 'chat:write', 'channels:read', 'channels:join'],
      ...config
    };

    // Initialize OAuth handler
    this.installer = new InstallProvider({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      stateSecret: this.config.stateSecret,
      installationStore: {
        storeInstallation: async (installation) => {
          // In production, you would store this in a database
          logger.info('Storing installation', { teamId: installation.team.id });
          return installation;
        },
        fetchInstallation: async (installQuery) => {
          // In production, you would fetch this from a database
          logger.info('Fetching installation', { teamId: installQuery.teamId });
          return null; // Would return the installation data in production
        },
      },
    });

    // Initialize events adapter if signingSecret is available
    if (this.config.signingSecret) {
      this.slackEvents = createEventAdapter(this.config.signingSecret);
    }

    // Initialize web client
    this.client = new WebClient();
  }

  /**
   * Initialize the Slack service with Express
   * @param {Object} app - Express app
   */
  initializeRoutes(app) {
    if (!app) {
      throw new Error('Express app is required to initialize Slack routes');
    }

    // OAuth routes
    app.get('/api/slack/install', (req, res) => {
      const url = this.installer.generateInstallUrl({
        scopes: this.config.scopes,
        redirectUri: this.config.redirectUri,
      });
      res.redirect(url);
    });

    app.get('/api/slack/oauth_redirect', async (req, res) => {
      try {
        const result = await this.installer.handleCallback(req, res);
        logger.info('Slack OAuth successful', { team: result.team.id });
        
        // Store webhook URL if provided
        if (result.incoming_webhook && result.incoming_webhook.url) {
          logger.info('Webhook URL received', { 
            channel: result.incoming_webhook.channel,
            webhookUrl: result.incoming_webhook.url
          });
        }
        
        res.send('Slack integration successfully installed!');
      } catch (error) {
        logger.error('Slack OAuth error', { error: error.message });
        res.status(500).send(`OAuth error: ${error.message}`);
      }
    });

    // Slack events endpoint
    if (this.slackEvents) {
      app.use('/api/slack/events', this.slackEvents.requestListener());
      
      this.slackEvents.on('message', (event) => {
        logger.info('Received a message event', { event });
      });
      
      this.slackEvents.on('error', (error) => {
        logger.error('Error from Slack events API', { error: error.message });
      });
    }

    // Webhook endpoint for receiving commands from other services
    app.post('/api/slack/webhook', async (req, res) => {
      try {
        const { channel, text, webhookUrl } = req.body;
        
        if (webhookUrl) {
          // Use incoming webhook URL
          await this.sendWebhookMessage(webhookUrl, text);
        } else if (channel && text) {
          // Use Web API
          const token = req.headers.authorization?.split(' ')[1];
          await this.sendMessage(channel, text, token);
        } else {
          throw new Error('Missing required parameters: channel, text, or webhookUrl');
        }
        
        res.status(200).json({ success: true });
      } catch (error) {
        logger.error('Error sending Slack message', { error: error.message });
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    logger.info('Slack routes initialized');
  }

  /**
   * Send a message to a Slack channel using the Web API
   * @param {string} channel - Channel to send to
   * @param {string} text - Text to send
   * @param {string} token - Slack token
   */
  async sendMessage(channel, text, token) {
    if (!token) {
      throw new Error('Slack token is required');
    }

    const client = new WebClient(token);
    const result = await client.chat.postMessage({
      channel,
      text,
    });

    logger.info('Message sent to Slack', { 
      channel, 
      messageTs: result.ts 
    });
    
    return result;
  }

  /**
   * Send a message using an incoming webhook URL
   * @param {string} webhookUrl - Webhook URL to use
   * @param {string} text - Text to send
   * @param {Object} blocks - Optional Block Kit blocks
   */
  async sendWebhookMessage(webhookUrl, text, blocks = null) {
    const axios = require('axios');

    const payload = { text };
    if (blocks) {
      payload.blocks = blocks;
    }

    const response = await axios.post(webhookUrl, payload);
    
    if (response.status !== 200) {
      throw new Error(`Failed to send webhook message: ${response.statusText}`);
    }
    
    logger.info('Webhook message sent to Slack');
    return response.data;
  }
}

module.exports = SlackService;
