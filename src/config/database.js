/**
 * Database Configuration for ASOOS
 *
 * In production, this would configure and connect to the actual database.
 * For development, we provide a mock database interface.
 */

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// Mock database functionality
class MockDatabase {
  constructor() {
    this.data = {};
    this.dataDir = path.join(__dirname, '../../data');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Load data from JSON file
  async loadCollection(collection) {
    try {
      const filePath = path.join(this.dataDir, `${collection}.json`);

      if (!fs.existsSync(filePath)) {
        this.data[collection] = [];
        return [];
      }

      const readFile = promisify(fs.readFile);
      const data = await readFile(filePath, 'utf8');
      this.data[collection] = JSON.parse(data);
      return this.data[collection];
    } catch (error) {
      console.error(`Error loading collection ${collection}:`, error);
      this.data[collection] = [];
      return [];
    }
  }

  // Save data to JSON file
  async saveCollection(collection) {
    try {
      const filePath = path.join(this.dataDir, `${collection}.json`);
      const writeFile = promisify(fs.writeFile);
      await writeFile(
        filePath,
        JSON.stringify(this.data[collection], null, 2),
        'utf8'
      );
    } catch (error) {
      console.error(`Error saving collection ${collection}:`, error);
      throw error;
    }
  }

  // Get all documents in a collection
  async getAll(collection) {
    if (!this.data[collection]) {
      await this.loadCollection(collection);
    }
    return this.data[collection];
  }

  // Get a document by ID
  async getById(collection, id) {
    if (!this.data[collection]) {
      await this.loadCollection(collection);
    }
    return this.data[collection].find(item => item.id === id);
  }

  // Find documents by query
  async find(collection, queryFn) {
    if (!this.data[collection]) {
      await this.loadCollection(collection);
    }
    return this.data[collection].filter(queryFn);
  }

  // Create a new document
  async create(collection, document) {
    if (!this.data[collection]) {
      await this.loadCollection(collection);
    }

    // Generate ID if not provided
    if (!document.id) {
      document.id = `${collection}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    this.data[collection].push(document);
    await this.saveCollection(collection);
    return document;
  }

  // Update a document
  async update(collection, id, updates) {
    if (!this.data[collection]) {
      await this.loadCollection(collection);
    }

    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Document with ID ${id} not found in ${collection}`);
    }

    this.data[collection][index] = {
      ...this.data[collection][index],
      ...updates,
    };
    await this.saveCollection(collection);
    return this.data[collection][index];
  }

  // Delete a document
  async delete(collection, id) {
    if (!this.data[collection]) {
      await this.loadCollection(collection);
    }

    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Document with ID ${id} not found in ${collection}`);
    }

    const deleted = this.data[collection].splice(index, 1)[0];
    await this.saveCollection(collection);
    return deleted;
  }

  // Clear a collection
  async clear(collection) {
    this.data[collection] = [];
    await this.saveCollection(collection);
  }
}

// Create and export the mock database
const db = new MockDatabase();

module.exports = db;
