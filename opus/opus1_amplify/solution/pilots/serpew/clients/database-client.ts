import { FirebaseApp, initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Firestore,
  DocumentData,
  QuerySnapshot,
  DocumentReference,
} from 'firebase/firestore';

/**
 * Configuration interface for database client
 */
export interface DatabaseConfig {
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  collections: {
    sectorStandards: string;
    jobDefinitions: string;
    rssEntries: string;
    processingLogs: string;
  };
}

/**
 * DatabaseClient for handling interactions with Firestore database
 * Used by SERPEW for storing and retrieving sector standards and job definitions
 */
export class DatabaseClient {
  private app: FirebaseApp;
  private db: Firestore;
  private config: DatabaseConfig;

  /**
   * Creates a new database client instance
   * @param config DatabaseConfig object containing Firebase configuration
   */
  constructor(config: DatabaseConfig) {
    this.config = config;
    this.app = initializeApp(config.firebaseConfig);
    this.db = getFirestore(this.app);
  }

  /**
   * Retrieves sector standards from the database
   * @param filter Optional filter criteria
   * @returns Promise resolving to sector standards data
   */
  async getSectorStandards(filter?: Record<string, any>): Promise<any[]> {
    const collectionRef = collection(
      this.db,
      this.config.collections.sectorStandards
    );

    let queryRef = query(collectionRef);
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        queryRef = query(queryRef, where(key, '==', value));
      });
    }

    const querySnapshot = await getDocs(queryRef);
    return this.extractDataFromSnapshot(querySnapshot);
  }

  /**
   * Retrieves job definitions from the database
   * @param filter Optional filter criteria
   * @returns Promise resolving to job definitions data
   */
  async getJobDefinitions(filter?: Record<string, any>): Promise<any[]> {
    const collectionRef = collection(
      this.db,
      this.config.collections.jobDefinitions
    );

    let queryRef = query(collectionRef);
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        queryRef = query(queryRef, where(key, '==', value));
      });
    }

    const querySnapshot = await getDocs(queryRef);
    return this.extractDataFromSnapshot(querySnapshot);
  }

  /**
   * Stores processed RSS entry in the database
   * @param rssEntry RSS entry data to store
   * @returns Promise resolving to the document reference
   */
  async storeRssEntry(rssEntry: any): Promise<DocumentReference<DocumentData>> {
    const collectionRef = collection(
      this.db,
      this.config.collections.rssEntries
    );
    return await addDoc(collectionRef, {
      ...rssEntry,
      timestamp: new Date(),
      processingStatus: 'completed',
    });
  }

  /**
   * Logs processing activity in the database
   * @param logEntry Log entry details
   * @returns Promise resolving to the document reference
   */
  async logProcessingActivity(logEntry: {
    source: string;
    action: string;
    status: 'success' | 'failure';
    details?: any;
  }): Promise<DocumentReference<DocumentData>> {
    const collectionRef = collection(
      this.db,
      this.config.collections.processingLogs
    );
    return await addDoc(collectionRef, {
      ...logEntry,
      timestamp: new Date(),
    });
  }

  /**
   * Updates an existing document in a collection
   * @param collectionName Name of the collection
   * @param docId Document ID
   * @param data Data to update
   * @returns Promise resolving when update is complete
   */
  async updateDocument(
    collectionName: string,
    docId: string,
    data: any
  ): Promise<void> {
    const docRef = doc(this.db, collectionName, docId);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    });
  }

  /**
   * Deletes a document from a collection
   * @param collectionName Name of the collection
   * @param docId Document ID
   * @returns Promise resolving when deletion is complete
   */
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(this.db, collectionName, docId);
    return await deleteDoc(docRef);
  }

  /**
   * Helper method to extract data from a query snapshot
   * @param querySnapshot Query result snapshot
   * @returns Array of document data with IDs
   */
  private extractDataFromSnapshot(
    querySnapshot: QuerySnapshot<DocumentData>
  ): any[] {
    const result: any[] = [];
    querySnapshot.forEach(doc => {
      result.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return result;
  }

  /**
   * Helper method to query any collection
   * @param collectionName Name of the collection to query
   * @param filter Optional filter criteria
   * @returns Promise resolving to collection data
   */
  async queryCollection(
    collectionName: string,
    filter?: Record<string, any>
  ): Promise<any[]> {
    const collectionRef = collection(this.db, collectionName);

    let queryRef = query(collectionRef);
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        queryRef = query(queryRef, where(key, '==', value));
      });
    }

    const querySnapshot = await getDocs(queryRef);
    return this.extractDataFromSnapshot(querySnapshot);
  }

  /**
   * Adds a document to any collection
   * @param collectionName Name of the collection
   * @param data Document data to add
   * @returns Promise resolving to the document reference
   */
  async addDocument(
    collectionName: string,
    data: any
  ): Promise<DocumentReference<DocumentData>> {
    const collectionRef = collection(this.db, collectionName);
    return await addDoc(collectionRef, {
      ...data,
      createdAt: new Date(),
    });
  }
}

/**
 * Default configuration for the database client
 * Can be overridden when instantiating the client
 */
export const DEFAULT_DB_CONFIG: DatabaseConfig = {
  firebaseConfig: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain:
      process.env.FIREBASE_AUTH_DOMAIN ||
      'aixtiv-symphony-opus1.firebaseapp.com',
    projectId: process.env.FIREBASE_PROJECT_ID || 'aixtiv-symphony-opus1',
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      'aixtiv-symphony-opus1.appspot.com',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  },
  collections: {
    sectorStandards: 'sectorStandards',
    jobDefinitions: 'jobDefinitions',
    rssEntries: 'rssEntries',
    processingLogs: 'processingLogs',
  },
};
