const Web3 = require('web3');
const { ethers } = require('ethers');
const crypto = require('crypto');

class AIPITowerPatentChain {
  constructor() {
    this.web3 = new Web3(process.env.AIPI_TOWER_RPC_URL || 'https://aipi-tower.blockchain.2100.cool');
    this.contractAddress = process.env.AIPI_PATENT_CONTRACT || '0x2100PatentEvidence...';
    this.privateKey = process.env.AIPI_TOWER_PRIVATE_KEY;
    this.account = null;
    this.patentContract = null;
    
    // NFT Configuration
    this.nftConfig = {
      name: 'AIPI Patent Evidence NFT',
      symbol: 'APNT',
      baseURI: 'https://nft.aipi.2100.cool/patent/',
      chainId: 2100 // AIPI Tower Chain ID
    };
    
    this.initializeBlockchain();
    console.log('🔗 AIPI Tower Patent Chain initialized');
  }

  async initializeBlockchain() {
    try {
      if (this.privateKey) {
        this.account = this.web3.eth.accounts.privateKeyToAccount(this.privateKey);
        this.web3.eth.accounts.wallet.add(this.account);
        this.web3.eth.defaultAccount = this.account.address;
        
        console.log(`🔑 AIPI Tower account: ${this.account.address}`);
      }
      
      // Load Patent Evidence Contract ABI
      this.patentContract = new this.web3.eth.Contract(
        this.getPatentContractABI(),
        this.contractAddress
      );
      
      console.log('✅ AIPI Tower blockchain connection established');
      
    } catch (error) {
      console.error('❌ AIPI Tower blockchain initialization failed:', error);
    }
  }

  // Patent Filing Evidence on Blockchain
  async createPatentFilingEvidence(patentData) {
    console.log(`📝 Creating blockchain evidence for patent: ${patentData.applicationNumber}`);
    
    try {
      const evidence = {
        applicationNumber: patentData.applicationNumber,
        title: patentData.title,
        inventors: patentData.inventors,
        filingDate: patentData.filingDate || new Date().toISOString(),
        
        // Evidence Hash
        contentHash: this.generateContentHash(patentData),
        priorArtHash: this.generatePriorArtHash(patentData.priorArt),
        
        // Metadata
        company: patentData.company,
        drBurbyAnalysisId: patentData.drBurbyAnalysisId,
        vlsSystemId: patentData.vlsSystemId,
        
        // Timestamps
        createdAt: Date.now(),
        blockchainTimestamp: Math.floor(Date.now() / 1000)
      };

      // Store on AIPI Tower Blockchain
      const txHash = await this.storePatentEvidence(evidence);
      
      // Mint Evidence NFT
      const nftTokenId = await this.mintPatentEvidenceNFT(evidence, txHash);
      
      return {
        success: true,
        transactionHash: txHash,
        nftTokenId,
        evidenceId: evidence.contentHash,
        blockchainProof: {
          chain: 'AIPI-Tower',
          contract: this.contractAddress,
          tokenId: nftTokenId,
          ipfsHash: await this.uploadToIPFS(evidence)
        }
      };
      
    } catch (error) {
      console.error('❌ Patent evidence creation failed:', error);
      throw error;
    }
  }

  async storePatentEvidence(evidence) {
    const gasPrice = await this.web3.eth.getGasPrice();
    const gasLimit = 500000;

    const transaction = this.patentContract.methods.storePatentEvidence(
      evidence.applicationNumber,
      evidence.contentHash,
      evidence.priorArtHash,
      JSON.stringify({
        title: evidence.title,
        inventors: evidence.inventors,
        company: evidence.company,
        filingDate: evidence.filingDate
      })
    );

    const tx = {
      from: this.account.address,
      to: this.contractAddress,
      data: transaction.encodeABI(),
      gas: gasLimit,
      gasPrice: gasPrice
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log(`🔗 Patent evidence stored on blockchain: ${receipt.transactionHash}`);
    return receipt.transactionHash;
  }

  async mintPatentEvidenceNFT(evidence, txHash) {
    console.log('🎨 Minting Patent Evidence NFT...');
    
    const metadata = {
      name: `Patent Evidence: ${evidence.title}`,
      description: `Immutable evidence of patent filing for application ${evidence.applicationNumber}`,
      image: `https://nft.aipi.2100.cool/patent/${evidence.applicationNumber}/image`,
      attributes: [
        { trait_type: 'Application Number', value: evidence.applicationNumber },
        { trait_type: 'Filing Date', value: evidence.filingDate },
        { trait_type: 'Company', value: evidence.company },
        { trait_type: 'VLS System', value: 'DUPS & CUPS' },
        { trait_type: 'Dr. Burby Analysis', value: evidence.drBurbyAnalysisId },
        { trait_type: 'Blockchain TX', value: txHash },
        { trait_type: 'Content Hash', value: evidence.contentHash }
      ],
      external_url: `https://patent.2100.cool/evidence/${evidence.applicationNumber}`,
      animation_url: `https://nft.aipi.2100.cool/patent/${evidence.applicationNumber}/animation`
    };

    // Upload metadata to IPFS
    const metadataHash = await this.uploadToIPFS(metadata);
    
    // Mint NFT
    const mintTx = this.patentContract.methods.mintPatentNFT(
      evidence.applicationNumber,
      metadataHash
    );

    const tx = {
      from: this.account.address,
      to: this.contractAddress,
      data: mintTx.encodeABI(),
      gas: 300000,
      gasPrice: await this.web3.eth.getGasPrice()
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    // Extract token ID from events
    const tokenId = this.extractTokenIdFromReceipt(receipt);
    
    console.log(`🎨 Patent Evidence NFT minted: Token ID ${tokenId}`);
    return tokenId;
  }

  // Xero Integration for Smart Contracts & Billing
  async createXeroSmartContract(patentData, billingTerms) {
    console.log(`💰 Creating Xero smart contract for ${patentData.company}`);
    
    const smartContract = {
      patentApplicationNumber: patentData.applicationNumber,
      company: patentData.company,
      
      // Billing Terms
      billingModel: billingTerms.model || 'subscription', // subscription, per-filing, success-based
      monthlyFee: billingTerms.monthlyFee || 7500, // DUPS & CUPS Professional
      filingFee: billingTerms.filingFee || 2500,
      successFee: billingTerms.successFee || 0.15, // 15% of patent value on grant
      
      // Payment Terms
      paymentSchedule: billingTerms.schedule || 'monthly',
      autoRenewal: true,
      currency: 'USD',
      
      // Services Included
      services: {
        dupsAccess: true,
        cupsUpdates: true,
        drBurbyAnalyses: billingTerms.drBurbyCount || 10,
        patentSearchQuota: billingTerms.searchQuota || 10000,
        filingAssistance: true,
        prioritySupport: billingTerms.plan === 'enterprise'
      },
      
      // Smart Contract Logic
      autoPayment: {
        enabled: true,
        xeroConnectionId: await this.getXeroConnectionId(patentData.company),
        paymentMethod: 'auto_debit',
        invoiceTemplate: 'patent_services_template'
      },
      
      // SLA Terms
      sla: {
        uptimeGuarantee: 99.9,
        responseTime: billingTerms.plan === 'enterprise' ? '1 hour' : '24 hours',
        drBurbyAccuracy: 95.0,
        patentFilingSuccess: 85.0
      },
      
      // Contract Metadata
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      status: 'active',
      blockchainEvidence: true
    };

    // Store smart contract on blockchain
    const contractHash = await this.storeXeroSmartContract(smartContract);
    
    // Create Xero invoice template
    await this.createXeroInvoiceTemplate(smartContract);
    
    return {
      success: true,
      contractHash,
      smartContract,
      xeroIntegration: 'active',
      autoPayment: 'enabled'
    };
  }

  async storeXeroSmartContract(contract) {
    const contractData = JSON.stringify(contract);
    const contractHash = crypto.createHash('sha256').update(contractData).digest('hex');
    
    const transaction = this.patentContract.methods.storeSmartContract(
      contract.company,
      contract.patentApplicationNumber,
      contractHash,
      contractData
    );

    const tx = {
      from: this.account.address,
      to: this.contractAddress,
      data: transaction.encodeABI(),
      gas: 400000,
      gasPrice: await this.web3.eth.getGasPrice()
    };

    const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    
    console.log(`💰 Xero smart contract stored: ${receipt.transactionHash}`);
    return contractHash;
  }

  // Automated SaaS Patent Models
  async createSaaSPatentModel(company, plan) {
    console.log(`🏢 Creating SaaS patent model for ${company.name}`);
    
    const saasModel = {
      company: company.name,
      companyId: company.id,
      plan: plan.name,
      
      // SaaS Configuration
      saas: {
        model: 'patent-as-a-service',
        billing: plan.billing,
        features: plan.features,
        limits: plan.limits,
        
        // Patent-Specific SaaS Features
        patentPortfolio: {
          managementEnabled: true,
          autoClassification: true,
          competitorMonitoring: true,
          valuationTracking: true,
          renewalAlerts: true
        },
        
        // Dr. Burby SaaS Features
        drBurbyServices: {
          instances: plan.drBurbyCount,
          specializations: plan.specializations || ['general'],
          availabilityGuarantee: '99.5%',
          analysisDeepLevel: plan.analysisDepth || 'standard'
        },
        
        // API Access
        apiAccess: {
          enabled: plan.apiEnabled || false,
          rateLimit: plan.apiRateLimit || 1000,
          webhooks: plan.webhooks || false,
          customIntegrations: plan.customIntegrations || false
        }
      },
      
      // Automated Billing
      automatedBilling: {
        xeroIntegration: true,
        recurringBilling: true,
        usageBasedBilling: plan.usageBased || false,
        overageCharges: plan.overage || {},
        paymentTerms: plan.paymentTerms || 'net-30',
        autoSuspension: true, // Suspend on non-payment
        gracePeriod: 7 // days
      },
      
      // Smart Contract Integration
      smartContract: {
        enabled: true,
        autoRenewal: true,
        escalationClauses: true,
        slaEnforcement: true,
        disputeResolution: 'blockchain-arbitration'
      },
      
      // Blockchain Evidence
      blockchainIntegration: {
        evidenceNFTs: true,
        filingProofs: true,
        auditTrail: true,
        immutableRecords: true
      },
      
      // Performance Metrics
      metrics: {
        patentFilingSuccess: 0,
        averageProcessingTime: 0,
        drBurbyAccuracy: 0,
        customerSatisfaction: 0,
        uptimeAchieved: 0
      },
      
      // Created timestamp
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Store SaaS model on blockchain for immutability
    const modelHash = await this.storeSaaSModel(saasModel);
    
    // Set up automated billing in Xero
    await this.setupXeroAutomatedBilling(saasModel);
    
    // Create monitoring dashboard
    await this.createSaaSMonitoringDashboard(saasModel);
    
    return {
      success: true,
      saasModel,
      modelHash,
      automatedBilling: 'configured',
      monitoring: 'active'
    };
  }

  async setupXeroAutomatedBilling(saasModel) {
    console.log(`💳 Setting up automated billing for ${saasModel.company}`);
    
    // This would integrate with Xero API
    const billingSetup = {
      company: saasModel.company,
      recurringInvoice: {
        template: 'patent_saas_template',
        frequency: 'monthly',
        amount: saasModel.saas.billing.monthlyFee,
        description: `${saasModel.plan} Plan - Patent SaaS Services`
      },
      paymentTerms: saasModel.automatedBilling.paymentTerms,
      autoCollection: true,
      dunningProcess: {
        enabled: true,
        reminders: [7, 14, 30], // days overdue
        suspensionDay: saasModel.automatedBilling.gracePeriod
      }
    };
    
    // Store billing configuration
    return billingSetup;
  }

  // Utility Methods
  generateContentHash(patentData) {
    const content = JSON.stringify({
      title: patentData.title,
      description: patentData.description,
      claims: patentData.claims,
      inventors: patentData.inventors,
      filingDate: patentData.filingDate
    });
    
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  generatePriorArtHash(priorArt) {
    if (!priorArt) return null;
    
    const content = JSON.stringify(priorArt);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async uploadToIPFS(data) {
    // This would upload to IPFS and return hash
    // For now, return a mock hash
    const dataString = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    return `Qm${hash.substring(0, 44)}`;
  }

  async getXeroConnectionId(companyName) {
    // This would get Xero connection ID for the company
    // For now, return a mock ID
    return `xero_conn_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  extractTokenIdFromReceipt(receipt) {
    // Extract token ID from Transfer event logs
    // For now, return a mock token ID
    return Math.floor(Math.random() * 1000000);
  }

  getPatentContractABI() {
    // This would return the actual ABI for the patent evidence contract
    return [
      {
        'inputs': [
          {'name': 'applicationNumber', 'type': 'string'},
          {'name': 'contentHash', 'type': 'string'},
          {'name': 'priorArtHash', 'type': 'string'},
          {'name': 'metadata', 'type': 'string'}
        ],
        'name': 'storePatentEvidence',
        'type': 'function'
      },
      {
        'inputs': [
          {'name': 'applicationNumber', 'type': 'string'},
          {'name': 'metadataHash', 'type': 'string'}
        ],
        'name': 'mintPatentNFT',
        'type': 'function'
      },
      {
        'inputs': [
          {'name': 'company', 'type': 'string'},
          {'name': 'applicationNumber', 'type': 'string'},
          {'name': 'contractHash', 'type': 'string'},
          {'name': 'contractData', 'type': 'string'}
        ],
        'name': 'storeSmartContract',
        'type': 'function'
      }
    ];
  }

  async storeSaaSModel(saasModel) {
    const modelData = JSON.stringify(saasModel);
    const modelHash = crypto.createHash('sha256').update(modelData).digest('hex');
    
    console.log(`💾 SaaS model hash: ${modelHash}`);
    return modelHash;
  }

  async createSaaSMonitoringDashboard(saasModel) {
    console.log(`📊 Creating monitoring dashboard for ${saasModel.company}`);
    
    return {
      dashboardUrl: `https://monitoring.2100.cool/saas/${saasModel.companyId}`,
      metrics: ['uptime', 'api_calls', 'patent_filings', 'billing_status'],
      alerts: ['downtime', 'payment_failure', 'quota_exceeded'],
      reports: ['monthly_usage', 'billing_summary', 'performance_metrics']
    };
  }

  async createXeroInvoiceTemplate(smartContract) {
    console.log(`📄 Creating Xero invoice template for ${smartContract.company}`);
    
    return {
      templateId: `patent_template_${smartContract.company.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: `Patent Services - ${smartContract.company}`,
      autoGeneration: true,
      billingFrequency: smartContract.paymentSchedule
    };
  }
}

module.exports = AIPITowerPatentChain;
