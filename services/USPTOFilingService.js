const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class USPTOFilingService {
  constructor() {
    this.baseURL = 'https://developer.uspto.gov/api';
    this.patentCenterAPI = 'https://patentcenter.uspto.gov/pc-api';
    this.apiKey = process.env.USPTO_API_KEY;
    this.clientId = process.env.USPTO_CLIENT_ID;
    this.clientSecret = process.env.USPTO_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    console.log('🔐 Authenticating with USPTO...');
    
    try {
      const response = await axios.post(`${this.patentCenterAPI}/oauth/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'read write'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      console.log('✅ USPTO authentication successful');
      return true;

    } catch (error) {
      console.error('❌ USPTO authentication failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with USPTO');
    }
  }

  async ensureAuthenticated() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  async searchPriorArt(searchTerms, options = {}) {
    console.log(`🔍 Searching prior art for: ${searchTerms}`);
    
    try {
      const response = await axios.get(`${this.baseURL}/search/patent/v1/query`, {
        params: {
          q: searchTerms,
          rows: options.limit || 20,
          start: options.start || 0,
          fl: 'patentNumber,inventionTitle,filingDate,grantDate,assigneeEntityName,inventorName',
        },
        headers: {
          'X-API-KEY': this.apiKey
        }
      });

      const results = response.data.response?.docs || [];
      
      return {
        totalFound: response.data.response?.numFound || 0,
        results: results.map(patent => ({
          patentNumber: patent.patentNumber,
          title: patent.inventionTitle,
          filingDate: patent.filingDate,
          grantDate: patent.grantDate,
          assignee: patent.assigneeEntityName,
          inventors: patent.inventorName,
          relevanceScore: patent.score
        }))
      };

    } catch (error) {
      console.error('❌ Prior art search failed:', error.response?.data || error.message);
      throw new Error('Failed to search prior art');
    }
  }

  async validateInvention(inventionData) {
    console.log('✅ Validating invention for patentability...');
    
    const validation = {
      isValid: true,
      issues: [],
      recommendations: []
    };

    // Check required fields
    const requiredFields = ['title', 'description', 'claims', 'inventors'];
    for (const field of requiredFields) {
      if (!inventionData[field] || inventionData[field].trim().length === 0) {
        validation.isValid = false;
        validation.issues.push(`Missing required field: ${field}`);
      }
    }

    // Validate title length
    if (inventionData.title && inventionData.title.length > 500) {
      validation.issues.push('Title too long (max 500 characters)');
      validation.isValid = false;
    }

    // Check for prior art
    if (inventionData.title) {
      try {
        const priorArt = await this.searchPriorArt(inventionData.title, { limit: 5 });
        
        if (priorArt.totalFound > 0) {
          validation.recommendations.push({
            type: 'prior_art_found',
            message: `Found ${priorArt.totalFound} similar patents. Review for novelty.`,
            similarPatents: priorArt.results.slice(0, 3)
          });
        }
      } catch (error) {
        validation.recommendations.push({
          type: 'prior_art_search_failed',
          message: 'Could not complete prior art search. Manual review recommended.'
        });
      }
    }

    // Validate claims
    if (inventionData.claims) {
      const claimCount = Array.isArray(inventionData.claims) 
        ? inventionData.claims.length 
        : inventionData.claims.split('\n').filter(c => c.trim()).length;
      
      if (claimCount === 0) {
        validation.isValid = false;
        validation.issues.push('At least one claim is required');
      } else if (claimCount > 20) {
        validation.recommendations.push({
          type: 'claim_count_high',
          message: 'High number of claims may increase filing costs'
        });
      }
    }

    return validation;
  }

  async createApplication(applicationData) {
    await this.ensureAuthenticated();
    
    console.log('📝 Creating patent application...');
    
    try {
      // Validate the application first
      const validation = await this.validateInvention(applicationData);
      
      if (!validation.isValid) {
        throw new Error(`Application validation failed: ${validation.issues.join(', ')}`);
      }

      // Prepare application payload
      const applicationPayload = {
        applicationType: applicationData.applicationType || 'utility',
        title: applicationData.title,
        description: applicationData.description,
        claims: Array.isArray(applicationData.claims) 
          ? applicationData.claims 
          : applicationData.claims.split('\n').filter(c => c.trim()),
        inventors: applicationData.inventors.map(inventor => ({
          firstName: inventor.firstName,
          lastName: inventor.lastName,
          address: inventor.address,
          citizenship: inventor.citizenship || 'US'
        })),
        applicants: applicationData.applicants || applicationData.inventors,
        attorney: applicationData.attorney,
        priority: applicationData.priority || {},
        entityStatus: applicationData.entityStatus || 'small', // small, large, micro
        submissionDate: new Date().toISOString()
      };

      // Create the application
      const response = await axios.post(`${this.patentCenterAPI}/applications`, applicationPayload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const applicationNumber = response.data.applicationNumber;
      
      console.log(`✅ Patent application created: ${applicationNumber}`);
      
      return {
        success: true,
        applicationNumber,
        confirmationNumber: response.data.confirmationNumber,
        filingDate: response.data.filingDate,
        status: 'filed',
        validation,
        estimatedCosts: this.calculateFees(applicationData),
        nextSteps: [
          'Application has been filed with USPTO',
          'Filing receipt will be mailed within 2 weeks',
          'Examination typically begins in 12-18 months',
          'Monitor application status via Patent Center'
        ]
      };

    } catch (error) {
      console.error('❌ Application creation failed:', error.response?.data || error.message);
      throw new Error(`Failed to create patent application: ${error.message}`);
    }
  }

  async getApplicationStatus(applicationNumber) {
    await this.ensureAuthenticated();
    
    console.log(`📊 Checking status for application: ${applicationNumber}`);
    
    try {
      const response = await axios.get(`${this.patentCenterAPI}/applications/${applicationNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      const application = response.data;
      
      return {
        applicationNumber: application.applicationNumber,
        status: application.status,
        filingDate: application.filingDate,
        title: application.title,
        publicationDate: application.publicationDate,
        grantDate: application.grantDate,
        patentNumber: application.patentNumber,
        currentLocation: application.currentLocation,
        examiner: application.examiner,
        attorneys: application.attorneys,
        timeline: application.prosecutionHistory || [],
        nextAction: application.nextAction,
        fees: {
          paid: application.feesPaid || 0,
          due: application.feesDue || 0,
          nextDueDate: application.nextFeeDate
        }
      };

    } catch (error) {
      console.error('❌ Status check failed:', error.response?.data || error.message);
      throw new Error(`Failed to get application status: ${error.message}`);
    }
  }

  calculateFees(applicationData) {
    // USPTO fee structure (2024 rates)
    const fees = {
      filing: 0,
      search: 0,
      examination: 0,
      total: 0
    };

    const entityStatus = applicationData.entityStatus || 'small';
    const claimCount = Array.isArray(applicationData.claims) 
      ? applicationData.claims.length 
      : applicationData.claims.split('\n').filter(c => c.trim()).length;

    // Base fees by entity size
    const feeSchedule = {
      micro: { filing: 320, search: 160, examination: 160 },
      small: { filing: 800, search: 400, examination: 400 },
      large: { filing: 1600, search: 800, examination: 800 }
    };

    const baseFees = feeSchedule[entityStatus] || feeSchedule.small;
    
    fees.filing = baseFees.filing;
    fees.search = baseFees.search;
    fees.examination = baseFees.examination;

    // Additional claim fees
    if (claimCount > 20) {
      const extraClaims = claimCount - 20;
      const claimFee = entityStatus === 'micro' ? 20 : entityStatus === 'small' ? 50 : 100;
      fees.filing += extraClaims * claimFee;
    }

    fees.total = fees.filing + fees.search + fees.examination;

    return fees;
  }

  async submitResponse(applicationNumber, responseData) {
    await this.ensureAuthenticated();
    
    console.log(`📤 Submitting response for application: ${applicationNumber}`);
    
    try {
      const response = await axios.post(
        `${this.patentCenterAPI}/applications/${applicationNumber}/responses`,
        responseData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        submissionId: response.data.submissionId,
        status: 'submitted',
        message: 'Response successfully submitted to USPTO'
      };

    } catch (error) {
      console.error('❌ Response submission failed:', error.response?.data || error.message);
      throw new Error(`Failed to submit response: ${error.message}`);
    }
  }

  async uploadDocument(applicationNumber, documentData, documentBuffer) {
    await this.ensureAuthenticated();
    
    console.log(`📎 Uploading document for application: ${applicationNumber}`);
    
    try {
      const formData = new FormData();
      formData.append('file', documentBuffer, documentData.filename);
      formData.append('documentType', documentData.type);
      formData.append('description', documentData.description);

      const response = await axios.post(
        `${this.patentCenterAPI}/applications/${applicationNumber}/documents`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            ...formData.getHeaders()
          }
        }
      );

      return {
        success: true,
        documentId: response.data.documentId,
        status: 'uploaded'
      };

    } catch (error) {
      console.error('❌ Document upload failed:', error.response?.data || error.message);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  // Helper method to generate patent application template
  generateApplicationTemplate(inventionDetails) {
    return {
      title: inventionDetails.title || '',
      applicationType: 'utility',
      description: {
        background: inventionDetails.background || '',
        summary: inventionDetails.summary || '',
        detailedDescription: inventionDetails.detailedDescription || '',
        drawings: inventionDetails.drawings || []
      },
      claims: inventionDetails.claims || [
        'What is claimed is:'
      ],
      inventors: inventionDetails.inventors || [{
        firstName: '',
        lastName: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: 'US',
          postalCode: ''
        },
        citizenship: 'US'
      }],
      entityStatus: inventionDetails.entityStatus || 'small',
      attorney: inventionDetails.attorney || null
    };
  }
}

module.exports = USPTOFilingService;
