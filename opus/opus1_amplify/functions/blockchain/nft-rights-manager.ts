/**
 * AIXTIV SYMPHONY™ NFT Rights Manager
 * © 2025 AI Publishing International LLP
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This is proprietary software of AI Publishing International LLP.
 * All rights reserved. Unauthorized copying or distribution is prohibited.
 */

import { ethers } from 'ethers';
import { firestore } from 'firebase-admin';
import { BlockchainIntegrationManager } from './BlockchainIntegration';
import {
  S2DOManager,
  S2DOObjectType,
  S2DOEncryptionLevel,
  S2DOAccessLevel,
} from './S2DOImplementation';
import { v4 as uuidv4 } from 'uuid';

// NFT Content Token interface
interface NFTContentToken {
  id: string;
  tokenId: string;
  contractAddress: string;
  blockchain: 'ethereum' | 'polygon' | 'solana' | 'aixtiv-chain';
  contentId: string;
  ownerId: string;
  ownerType: 'user' | 'organization';
  createdAt: firestore.Timestamp;
  metadataUri: string;
  royaltyPercentage: number;
  tokenStandard: 'ERC721' | 'ERC1155' | 'SPL' | 'AIXTIV-NFT';
  status: 'active' | 'burned' | 'frozen';
  transactionHistory: NFTTransactionRecord[];
  rightsData: NFTRightsData;
}

// NFT Transaction Record interface
interface NFTTransactionRecord {
  transactionHash: string;
  timestamp: firestore.Timestamp;
  fromAddress: string;
  toAddress: string;
  transactionType: 'mint' | 'transfer' | 'burn' | 'royalty_payment';
  value?: string;
  currency?: string;
}

// NFT Rights Data interface
interface NFTRightsData {
  contentFingerprint: string; // Hash of the original content
  rightsFingerprint: string; // Hash of the rights metadata
  commercialUse: boolean;
  derivativeWorks: boolean;
  redistributionRights: string[];
  royaltyStructure: {
    percentage: number;
    beneficiaries: {
      address: string;
      share: number; // Percentage of royalty
    }[];
  };
  licenseTerms: string;
  contentHashAlgorithm: string;
  contentHash: string;
}

// Smart contract ABIs
const ERC721_ABI = [
  // Standard ERC721 functions
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',

  // Extensions for AIXTIV content rights
  'function mintWithRights(address to, string memory contentUri, uint256 royaltyPercentage, bytes memory rightsData) returns (uint256)',
  'function updateRights(uint256 tokenId, bytes memory newRightsData)',
  'function getRights(uint256 tokenId) view returns (bytes memory)',
  'function contentFingerprint(uint256 tokenId) view returns (bytes32)',
  'function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)',
];

/**
 * NFT Rights Manager Service
 *
 * Manages content rights through NFTs on the blockchain within the AIXTIV SYMPHONY ecosystem.
 */
class NFTRightsManagerService {
  private db: firestore.Firestore;
  private blockchainManager: BlockchainIntegrationManager;
  private s2doManager: any;
  private providers: Map<string, ethers.providers.Provider>;
  private contracts: Map<string, ethers.Contract>;
  private defaultContractAddress: string;
  private defaultChain: string;

  constructor(
    db: firestore.Firestore,
    blockchainManager: BlockchainIntegrationManager,
    s2doManager: any,
    providerConfig: {
      [chainName: string]: {
        rpcUrl: string;
        contracts: {
          [contractName: string]: string;
        };
      };
    },
    defaultChain: string = 'aixtiv-chain',
    defaultContract: string = 'AIXTIVContentNFT'
  ) {
    this.db = db;
    this.blockchainManager = blockchainManager;
    this.s2doManager = s2doManager;
    this.providers = new Map();
    this.contracts = new Map();
    this.defaultChain = defaultChain;

    // Initialize providers for each configured chain
    Object.entries(providerConfig).forEach(([chainName, config]) => {
      const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
      this.providers.set(chainName, provider);

      // Initialize contracts for this chain
      Object.entries(config.contracts).forEach(([contractName, address]) => {
        const contract = new ethers.Contract(address, ERC721_ABI, provider);
        const contractKey = `${chainName}:${contractName}`;
        this.contracts.set(contractKey, contract);

        // Set default contract address
        if (chainName === defaultChain && contractName === defaultContract) {
          this.defaultContractAddress = address;
        }
      });
    });
  }

  /**
   * Create an NFT for content and register rights
   *
   * @param contentId Content ID
   * @param ownerId Owner ID
   * @param ownerType Owner type
   * @param contentFingerprint Hash of the content
   * @param rightsData Content rights data
   * @param contractAddress Optional contract address (uses default if not provided)
   * @param blockchain Optional blockchain name (uses default if not provided)
   * @returns Promise with the NFT token information
   */
  async mintContentNFT(
    contentId: string,
    ownerId: string,
    ownerType: 'user' | 'organization',
    contentFingerprint: string,
    rightsData: Omit<NFTRightsData, 'contentFingerprint' | 'rightsFingerprint'>,
    contractAddress?: string,
    blockchain?: string
  ): Promise<NFTContentToken> {
    // Use default values if not provided
    const chain = blockchain || this.defaultChain;
    const contract = contractAddress || this.defaultContractAddress;
    const contractKey = `${chain}:${contract}`;

    // Get blockchain wallet for owner
    const ownerWallet = await this.blockchainManager.getWalletForEntity(
      ownerId,
      ownerType
    );

    // Create metadata for the NFT
    const metadata = {
      name: `AIXTIV Content: ${contentId}`,
      description: 'AIXTIV SYMPHONY content rights token',
      contentId,
      ownerId,
      contentFingerprint,
      rights: rightsData,
    };

    // Store metadata in S2DO
    const metadataS2doId = await this.s2doManager.createObject({
      data: metadata,
      type: S2DOObjectType.NFT_METADATA,
      encryptionLevel: S2DOEncryptionLevel.MEDIUM,
      accessLevel: S2DOAccessLevel.PUBLIC,
      ownerId,
    });

    // Generate metadata URI (could be IPFS, S2DO URL, etc.)
    const metadataUri = `s2do://${metadataS2doId}`;

    // Calculate rights fingerprint
    const rightsFingerprint = this.calculateRightsFingerprint(rightsData);

    // Prepare complete rights data
    const completeRightsData: NFTRightsData = {
      ...rightsData,
      contentFingerprint,
      rightsFingerprint,
      contentHashAlgorithm: 'sha256',
      contentHash: contentFingerprint,
    };

    // Encode rights data for blockchain
    const encodedRightsData = ethers.utils.defaultAbiCoder.encode(
      [
        'string',
        'string',
        'bool',
        'bool',
        'string[]',
        'uint256',
        'string',
        'string',
        'string',
      ],
      [
        completeRightsData.contentFingerprint,
        completeRightsData.rightsFingerprint,
        completeRightsData.commercialUse,
        completeRightsData.derivativeWorks,
        completeRightsData.redistributionRights,
        completeRightsData.royaltyStructure.percentage,
        completeRightsData.licenseTerms,
        completeRightsData.contentHashAlgorithm,
        completeRightsData.contentHash,
      ]
    );

    // Connect contract with signer
    const contract_instance = this.contracts.get(contractKey);
    if (!contract_instance) {
      throw new Error(`Contract not found: ${contractKey}`);
    }

    // Get private key for owner (in a real system, this would use secure wallet services)
    const privateKey = await this.blockchainManager.getPrivateKey(ownerId);
    const wallet = new ethers.Wallet(privateKey, this.providers.get(chain));
    const contractWithSigner = contract_instance.connect(wallet);

    // Call mintWithRights function on the contract
    const tx = await contractWithSigner.mintWithRights(
      ownerWallet.address,
      metadataUri,
      completeRightsData.royaltyStructure.percentage,
      encodedRightsData
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Get token ID from event (assuming event emits token ID)
    const tokenId = this.extractTokenIdFromReceipt(receipt);

    // Create NFT token record
    const now = firestore.Timestamp.now();
    const nftToken: NFTContentToken = {
      id: uuidv4(),
      tokenId,
      contractAddress: contract,
      blockchain: chain as 'ethereum' | 'polygon' | 'solana' | 'aixtiv-chain',
      contentId,
      ownerId,
      ownerType,
      createdAt: now,
      metadataUri,
      royaltyPercentage: completeRightsData.royaltyStructure.percentage,
      tokenStandard: 'AIXTIV-NFT',
      status: 'active',
      transactionHistory: [
        {
          transactionHash: receipt.transactionHash,
          timestamp: now,
          fromAddress: ethers.constants.AddressZero,
          toAddress: ownerWallet.address,
          transactionType: 'mint',
        },
      ],
      rightsData: completeRightsData,
    };

    // Save NFT token record
    await this.db.collection('nftContentTokens').doc(nftToken.id).set(nftToken);

    return nftToken;
  }

  /**
   * Transfer NFT ownership to another user or organization
   *
   * @param tokenId Token ID or NFT record ID
   * @param fromOwnerId Current owner ID
   * @param toOwnerId New owner ID
   * @param toOwnerType New owner type
   * @returns Promise with updated NFT token
   */
  async transferNFT(
    tokenId: string,
    fromOwnerId: string,
    toOwnerId: string,
    toOwnerType: 'user' | 'organization'
  ): Promise<NFTContentToken> {
    // Check if tokenId is a NFT record ID or blockchain token ID
    let nftToken: NFTContentToken;
    const nftDoc = await this.db
      .collection('nftContentTokens')
      .doc(tokenId)
      .get();

    if (nftDoc.exists) {
      // This is an NFT record ID
      nftToken = nftDoc.data() as NFTContentToken;
    } else {
      // This might be a blockchain token ID, search for it
      const nftSnapshot = await this.db
        .collection('nftContentTokens')
        .where('tokenId', '==', tokenId)
        .limit(1)
        .get();

      if (nftSnapshot.empty) {
        throw new Error(`NFT with token ID ${tokenId} not found`);
      }

      nftToken = nftSnapshot.docs[0].data() as NFTContentToken;
    }

    // Verify current ownership
    if (nftToken.ownerId !== fromOwnerId) {
      throw new Error(
        `User ${fromOwnerId} is not the current owner of NFT ${nftToken.id}`
      );
    }

    // Get blockchain wallets for both parties
    const fromWallet = await this.blockchainManager.getWalletForEntity(
      fromOwnerId,
      nftToken.ownerType
    );
    const toWallet = await this.blockchainManager.getWalletForEntity(
      toOwnerId,
      toOwnerType
    );

    // Get contract instance
    const contractKey = `${nftToken.blockchain}:${nftToken.contractAddress}`;
    const contract_instance = this.contracts.get(contractKey);
    if (!contract_instance) {
      throw new Error(`Contract not found: ${contractKey}`);
    }

    // Get private key for owner (in a real system, this would use secure wallet services)
    const privateKey = await this.blockchainManager.getPrivateKey(fromOwnerId);
    const wallet = new ethers.Wallet(
      privateKey,
      this.providers.get(nftToken.blockchain)
    );
    const contractWithSigner = contract_instance.connect(wallet);

    // Execute transfer on blockchain
    const tx = await contractWithSigner.transferFrom(
      fromWallet.address,
      toWallet.address,
      nftToken.tokenId
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Update NFT record
    const now = firestore.Timestamp.now();

    // Add transaction to history
    nftToken.transactionHistory.push({
      transactionHash: receipt.transactionHash,
      timestamp: now,
      fromAddress: fromWallet.address,
      toAddress: toWallet.address,
      transactionType: 'transfer',
    });

    // Update owner information
    nftToken.ownerId = toOwnerId;
    nftToken.ownerType = toOwnerType;

    // Save updated NFT record
    await this.db.collection('nftContentTokens').doc(nftToken.id).update({
      ownerId: toOwnerId,
      ownerType: toOwnerType,
      transactionHistory: nftToken.transactionHistory,
    });

    // Update content rights in the content collection
    await this.db.collection('content').doc(nftToken.contentId).update({
      'rights.ownerId': toOwnerId,
      'rights.ownerType': toOwnerType,
      updatedAt: now,
    });

    return nftToken;
  }

  /**
   * Verify NFT ownership
   *
   * @param tokenId NFT token ID
   * @param ownerId Owner ID to verify
   * @returns Promise with boolean indicating ownership
   */
  async verifyNFTOwnership(tokenId: string, ownerId: string): Promise<boolean> {
    // Get NFT record
    const nftSnapshot = await this.db
      .collection('nftContentTokens')
      .where('tokenId', '==', tokenId)
      .limit(1)
      .get();

    if (nftSnapshot.empty) {
      throw new Error(`NFT with token ID ${tokenId} not found`);
    }

    const nftToken = nftSnapshot.docs[0].data() as NFTContentToken;

    // Check off-chain ownership record
    if (nftToken.ownerId !== ownerId) {
      return false;
    }

    // Verify on-chain ownership for additional security
    const ownerWallet = await this.blockchainManager.getWalletForEntity(
      ownerId,
      nftToken.ownerType
    );

    // Get contract instance
    const contractKey = `${nftToken.blockchain}:${nftToken.contractAddress}`;
    const contract = this.contracts.get(contractKey);
    if (!contract) {
      throw new Error(`Contract not found: ${contractKey}`);
    }

    // Call ownerOf function to verify on-chain owner
    try {
      const onChainOwner = await contract.ownerOf(nftToken.tokenId);
      return onChainOwner.toLowerCase() === ownerWallet.address.toLowerCase();
    } catch (error) {
      console.error('Error verifying on-chain ownership:', error);
      return false;
    }
  }

  /**
   * Update NFT rights data
   *
   * @param tokenId NFT token ID
   * @param ownerId Owner ID (must be current owner)
   * @param rightsData Updated rights data
   * @returns Promise with updated NFT token
   */
  async updateNFTRights(
    tokenId: string,
    ownerId: string,
    rightsData: Partial<NFTRightsData>
  ): Promise<NFTContentToken> {
    // Get NFT record
    const nftSnapshot = await this.db
      .collection('nftContentTokens')
      .where('tokenId', '==', tokenId)
      .limit(1)
      .get();

    if (nftSnapshot.empty) {
      throw new Error(`NFT with token ID ${tokenId} not found`);
    }

    const nftDoc = nftSnapshot.docs[0];
    const nftToken = nftDoc.data() as NFTContentToken;

    // Verify ownership
    if (nftToken.ownerId !== ownerId) {
      throw new Error(
        `User ${ownerId} is not the current owner of NFT ${nftToken.id}`
      );
    }

    // Prepare updated rights data
    const updatedRightsData: NFTRightsData = {
      ...nftToken.rightsData,
      ...rightsData,
    };

    // Calculate new rights fingerprint
    updatedRightsData.rightsFingerprint =
      this.calculateRightsFingerprint(updatedRightsData);

    // Encode updated rights data for blockchain
    const encodedRightsData = ethers.utils.defaultAbiCoder.encode(
      [
        'string',
        'string',
        'bool',
        'bool',
        'string[]',
        'uint256',
        'string',
        'string',
        'string',
      ],
      [
        updatedRightsData.contentFingerprint,
        updatedRightsData.rightsFingerprint,
        updatedRightsData.commercialUse,
        updatedRightsData.derivativeWorks,
        updatedRightsData.redistributionRights,
        updatedRightsData.royaltyStructure.percentage,
        updatedRightsData.licenseTerms,
        updatedRightsData.contentHashAlgorithm,
        updatedRightsData.contentHash,
      ]
    );

    // Update rights on blockchain
    const contractKey = `${nftToken.blockchain}:${nftToken.contractAddress}`;
    const contract_instance = this.contracts.get(contractKey);
    if (!contract_instance) {
      throw new Error(`Contract not found: ${contractKey}`);
    }

    // Get private key for owner (in a real system, this would use secure wallet services)
    const privateKey = await this.blockchainManager.getPrivateKey(ownerId);
    const wallet = new ethers.Wallet(
      privateKey,
      this.providers.get(nftToken.blockchain)
    );
    const contractWithSigner = contract_instance.connect(wallet);

    // Call updateRights function on the contract
    const tx = await contractWithSigner.updateRights(
      nftToken.tokenId,
      encodedRightsData
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Update NFT record
    const now = firestore.Timestamp.now();

    // Add transaction to history
    nftToken.transactionHistory.push({
      transactionHash: receipt.transactionHash,
      timestamp: now,
      fromAddress: wallet.address,
      toAddress: nftToken.contractAddress,
      transactionType: 'royalty_payment',
    });

    // Update rights data
    nftToken.rightsData = updatedRightsData;

    // Save updated NFT record
    await this.db.collection('nftContentTokens').doc(nftDoc.id).update({
      rightsData: updatedRightsData,
      transactionHistory: nftToken.transactionHistory,
    });

    // Update content rights in the content collection if needed
    if (
      rightsData.commercialUse !== undefined ||
      rightsData.derivativeWorks !== undefined ||
      rightsData.redistributionRights !== undefined ||
      rightsData.royaltyStructure !== undefined
    ) {
      const contentUpdate: any = { updatedAt: now };

      if (rightsData.commercialUse !== undefined) {
        contentUpdate['rights.commercialUse'] = rightsData.commercialUse;
      }

      if (rightsData.derivativeWorks !== undefined) {
        contentUpdate['rights.derivativeWorks'] = rightsData.derivativeWorks;
      }

      if (rightsData.redistributionRights !== undefined) {
        contentUpdate['rights.redistributionRights'] =
          rightsData.redistributionRights;
      }

      if (rightsData.royaltyStructure !== undefined) {
        contentUpdate['rights.royaltyStructure'] = rightsData.royaltyStructure;
      }

      await this.db
        .collection('content')
        .doc(nftToken.contentId)
        .update(contentUpdate);
    }

    return nftToken;
  }

  /**
   * Calculate fingerprint for rights data
   *
   * @param rightsData Rights data
   * @returns Rights fingerprint
   */
  private calculateRightsFingerprint(rightsData: any): string {
    // In a real implementation, this would create a cryptographic hash
    // of the rights data for verification
    const jsonString = JSON.stringify(rightsData);
    return ethers.utils.id(jsonString);
  }

  /**
   * Extract token ID from transaction receipt
   *
   * @param receipt Transaction receipt
   * @returns Token ID
   */
  private extractTokenIdFromReceipt(receipt: ethers.ContractReceipt): string {
    // In a real implementation, this would parse the event logs
    // to extract the token ID from the Transfer event
    // For now, we'll use a placeholder
    if (receipt.events && receipt.events.length > 0) {
      const transferEvent = receipt.events.find(e => e.event === 'Transfer');
      if (transferEvent && transferEvent.args) {
        return transferEvent.args.tokenId.toString();
      }
    }

    // Fallback to a generic ID (this should never happen in production)
    return `token-${Date.now()}`;
  }
}

export {
  NFTRightsManagerService,
  NFTContentToken,
  NFTTransactionRecord,
  NFTRightsData,
};
