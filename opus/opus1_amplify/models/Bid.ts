/**
 * Bid.ts - Interfaces and types for the Bid Suite
 * Defines the core data structures for the BidSuiteService
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Interface defining the basic structure of a Bid
 */
export interface Bid {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: BidStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  ownerId: string;
  ownerName: string;
  category: BidCategory;
  tags: string[];
  location?: BidLocation;
  requirements?: BidRequirement[];
  attachments?: BidAttachment[];
  visibility: BidVisibility;
  responses?: BidResponse[];
  metadata?: Record<string, any>;
}

/**
 * Status of a bid
 */
export enum BidStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  AWARDED = 'awarded',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Categorization of bids
 */
export enum BidCategory {
  SERVICES = 'services',
  PRODUCTS = 'products',
  PROJECTS = 'projects',
  CONSULTING = 'consulting',
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  CREATIVE = 'creative',
  OTHER = 'other',
}

/**
 * Bid visibility settings
 */
export enum BidVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITATION = 'invitation',
}

/**
 * Location information for a bid
 */
export interface BidLocation {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
  remote: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Requirements for fulfilling a bid
 */
export interface BidRequirement {
  id: string;
  title: string;
  description: string;
  mandatory: boolean;
  type: BidRequirementType;
  valueOptions?: string[];
}

/**
 * Types of bid requirements
 */
export enum BidRequirementType {
  QUALIFICATION = 'qualification',
  SKILL = 'skill',
  CERTIFICATION = 'certification',
  EXPERIENCE = 'experience',
  AVAILABILITY = 'availability',
  LEGAL = 'legal',
  OTHER = 'other',
}

/**
 * Attachments for a bid
 */
export interface BidAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: Timestamp;
}

/**
 * Response to a bid
 */
export interface BidResponse {
  id: string;
  responderId: string;
  responderName: string;
  proposal: string;
  amount?: number;
  submittedAt: Timestamp;
  status: BidResponseStatus;
  attachments?: BidAttachment[];
  requirementResponses?: BidRequirementResponse[];
  notes?: string;
}

/**
 * Status of a bid response
 */
export enum BidResponseStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  SHORTLISTED = 'shortlisted',
}

/**
 * Response to a bid requirement
 */
export interface BidRequirementResponse {
  requirementId: string;
  value: string | boolean | number;
  notes?: string;
}

/**
 * Criteria used to search for bids
 */
export interface BidSearchCriteria {
  categories?: BidCategory[];
  statuses?: BidStatus[];
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
  location?: {
    country?: string;
    state?: string;
    city?: string;
    remote?: boolean;
    radiusKm?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  requirementFilters?: {
    requirementId: string;
    value: string | boolean | number;
  }[];
  keywords?: string[];
  ownerId?: string;
  responderId?: string;
  sortBy?: BidSortBy;
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Options for sorting bids
 */
export enum BidSortBy {
  CREATED_AT = 'createdAt',
  EXPIRES_AT = 'expiresAt',
  AMOUNT = 'amount',
  RELEVANCE = 'relevance',
}

/**
 * Results of a bid search
 */
export interface BidSearchResult {
  bids: Bid[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Rankings of bids
 */
export interface BidRanking {
  bidId: string;
  score: number;
  factors: {
    relevanceScore: number;
    qualityScore: number;
    valueScore: number;
    timelinessScore: number;
  };
}

/**
 * Context for the bid seeking process
 */
export interface BidSeekingContext {
  userId: string;
  userPreferences?: Record<string, any>;
  industry?: string;
  priorityFactors?: {
    price: number; // 0-1 importance weighting
    quality: number; // 0-1 importance weighting
    timeline: number; // 0-1 importance weighting
  };
  recentSearches?: BidSearchCriteria[];
  currentProject?: string;
}
