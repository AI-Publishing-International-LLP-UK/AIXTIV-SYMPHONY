/**
 * AIXTIV SYMPHONY™ Rights Manager
 * © 2025 AI Publishing International LLP
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This is proprietary software of AI Publishing International LLP.
 * All rights reserved. Unauthorized copying or distribution is prohibited.
 */

import { firestore } from 'firebase-admin';
import { BlockchainIntegrationManager } from './BlockchainIntegration';
import { S2DOManager, S2DOObjectType, S2DOEncryptionLevel, S2DOAccessLevel } from './S2DOImplementation';
import { v4 as uuidv4 } from 'uuid';
import { ContentRights } from './ContentManager';

// Rights transfer record interface
interface RightsTransferRecord {
  id: string;
  contentId: string;
  fromOwnerId: string;
  fromOwnerType: 'user' | 'organization';
  toOwnerId: string;
  toOwnerType: 'user' | 'organization';
  transferType: RightsTransferType;
  rightsTransferred: Partial<ContentRights>;
  compensation: CompensationDetails;
  transferredAt: firestore.Timestamp;
  expiresAt?: firestore.Timestamp;
  contractId?: string;
  blockchainTransactionId?: string;
  nftTokenId?: string;
  status: RightsTransferStatus;
  s2doId?: string;
}

// Rights transfer status enum
enum RightsTransferStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
}

// Rights transfer type enum
enum RightsTransferType {
  FULL_OWNERSHIP = 'full_ownership',
  LICENSE = 'license',
  SUBLICENSE = 'sublicense',
  ROYALTY_AGREEMENT = 'royalty_agreement',
  NFT_CREATION = 'nft_creation',
  DISTRIBUTION_RIGHTS = 'distribution_rights',
  COMMERCIAL_USE = 'commercial_use',
  DERIVATIVE_WORKS = 'derivative_works'
}

// Compensation details interface
interface CompensationDetails {
  type: 'monetary' | 'token' | 'royalty' | 'free' | 'exchange';
  amount?: number;
  currency?: string;
  tokenContract?: string;
  tokenId?: string;
  royaltyPercentage?: number;
  royaltyTerms?: string;
  exchangeDetails?: any;
}

// Rights assertion interface
interface RightsAssertion {
  id: string;
  contentId: string;
  assertedBy: string;
  assertionType: RightsAssertionType;
  evidence: RightsEvidence[];
  status: RightsAssertionStatus;
  createdAt: firestore.Timestamp;
  resolvedAt?: firestore.Timestamp;
  resolvedBy?: string;
  resolutionDetails?: string;
  blockchainRecordId?: string;
  s2doId?: string;
}

// Rights assertion type enum
enum RightsAssertionType {
  ORIGINAL_CREATOR = 'original_creator',
  OWNERSHIP_TRANSFER = 'ownership_transfer',
  LICENSE_GRANT = 'license_grant',
  COPYRIGHT_INFRINGEMENT = 'copyright_infringement',
  PLAGIARISM = 'plagiarism',
  FAIR_USE = 'fair_use',
  DISPUTED_OWNERSHIP = 'disputed_ownership'
}

// Rights assertion status enum
enum RightsAssertionStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved'
}

// Rights evidence interface
interface RightsEvidence {
  type: 'document' | 'blockchain' | 'similarity' | 'timestamp' | 'witness' | 'certificate';
  description: string;
  url?: string;
  fileHash?: string;
  blockchainReference?: string;
  similarityScore?: number;
  timestampProof?: string;
  certificateId?: string;
  s2doId?: string;
}

// Content revision proposal interface
interface ContentRevisionProposal {
  id: string;
  contentId: string;
  proposedBy: string;
  proposerType: 'user' | 'organization' | 'copilot';
  proposalType: 'modification' | 'addition' | 'deletion' | 'reorganization' | 'complete_revision';
  status: RevisionProposalStatus;
  createdAt: firestore.Timestamp;
  reviewedAt?: firestore.Timestamp;
  reviewedBy?: string;
  reviewComments?: string;
  originalContentSnapshotId?: string;
  proposedContentId?: string; // S2DO ID of the proposed content
  affectedSections?: Array<{
    sectionId: string;
    action: 'modify' | 'add' | 'delete' | 'move';
    newPosition?: number;
  }>;
}

// Content revision proposal status
enum RevisionProposalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MODIFIED_AND_APPROVED = 'modified_and_approved',
  WITHDRAWN = 'withdrawn'
}

/**
 * Rights Manager Service
 * 
 * Manages digital rights, ownership, transfers, and assertions within the
 * AIXTIV SYMPHONY ecosystem, including co-pilot collaboration and
 * owner-subscriber content review workflows.
 */
class RightsManagerService {
  private db: firestore.Firestore;
  private blockchainManager: BlockchainIntegrationManager;
  private s2doManager: any;
  
  constructor(
    db: firestore.Firestore,
    blockchainManager: BlockchainIntegrationManager,
    s2doManager: any
  ) {
    this.db = db;
    this.blockchainManager = blockchainManager;
    this.s2doManager = s2doManager;
  }
  
  /**
   * Register initial rights for content
   * 
   * @param contentId Content ID
   * @param rights Rights information
   * @param createNFT Whether to create an NFT for the content
   * @returns Promise with the updated rights information
   */
  async registerContentRights(
    contentId: string,
    rights: ContentRights,
    createNFT: boolean = false
  ): Promise<ContentRights> {
    // Get content reference
    const contentRef = this.db.collection('content').doc(contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    // Store rights assertion on blockchain
    const blockchainRecordId = await this.blockchainManager.recordRightsAssertion({
      contentId,
      assertedBy: rights.ownerId,
      assertionType: RightsAssertionType.ORIGINAL_CREATOR,
      timestamp: Date.now(),
      ownershipDetails: {
        ownerId: rights.ownerId,
        ownerType: rights.ownerType,
        licenseType: rights.licenseType
      }
    });
    
    // Update rights with blockchain record
    const updatedRights: ContentRights = {
      ...rights,
      blockchainRecordId
    };
    
    // If NFT requested, create one
    if (createNFT) {
      const nftTokenId = await this.blockchainManager.mintContentNFT({
        contentId,
        ownerId: rights.ownerId,
        rightsDetails: updatedRights,
        blockchainRecordId
      });
      
      updatedRights.nftTokenId = nftTokenId;
    }
    
    // Update content with rights information
    await contentRef.update({
      rights: updatedRights,
      updatedAt: firestore.Timestamp.now()
    });
    
    return updatedRights;
  }
  
  /**
   * Transfer rights to another user or organization
   * 
   * @param contentId Content ID
   * @param fromOwnerId Current owner ID
   * @param toOwnerId New owner ID
   * @param transferType Type of rights transfer
   * @param rightsToTransfer Rights being transferred
   * @param compensation Compensation details
   * @returns Promise with the transfer record
   */
  async transferRights(
    contentId: string,
    fromOwnerId: string,
    fromOwnerType: 'user' | 'organization',
    toOwnerId: string,
    toOwnerType: 'user' | 'organization',
    transferType: RightsTransferType,
    rightsToTransfer: Partial<ContentRights>,
    compensation: CompensationDetails,
    expiresAt?: firestore.Timestamp
  ): Promise<RightsTransferRecord> {
    // Get content reference
    const contentRef = this.db.collection('content').doc(contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    const content = contentDoc.data() as any;
    
    // Verify current ownership
    if (content.rights.ownerId !== fromOwnerId) {
      throw new Error(`User ${fromOwnerId} is not the current owner of content ${contentId}`);
    }
    
    // Generate transfer record ID
    const transferId = uuidv4();
    const now = firestore.Timestamp.now();
    
    // Create transfer record
    const transferRecord: RightsTransferRecord = {
      id: transferId,
      contentId,
      fromOwnerId,
      fromOwnerType,
      toOwnerId,
      toOwnerType,
      transferType,
      rightsTransferred: rightsToTransfer,
      compensation,
      transferredAt: now,
      expiresAt,
      status: RightsTransferStatus.PENDING
    };
    
    // Create digital contract for the transfer using S2DO
    const contractData = {
      type: 'rights_transfer',
      parties: {
        from: {
          id: fromOwnerId,
          type: fromOwnerType
        },
        to: {
          id: toOwnerId,
          type: toOwnerType
        }
      },
      content: {
        id: contentId,
        title: content.title
      },
      transfer: {
        type: transferType,
        rights: rightsToTransfer,
        compensation,
        effectiveDate: now.toDate(),
        expiryDate: expiresAt?.toDate()
      },
      legalTerms: this.generateLegalTerms(transferType, rightsToTransfer)
    };
    
    // Store contract in S2DO
    const s2doId = await this.s2doManager.createObject({
      data: contractData,
      type: S2DOObjectType.CONTRACT,
      encryptionLevel: S2DOEncryptionLevel.HIGH,
      accessLevel: S2DOAccessLevel.SHARED,
      ownerId: fromOwnerId,
      sharedWith: [toOwnerId]
    });
    
    transferRecord.contractId = s2doId;
    transferRecord.s2doId = s2doId;
    
    // Record transfer on blockchain
    const blockchainTx = await this.blockchainManager.recordRightsTransfer({
      contentId,
      fromOwnerId,
      toOwnerId,
      transferType,
      rightsTransferred: rightsToTransfer,
      compensation,
      contractId: s2doId,
      timestamp: now.toDate().getTime()
    });
    
    transferRecord.blockchainTransactionId = blockchainTx;
    
    // If this is a full ownership transfer, transfer NFT if it exists
    if (
      transferType === RightsTransferType.FULL_OWNERSHIP && 
      content.rights.nftTokenId
    ) {
      const nftTransferTx = await this.blockchainManager.transferContentNFT({
        tokenId: content.rights.nftTokenId,
        fromAddress: fromOwnerId,
        toAddress: toOwnerId
      });
      
      transferRecord.nftTokenId = content.rights.nftTokenId;
    }
    
    // Update rights status based on transfer type
    if (transferType === RightsTransferType.FULL_OWNERSHIP) {
      // Update content rights to new owner
      const updatedRights: ContentRights = {
        ...content.rights,
        ownerId: toOwnerId,
        ownerType: toOwnerType
      };
      
      // Start Firestore transaction
      const batch = this.db.batch();
      
      // Update content rights
      batch.update(contentRef, {
        'rights': updatedRights,
        'updatedAt': now
      });
      
      // Save transfer record with completed status
      transferRecord.status = RightsTransferStatus.COMPLETED;
      const transferRef = this.db.collection('rightsTransfers').doc(transferId);
      batch.set(transferRef, transferRecord);
      
      // Commit transaction
      await batch.commit();
    } else {
      // For other transfer types, just save the transfer record
      await this.db.collection('rightsTransfers').doc(transferId).set(transferRecord);
    }
    
    return transferRecord;
  }
  
  /**
   * Generate legal terms for rights transfer
   * 
   * @param transferType Transfer type
   * @param rights Rights being transferred
   * @returns Legal terms for the transfer
   */
  private generateLegalTerms(
    transferType: RightsTransferType,
    rights: Partial<ContentRights>
  ): string {
    // In a real implementation, this would generate appropriate legal terms
    // based on the transfer type and rights
    return `Standard legal terms for ${transferType} transfer`;
  }
  
  /**
   * Submit a co-pilot generated content revision for owner-subscriber approval
   * 
   * @param contentId Content ID
   * @param copilotId Co-pilot ID that generated the revision
   * @param proposalType Type of revision being proposed
   * @param proposedContent The new content data
   * @param affectedSections Sections affected by the changes (for partial changes)
   * @returns Promise with the revision proposal
   */
  async submitCopilotRevisionProposal(
    contentId: string,
    copilotId: string,
    proposalType: 'modification' | 'addition' | 'deletion' | 'reorganization' | 'complete_revision',
    proposedContent: any,
    affectedSections?: Array<{
      sectionId: string;
      action: 'modify' | 'add' | 'delete' | 'move';
      newPosition?: number;
    }>
  ): Promise<ContentRevisionProposal> {
    // Get content reference
    const contentRef = this.db.collection('content').doc(contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    const content = contentDoc.data() as any;
    
    // Generate proposal ID
    const proposalId = uuidv4();
    const now = firestore.Timestamp.now();
    
    // Create a snapshot of the original content
    const originalContentSnapshotId = await this.s2doManager.createObject({
      data: {
        contentId,
        originalVersion: content.versionId,
        snapshotTimestamp: now.toDate(),
        content: await this.s2doManager.getObject(content.s2doId)
      },
      type: S2DOObjectType.CONTENT_SNAPSHOT,
      encryptionLevel: S2DOEncryptionLevel.HIGH,
      accessLevel: S2DOAccessLevel.PRIVATE,
      ownerId: content.rights.ownerId
    });
    
    // Store the proposed content in S2DO
    const proposedContentId = await this.s2doManager.createObject({
      data: proposedContent,
      type: S2DOObjectType.CONTENT_REVISION,
      encryptionLevel: S2DOEncryptionLevel.HIGH,
      accessLevel: S2DOAccessLevel.SHARED,
      ownerId: copilotId,
      sharedWith: [content.rights.ownerId]
    });
    
    // Create the revision proposal
    const revisionProposal: ContentRevisionProposal = {
      id: proposalId,
      contentId,
      proposedBy: copilotId,
      proposerType: 'copilot',
      proposalType,
      status: RevisionProposalStatus.PENDING,
      createdAt: now,
      originalContentSnapshotId,
      proposedContentId,
      affectedSections
    };
    
    // Save the proposal
    await this.db.collection('contentRevisionProposals').doc(proposalId).set(revisionProposal);
    
    // Notify owner of pending revision
    await this.notifyContentOwnerOfRevision(content.rights.ownerId, revisionProposal);
    
    return revisionProposal;
  }
  
  /**
   * Review and respond to a content revision proposal
   * 
   * @param proposalId Proposal ID
   * @param reviewerId Reviewer ID (should be the content owner or authorized representative)
   * @param decision Accept, reject, or modify and accept
   * @param reviewComments Optional review comments
   * @param modifiedContent Optional modified version of the proposed content
   * @returns Promise with the updated proposal
   */
  async reviewRevisionProposal(
    proposalId: string,
    reviewerId: string,
    decision: 'approve' | 'reject' | 'modify_and_approve',
    reviewComments?: string,
    modifiedContent?: any
  ): Promise<ContentRevisionProposal> {
    // Get the proposal
    const proposalRef = this.db.collection('contentRevisionProposals').doc(proposalId);
    const proposalDoc = await proposalRef.get();
    
    if (!proposalDoc.exists) {
      throw new Error(`Revision proposal with ID ${proposalId} not found`);
    }
    
    const proposal = proposalDoc.data() as ContentRevisionProposal;
    
    // Get the content to verify ownership
    const contentRef = this.db.collection('content').doc(proposal.contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${proposal.contentId} not found`);
    }
    
    const content = contentDoc.data() as any;
    
    // Verify reviewer is the content owner
    if (content.rights.ownerId !== reviewerId) {
      throw new Error(`User ${reviewerId} is not authorized to review this proposal`);
    }
    
    // Update proposal with review information
    const now = firestore.Timestamp.now();
    let updatedProposal: ContentRevisionProposal = {
      ...proposal,
      reviewedAt: now,
      reviewedBy: reviewerId,
      reviewComments
    };
    
    // Process based on decision
    if (decision === 'approve') {
      updatedProposal.status = RevisionProposalStatus.APPROVED;
      
      // Get the proposed content
      const proposedContent = await this.s2doManager.getObject(proposal.proposedContentId);
      
      // Apply the approved changes
      await this.applyRevisionToContent(
        proposal.contentId, 
        proposedContent, 
        proposal.proposalType, 
        proposal.affectedSections
      );
    } else if (decision === 'reject') {
      updatedProposal.status = RevisionProposalStatus.REJECTED;
    } else if (decision === 'modify_and_approve') {
      if (!modifiedContent) {
        throw new Error('Modified content must be provided when selecting "modify_and_approve"');
      }
      
      updatedProposal.status = RevisionProposalStatus.MODIFIED_AND_APPROVED;
      
      // Store the modified content
      const modifiedContentId = await this.s2doManager.createObject({
        data: modifiedContent,
        type: S2DOObjectType.CONTENT_REVISION,
        encryptionLevel: S2DOEncryptionLevel.HIGH,
        accessLevel: S2DOAccessLevel.SHARED,
        ownerId: reviewerId,
        sharedWith: [proposal.proposedBy]
      });
      
      // Update the proposal with the modified content
      updatedProposal.proposedContentId = modifiedContentId;
      
      // Apply the modified changes
      await this.applyRevisionToContent(
        proposal.contentId, 
        modifiedContent, 
        proposal.proposalType, 
        proposal.affectedSections
      );
    }
    
    // Save the updated proposal
    await proposalRef.update(updatedProposal);
    
    return updatedProposal;
  }
  
  /**
   * Apply approved revision to content
   * 
   * @param contentId Content ID
   * @param revisedContent Revised content data
   * @param revisionType Type of revision
   * @param affectedSections Sections affected (for partial revisions)
   */
  private async applyRevisionToContent(
    contentId: string,
    revisedContent: any,
    revisionType: string,
    affectedSections?: Array<{
      sectionId: string;
      action: 'modify' | 'add' | 'delete' | 'move';
      newPosition?: number;
    }>
  ): Promise<void> {
    // Get content reference
    const contentRef = this.db.collection('content').doc(contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    const content = contentDoc.data() as any;
    const now = firestore.Timestamp.now();
    
    // Create a new version
    const versionId = uuidv4();
    const versionNumber = (await this.getLatestVersionNumber(contentId)) + 1;
    
    // Handle different revision types
    if (revisionType === 'complete_revision') {
      // For complete revision, replace the entire content
      
      // Store revised content in S2DO
      const s2doId = await this.s2doManager.createObject({
        data: revisedContent,
        type: S2DOObjectType.CONTENT,
        encryptionLevel: S2DOEncryptionLevel.HIGH,
        accessLevel: S2DOAccessLevel.PRIVATE,
        ownerId: content.rights.ownerId,
        organizationId: content.organizationId
      });
      
      // Create version record
      const contentVersion = {
        id: versionId,
        contentId: contentId,
        versionNumber: versionNumber,
        createdAt: now,
        createdBy: content.rights.ownerId,
        storagePath: `s2do://${s2doId}`,
        changeDescription: 'Complete content revision',
        s2doId
      };
      
      // Update content record
      const updatedContent = {
        ...content,
        updatedAt: now,
        versionId: versionId,
        s2doId: s2doId
      };
      
      // Start a Firestore transaction
      const batch = this.db.batch();
      
      // Update content
      batch.update(contentRef, updatedContent);
      
      // Add version record
      const versionRef = this.db.collection('contentVersions').doc(versionId);
      batch.set(versionRef, contentVersion);
      
      // Commit transaction
      await batch.commit();
    } else if (revisionType === 'modification' && affectedSections) {
      // For partial modifications, we need to merge changes into the original content
      
      // Get the original content
      const originalContent = await this.s2doManager.getObject(content.s2doId);
      
      // Apply changes to specific sections
      let updatedContent = { ...originalContent };
      
      // Handle each affected section
      for (const section of affectedSections) {
        if (section.action === 'modify') {
          // Find the section in revised content and update it
          if (revisedContent.sections && revisedContent.sections[section.sectionId]) {
            updatedContent.sections[section.sectionId] = revisedContent.sections[section.sectionId];
          }
        } else if (section.action === 'add') {
          // Add new section from revised content
          if (revisedContent.sections && revisedContent.sections[section.sectionId]) {
            updatedContent.sections[section.sectionId] = revisedContent.sections[section.sectionId];
            
            // If structure exists, update it
            if (updatedContent.structure && updatedContent.structure.sections) {
              updatedContent.structure.sections.push({
                id: section.sectionId,
                order: section.newPosition || updatedContent.structure.sections.length,
                title: revisedContent.sections[section.sectionId].title || `Section ${section.sectionId}`
              });
              
              // Re-sort structure based on order
              updatedContent.structure.sections.sort((a: any, b: any) => a.order - b.order);
            }
          }
        } else if (section.action === 'delete') {
          // Remove section
          if (updatedContent.sections && updatedContent.sections[section.sectionId]) {
            delete updatedContent.sections[section.sectionId];
            
            // If structure exists, update it
            if (updatedContent.structure && updatedContent.structure.sections) {
              updatedContent.structure.sections = updatedContent.structure.sections
                .filter((s: any) => s.id !== section.sectionId);
            }
          }
        } else if (section.action === 'move' && section.newPosition !== undefined) {
          // Update section position in structure
          if (updatedContent.structure && updatedContent.structure.sections) {
            const sectionIndex = updatedContent.structure.sections
              .findIndex((s: any) => s.id === section.sectionId);
              
            if (sectionIndex !== -1) {
              updatedContent.structure.sections[sectionIndex].order = section.newPosition;
              
              // Re-sort structure based on order
              updatedContent.structure.sections.sort((a: any, b: any) => a.order - b.order);
            }
          }
        }
      }
      
      // Store updated content in S2DO
      const s2doId = await this.s2doManager.createObject({
        data: updatedContent,
        type: S2DOObjectType.CONTENT,
        encryptionLevel: S2DOEncryptionLevel.HIGH,
        accessLevel: S2DOAccessLevel.PRIVATE,
        ownerId: content.rights.ownerId,
        organizationId: content.organizationId
      });
      
      // Create version record
      const contentVersion = {
        id: versionId,
        contentId: contentId,
        versionNumber: versionNumber,
        createdAt: now,
        createdBy: content.rights.ownerId,
        storagePath: `s2do://${s2doId}`,
        changeDescription: 'Partial content revision',
        s2doId
      };
      
      // Update content record
      const updatedContentRecord = {
        ...content,
        updatedAt: now,
        versionId: versionId,
        s2doId: s2doId
      };
      
      // Start a Firestore transaction
      const batch = this.db.batch();
      
      // Update content
      batch.update(contentRef, updatedContentRecord);
      
      // Add version record
      const versionRef = this.db.collection('contentVersions').doc(versionId);
      batch.set(versionRef, contentVersion);
      
      // Commit transaction
      await batch.commit();
    }
    
    // Record on blockchain (optional but recommended for content integrity)
    await this.blockchainManager.recordContentRevision({
      contentId,
      revisionTimestamp: now.toDate().getTime(),
      revisionType,
      revisionPerformedBy: content.rights.ownerId,
      contentHash: this.generateContentHash(revisedContent)
    });
  }
  
  /**
   * Get latest version number for content
   * 
   * @param contentId Content ID
   * @returns Promise with latest version number
   */
  private async getLatestVersionNumber(contentId: string): Promise<number> {
    const versionsSnapshot = await this.db
      .collection('contentVersions')
      .where('contentId', '==', contentId)
      .orderBy('versionNumber', 'desc')
      .limit(1)
      .get();
      
    if (versionsSnapshot.empty) {
      return 0;
    }
    
    return versionsSnapshot.docs[0].data().versionNumber;
  }
  
  /**
   * Generate content hash for blockchain recording
   * 
   * @param content Content data
   * @returns Content hash
   */
  private generateContentHash(content: any): string {
    // In a real implementation, this would create a cryptographic hash
    // For now, return a placeholder
    return 'content-hash-' + Date.now();
  }
  
  /**
   * Notify content owner of pending revision
   * 
   * @param ownerId Owner ID
   * @param proposal Revision proposal
   */
  private async notifyContentOwnerOfRevision(
    ownerId: string,
    proposal: ContentRevisionProposal
  ): Promise<void> {
    // In a real implementation, this would integrate with a notification system
    console.log(`Notifying owner ${ownerId} of revision proposal ${proposal.id}`);
  }
  
  /**
   * Upload a user-modified revision
   * 
   * @param contentId Content ID
   * @param userId User ID (should be the content owner)
   * @param modifiedContent The modified content data
   * @param changeDescription Description of changes
   * @returns Promise with the new version ID
   */
  async uploadUserModifiedContent(
    contentId: string,
    userId: string,
    modifiedContent: any,
    changeDescription: string
  ): Promise<string> {
    // Get content reference
    const contentRef = this.db.collection('content').doc(contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }
    
    const content = contentDoc.data() as any;
    
    // Verify user is the content owner
    if (content.rights.ownerId !== userId) {
      throw new Error(`User ${userId} is not authorized to modify this content`);
    }
    
    // Generate new version ID
    const versionId = uuidv4();
    const now = firestore.Timestamp.now();
    const versionNumber = (await this.getLatestVersionNumber(contentId)) + 1;
    
    // Store modified content in S2DO
    const s2doId = await this.s2doManager.createObject({
      data: modifiedContent,
      type: S2DOObjectType.CONTENT,
      encryptionLevel: S2DOEncryptionLevel.HIGH,
      accessLevel: S2DOAccessLevel.PRIVATE