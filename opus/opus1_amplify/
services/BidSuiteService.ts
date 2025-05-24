/**
 * BidSuiteService.ts - Main service for the Bid Suite
 * Orchestrates the components of the bid system including
 * seeking, ranking, and building bids
 */

import { 
  Firestore, 
  getFirestore, 
  connectFirestoreEmulator 
} from "firebase/firestore";

import { BidSeeker } from "./BidSeeker";
import { BidRanker } from "./BidRanker";
import { BidBuilder } from "./BidBuilder";
import { 
  Bid, 
  BidSearchCriteria, 
  BidSearchResult, 
  BidRanking,
  BidSeekingContext
} from "../models/Bid";

/**
 * Configuration for the BidSuiteService
 */
export interface BidSuiteConfig {
  firestore?: Firestore;
  collections: {
    bids: string;
    bidResponses: string;
    bidRankings: string;
    bidAnalytics: string;
  };
  useEmulator?: boolean;
  emulatorHost?: string;
  emulatorPort?: number;
}

/**
 * Default configuration for the BidSuiteService
 */
export const DEFAULT_BID_SUITE_CONFIG: BidSuiteConfig = {
  collections: {
    bids: "bids",
    bidResponses: "bidResponses",
    bidRankings: "bidRankings",
    bidAnalytics: "bidAnalytics"
  },
  useEmulator: false,
  emulatorHost: "localhost",
  emulatorPort: 8080
};

/**
 * BidSuiteService - The main orchestration service for the bid system
 * 
 * Integrates BidSeeker, BidRanker, and BidBuilder components to create
 * a comprehensive solution for bid management
 */
export class BidSuiteService {
  private firestore: Firestore;
  private collections: {
    bids: string;
    bidResponses: string;
    bidRankings: string;
    bidAnalytics: string;
  };
  
  private bidSeeker: BidSeeker;
  private bidRanker: BidRanker;
  private bidBuilder: BidBuilder;
  
  /**
   * Creates a new BidSuiteService instance
   * @param config Configuration for the BidSuiteService
   */
  constructor(config: BidSuiteConfig = DEFAULT_BID_SUITE_CONFIG) {
    // Initialize Firestore
    this.firestore = config.firestore || getFirestore();
    
    // Connect to Firestore emulator if specified
    if (config.useEmulator && config.emulatorHost && config.emulatorPort) {
      connectFirestoreEmulator(
        this.firestore, 
        config.emulatorHost, 
        config.emulatorPort
      );
    }
    
    this.collections = config.collections;
    
    // Initialize components
    this.bidSeeker = new BidSeeker(this.firestore, this.collections.bids);
    this.bidRanker = new BidRanker(this.firestore, this.collections.bidRankings);
    this.bidBuilder = new BidBuilder(this.firestore, this.collections.bids);
  }
  
  /**
   * Searches for bids matching the given criteria
   * @param criteria Search criteria for finding bids
   * @param context Optional context for personalized search results
   * @returns Results of the bid search
   */
  async searchBids(
    criteria: BidSearchCriteria,
    context?: BidSeekingContext
  ): Promise<BidSearchResult> {
    return this.bidSeeker.searchBids(criteria, context);
  }
  
  /**
   * Ranks bids based on their quality and relevance
   * @param bids Array of bids to rank
   * @param context Context information for ranking, including user preferences
   * @returns Ranked bids with scores
   */
  async rankBids(
    bids: Bid[], 
    context?: BidSeekingContext
  ): Promise<BidRanking[]> {
    return this.bidRanker.rankBids(bids, context);
  }
  
  /**
   * Creates a new bid
   * @param bidData The data for the new bid
   * @param userId User ID of the bid creator
   * @returns The created bid
   */
  async createBid(bidData: Partial<Bid>, userId: string): Promise<Bid> {
    return this.bidBuilder.createBid(bidData, userId);
  }
  
  /**
   * Updates an existing bid
   * @param bidId ID of the bid to update
   * @param bidData Updated bid data
   * @param userId User ID of the person doing the update
   * @returns The updated bid
   */
  async updateBid(bidId: string, bidData: Partial<Bid>, userId: string): Promise<Bid> {
    return this.bidBuilder.updateBid(bidId, bidData, userId);
  }
  
  /**
   * Gets a bid by ID
   * @param bidId ID of the bid to retrieve
   * @returns The bid, or null if not found
   */
  async getBid(bidId: string): Promise<Bid | null> {
    return this.bidBuilder.getBid(bidId);
  }
  
  /**
   * Deletes a bid by ID
   * @param bidId ID of the bid to delete
   * @param userId User ID of the person deleting the bid
   * @returns True if successful, false otherwise
   */
  async deleteBid(bidId: string, userId: string): Promise<boolean> {
    return this.bidBuilder.deleteBid(bidId, userId);
  }
  
  /**
   * Responds to a bid
   * @param bidId ID of the bid to respond to
   * @param responseData Response data
   * @param userId User ID of the responder
   * @returns Bid with the new response
   */
  async respondToBid(
    bidId: string, 
    responseData: any, 
    userId: string
  ): Promise<Bid> {
    return this.bidBuilder.respondToBid(bidId, responseData, userId);
  }
  
  /**
   * Search and rank bids in a single operation
   * @param criteria Search criteria for finding bids
   * @param context Context information for personalized results
   * @returns Ranked search results
   */
  async searchAndRankBids(
    criteria: BidSearchCriteria, 
    context?: BidSeekingContext
  ): Promise<{ results: BidSearchResult; rankings: BidRanking[] }> {
    // First search for matching bids
    const searchResults = await this.searchBids(criteria, context);
    
    // Then rank the results
    const rankings = await this.rankBids(searchResults.bids, context);
    
    return {
      results: searchResults,
      rankings: rankings
    };
  }
  
  /**
   * Monitors bids for changes in real-time
   * @param criteria Criteria to filter which bids to monitor
   * @param callback Function called when monitored bids change
   * @returns A function that can be called to stop monitoring
   */
  monitorBids(
    criteria: BidSearchCriteria, 
    callback: (bids: Bid[]) => void
  ): () => void {
    return this.bidSeeker.monitorBids(criteria, callback);
  }
  
  /**
   * Gets recommended bids for a user based on their preferences and history
   * @param userId ID of the user to get recommendations for
   * @param limit Maximum number of recommendations to return
   * @returns Array of recommended bids with scores
   */
  async getRecommendedBids(
    userId: string, 
    limit: number = 10
  ): Promise<{ bid: Bid; score: number }[]> {
    // Get user context
    const context: BidSeekingContext = {
      userId,
      // In a real implementation, we would fetch user preferences from a database
      userPreferences: {}
    };
    
    // Search for bids that might be relevant
    const criteria: BidSearchCriteria = {
      statuses: ['open'],
      limit: limit * 3 // Get more than we need for better ranking
    };
    
    const searchResults = await this.searchBids(criteria, context);
    
    // Rank the results
    const rankings = await this.rankBids(searchResults.bids, context);
    
    // Combine bids with their rankings
    const recommendedBids = rankings.map(ranking => {
      const bid = searchResults.bids.find(b => b.id === ranking.bidId);
      return {
        bid: bid!,
        score: ranking.score
      };
    });
    
    // Sort by score and limit to the requested number
    return recommendedBids
      .sort((a

