const express = require('express');
const multer = require('multer');
const USPTOFilingService = require('../services/USPTOFilingService');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const usptoService = new USPTOFilingService();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common patent document formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/xml',
      'application/xml'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and XML files are allowed.'));
    }
  }
});

// Use existing OAuth2 authentication middleware
const { cloudflareAuthentication } = require('../middleware/cloudflare-auth');
router.use(cloudflareAuthentication);

// POST /api/filing/validate - Validate invention before filing
router.post('/validate', async (req, res) => {
  try {
    const inventionData = req.body;
    
    if (!inventionData.title || !inventionData.description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title and description are required for validation'
      });
    }

    const validation = await usptoService.validateInvention(inventionData);
    
    res.json({
      success: true,
      validation,
      estimatedCosts: usptoService.calculateFees(inventionData)
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
});

// POST /api/filing/prior-art - Search for prior art
router.post('/prior-art', async (req, res) => {
  try {
    const { searchTerms, limit = 20, start = 0 } = req.body;
    
    if (!searchTerms) {
      return res.status(400).json({
        error: 'Search terms required',
        message: 'Please provide search terms for prior art search'
      });
    }

    const results = await usptoService.searchPriorArt(searchTerms, { limit, start });
    
    res.json({
      success: true,
      searchTerms,
      ...results
    });

  } catch (error) {
    console.error('Prior art search error:', error);
    res.status(500).json({
      error: 'Prior art search failed',
      message: error.message
    });
  }
});

// POST /api/filing/create - Create new patent application
router.post('/create', async (req, res) => {
  try {
    const applicationData = req.body;
    
    // Add user information to application
    applicationData.submittedBy = req.user.id;
    applicationData.submissionDate = new Date().toISOString();
    
    const result = await usptoService.createApplication(applicationData);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({
      error: 'Application creation failed',
      message: error.message
    });
  }
});

// GET /api/filing/status/:applicationNumber - Check application status
router.get('/status/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    const status = await usptoService.getApplicationStatus(applicationNumber);
    
    res.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

// POST /api/filing/response/:applicationNumber - Submit response to office action
router.post('/response/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    const responseData = req.body;
    
    responseData.submittedBy = req.user.id;
    responseData.submissionDate = new Date().toISOString();
    
    const result = await usptoService.submitResponse(applicationNumber, responseData);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Response submission error:', error);
    res.status(500).json({
      error: 'Response submission failed',
      message: error.message
    });
  }
});

// POST /api/filing/upload/:applicationNumber - Upload documents
router.post('/upload/:applicationNumber', upload.single('document'), async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const documentData = {
      filename: req.file.originalname,
      type: req.body.documentType || 'supporting_document',
      description: req.body.description || 'Supporting document'
    };

    const documentBuffer = fs.readFileSync(req.file.path);
    
    const result = await usptoService.uploadDocument(applicationNumber, documentData, documentBuffer);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Document upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Document upload failed',
      message: error.message
    });
  }
});

// GET /api/filing/template - Generate application template
router.get('/template', (req, res) => {
  try {
    const { type = 'utility' } = req.query;
    
    const template = usptoService.generateApplicationTemplate({
      applicationType: type
    });
    
    res.json({
      success: true,
      template,
      instructions: {
        title: 'Provide a concise, descriptive title (max 500 characters)',
        description: {
          background: 'Describe the field of invention and prior art',
          summary: 'Provide a brief summary of the invention',
          detailedDescription: 'Detailed description of the invention with examples'
        },
        claims: 'List what you claim as your invention (at least 1 claim required)',
        inventors: 'List all inventors with complete address information',
        entityStatus: 'Choose: micro, small, or large (affects fees)',
        sequenceListing: 'Required if invention involves nucleotide or amino acid sequences'
      }
    });

  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({
      error: 'Template generation failed',
      message: error.message
    });
  }
});

// POST /api/filing/sequence/validate - Validate sequence listing files
router.post('/sequence/validate', upload.single('sequenceFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No sequence file uploaded',
        message: 'Please upload a sequence listing file'
      });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const validation = await validateSequenceListing(fileContent, req.file.originalname);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      validation,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      recommendations: [
        'Ensure sequence listing complies with WIPO Standard ST.26',
        'Use WIPO Sequence Suite for ST.26 compliance',
        'PatentIn 3.5.1 can be used for ST.25 legacy format',
        'Contact SequenceHelpDesk@USPTO.GOV for assistance'
      ]
    });

  } catch (error) {
    console.error('Sequence validation error:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      error: 'Sequence validation failed',
      message: error.message
    });
  }
});

// GET /api/filing/sequence/tools - Get sequence listing tools information
router.get('/sequence/tools', (req, res) => {
  res.json({
    success: true,
    tools: {
      wipoSequenceSuite: {
        name: 'WIPO Sequence Suite',
        purpose: 'Create and validate ST.26 compliant sequence listings',
        downloadUrl: 'https://www.wipo.int/standards/en/sequence/index.html',
        standard: 'WIPO Standard ST.26',
        status: 'Current - Required for new filings'
      },
      patentIn: {
        name: 'PatentIn 3.5.1',
        purpose: 'Create ST.25 compliant sequence listings (legacy)',
        downloadUrl: '/api/filing/sequence/patentin-download',
        standard: 'WIPO Standard ST.25',
        status: 'Legacy - Available indefinitely but not updated',
        fileSize: '6.5 MB'
      }
    },
    requirements: {
      st26: 'Required for applications filed after July 1, 2022',
      st25: 'Accepted but deprecated - use only if necessary'
    },
    support: {
      email: 'SequenceHelpDesk@USPTO.GOV',
      description: 'Contact for sequence listing questions and technical support'
    }
  });
});

// GET /api/filing/fees - Get current USPTO fee schedule
router.get('/fees', (req, res) => {
  const { entityStatus = 'small', claimCount = 1, applicationCount = 1 } = req.query;
  
  const fees = usptoService.calculateFees({
    entityStatus,
    claims: Array(parseInt(claimCount)).fill('sample claim')
  });
  
  const feeSchedule = {
    micro: {
      description: 'Micro entity (qualifying small businesses, universities, inventors)',
      requirements: 'Must qualify under 37 CFR 1.29',
      discount: '75% reduction from large entity fees'
    },
    small: {
      description: 'Small entity (businesses with <500 employees)',
      requirements: 'Must qualify under 37 CFR 1.27', 
      discount: '50% reduction from large entity fees'
    },
    large: {
      description: 'Large entity (all others)',
      requirements: 'Default classification',
      discount: 'No discount - standard rates'
    }
  };
  
  res.json({
    success: true,
    entityStatus,
    fees,
    feeSchedule: feeSchedule[entityStatus],
    additionalFees: {
      excessClaims: `$${entityStatus === 'micro' ? 20 : entityStatus === 'small' ? 50 : 100} per claim over 20`,
      applicationSizeOver100Pages: `$${entityStatus === 'micro' ? 80 : entityStatus === 'small' ? 200 : 400} per 50 pages`,
      priorityClaim: `$${entityStatus === 'micro' ? 80 : entityStatus === 'small' ? 200 : 400} per claim`
    },
    paymentMethods: [
      'Credit card (online)',
      'EFT (Electronic Funds Transfer)',
      'Check or money order',
      'USPTO deposit account'
    ],
    lastUpdated: '2024'
  });
});

// Helper function to validate sequence listings
async function validateSequenceListing(fileContent, fileName) {
  const validation = {
    isValid: true,
    format: 'unknown',
    issues: [],
    warnings: [],
    sequenceCount: 0
  };

  try {
    // Detect format
    if (fileName.includes('_ST25.txt') || fileContent.includes('<210>')) {
      validation.format = 'ST.25';
      validation.warnings.push('ST.25 format detected. Consider upgrading to ST.26 using WIPO Sequence Suite.');
    } else if (fileContent.includes('<?xml') && fileContent.includes('ST26SequenceListing')) {
      validation.format = 'ST.26';
    } else {
      validation.isValid = false;
      validation.issues.push('Unrecognized sequence listing format');
    }

    // Count sequences
    if (validation.format === 'ST.25') {
      const sequenceMatches = fileContent.match(/<210>/g);
      validation.sequenceCount = sequenceMatches ? sequenceMatches.length : 0;
    } else if (validation.format === 'ST.26') {
      const sequenceMatches = fileContent.match(/<INSDSeq>/g);
      validation.sequenceCount = sequenceMatches ? sequenceMatches.length : 0;
    }

    // Basic validation checks
    if (validation.sequenceCount === 0) {
      validation.isValid = false;
      validation.issues.push('No sequences found in file');
    }

    // File size check
    const fileSizeKB = Buffer.byteLength(fileContent, 'utf8') / 1024;
    if (fileSizeKB > 10240) { // 10MB
      validation.warnings.push('Large file size may cause processing delays');
    }

  } catch (error) {
    validation.isValid = false;
    validation.issues.push(`Validation error: ${error.message}`);
  }

  return validation;
}

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    services: {
      uspto: 'connected',
      sequenceValidation: 'available',
      fileUpload: 'available'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
