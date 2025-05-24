/**
 * User Model
 *
 * Provides an interface for working with user data.
 * In production, this would connect to a real database.
 */

const db = require('../config/database');
const crypto = require('crypto');

// Collection name
const COLLECTION = 'users';

class User {
  // Get all users
  static async getAll() {
    return db.getAll(COLLECTION);
  }

  // Get user by ID
  static async getById(id) {
    return db.getById(COLLECTION, id);
  }

  // Get user by email
  static async getByEmail(email) {
    const users = await db.find(COLLECTION, user => user.email === email);
    return users[0] || null;
  }

  // Create a new user
  static async create(userData) {
    // Check if email already exists
    const existingUser = await User.getByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Hash the password
    if (userData.password) {
      userData.passwordHash = User.hashPassword(userData.password);
      delete userData.password;
    }

    // Add timestamps
    userData.createdAt = new Date().toISOString();
    userData.updatedAt = new Date().toISOString();

    return db.create(COLLECTION, userData);
  }

  // Update a user
  static async update(id, updates) {
    // Check if email is being changed and already exists
    if (updates.email) {
      const existingUser = await User.getByEmail(updates.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already in use');
      }
    }

    // Hash the password if provided
    if (updates.password) {
      updates.passwordHash = User.hashPassword(updates.password);
      delete updates.password;
    }

    // Update timestamp
    updates.updatedAt = new Date().toISOString();

    return db.update(COLLECTION, id, updates);
  }

  // Delete a user
  static async delete(id) {
    return db.delete(COLLECTION, id);
  }

  // Authenticate a user
  static async authenticate(email, password) {
    const user = await User.getByEmail(email);
    if (!user) {
      return null;
    }

    const passwordHash = User.hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return null;
    }

    return user;
  }

  // Hash a password
  static hashPassword(password) {
    return crypto.createHash('sha512').update(password).digest('hex');
  }
}

module.exports = User;
