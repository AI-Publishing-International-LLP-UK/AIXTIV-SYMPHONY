/**
 * Authentication Routes for ASOOS
 * 
 * These routes provide authentication capabilities for the ASOOS system.
 * In production, these would integrate with the Sally Port security layer.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Initialize default users if none exist
const initDefaultUsers = async () => {
  const users = await User.getAll();
  
  if (users.length === 0) {
    // Create admin user
    await User.create({
      email: 'admin@example.com',
      password: 'admin',
      role: 'admin',
      name: 'Admin User'
    });
    
    // Create regular user
    await User.create({
      email: 'user@example.com',
      password: 'user123',
      role: 'user',
      name: 'Regular User'
    });
    
    console.log('Default users created');
  }
};

// Call the initialization (normally would be in a separate setup script)
initDefaultUsers().catch(err => console.error('Error initializing users:', err));

// Simple token generation (in production, use a proper JWT system)
const generateToken = (user) => {
  return `${user.role}:${user.id}`;
};

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Email and password are required'
    });
  }
  
  try {
    // Authenticate user
    const user = await User.authenticate(email, password);
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data and token
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
});

// Verify token route
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Authorization header missing'
    });
  }
  
  // Format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Invalid authorization format',
      message: 'Authorization header must be in format: Bearer <token>'
    });
  }
  
  const token = parts[1];
  
  try {
    // Simple token validation for development
    // In production, this would validate with Sally Port
    const tokenParts = token.split(':');
    if (tokenParts.length !== 2) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided authentication token is invalid'
      });
    }
    
    const [role, userId] = tokenParts;
    const user = await User.getById(userId);
    
    if (!user || user.role !== role) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided authentication token is invalid'
      });
    }
    
    // Return user data
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during token verification'
    });
  }
});

// Logout route (client-side only in this implementation)
router.post('/logout', (req, res) => {
  // In a stateful system, we would invalidate the token here
  // For JWT-based systems, this is typically handled client-side
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;